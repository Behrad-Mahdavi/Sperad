/**
 * Synthetic User Simulator Harness
 * Generates virtual training history with known priors (Banister τ1/τ2, Banister a/b, dose-response).
 * Used for property-based testing and safety invariant verification.
 */
export interface SimulatorConfig {
  weeks: number;
  adherenceRate: number;
  tau1: number;
  tau2: number;
  rirNoiseStd: number;
}

export function createDefaultSimConfig(): SimulatorConfig {
  return {
    weeks: 52,
    adherenceRate: 0.95,
    tau1: 45,
    tau2: 11,
    rirNoiseStd: 0.5
  };
}
