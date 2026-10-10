/**
 * Algorithm 5-A: Body Weight Local Level Kalman Filter
 * Separates daily transient water/gut noise from true metabolic mass trend
 * and computes weekly rate of change with 80% confidence intervals.
 */

export interface WeightKalmanState {
  weightTrendKg: number;    // Smoothed true weight
  dailyRateKg: number;       // Change per day
  varianceWeight: number;    // Uncertainty in weight
  varianceRate: number;      // Uncertainty in slope
  lastRecordedDate: string;  // YYYY-MM-DD
}

export interface WeightObservation {
  weightKg: number;
  date: string;
}

export interface WeightAnalysisResult {
  smoothedWeightKg: number;
  weeklyChangeKg: number;
  weeklyChangePercent: number;
  lowerBound80Percent: number;
  upperBound80Percent: number;
  goalStatus: 'on_track' | 'too_fast' | 'too_slow' | 'reversing';
  explanationFa: string;
  explanationEn: string;
}

export const DEFAULT_WEIGHT_STATE: WeightKalmanState = {
  weightTrendKg: 75.0,
  dailyRateKg: 0.0,
  varianceWeight: 0.36,   // (0.6 kg std)^2
  varianceRate: 0.0004,
  lastRecordedDate: new Date().toISOString().split('T')[0]
};

/**
 * Updates the Weight Kalman filter with a new morning weigh-in.
 */
export function updateWeightKalman(
  prevState: WeightKalmanState,
  obs: WeightObservation
): WeightKalmanState {
  const d1 = new Date(prevState.lastRecordedDate).getTime();
  const d2 = new Date(obs.date).getTime();
  const deltaDays = Math.max(0.1, Math.min(30, (d2 - d1) / (1000 * 60 * 60 * 24)));

  // 1. Predict
  const predWeight = prevState.weightTrendKg + deltaDays * prevState.dailyRateKg;
  const predRate = prevState.dailyRateKg;

  // Process noise
  const qWeight = 0.01 * deltaDays;
  const qRate = 0.00005 * deltaDays;

  const predVarWeight = prevState.varianceWeight + deltaDays * deltaDays * prevState.varianceRate + qWeight;
  const predVarRate = prevState.varianceRate + qRate;

  // 2. Innovation
  // Daily water/food observation variance ~ (0.65 kg)^2 = 0.4225
  const obsVariance = 0.4225;
  const S = predVarWeight + obsVariance;
  const residual = obs.weightKg - predWeight;

  // 3. Kalman Gain
  const KWeight = predVarWeight / S;
  const KRate = (deltaDays * prevState.varianceRate) / S;

  const newWeight = predWeight + KWeight * residual;
  const newRate = predRate + KRate * residual;

  const newVarWeight = Math.max(0.01, (1 - KWeight) * predVarWeight);
  const newVarRate = Math.max(0.00001, predVarRate - KRate * deltaDays * prevState.varianceRate);

  return {
    weightTrendKg: parseFloat(newWeight.toFixed(2)),
    dailyRateKg: parseFloat(newRate.toFixed(4)),
    varianceWeight: parseFloat(newVarWeight.toFixed(4)),
    varianceRate: parseFloat(newVarRate.toFixed(6)),
    lastRecordedDate: obs.date
  };
}

/**
 * Evaluates weekly body weight trajectory against target phase (bulk, cut, recomp).
 */
