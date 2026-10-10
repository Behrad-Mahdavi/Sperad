export interface MuscleVolumePrior {
  mev: number; // Minimum Effective Volume (e.g. 8 sets/week)
  mav: number; // Maximum Adaptive Volume (e.g. 14 sets/week)
  mrv: number; // Maximum Recoverable Volume (e.g. 20 sets/week)
  v0: number;  // Saturation curvature
}

export const DEFAULT_MUSCLE_VOLUME_PRIORS: Record<string, MuscleVolumePrior> = {
  chest: { mev: 8, mav: 14, mrv: 20, v0: 10 },
  back: { mev: 10, mav: 16, mrv: 22, v0: 12 },
  quads: { mev: 8, mav: 14, mrv: 18, v0: 10 },
  hamstrings: { mev: 6, mav: 12, mrv: 16, v0: 8 },
  shoulders: { mev: 8, mav: 16, mrv: 22, v0: 12 },
  arms: { mev: 6, mav: 12, mrv: 18, v0: 8 },
  calves: { mev: 6, mav: 12, mrv: 16, v0: 8 }
};

export interface VolumeProgressionInput {
  muscleId: string;
  currentWeeklySets: number;
  consecutiveWeeksProgression: number;
  avgReadinessScore: number;
  hasJointPain: boolean;
  isE1rmImproving: boolean;
  priors?: MuscleVolumePrior;
}

export interface VolumeProgressionResult {
  recommendedSets: number;
  action: 'increase_set' | 'hold' | 'reduce_set' | 'deload';
  rationaleFa: string;
}

/**
 * Algorithm 3: Dose-Response Volume progression per muscle.
 * Calculates next week's prescribed effective sets within [MEV, MRV].
 */
export function evaluateMesocycleVolumeProgression(
  input: VolumeProgressionInput
): VolumeProgressionResult {
  const priors = input.priors ?? DEFAULT_MUSCLE_VOLUME_PRIORS[input.muscleId] ?? {
    mev: 8,
    mav: 14,
    mrv: 20,
    v0: 10
  };

  if (input.hasJointPain) {
    const reducedSets = Math.max(priors.mev, Math.round(input.currentWeeklySets * 0.7));
    return {
      recommendedSets: reducedSets,
      action: 'reduce_set',
      rationaleFa: 'به دلیل اعلام ناراحتی یا درد در مفاصل درگیر، حجم این عضله کاهش یافت.'
    };
  }

  // If performance improving and recovery is high (readiness >= 0.65)
  if (input.isE1rmImproving && input.avgReadinessScore >= 0.65) {
    if (input.currentWeeklySets < priors.mrv) {
      const nextSets = Math.min(priors.mrv, input.currentWeeklySets + 1);
      return {
        recommendedSets: nextSets,
        action: 'increase_set',
        rationaleFa: `عملکرد رو به رشد و ریکاوری عالی؛ افزودن ۱ ست موثر به حجم هفتگی (${nextSets} ست).`
      };
    }
  }

  // If readiness low, hold or reduce
  if (input.avgReadinessScore < 0.45) {
    const nextSets = Math.max(priors.mev, input.currentWeeklySets - 1);
    return {
      recommendedSets: nextSets,
      action: 'reduce_set',
      rationaleFa: 'شاخص آمادگی مزمن پایین؛ تعدیل ۱ ست جهت بازیابی ظرفیت تطابق عضلانی.'
    };
  }

  return {
    recommendedSets: input.currentWeeklySets,
    action: 'hold',
    rationaleFa: `حفظ حجم فعلی (${input.currentWeeklySets} ست موثر) در محدوده انطباق مطلوب.`
  };
}

export interface DeloadSignalInput {
  currentWeek: number;
  maxMesocycleWeeks: number;
  e1rmPerformanceSlope: number; // posterior slope
  slopeVariance: number;
  recentReadinessScores: number[]; // last 3 sessions (0 to 1)
  weeklySets: number;
  mrv: number;
  hasJointPainFlag: boolean;
}

