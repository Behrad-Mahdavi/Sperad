import { describe, it, expect } from 'vitest';
import {
  calculateStimulus,
  calculateFatigueCost,
  stepBanisterState,
  calculateDailyReadiness,
  DEFAULT_BANISTER_PARAMS
} from '../src/algorithms/fitness-fatigue';
import {
  updateKalmanE1RM,
  recommendNextSetLoad,
  DEFAULT_E1RM_STATE
} from '../src/algorithms/kalman-e1rm';
import {
  updateWeightKalman,
  analyzeWeightTrend,
  DEFAULT_WEIGHT_STATE
} from '../src/algorithms/weight-kalman';
import {
  calculateReEntryPrior,
  evaluateReEntryGovernors
} from '../src/algorithms/re-entry';
import {
  evaluateDeloadSignals,
  analyzePlateauRootCause
} from '../src/algorithms/mesocycle-planning';

describe('Algorithm 1: Fitness-Fatigue & Readiness', () => {
  it('calculates stimulus correctly with knee at RIR 3', () => {
    expect(calculateStimulus(2)).toBe(1.0);
    expect(calculateStimulus(3)).toBe(1.0);
    expect(calculateStimulus(4)).toBeCloseTo(0.85);
    expect(calculateStimulus(5)).toBeCloseTo(0.70);
  });

  it('calculates fatigue cost with failure penalty', () => {
    const costRir0 = calculateFatigueCost(0, 0.85);
    const costRir3 = calculateFatigueCost(3, 0.85);
    // At RIR 0: (1 + 0.25*3) = 1.75x
    expect(costRir0 / costRir3).toBeCloseTo(1.75, 2);
  });

  it('advances Banister state and computes readiness score', () => {
    // Highly recovered state: good fitness accumulation with low residual fatigue
    const s0 = { fitness: 35, fatigue: 4, asOfDate: '2026-10-10' };
    const s1 = stepBanisterState(s0, 0, 0, 1, DEFAULT_BANISTER_PARAMS);
    expect(s1.fitness).toBeGreaterThan(0);

    const readiness = calculateDailyReadiness(s1, {
      sleepHours: 8,
      sleepQuality: 5,
      stressLevel: 1,
      motivation: 5,
      targetMuscleSoreness: 0
    });

    expect(readiness.score).toBeGreaterThan(0.7);
    expect(readiness.category).toBe('high');
  });
});

describe('Algorithm 2: Bayesian Kalman e1RM & Load Recommendation', () => {
  it('updates e1RM state and handles PR detection', () => {
    const state = { ...DEFAULT_E1RM_STATE, allTimeRecordE1RM: 100, logTheta: Math.log(100) };
    const obs = {
      loadKg: 105,
      reps: 5,
      rir: 1,
      setNumberInSession: 1,
      performedDate: '2026-10-11'
    };

    const { newState, isNewPR, prProbability } = updateKalmanE1RM(state, obs);
    expect(Math.exp(newState.logTheta)).toBeGreaterThan(100);
    expect(prProbability).toBeGreaterThan(0.7);
  });

  it('generates double progression load recommendation', () => {
    const state = { ...DEFAULT_E1RM_STATE, logTheta: Math.log(100) };
    const rec = recommendNextSetLoad(
      state,
      {
        targetReps: 10,
        targetRir: 2,
        repRange: [6, 10],
        availableIncrementsKg: [2.5]
      },
      {
        loadKg: 75,
        reps: 10, // hit upper bound!
        rir: 2,
        setNumberInSession: 1,
        performedDate: '2026-10-11'
      }
    );

    expect(rec.isDoubleProgressionAdvancement).toBe(true);
    expect(rec.targetReps).toBe(6); // reset to lower bound
  });
});