export function analyzeWeightTrend(
  state: WeightKalmanState,
  goal: 'hypertrophy' | 'fat_loss' | 'recomp' | 'maintenance' = 'hypertrophy'
): WeightAnalysisResult {
  const weeklyChangeKg = state.dailyRateKg * 7;
  const weeklyChangePercent = (weeklyChangeKg / state.weightTrendKg) * 100;

  // 80% confidence interval for weekly change (z = 1.282)
  const rateStd = Math.sqrt(state.varianceRate) * 7;
  const rateStdPercent = (rateStd / state.weightTrendKg) * 100;

  const lowerBound80Percent = parseFloat((weeklyChangePercent - 1.282 * rateStdPercent).toFixed(2));
  const upperBound80Percent = parseFloat((weeklyChangePercent + 1.282 * rateStdPercent).toFixed(2));

  let goalStatus: 'on_track' | 'too_fast' | 'too_slow' | 'reversing' = 'on_track';
  let explanationFa = '';
  let explanationEn = '';

  if (goal === 'hypertrophy') {
    // Target clean bulk: +0.25% to +0.50% of body weight per week
    if (weeklyChangePercent >= 0.20 && weeklyChangePercent <= 0.60) {
      goalStatus = 'on_track';
      explanationFa = `روند وزن بر مدار هدف حجم‌گیری تمیز (+${weeklyChangePercent.toFixed(2)}٪ در هفته).`;
      explanationEn = `Weight trend on track for clean bulk (+${weeklyChangePercent.toFixed(2)}%/week).`;
    } else if (weeklyChangePercent > 0.60) {
      goalStatus = 'too_fast';
      explanationFa = `رشد وزن سریع‌تر از هدف (+${weeklyChangePercent.toFixed(2)}٪ در هفته)؛ احتمال تجمع بافت چربی بیش از حد.`;
      explanationEn = `Weight gain too fast (+${weeklyChangePercent.toFixed(2)}%/week); risk of excess fat gain.`;
    } else if (weeklyChangePercent < 0.10 && weeklyChangePercent >= -0.10) {
      goalStatus = 'too_slow';
      explanationFa = 'روند وزن تقریباً ثابت است؛ برای حجم‌گیری کالری مازاد خفیف نیاز است.';
      explanationEn = 'Weight trend is flat; slight surplus recommended for hypertrophy.';
    } else {
      goalStatus = 'reversing';
      explanationFa = 'روند وزن کاهشی است در حالی که هدف حجم‌گیری است.';
      explanationEn = 'Weight is decreasing despite hypertrophy goal.';
    }
  } else if (goal === 'fat_loss') {
    // Target fat loss: -0.5% to -1.0% per week
    if (weeklyChangePercent <= -0.40 && weeklyChangePercent >= -1.10) {
      goalStatus = 'on_track';
      explanationFa = `کاهش وزن در بازه‌ی مطلوب (${weeklyChangePercent.toFixed(2)}٪ در هفته).`;
      explanationEn = `Fat loss rate on track (${weeklyChangePercent.toFixed(2)}%/week).`;
    } else if (weeklyChangePercent < -1.10) {
      goalStatus = 'too_fast';
      explanationFa = `کاهش وزن بیش از حد سریع (${weeklyChangePercent.toFixed(2)}٪ در هفته)؛ خطر افت توده عضلانی و عملکرد.`;
      explanationEn = `Fat loss too aggressive (${weeklyChangePercent.toFixed(2)}%/week); risk of lean mass loss.`;
    } else {
      goalStatus = 'too_slow';
      explanationFa = 'نرخ کاهش وزن کمتر از هدف است.';
      explanationEn = 'Weight loss rate slower than targeted.';
    }
  } else {
    // Recomp / Maintenance: between -0.2% and +0.2%
    if (Math.abs(weeklyChangePercent) <= 0.25) {
      goalStatus = 'on_track';
      explanationFa = `تثبیت عالی وزن (${weeklyChangePercent.toFixed(2)}٪ در هفته).`;
      explanationEn = `Weight stable within recomp range (${weeklyChangePercent.toFixed(2)}%/week).`;
    } else {
      goalStatus = weeklyChangePercent > 0.25 ? 'too_fast' : 'too_slow';
      explanationFa = `انحراف از تثبیت وزن (${weeklyChangePercent.toFixed(2)}٪ در هفته).`;
      explanationEn = `Drift from weight maintenance (${weeklyChangePercent.toFixed(2)}%/week).`;
    }
  }

  return {
    smoothedWeightKg: state.weightTrendKg,
    weeklyChangeKg: parseFloat(weeklyChangeKg.toFixed(2)),
    weeklyChangePercent: parseFloat(weeklyChangePercent.toFixed(2)),
    lowerBound80Percent,
    upperBound80Percent,
    goalStatus,
    explanationFa,
    explanationEn
  };
}