export interface DeloadDecision {
  isDeloadRecommended: boolean;
  reasons: string[];
  actionType: 'continue_accumulation' | 'recommended_deload' | 'forced_safety_deload';
  volumeReductionFactor: number; // e.g. 0.5 (cut sets by half)
  explanationFa: string;
  explanationEn: string;
}

export interface PlateauSignalInput {
  exerciseId: string;
  slope3Weeks: number;
  slopeStdDev: number;
  currentWeeklySets: number;
  mev: number;
  mrv: number;
  avgSleepHours: number;
  avgStressLevel: number;
  weeklyWeightRatePercent: number;
  mesocyclesWithThisExercise: number;
  hasErraticRir: boolean;
}

export interface PlateauHypothesis {
  hypothesis:
    | 'insufficient_volume'
    | 'excessive_volume'
    | 'sleep_or_stress'
    | 'energy_deficit'
    | 'exercise_staleness'
    | 'measurement_error';
  confidence: 'low' | 'medium' | 'high';
  score: number; // 0 to 1
  actionFa: string;
  actionEn: string;
}

/**
 * Evaluates whether a deload is warranted across 5 multi-signal criteria.
 */
export function evaluateDeloadSignals(input: DeloadSignalInput): DeloadDecision {
  const reasons: string[] = [];

  // 1. Joint/tendon pain (Highest priority safety trigger)
  if (input.hasJointPainFlag) {
    reasons.push('joint_pain_flag');
  }

  // 2. Performance drop: slope < 0 with high confidence (z < -0.84 ~ P > 80%)
  const zSlope = input.e1rmPerformanceSlope / Math.max(0.001, Math.sqrt(input.slopeVariance));
  if (zSlope < -0.84) {
    reasons.push('performance_drop');
  }

  // 3. Chronic low readiness (rolling average of 3 sessions < 0.45)
  if (input.recentReadinessScores.length >= 3) {
    const avgReady =
      input.recentReadinessScores.reduce((a: number, b: number) => a + b, 0) / input.recentReadinessScores.length;
    if (avgReady < 0.45) {
      reasons.push('chronic_low_readiness');
    }
  }

  // 4. Volume reached MRV ceiling
  if (input.weeklySets >= input.mrv) {
    reasons.push('mrv_ceiling_reached');
  }

  // 5. Time ceiling
  if (input.currentWeek >= input.maxMesocycleWeeks) {
    reasons.push('max_mesocycle_duration');
  }

  const isDeloadRecommended = reasons.length >= 2 || input.hasJointPainFlag;

  let actionType: 'continue_accumulation' | 'recommended_deload' | 'forced_safety_deload' =
    'continue_accumulation';
  let explanationFa = 'ادامه‌ی فاز تجمع حجم (Accumulation)؛ ریکاوری و عملکرد در محدوده‌ی مطلوب است.';
  let explanationEn = 'Continue accumulation phase; recovery and performance within optimal bounds.';

  if (input.hasJointPainFlag) {
    actionType = 'forced_safety_deload';
    explanationFa =
      'دیلود ایمنی اجباری: گزارش پرچم درد مفصل با اولویت بالا فعال شد؛ کاهش حجم به ۵۰٪ برای بازسازی بافت همبند.';
    explanationEn =
      'Forced safety deload: high-priority joint pain flag active; volume reduced to 50% for connective tissue repair.';
  } else if (isDeloadRecommended) {
    actionType = 'recommended_deload';
    explanationFa = `دیلود برنامه‌ریزی‌شده پیشنهاد می‌شود به دلایل: ${reasons.join(', ')}. کاهش ست‌ها به نصف با حفظ وزنه قبلی.`;
    explanationEn = `Deload recommended due to: ${reasons.join(', ')}. Volume reduced by 50% while holding load.`;
  }

  return {
    isDeloadRecommended,
    reasons,
    actionType,
    volumeReductionFactor: isDeloadRecommended ? 0.5 : 1.0,
    explanationFa,
    explanationEn
  };
}

