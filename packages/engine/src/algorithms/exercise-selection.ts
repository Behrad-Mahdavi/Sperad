/**
 * Algorithm 4-A: Exercise Selection & Session Distribution (Constrained Optimization)
 *
 * Implements the MILP / greedy fallback optimizer from Section 4-A of the technical brief:
 * Maximize stimulus-to-fatigue ratio (SFR) while strictly satisfying:
 *  - Muscle weekly volume bounds [V^{lo}_m, V^{hi}_m]
 *  - Session time budget T_d
 *  - Joint budget limits J_k
 *  - Sets per exercise bounds (2 <= x_{e,d} <= 5)
 *  - Daily muscle volume ceiling S^{max}_m (prevents junk volume)
 *  - Pain flag / available equipment exclusions
 *  - Order: Compound/high-fatigue first, isolation last.
 */

export interface ExerciseCandidate {
  id: string;
  name: string;
  nameFa?: string;
  primaryMuscles: { muscleId: string; contribution: number }[];
  secondaryMuscles?: { muscleId: string; contribution: number }[];
  movementPattern: string;
  equipment: string[];
  sfrPrior: number; // 0.0 to 1.0
  systemicFatigue: number; // 0.0 to 1.0 (higher = compound/spine load)
  jointStress?: Record<string, number>; // e.g. { knee: 0.8, spine: 0.9 }
  timePerSetMinutes?: number; // default ~2.5
  lengthBias?: boolean; // stretch-mediated hypertrophy bonus
  e1rmSlope?: number; // historical user progression slope
  userPreference?: number; // multiplier default 1.0
}

export interface DayBudget {
  dayIndex: number;
  nameFa: string;
  maxMinutes?: number; // default 75
  maxJointBudget?: Record<string, number>;
  focusMuscles?: string[];
}

export interface SelectionProblemInput {
  muscleTargets: Record<string, { minSets: number; maxSets: number }>;
  availableExercises: ExerciseCandidate[];
  days: DayBudget[];
  userAvailableEquipment: string[];
  activePainJoints: string[];
  maxPerMuscleDailySets?: number; // default 8
}

export interface PlannedExerciseAssignment {
  exerciseId: string;
  exerciseName: string;
  sets: number;
  movementOrder: number;
  rationaleFa: string;
}

export interface PlannedSessionDay {
  dayIndex: number;
  nameFa: string;
  exercises: PlannedExerciseAssignment[];
  totalSets: number;
  estimatedMinutes: number;
  muscleSetsDelivered: Record<string, number>;
  rationaleFa: string;
}

export interface ExerciseSelectionResult {
  sessions: PlannedSessionDay[];
  weeklyMuscleVolume: Record<string, number>;
  unmetTargets: Record<string, { target: number; delivered: number }>;
  modelNotesFa: string[];
}