describe('Algorithm 5-A: Body Weight Local Level Kalman', () => {
  it('filters noisy weigh-ins and calculates weekly trend', () => {
    let state = DEFAULT_WEIGHT_STATE;
    state = updateWeightKalman(state, { weightKg: 75.8, date: '2026-10-01' });
    state = updateWeightKalman(state, { weightKg: 75.4, date: '2026-10-02' });
    state = updateWeightKalman(state, { weightKg: 75.7, date: '2026-10-03' });

    const analysis = analyzeWeightTrend(state, 'hypertrophy');
    expect(analysis.smoothedWeightKg).toBeGreaterThan(70);
    expect(analysis.weeklyChangePercent).toBeDefined();
  });
});

describe('Algorithm 4-B: Re-entry Mode Prior & Governors', () => {
  it('decays prior e1RM proportionally after layoff', () => {
    const priorShort = calculateReEntryPrior({
      layoffDays: 30,
      peakHistoricalE1RM: 140,
      trainingAgeYears: 5,
      age: 28
    });

    const priorLong = calculateReEntryPrior({
      layoffDays: 180,
      peakHistoricalE1RM: 140,
      trainingAgeYears: 5,
      age: 28
    });

    expect(priorLong.priorE1RM).toBeLessThan(priorShort.priorE1RM);
    expect(priorLong.priorVariance).toBeGreaterThan(priorShort.priorVariance);
  });

  it('enforces joint pain lock in Re-entry', () => {
    const rec = evaluateReEntryGovernors(
      { layoffDays: 60, peakHistoricalE1RM: 100, trainingAgeYears: 3, age: 28 },
      {
        currentPhase: 1,
        consecutivePainFreeSessions: 0,
        consecutiveJointPainSessions: 2, // 2 sessions of joint pain!
        phaseWeeksCompleted: 2,
        isLoadLockedByPain: true
      },
      80
    );

    expect(rec.minRirTarget).toBe(4);
    expect(rec.isExitApproved).toBe(false);
  });
});

describe('Algorithm 3 & 5-C: Deload & Plateau Analysis', () => {
  it('triggers safety deload when joint pain is flagged', () => {
    const decision = evaluateDeloadSignals({
      currentWeek: 3,
      maxMesocycleWeeks: 5,
      e1rmPerformanceSlope: 0.005,
      slopeVariance: 0.0001,
      recentReadinessScores: [0.7, 0.8, 0.7],
      weeklySets: 14,
      mrv: 20,
      hasJointPainFlag: true
    });

    expect(decision.isDeloadRecommended).toBe(true);
    expect(decision.actionType).toBe('forced_safety_deload');
    expect(decision.volumeReductionFactor).toBe(0.5);
  });

  it('detects plateau and scores root causes', () => {
    const diag = analyzePlateauRootCause({
      exerciseId: 'barbell_bench_press',
      slope3Weeks: -0.001,
      slopeStdDev: 0.002,
      currentWeeklySets: 8,
      mev: 8,
      mrv: 20,
      avgSleepHours: 8,
      avgStressLevel: 2,
      weeklyWeightRatePercent: 0.3,
      mesocyclesWithThisExercise: 1,
      hasErraticRir: false
    });

    expect(diag.isPlateaued).toBe(true);
    expect(diag.rankedHypotheses[0].hypothesis).toBe('insufficient_volume');
  });
});