/**
 * Detects whether an exercise has plateaued and scores 6 root-cause hypotheses.
 */
export function analyzePlateauRootCause(input: PlateauSignalInput): {
  isPlateaued: boolean;
  rankedHypotheses: PlateauHypothesis[];
} {
  // Plateau condition: 3-week slope <= 0 with probability > 80% (z < 0.84)
  const zScore = input.slope3Weeks / Math.max(0.001, input.slopeStdDev);
  const isPlateaued = zScore <= 0.2 && input.slope3Weeks <= 0.001;

  const hypotheses: PlateauHypothesis[] = [];

  // 1. Insufficient Volume
  if (input.currentWeeklySets <= input.mev + 1 && input.avgSleepHours >= 7.0) {
    hypotheses.push({
      hypothesis: 'insufficient_volume',
      score: 0.85,
      confidence: 'high',
      actionFa: 'افزودن ۱ تا ۲ ست در هفته برای این عضله (حجم فعلی نزدیک به MEV است و ریکاوری عالی است).',
      actionEn: 'Add 1-2 sets/week for target muscle (current volume near MEV and recovery is solid).'
    });
  }

  // 2. Excessive Volume
  if (input.currentWeeklySets >= input.mrv - 2) {
    hypotheses.push({
      hypothesis: 'excessive_volume',
      score: 0.80,
      confidence: 'high',
      actionFa: 'کاهش حجم یا دیلود؛ ست‌های هفتگی نزدیک به سقف MRV است و توان انطباق به اتمام رسیده.',
      actionEn: 'Reduce volume or deload; weekly sets near MRV ceiling, exceeding adaptive reserve.'
    });
  }

  // 3. Sleep or Stress
  if (input.avgSleepHours < 6.5 || input.avgStressLevel >= 4) {
    hypotheses.push({
      hypothesis: 'sleep_or_stress',
      score: 0.75,
      confidence: 'medium',
      actionFa: 'اصلاح خواب یا کاهش استرس زندگی؛ خواب زیر ۶.۵ ساعت مانع سنتز پروتئین و بازتوانی عصبی است.',
      actionEn: 'Address sleep/stress; under 6.5h sleep impedes MPS and neural recovery.'
    });
  }

  // 4. Energy Deficit
  if (input.weeklyWeightRatePercent < -0.30) {
    hypotheses.push({
      hypothesis: 'energy_deficit',
      score: 0.70,
      confidence: 'medium',
      actionFa: 'کسری کالری مشهود در روند وزن؛ پذیرش افت موقت یا افزایش ملایم کربوهیدرات قبل تمرین.',
      actionEn: 'Energy deficit evidenced by weight drop; accept temporary plateau or add pre-workout carbs.'
    });
  }

  // 5. Exercise Staleness
  if (input.mesocyclesWithThisExercise >= 3) {
    hypotheses.push({
      hypothesis: 'exercise_staleness',
      score: 0.65,
      confidence: 'medium',
      actionFa: 'کهنگی انطباقی حرکت؛ بیش از ۳ مزوسیکل متوالی استفاده شده. تعویض با یک تنوع حرکتی در همان الگو.',
      actionEn: 'Adaptive resistance/staleness; used >3 mesocycles. Swap variation in same movement pattern.'
    });
  }

  // 6. Measurement Error
  if (input.hasErraticRir) {
    hypotheses.push({
      hypothesis: 'measurement_error',
      score: 0.60,
      confidence: 'low',
      actionFa: 'عدم ثبت دقیق RIR؛ ست‌های ثبت‌شده بدون RIR یا با تخمین غیرقابل اتکا بوده‌اند.',
      actionEn: 'Inconsistent RIR logging; erratic ratings distorting latent strength estimates.'
    });
  }

  // Sort hypotheses descending by score
  hypotheses.sort((a, b) => b.score - a.score);

  return {
    isPlateaued,
    rankedHypotheses: hypotheses
  };
}
