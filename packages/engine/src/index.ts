import type { RepMaxModel } from './types';

export * from './types';

/**
 * Stimulus function σ(RIR):
 * σ(RIR) = max(0, 1 - s * max(0, RIR - rho_knee))
 * default s = 0.15, rho_knee = 3
 */
export function calculateStimulus(
  rir: number,
  s = 0.15,
  rhoKnee = 3
): number {
  return Math.max(0, 1 - s * Math.max(0, rir - rhoKnee));
}

/**
 * Fatigue cost function φ(RIR, I, f_e):
 * φ = f_e * (I^gamma) * (1 + kappa * max(0, rho_knee - RIR))
 * where I = load / e1rm, default gamma = 1, kappa = 0.25, rho_knee = 3
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
 * Repetition-Max percentage models p(n) where n = reps + rir
 */
export const epleyModel: RepMaxModel = {
  name: 'epley',
  percent: (n: number) => {
    if (n <= 0) return 1.0;
    return 1.0 / (1.0 + 0.0333 * n);
  }
};

export const brzyckiModel: RepMaxModel = {
  name: 'brzycki',
  percent: (n: number) => {
    if (n <= 1) return 1.0;
    if (n >= 37) return 0.25; // numerical safeguard
    return (37 - n) / 36;
  }
};
