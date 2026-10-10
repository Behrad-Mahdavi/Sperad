/**
 * Algorithm 5-B: Lightweight Nutrition, Protein Guidelines & TDEE Kalman Estimation
 *
 * Implements Section 5-B of the technical brief:
 * - Protein targets in g/kg range (1.6 - 2.2 g/kg, expanding to 2.4 in deep deficit).
 * - TDEE estimation correlating calorie logs with Kalman weight trend (7700 kcal/kg).
 * - Feedback loop to training engine: in severe caloric deficits, dampens MRV
 *   and e1RM expectation to prevent false deload/plateau triggers.
 */

export interface NutritionTargets {
  bodyWeightKg: number;
  goal: 'hypertrophy' | 'maintenance' | 'fat_loss';
  isAggressiveDeficit?: boolean;
}

export interface ProteinRecommendation {
  minGrams: number;
  maxGrams: number;
  recommendedPerKg: string; // e.g. "1.6 - 2.2"
  rationaleFa: string;
}

export interface DailyEnergyLog {
  date: string;
  calories: number;
  weightTrendKg: number;
}

export interface TdeeEstimateResult {
  estimatedTdee: number;
  confidenceRange: [number, number]; // [p10, p90]
  dataPointsCount: number;
  energyBalanceKcal: number; // Intake - TDEE
  volumeAdjustmentFactor: number; // 0.85 to 1.0 (dampens MRV during aggressive deficit)
  e1rmSlopeDamping: number; // 0.8 to 1.0
  rationaleFa: string;
}

/**
 * Calculates protein intake range based on body weight, goal, and deficit severity.
 */
export function calculateProteinTargets(
  input: NutritionTargets
): ProteinRecommendation {
  const { bodyWeightKg, goal, isAggressiveDeficit } = input;

  let minRate = 1.6;
  let maxRate = 2.2;

  if (goal === 'fat_loss' || isAggressiveDeficit) {
    minRate = 2.0;
    maxRate = 2.4;
  } else if (goal === 'hypertrophy') {
    minRate = 1.6;
    maxRate = 2.0;
  }

  const minGrams = Math.round(minRate * bodyWeightKg);
  const maxGrams = Math.round(maxRate * bodyWeightKg);

  const rationaleFa =
    goal === 'fat_loss' || isAggressiveDeficit
      ? `در فاز کسری انرژی، دریافت پروتئین در بازه ${minRate} تا ${maxRate} گرم به ازای هر کیلوگرم (${minGrams} تا ${maxGrams} گرم روزانه) جهت حفظ توده بدون چربی ضروری است.`
      : `نقطه بازده نزولی سنتز پروتئین عضلانی در بازه ${minRate} تا ${maxRate} گرم بر کیلوگرم (${minGrams} تا ${maxGrams} گرم روزانه) قرار دارد.`;

  return {
    minGrams,
    maxGrams,
    recommendedPerKg: `${minRate} - ${maxRate}`,
    rationaleFa
  };
}

/**
 * Estimates Total Daily Energy Expenditure (TDEE) and returns training feedback factors.
 */
export function estimateTdeeFromLogs(
  logs: { calories: number }[],
  weeklyWeightSlopeKg: number, // positive = gaining, negative = losing
  priorTdee = 2400
): TdeeEstimateResult {
  if (logs.length < 5) {
    // Insufficient logs: return conservative prior
    return {
      estimatedTdee: priorTdee,
      confidenceRange: [priorTdee - 250, priorTdee + 250],
      dataPointsCount: logs.length,
      energyBalanceKcal: 0,
      volumeAdjustmentFactor: 1.0,
      e1rmSlopeDamping: 1.0,
      rationaleFa: 'داده‌های کالری دریافتی هنوز به حداقل ۵ روز نرسیده است؛ از تخمین پایه استفاده شد.'
    };
  }

  const avgCalories =
    logs.reduce((sum, item) => sum + item.calories, 0) / logs.length;

  // 1 kg body mass change ~ 7700 kcal
  // Daily caloric surplus / deficit = (weeklyWeightSlopeKg * 7700) / 7 = weeklyWeightSlopeKg * 1100
  const dailyEnergyDelta = weeklyWeightSlopeKg * 1100;
  const observedTdee = Math.round(avgCalories - dailyEnergyDelta);

  // Kalman smoothing between prior and observed
  const kalmanGain = Math.min(0.7, logs.length / (logs.length + 5));
  const estimatedTdee = Math.round((1 - kalmanGain) * priorTdee + kalmanGain * observedTdee);

  const energyBalanceKcal = Math.round(avgCalories - estimatedTdee);

  // Connect to training engine: In severe deficit, reduce MRV to protect recovery
  let volumeAdjustmentFactor = 1.0;
  let e1rmSlopeDamping = 1.0;
  let rationaleFa = `مصرف انرژی روزانه (TDEE) معادل ${estimatedTdee} کیلوکالری تخمین زده شد.`;

  if (energyBalanceKcal < -500 || weeklyWeightSlopeKg < -0.7) {
    volumeAdjustmentFactor = 0.85; // 15% reduction in MRV ceiling
    e1rmSlopeDamping = 0.8; // Lower expected rate of e1RM increase
    rationaleFa = `کسری انرژی قابل‌توجه (${Math.abs(energyBalanceKcal)} کیلوکالری) شناسایی شد. سقف حجم موثر (MRV) و انتظار پیشرفت سریع e1RM به میزان ۱۵٪ تعدیل گردید تا از بروز خستگی مزمن یا دیلود کاذب جلوگیری شود.`;
  }

  return {
    estimatedTdee,
    confidenceRange: [estimatedTdee - 150, estimatedTdee + 150],
    dataPointsCount: logs.length,
    energyBalanceKcal,
    volumeAdjustmentFactor,
    e1rmSlopeDamping,
    rationaleFa
  };
}
