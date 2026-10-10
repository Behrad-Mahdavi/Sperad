/**
 * Algorithm 2: Bayesian Strength Estimation & Next-Set Load Recommendation
 * Tracks latent e1RM distribution (mean, variance, drift) using a 2D Kalman Filter
 * with Mahalanobis outlier gating, intra-session fatigue discount, and double progression.
 */

import { epleyModel, type RepMaxModel } from '../types';

export interface KalmanStateE1RM {
  logTheta: number;  // ln(e1RM) mean
  drift: number;     // growth slope (per day)
  covariance: [
    [number, number],
    [number, number]
  ];                 // 2x2 uncertainty matrix
  lastPerformedDate: string; // YYYY-MM-DD
  allTimeRecordE1RM: number; // in kg
}

export interface SetObservation {
  loadKg: number;
  reps: number;
  rir: number | null;
  setNumberInSession: number;
  performedDate: string;
}

export interface LoadRecommendationInput {
  targetReps: number;
  targetRir: number;
  repRange: [number, number]; // e.g. [6, 10]
  availableIncrementsKg: number[]; // e.g. [1.25, 2.5, 5.0] or default 2.5
  readinessScore?: number; // 0.0 to 1.0 (default 0.7)
  model?: RepMaxModel;
}

export interface LoadRecommendationResult {
  suggestedLoadKg: number;
  targetReps: number;
  targetRir: number;
  e1rmMeanKg: number;
  e1rmLowerBound80Kg: number;
  e1rmUpperBound80Kg: number;
  isDoubleProgressionAdvancement: boolean;
  confidence: 'low' | 'medium' | 'high';
  explanationFa: string;
  explanationEn: string;
}

export const DEFAULT_E1RM_STATE: KalmanStateE1RM = {
  logTheta: Math.log(80), // default prior e1RM = 80kg
  drift: 0.001,          // ~0.1% daily progress prior
  covariance: [
    [0.02, 0.0001],
    [0.0001, 0.00005]
  ],
  lastPerformedDate: new Date().toISOString().split('T')[0],
  allTimeRecordE1RM: 80
};

/**
 * Calculates observation variance σ² based on RIR, rep count, and intra-session set position.
 */
export function calculateObservationVariance(obs: SetObservation): number {
  let variance = 0.0025; // baseline ~5% std dev error

  // 1. Subjective RIR quality
  if (obs.rir === null) {
    variance += 0.015; // missing RIR has higher noise
  } else if (obs.rir > 3) {
    variance += 0.002 * (obs.rir - 3); // extrapolation uncertainty
  }

  // 2. High rep extrapolation (>12 reps is less predictable for 1RM)
  if (obs.reps > 12) {
    variance += 0.0015 * Math.min(10, obs.reps - 12);
  }

  // 3. Intra-session set drop-off fatigue
  if (obs.setNumberInSession > 1) {
    variance += 0.001 * (obs.setNumberInSession - 1);
  }

  return variance;
}

/**
 * Updates Kalman e1RM state with a new completed set observation.
 */
export function updateKalmanE1RM(
  prevState: KalmanStateE1RM,
  obs: SetObservation,
  model: RepMaxModel = epleyModel
): { newState: KalmanStateE1RM; isNewPR: boolean; prProbability: number } {
  const rir = obs.rir ?? 2;
  const repsToFailure = obs.reps + rir;
  const pct = model.percent(repsToFailure);

  // Observation value y = ln(L / p(r + rho))
  const observedE1RM = obs.loadKg / pct;
  const y = Math.log(Math.max(1, observedE1RM));

  // Time elapsed in days
  const d1 = new Date(prevState.lastPerformedDate).getTime();
  const d2 = new Date(obs.performedDate).getTime();
  const deltaDays = Math.max(0, Math.min(60, (d2 - d1) / (1000 * 60 * 60 * 24)));

  // 1. PREDICT STEP
  const lambda = 0.98; // slope damping
  const damping = Math.pow(lambda, deltaDays);

  // F = [[1, delta], [0, damping]]
  const predLogTheta = prevState.logTheta + deltaDays * prevState.drift;
  const predDrift = prevState.drift * damping;

  // Process noise Q
  const qTheta = 0.0001 * Math.max(1, deltaDays);
  const qDrift = 0.00001 * Math.max(1, deltaDays);

  const [[p00, p01], [p10, p11]] = prevState.covariance;

  // P_pred = F * P * F^T + Q
  const predP00 = p00 + deltaDays * (p10 + p01) + deltaDays * deltaDays * p11 + qTheta;
  const predP01 = (p01 + deltaDays * p11) * damping;
  const predP10 = predP01;
  const predP11 = p11 * damping * damping + qDrift;

  // 2. INNOVATION & OUTLIER GATING
  const residual = y - predLogTheta;
  const obsVariance = calculateObservationVariance(obs);
  const innovationVariance = predP00 + obsVariance;

  // Mahalanobis distance squared (d^2)
  const d2Dist = (residual * residual) / innovationVariance;
  let effectiveR = obsVariance;

  // Robust Student-t gating: if outlier (d > 3 sigmas), inflate R instead of rejecting completely
  if (d2Dist > 9.0) {
    effectiveR = obsVariance * (1 + (d2Dist - 9.0) / 3);
  }

  // 3. KALMAN GAIN & UPDATE
  const S = predP00 + effectiveR;
  const K0 = predP00 / S;
  const K1 = predP10 / S;

  const newLogTheta = predLogTheta + K0 * residual;
  const newDrift = predDrift + K1 * residual;

  const newP00 = Math.max(0.0005, (1 - K0) * predP00);
  const newP01 = (1 - K0) * predP01;
  const newP10 = newP01;
  const newP11 = Math.max(0.000001, predP11 - K1 * predP01);

  const currentE1RM = Math.exp(newLogTheta);
  const currentStdDev = Math.sqrt(newP00) * currentE1RM;

  // 4. PR PROBABILITY CALCULATION
  // P(X > PR_prev) via normal CDF approximation
  const zPR = (currentE1RM - prevState.allTimeRecordE1RM) / Math.max(0.1, currentStdDev);
  const prProbability = normalCDF(zPR);
  const isNewPR = prProbability > 0.90 && currentE1RM > prevState.allTimeRecordE1RM;

  const newState: KalmanStateE1RM = {
    logTheta: newLogTheta,
    drift: newDrift,
    covariance: [
      [newP00, newP01],
      [newP10, newP11]
    ],
    lastPerformedDate: obs.performedDate,
    allTimeRecordE1RM: isNewPR ? parseFloat(currentE1RM.toFixed(1)) : prevState.allTimeRecordE1RM
  };

  return { newState, isNewPR, prProbability: parseFloat(prProbability.toFixed(3)) };
}

