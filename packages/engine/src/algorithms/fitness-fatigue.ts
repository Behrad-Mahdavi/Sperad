/**
 * Algorithm 1: Banister Fitness-Fatigue & Daily Autoregulation
 * Implements discrete-time recurrence for latent fitness (fit_t) and fatigue (fat_t)
 * and logistic daily readiness combining objective stimulus with subjective check-ins.
 */

export interface BanisterState {
  fitness: number;
  fatigue: number;
  asOfDate: string; // YYYY-MM-DD
}

export interface BanisterParams {
  tau1: number; // Fitness time constant in days (default: 45)
  tau2: number; // Fatigue time constant in days (default: 11)
  a: number;    // Fitness scaling coefficient (default: 1.0)
  b: number;    // Fatigue scaling coefficient (default: 2.0)
}

export const DEFAULT_BANISTER_PARAMS: BanisterParams = {
  tau1: 45,
  tau2: 11,
  a: 1.0,
  b: 2.0
};

/**
 * Stimulus function σ(RIR):
 * σ(RIR) = max(0, 1 - s * max(0, RIR - rho_knee))
 */
export function calculateStimulus(rir: number, s = 0.15, rhoKnee = 3): number {
  return Math.max(0, 1 - s * Math.max(0, rir - rhoKnee));
}

/**
 * Fatigue cost function φ(RIR, I, f_e):
 * φ = f_e * (I^gamma) * (1 + kappa * max(0, rho_knee - RIR))
 */
export function calculateFatigueCost(
  rir: number,
  relativeIntensity: number,
  exerciseFatigue = 1.0,
  gamma = 1.0,
  kappa = 0.25,
  rhoKnee = 3
): number {
  const intensityTerm = Math.pow(Math.max(0, relativeIntensity), gamma);
  const failureCostTerm = 1 + kappa * Math.max(0, rhoKnee - rir);
  return exerciseFatigue * intensityTerm * failureCostTerm;
}

/**
 * Advances Banister state by deltaDays with day's stimulus and fatigue inputs.
 */
export function stepBanisterState(
  prevState: BanisterState,
  stimulus: number,
  fatigueCost: number,
  deltaDays: number,
  params: BanisterParams = DEFAULT_BANISTER_PARAMS
): BanisterState {
  const decayFit = Math.exp(-deltaDays / params.tau1);
  const decayFat = Math.exp(-deltaDays / params.tau2);

  const newFitness = prevState.fitness * decayFit + stimulus;
  const newFatigue = prevState.fatigue * decayFat + fatigueCost;

  return {
    fitness: Math.max(0, newFitness),
    fatigue: Math.max(0, newFatigue),
    asOfDate: prevState.asOfDate
  };
}

export interface DailyCheckinInput {
  sleepHours: number;       // e.g. 7.5
  sleepQuality: number;     // 1 to 5
  stressLevel: number;      // 1 to 5 (1 lowest, 5 highest)
  motivation: number;       // 1 to 5
  targetMuscleSoreness: number; // 0 to 4 (0 none, 4 severe)
}

export interface ReadinessResult {
  score: number;            // 0.0 to 1.0
  category: 'high' | 'moderate' | 'low';
  modelComponent: number;   // normalized model prediction
  subjectiveComponent: number;
  recommendation: {
    action: 'execute_normal' | 'increase_rir' | 'reduce_volume' | 'early_deload';
    targetRirDelta: number;
    volumeMultiplier: number;
    explanationEn: string;
    explanationFa: string;
  };
}

/**
 * Computes Daily Readiness score via logistic regression transform:
 * Ready_t = logistic(w1 * R_model + w2 * sleep + w3 * (-stress) + w4 * (-soreness) + w5 * motivation)
 */
export function calculateDailyReadiness(
  banisterState: BanisterState,
  checkin: DailyCheckinInput,
  params: BanisterParams = DEFAULT_BANISTER_PARAMS
): ReadinessResult {
  // 1. Model component: normalized difference between fitness and fatigue
  const netFitness = params.a * banisterState.fitness - params.b * banisterState.fatigue;
  // Scaled roughly around 0
  const modelComponent = Math.tanh(netFitness / 15);

  // 2. Normalize subjective inputs into zero-centered values [-1, +1]
  const normSleep = ((checkin.sleepHours - 7) / 2) * 0.5 + ((checkin.sleepQuality - 3) / 2) * 0.5;
  const normStress = -((checkin.stressLevel - 3) / 2);
  const normSoreness = -((checkin.targetMuscleSoreness - 1.5) / 1.5);
  const normMotivation = (checkin.motivation - 3) / 2;

  // 3. Weighted log-odds z_t
  const w = { model: 0.35, sleep: 0.25, stress: 0.15, soreness: 0.15, motivation: 0.10 };
  const subjectiveScore =
    (w.sleep * normSleep + w.stress * normStress + w.soreness * normSoreness + w.motivation * normMotivation) /
    (w.sleep + w.stress + w.soreness + w.motivation);

  const z = w.model * modelComponent + (1 - w.model) * subjectiveScore;

  // Logistic function
  const score = Math.max(0.05, Math.min(0.95, 1 / (1 + Math.exp(-2.5 * z))));

  let category: 'high' | 'moderate' | 'low' = 'moderate';
  let action: 'execute_normal' | 'increase_rir' | 'reduce_volume' | 'early_deload' = 'execute_normal';
  let targetRirDelta = 0;
  let volumeMultiplier = 1.0;
  let explanationEn = '';
  let explanationFa = '';

  if (score >= 0.70 && checkin.targetMuscleSoreness <= 1) {
    category = 'high';
    action = 'execute_normal';
    targetRirDelta = 0;
    volumeMultiplier = 1.1; // allowed bonus set if under volume target
    explanationEn = 'High readiness detected. Full intensity permitted with potential bonus volume.';
    explanationFa = 'آمادگی بالا ثبت شد. اجرای کامل برنامه با شدت هدف و اجازه‌ی ست اضافه مجاز است.';
  } else if (score < 0.40 || checkin.targetMuscleSoreness >= 3) {
    category = 'low';
    action = 'reduce_volume';
    targetRirDelta = +1;
    volumeMultiplier = 0.6; // reduce sets for this muscle
    explanationEn = `Low readiness or severe soreness (${checkin.targetMuscleSoreness}/4). Reducing target muscle volume by 40%.`;
    explanationFa = `آمادگی پایین یا کوفتگی شدید (${checkin.targetMuscleSoreness} از ۴). حجم این عضله ۴۰٪ کاهش یافت.`;
  } else {
    category = 'moderate';
    action = 'increase_rir';
    targetRirDelta = +1;
    volumeMultiplier = 1.0;
    explanationEn = 'Moderate readiness. Execute planned sets with 1 higher target RIR for joint/fatigue preservation.';
    explanationFa = 'آمادگی متوسط. اجرای برنامه‌ی ست‌ها با ۱ واحد RIR بالاتر (محافظه‌کارانه‌تر).';
  }

  return {
    score: parseFloat(score.toFixed(2)),
    category,
    modelComponent: parseFloat(modelComponent.toFixed(2)),
    subjectiveComponent: parseFloat(subjectiveScore.toFixed(2)),
    recommendation: {
      action,
      targetRirDelta,
      volumeMultiplier,
      explanationEn,
      explanationFa
    }
  };
}