describe('Algorithm 4-A: Exercise Selection & Session Distribution (Constrained Optimizer)', () => {
  it('solves session distribution without exceeding daily caps or pain joints', async () => {
    const { solveExerciseSelection } = await import('../src/algorithms/exercise-selection');

    const result = solveExerciseSelection({
      muscleTargets: {
        chest: { minSets: 8, maxSets: 12 },
        back: { minSets: 8, maxSets: 12 }
      },
      availableExercises: [
        {
          id: 'bench_press',
          name: 'پرس سینه هالتر',
          primaryMuscles: [{ muscleId: 'chest', contribution: 1.0 }],
          movementPattern: 'horizontal_push',
          equipment: ['barbell', 'bench'],
          sfrPrior: 0.85,
          systemicFatigue: 0.8,
          jointStress: { shoulder: 0.4 }
        },
        {
          id: 'dumbbell_fly',
          name: 'قفسه سینه دمبل',
          primaryMuscles: [{ muscleId: 'chest', contribution: 1.0 }],
          movementPattern: 'isolation',
          equipment: ['dumbbell', 'bench'],
          sfrPrior: 0.75,
          systemicFatigue: 0.2,
          lengthBias: true
        },
        {
          id: 'barbell_row',
          name: 'زیربغل هالتر خم',
          primaryMuscles: [{ muscleId: 'back', contribution: 1.0 }],
          movementPattern: 'horizontal_pull',
          equipment: ['barbell'],
          sfrPrior: 0.80,
          systemicFatigue: 0.75,
          jointStress: { spine: 0.8 } // High spine stress
        }
      ],
      days: [
        { dayIndex: 1, nameFa: 'جلسه ۱', maxMinutes: 60 },
        { dayIndex: 2, nameFa: 'جلسه ۲', maxMinutes: 60 }
      ],
      userAvailableEquipment: ['barbell', 'bench', 'dumbbell'],
      activePainJoints: ['spine'] // Spine pain active!
    });

    // Barbell row must be excluded due to spine pain
    const allAssignedIds = result.sessions.flatMap((s) => s.exercises.map((e) => e.exerciseId));
    expect(allAssignedIds).not.toContain('barbell_row');

    // Bench press should be compound and ordered first
    const day1 = result.sessions[0];
    if (day1.exercises.length > 1) {
      expect(day1.exercises[0].exerciseId).toBe('bench_press');
    }
    expect(result.sessions.length).toBe(2);
  });
});

describe('Algorithm 5-B: Nutrition Guidelines & TDEE Kalman Estimation', () => {
  it('calculates protein targets in appropriate ranges', async () => {
    const { calculateProteinTargets } = await import('../src/algorithms/nutrition-tdee');

    const cutTarget = calculateProteinTargets({
      bodyWeightKg: 80,
      goal: 'fat_loss'
    });
    expect(cutTarget.minGrams).toBeGreaterThanOrEqual(160);
    expect(cutTarget.maxGrams).toBeLessThanOrEqual(195);

    const bulkTarget = calculateProteinTargets({
      bodyWeightKg: 80,
      goal: 'hypertrophy'
    });
    expect(bulkTarget.minGrams).toBe(128); // 1.6 * 80
  });

  it('estimates TDEE and applies volume damping under aggressive deficit', async () => {
    const { estimateTdeeFromLogs } = await import('../src/algorithms/nutrition-tdee');

    const logs = [
      { calories: 1800 },
      { calories: 1850 },
      { calories: 1750 },
      { calories: 1900 },
      { calories: 1800 },
      { calories: 1800 }
    ];

    const result = estimateTdeeFromLogs(logs, -0.85); // losing 0.85 kg / week (aggressive)
    expect(result.estimatedTdee).toBeGreaterThan(2000);
    expect(result.volumeAdjustmentFactor).toBeLessThan(1.0); // MRV damping triggered
  });
});

describe('Synthetic User Simulator & Invariant Verifier (52 Weeks)', () => {
  it('passes 52 weeks of continuous simulation with zero invariant violations', async () => {
    const { run52WeekSimulation } = await import('../src/simulator/synthetic-user');

    const report = run52WeekSimulation();
    expect(report.weeksSimulated).toBe(52);
    expect(report.totalSetsSimulated).toBeGreaterThan(100);
    expect(report.safetyViolations).toBe(0);
    expect(report.invariantsPassed.loadJumpCapped).toBe(true);
    expect(report.invariantsPassed.painSafetyEnforced).toBe(true);
    expect(report.invariantsPassed.deterministicOutput).toBe(true);
  });
});