/**
 * Generates next-set load and reps recommendation.
 */
export function recommendNextSetLoad(
  state: KalmanStateE1RM,
  input: LoadRecommendationInput,
  lastCompletedSet?: SetObservation
): LoadRecommendationResult {
  const model = input.model || epleyModel;
  const readiness = input.readinessScore ?? 0.7;

  const e1rmMean = Math.exp(state.logTheta);
  const e1rmVar = state.covariance[0][0];
  const e1rmStd = Math.sqrt(e1rmVar);

  // 80% confidence interval (z = 1.282)
  const lower80 = Math.exp(state.logTheta - 1.282 * e1rmStd);
  const upper80 = Math.exp(state.logTheta + 1.282 * e1rmStd);

  // Confidence assessment
  let confidence: 'low' | 'medium' | 'high' = 'medium';
  if (e1rmStd / e1rmMean < 0.05) confidence = 'high';
  else if (e1rmStd / e1rmMean > 0.12) confidence = 'low';

  // Double progression logic:
  // If user completed upper rep bound (e.g. 10 reps) at target RIR in last set:
  const [minReps, maxReps] = input.repRange;
  let targetReps = input.targetReps;
  let isDoubleProgressionAdvancement = false;

  if (lastCompletedSet && lastCompletedSet.reps >= maxReps && (lastCompletedSet.rir ?? 0) >= input.targetRir) {
    // Progress load up, reset reps to lower bound
    targetReps = minReps;
    isDoubleProgressionAdvancement = true;
  }

  // Quantile selection:
  // Alpha = 0.5 (normal, z=0), conservative = 0.35 (z=-0.38) when readiness < 0.5 or uncertainty is high
  const zAlpha = readiness < 0.5 || confidence === 'low' ? -0.38 : 0.0;
  const targetTheta = Math.exp(state.logTheta + zAlpha * e1rmStd);

  const pct = model.percent(targetReps + input.targetRir);
  const rawLoad = targetTheta * pct;

  // Round to nearest available increment
  const increment = input.availableIncrementsKg[0] || 2.5;
  const suggestedLoadKg = Math.max(increment, Math.round(rawLoad / increment) * increment);

  let explanationFa = `پیشنهاد بار ${suggestedLoadKg} کیلوگرم برای ${targetReps} تکرار با RIR ${input.targetRir}. `;
  let explanationEn = `Recommended ${suggestedLoadKg} kg for ${targetReps} reps @ RIR ${input.targetRir}. `;

  if (isDoubleProgressionAdvancement) {
    explanationFa += `(پیشرفت دوگانه: رسیدن به سقف ${maxReps} تکرار؛ افزایش بار و بازگشت تکرار به ${minReps}).`;
    explanationEn += `(Double progression: reached ${maxReps} reps; increased load and reset reps to ${minReps}).`;
  } else {
    explanationFa += `(برآورد بیزی توان ۱RM: ${e1rmMean.toFixed(1)} کیلوگرم با بازه‌ی اطمینان ۸۰٪: ${lower80.toFixed(1)} تا ${upper80.toFixed(1)}).`;
    explanationEn += `(Posterior e1RM: ${e1rmMean.toFixed(1)} kg, 80% CI: [${lower80.toFixed(1)}, ${upper80.toFixed(1)}]).`;
  }

  return {
    suggestedLoadKg,
    targetReps,
    targetRir: input.targetRir,
    e1rmMeanKg: parseFloat(e1rmMean.toFixed(1)),
    e1rmLowerBound80Kg: parseFloat(lower80.toFixed(1)),
    e1rmUpperBound80Kg: parseFloat(upper80.toFixed(1)),
    isDoubleProgressionAdvancement,
    confidence,
    explanationFa,
    explanationEn
  };
}

function normalCDF(z: number): number {
  const p = 0.3275911;
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;

  const sign = z < 0 ? -1 : 1;
  const absZ = Math.abs(z) / Math.SQRT2;
  const t = 1.0 / (1.0 + p * absZ);
  const erf = 1.0 - ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-absZ * absZ);

  return 0.5 * (1.0 + sign * erf);
}