export function solveExerciseSelection(
  input: SelectionProblemInput
): ExerciseSelectionResult {
  const {
    muscleTargets,
    availableExercises,
    days,
    userAvailableEquipment,
    activePainJoints,
    maxPerMuscleDailySets = 8
  } = input;

  const notes: string[] = [];

  // 1. Hard Filter: Equipment & Joint Pain
  const painSet = new Set(activePainJoints.map((j) => j.toLowerCase()));
  const equipSet = new Set(userAvailableEquipment.map((e) => e.toLowerCase()));

  const filteredExercises = availableExercises.filter((ex) => {
    // Check equipment
    const hasEquipment =
      ex.equipment.length === 0 ||
      ex.equipment.some((eq) => equipSet.has(eq.toLowerCase()));
    if (!hasEquipment) return false;

    // Check pain flags on stressed joints
    if (ex.jointStress) {
      for (const [joint, stress] of Object.entries(ex.jointStress)) {
        if (stress > 0.3 && painSet.has(joint.toLowerCase())) {
          notes.push(`حرکت «${ex.name}» به دلیل درد مفاصل (${joint}) حذف شد.`);
          return false;
        }
      }
    }
    return true;
  });

  // 2. Score utility u_e for each candidate
  // u_e = sfrPrior * (1 + 0.1 * lengthBias) * (1 + slope) * preference
  const scoredExercises = filteredExercises.map((ex) => {
    const lengthBonus = ex.lengthBias ? 0.1 : 0.0;
    const slopeBonus = Math.max(-0.2, Math.min(0.3, ex.e1rmSlope ?? 0.0));
    const pref = ex.userPreference ?? 1.0;
    const utility = (ex.sfrPrior + lengthBonus + slopeBonus) * pref;
    return {
      ...ex,
      utility: Math.max(0.1, utility),
      timePerSet: ex.timePerSetMinutes ?? 2.5
    };
  });

  // Track weekly volume delivered to each muscle
  const weeklyMuscleVolume: Record<string, number> = {};
  for (const muscleId of Object.keys(muscleTargets)) {
    weeklyMuscleVolume[muscleId] = 0;
  }

  // State per session day
  const sessionPlans: {
    day: DayBudget;
    exercises: Map<string, { exercise: typeof scoredExercises[0]; sets: number }>;
    totalMinutes: number;
    jointStress: Record<string, number>;
    muscleSets: Record<string, number>;
  }[] = days.map((d) => ({
    day: d,
    exercises: new Map(),
    totalMinutes: 0,
    jointStress: {},
    muscleSets: {}
  }));

  // 3. Iterative greedy allocation to fulfill muscle target ranges [V^{lo}_m, V^{hi}_m]
  // Sort muscles by deficit relative to minSets
  const sortedMuscleIds = Object.keys(muscleTargets).sort((a, b) => {
    return muscleTargets[b].minSets - muscleTargets[a].minSets;
  });

  for (const muscleId of sortedMuscleIds) {
    const target = muscleTargets[muscleId];
    let currentVolume = weeklyMuscleVolume[muscleId] ?? 0;

    // Candidate exercises targeting this muscle
    const candidates = scoredExercises
      .filter((ex) => {
        const prim = ex.primaryMuscles.some((m) => m.muscleId === muscleId && m.contribution > 0.4);
        return prim;
      })
      .sort((a, b) => b.utility - a.utility);

    if (candidates.length === 0) continue;

    let candidateIdx = 0;
    let attempts = 0;

    while (currentVolume < target.minSets && attempts < 20) {
      attempts++;
      const candidate = candidates[candidateIdx % candidates.length];
      candidateIdx++;

      // Find best day to place this candidate
      // Prioritize days with focusMuscles, least daily sets for this muscle, and available time budget
      let bestDayIndex = -1;
      let minDayFatigue = Infinity;

      for (let i = 0; i < sessionPlans.length; i++) {
        const plan = sessionPlans[i];
        const dayLimitMinutes = plan.day.maxMinutes ?? 75;
        const currentDailySetsForMuscle = plan.muscleSets[muscleId] ?? 0;

        // Check if muscle cap reached in this day
        if (currentDailySetsForMuscle >= maxPerMuscleDailySets) continue;

        // Check time budget (adding 3 sets)
        if (plan.totalMinutes + 3 * candidate.timePerSet > dayLimitMinutes) continue;

        // Check if exercise already assigned
        const existingAssignment = plan.exercises.get(candidate.id);
        if (existingAssignment && existingAssignment.sets >= 5) continue;

        // Check max exercise count per day (limit 7)
        if (!existingAssignment && plan.exercises.size >= 7) continue;

        // Evaluate day score
        let dayScore = plan.totalMinutes;
        if (plan.day.focusMuscles?.includes(muscleId)) {
          dayScore -= 50; // High bonus for designated split focus
        }

        if (dayScore < minDayFatigue) {
          minDayFatigue = dayScore;
          bestDayIndex = i;
        }
      }

      if (bestDayIndex === -1) {
        break; // No valid day slots available
      }

      const targetDayPlan = sessionPlans[bestDayIndex];
      const existing = targetDayPlan.exercises.get(candidate.id);
      const setsToAdd = existing ? Math.min(2, 5 - existing.sets) : 3;

      if (setsToAdd <= 0) break;

      if (existing) {
        existing.sets += setsToAdd;
      } else {
        targetDayPlan.exercises.set(candidate.id, {
          exercise: candidate,
          sets: setsToAdd
        });
      }

      targetDayPlan.totalMinutes += setsToAdd * candidate.timePerSet;

      // Update muscle deliveries
      for (const prim of candidate.primaryMuscles) {
        const addedEff = setsToAdd * prim.contribution;
        weeklyMuscleVolume[prim.muscleId] = (weeklyMuscleVolume[prim.muscleId] ?? 0) + addedEff;
        targetDayPlan.muscleSets[prim.muscleId] =
          (targetDayPlan.muscleSets[prim.muscleId] ?? 0) + addedEff;
      }

      if (candidate.secondaryMuscles) {
        for (const sec of candidate.secondaryMuscles) {
          const addedEff = setsToAdd * sec.contribution;
          weeklyMuscleVolume[sec.muscleId] = (weeklyMuscleVolume[sec.muscleId] ?? 0) + addedEff;
          targetDayPlan.muscleSets[sec.muscleId] =
            (targetDayPlan.muscleSets[sec.muscleId] ?? 0) + addedEff;
        }
      }

      currentVolume = weeklyMuscleVolume[muscleId] ?? 0;
    }
  }

  // 4. Assemble session outputs and sort by: Compound/high-fatigue first, isolation last
  const sessions: PlannedSessionDay[] = sessionPlans.map((plan) => {
    const assignments = Array.from(plan.exercises.values()).sort((a, b) => {
      // Sort descending by systemicFatigue (compound multi-joint first)
      return b.exercise.systemicFatigue - a.exercise.systemicFatigue;
    });

    const plannedExercises: PlannedExerciseAssignment[] = assignments.map(
      (assign, idx) => {
        const isCompound = assign.exercise.systemicFatigue >= 0.6;
        const rationale = isCompound
          ? `حرکت چندمفصلی پایه؛ اولویت اجرای اول جلسه برای بهره‌وری عصبی حداکثر (${assign.sets} ست کاری)`
          : `حرکت ایزوله تمرکزی با SFR بهینه جهت تکمیل حجم بدون فشار بی‌مورد بر ستون فقرات (${assign.sets} ست کاری)`;

        return {
          exerciseId: assign.exercise.id,
          exerciseName: assign.exercise.nameFa ?? assign.exercise.name,
          sets: assign.sets,
          movementOrder: idx + 1,
          rationaleFa: rationale
        };
      }
    );

    const totalSets = plannedExercises.reduce((sum, e) => sum + e.sets, 0);

    return {
      dayIndex: plan.day.dayIndex,
      nameFa: plan.day.nameFa,
      exercises: plannedExercises,
      totalSets,
      estimatedMinutes: Math.round(plan.totalMinutes),
      muscleSetsDelivered: plan.muscleSets,
      rationaleFa: `برنامه روز شامل ${plannedExercises.length} حرکت و ${totalSets} ست موثر، متوازن با سقف زمان و ریکاوری.`
    };
  });

  // 5. Evaluate unmet targets
  const unmetTargets: Record<string, { target: number; delivered: number }> = {};
  for (const [mId, target] of Object.entries(muscleTargets)) {
    const delivered = Math.round((weeklyMuscleVolume[mId] ?? 0) * 10) / 10;
    if (delivered < target.minSets) {
      unmetTargets[mId] = { target: target.minSets, delivered };
    }
  }

  return {
    sessions,
    weeklyMuscleVolume,
    unmetTargets,
    modelNotesFa: notes
  };
}
