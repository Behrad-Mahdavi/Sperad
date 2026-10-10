/**
 * Algorithm 4-B: Re-entry Mode (Returning after long layoff)
 * Protects connective tissue from neuromuscular overreach by managing
 * prior decay, high-variance safety governors, and phased volume/load ramps.
 */

export interface LayoffProfile {
  layoffDays: number;
  peakHistoricalE1RM: number; // in kg
  trainingAgeYears: number;
  age: number;
}

export interface ReEntryPhaseState {
  currentPhase: 0 | 1 | 2; // 0: Acclimatization, 1: Progressive Ramp, 2: Exit Gate
  consecutivePainFreeSessions: number;
  consecutiveJointPainSessions: number;
  phaseWeeksCompleted: number;
  isLoadLockedByPain: boolean;
}

export interface ReEntryRecommendation {
  initialPriorE1RM: number;
  initialPriorVariance: number;
  volumeMultiplier: number;
  minRirTarget: number;
  loadCeilingKg: number;
  isExitApproved: boolean;
  explanationFa: string;
  explanationEn: string;
}

/**
 * Calculates decayed e1RM prior and widened variance after D days of layoff:
 * θ_0 = θ_floor + (θ_peak - θ_floor) * exp(-D / tau_d)
 */
export function calculateReEntryPrior(profile: LayoffProfile): {
  priorE1RM: number;
  priorVariance: number;
} {
  const tauD = 90; // decay time constant ~ 3 months
  const floorFraction = profile.trainingAgeYears > 3 ? 0.65 : 0.55;
  const floorE1RM = profile.peakHistoricalE1RM * floorFraction;

  const decayedE1RM =
    floorE1RM + (profile.peakHistoricalE1RM - floorE1RM) * Math.exp(-profile.layoffDays / tauD);

  // Variance widens as layoff duration grows
  const baseVar = 0.02;
  const layoffInflation = Math.min(0.15, (profile.layoffDays / 180) * 0.12);
  const priorVariance = baseVar + layoffInflation;

  return {
    priorE1RM: parseFloat(decayedE1RM.toFixed(1)),
    priorVariance: parseFloat(priorVariance.toFixed(4))
  };
}

/**
 * Evaluates current Re-entry phase and outputs strict safety governors.
 */
export function evaluateReEntryGovernors(
  profile: LayoffProfile,
  state: ReEntryPhaseState,
  _currentE1RM: number
): ReEntryRecommendation {
  const { priorE1RM, priorVariance } = calculateReEntryPrior(profile);

  // Safety lock on joint pain
  const isLoadLocked = state.consecutiveJointPainSessions >= 2;

  let volumeMultiplier = 0.55;
  let minRirTarget = 4;
  let isExitApproved = false;
  let explanationFa = '';
  let explanationEn = '';

  if (state.currentPhase === 0) {
    // Phase 0: Acclimatization (50-60% MEV, RIR 4+, no failure)
    volumeMultiplier = 0.55;
    minRirTarget = 4;
    explanationFa =
      'فاز ۰ بازگشت (آشنایی و سازگاری بافت همبند): حجم ۵۵٪ MEV، حداقل RIR برابر ۴، بدون رسیدن به نارسایی.';
    explanationEn =
      'Re-entry Phase 0 (Acclimatization): volume at 55% MEV, min RIR 4, no failure allowed to protect tendons.';
  } else if (state.currentPhase === 1) {
    // Phase 1: Progressive Ramp (75-85% MEV, RIR 3 to 2)
    volumeMultiplier = Math.min(0.9, 0.65 + state.phaseWeeksCompleted * 0.1);
    minRirTarget = isLoadLocked ? 4 : 2;
    explanationFa = isLoadLocked
      ? 'قفل ایمنی فعال شد: دو جلسه درد مفصل متوالی ثبت شد؛ افزایش بار قفل گردید و RIR روی ۴ تثبیت شد.'
      : `فاز ۱ بازگشت (صعود تدریجی): حجم ${(volumeMultiplier * 100).toFixed(0)}٪ با RIR هدف ۲ تا ۳.`;
    explanationEn = isLoadLocked
      ? 'Safety lock active: 2 consecutive joint pain flags detected; load progression locked.'
      : `Re-entry Phase 1 (Progressive ramp): volume at ${(volumeMultiplier * 100).toFixed(0)}%, RIR 2-3.`;
  } else {
    // Phase 2: Exit check (requires >= 6 pain-free sessions)
    volumeMultiplier = 1.0;
    minRirTarget = 1;
    isExitApproved = state.consecutivePainFreeSessions >= 6 && !isLoadLocked;
    explanationFa = isExitApproved
      ? 'معیار خروج از مود بازگشت برآورده شد: آمادگی ساختاری تاندون‌ها و عضلات تایید شد؛ انتقال به مزوسیکل عادی.'
      : 'فاز ۲ بازگشت: در انتظار تکمیل ۶ جلسه‌ی متوالی بدون درد مفصل برای خروج کامل.';
    explanationEn = isExitApproved
      ? 'Exit criteria met: structural tissue readiness verified. Transitioning to normal mesocycle.'
      : 'Re-entry Phase 2: awaiting 6 consecutive pain-free sessions for full exit.';
  }

  // Max load jump ceiling: never exceed 70% of peak in Phase 0
  const loadCeilingKg =
    state.currentPhase === 0
      ? profile.peakHistoricalE1RM * 0.70
      : profile.peakHistoricalE1RM * 0.90;

  return {
    initialPriorE1RM: priorE1RM,
    initialPriorVariance: priorVariance,
    volumeMultiplier,
    minRirTarget,
    loadCeilingKg: parseFloat(loadCeilingKg.toFixed(1)),
    isExitApproved,
    explanationFa,
    explanationEn
  };
}
