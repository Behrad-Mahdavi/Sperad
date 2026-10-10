'use client';

import React, { useState, useEffect } from 'react';
import {
  DEFAULT_MUSCLE_VOLUME_PRIORS,
  evaluateDeloadSignals,
  evaluateReEntryGovernors,
  solveExerciseSelection,
  type PlannedSessionDay,
  type DeloadDecision
} from '@sperad/engine';

export default function ProgramPage() {
  const [currentWeek, setCurrentWeek] = useState<number>(3);
  const [mesocycleWeeks] = useState<number>(6);
  const [isReEntryMode, setIsReEntryMode] = useState<boolean>(false);
  const [reEntryPhase, setReEntryPhase] = useState<number>(1);
  const [jointPainActive, setJointPainActive] = useState<boolean>(false);

  // Muscle weekly sets tracker
  const [muscleSets, setMuscleSets] = useState<Record<string, number>>({
    chest: 12,
    back: 14,
    quads: 10,
    hamstrings: 8,
    shoulders: 12,
    arms: 10
  });

  const [deloadStatus, setDeloadStatus] = useState<DeloadDecision | null>(null);
  const [plannedSessions, setPlannedSessions] = useState<PlannedSessionDay[]>([]);

  // Evaluate Re-entry governors if active (Algorithm 4-B)
  const reEntryStatus = isReEntryMode
    ? evaluateReEntryGovernors(
        { layoffDays: 90, peakHistoricalE1RM: 100, trainingAgeYears: 3, age: 28 },
        {
          currentPhase: reEntryPhase as 0 | 1 | 2,
          consecutivePainFreeSessions: jointPainActive ? 0 : 3,
          consecutiveJointPainSessions: jointPainActive ? 2 : 0,
          phaseWeeksCompleted: 2,
          isLoadLockedByPain: jointPainActive
        },
        75
      )
    : null;

  useEffect(() => {
    // 1. Evaluate Deload status (Algorithm 3)
    const deload = evaluateDeloadSignals({
      currentWeek,
      maxMesocycleWeeks: mesocycleWeeks,
      e1rmPerformanceSlope: 0.005,
      slopeVariance: 0.0001,
      recentReadinessScores: [0.75, 0.70, 0.80],
      weeklySets: muscleSets.chest,
      mrv: DEFAULT_MUSCLE_VOLUME_PRIORS.chest.mrv,
      hasJointPainFlag: jointPainActive
    });
    setDeloadStatus(deload);

    // 2. Solve Exercise Selection (Algorithm 4-A)
    const selection = solveExerciseSelection({
      muscleTargets: {
        chest: { minSets: muscleSets.chest, maxSets: muscleSets.chest + 2 },
        back: { minSets: muscleSets.back, maxSets: muscleSets.back + 2 },
        quads: { minSets: muscleSets.quads, maxSets: muscleSets.quads + 2 }
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
          id: 'incline_db_press',
          name: 'بالا سینه دمبل',
          primaryMuscles: [{ muscleId: 'chest', contribution: 1.0 }],
          movementPattern: 'incline_push',
          equipment: ['dumbbell', 'bench'],
          sfrPrior: 0.88,
          systemicFatigue: 0.5,
          lengthBias: true
        },
        {
          id: 'lat_pulldown',
          name: 'زیربغل سیم‌کش',
          primaryMuscles: [{ muscleId: 'back', contribution: 1.0 }],
          movementPattern: 'vertical_pull',
          equipment: ['cable'],
          sfrPrior: 0.90,
          systemicFatigue: 0.3,
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
          jointStress: { spine: 0.8 }
        },
        {
          id: 'barbell_squat',
          name: 'اسکوات هالتر',
          primaryMuscles: [{ muscleId: 'quads', contribution: 1.0 }],
          movementPattern: 'squat',
          equipment: ['barbell', 'rack'],
          sfrPrior: 0.85,
          systemicFatigue: 0.9,
          jointStress: { knee: 0.7, spine: 0.6 }
        },
        {
          id: 'leg_press',
          name: 'پرس پا دستگاه',
          primaryMuscles: [{ muscleId: 'quads', contribution: 1.0 }],
          movementPattern: 'squat',
          equipment: ['machine'],
          sfrPrior: 0.92,
          systemicFatigue: 0.5,
          jointStress: { knee: 0.5 }
        }
      ],
      days: [
        { dayIndex: 1, nameFa: 'جلسه ۱: بالاتنه فشاری و کششی', maxMinutes: 70 },
        { dayIndex: 2, nameFa: 'جلسه ۲: پایین‌تنه و پایه‌ها', maxMinutes: 65 },
        { dayIndex: 3, nameFa: 'جلسه ۳: حجم تکمیلی عضلات', maxMinutes: 65 }
      ],
      userAvailableEquipment: ['barbell', 'bench', 'dumbbell', 'cable', 'machine', 'rack'],
      activePainJoints: jointPainActive ? ['shoulder'] : []
    });

    setPlannedSessions(selection.sessions);
  }, [currentWeek, mesocycleWeeks, jointPainActive, muscleSets]);

  return (
    <div className="flex flex-col gap-4 pb-12">
      {/* Header */}
      <div className="glass-panel rounded-2xl p-4">
        <div className="flex items-center justify-between mb-1">
          <h1 className="text-base font-black text-slate-100 tracking-tight">
            مدیریت مزوسیکل و حجم هفتگی
          </h1>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentWeek((w) => Math.max(1, w - 1))}
              className="w-6 h-6 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-bold text-slate-300 flex items-center justify-center cursor-pointer"
            >
              -
            </button>
            <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/25 fa-num">
              هفته {currentWeek} از {mesocycleWeeks}
            </span>
            <button
              onClick={() => setCurrentWeek((w) => Math.min(mesocycleWeeks, w + 1))}
              className="w-6 h-6 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-bold text-slate-300 flex items-center justify-center cursor-pointer"
            >
              +
            </button>
          </div>
        </div>
        <p className="text-[11px] text-slate-400 leading-relaxed">
          تنظیم هوشمند حجم عضلانی بر اساس دوز-پاسخ (MEV, MAV, MRV)، بهینه‌سازی توزیع حرکت‌ها (MILP) و پایش دیلود.
        </p>
      </div>

      {/* Mode Switches: Re-entry Mode (Algorithm 4-B) & Joint Pain */}
      <section className="glass-panel p-3.5 rounded-2xl flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-300">مود بازگشت (Re-entry):</span>
          <button
            onClick={() => setIsReEntryMode(!isReEntryMode)}
            className={`text-[10px] font-bold px-2.5 py-1 rounded-xl transition cursor-pointer ${
              isReEntryMode
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : 'bg-white/5 text-slate-400'
            }`}
          >
            {isReEntryMode ? 'فعال (وقفه ۳ ماهه)' : 'غیرفعال'}
          </button>
        </div>

        {isReEntryMode && (
          <div className="flex items-center gap-1">
            {[0, 1, 2].map((ph) => (
              <button
                key={ph}
                onClick={() => setReEntryPhase(ph)}
                className={`text-[10px] font-black px-2 py-0.5 rounded-lg transition cursor-pointer ${
                  reEntryPhase === ph
                    ? 'bg-amber-400 text-slate-950 font-black'
                    : 'bg-white/5 text-slate-400 hover:text-slate-200'
                }`}
              >
                فاز {ph}
              </button>
            ))}
          </div>
        )}
      </section>

      {/* Re-entry Governor Card */}
      {reEntryStatus && (
        <section className="glass-panel-elevated p-4 rounded-2xl border-amber-500/30 glow-emerald flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-amber-300">
              قیدهای ایمنی مود بازگشت (الگوریتم ۴-ب)
            </span>
            <span className="text-[10px] font-bold bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-md">
              کف RIR: {reEntryStatus.minRirTarget}
            </span>
          </div>
          <p className="text-[11px] text-slate-300 leading-relaxed">
            {reEntryStatus.explanationFa}
          </p>
          <div className="flex justify-between items-center text-[10px] text-slate-400 mt-1 border-t border-white/5 pt-2">
            <span>سقف بار مجاز: {reEntryStatus.loadCeilingKg} kg</span>
            <span>ضریب حجم: {(reEntryStatus.volumeMultiplier * 100).toFixed(0)}%</span>
          </div>
        </section>
      )}

      {/* Deload & Safety Alert Banner */}
      {deloadStatus && (
        <section
          className={`glass-panel-elevated p-4 rounded-2xl border ${
            deloadStatus.isDeloadRecommended
              ? 'border-amber-500/30 glow-emerald'
              : 'border-emerald-500/25'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span
                className={`w-2 h-2 rounded-full ${
                  deloadStatus.isDeloadRecommended ? 'bg-amber-400' : 'bg-emerald-400'
                } animate-pulse`}
              />
              <span className="text-xs font-black text-slate-100">
                پایش دیلود (الگوریتم ۳ - ۵ سیگنال)
              </span>
            </div>
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                deloadStatus.actionType === 'forced_safety_deload'
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                  : deloadStatus.actionType === 'recommended_deload'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
              }`}
            >
              {deloadStatus.actionType === 'forced_safety_deload'
                ? 'دیلود ایمنی اجباری'
                : deloadStatus.actionType === 'recommended_deload'
                ? 'دیلود پیشنهادی'
                : 'تجمع حجم (مطلوب)'}
            </span>
          </div>
          <p className="text-[11px] text-slate-300 leading-relaxed">
            {deloadStatus.explanationFa}
          </p>

          <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between">
            <span className="text-[11px] text-slate-400">آزمون ایمنی مفاصل:</span>
            <button
              onClick={() => setJointPainActive(!jointPainActive)}
              className={`text-[10px] font-bold px-3 py-1 rounded-xl transition cursor-pointer ${
                jointPainActive
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                  : 'bg-white/5 text-slate-400 hover:text-slate-200'
              }`}
            >
              {jointPainActive ? '⚠️ پرچم درد شانه فعال است' : 'پرچم درد غیرفعال'}
            </button>
          </div>
        </section>
      )}

      {/* Muscle Volume Targets (Israetel / Schoenfeld Dose-Response) */}
      <section className="glass-panel p-4 rounded-2xl flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-black text-slate-100">
            توزیع حجم هفتگی عضلات (ست موثر)
          </span>
          <span className="text-[10px] text-slate-400">MEV ── MAV ── MRV</span>
        </div>

        <div className="flex flex-col gap-3 mt-1">
          {Object.entries(muscleSets).map(([muscleId, sets]) => {
            const prior = DEFAULT_MUSCLE_VOLUME_PRIORS[muscleId] || {
              mev: 8,
              mav: 14,
              mrv: 20
            };
            const percentOfMrv = Math.min(100, Math.round((sets / prior.mrv) * 100));

            return (
              <div key={muscleId} className="flex flex-col gap-1.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-slate-300">
                    {muscleId === 'chest'
                      ? 'سینه (Chest)'
                      : muscleId === 'back'
                      ? 'زیربغل و پشت (Back)'
                      : muscleId === 'quads'
                      ? 'چهارسر ران (Quads)'
                      : muscleId === 'hamstrings'
                      ? 'همسترینگ (Hamstrings)'
                      : muscleId === 'shoulders'
                      ? 'سرشانه (Shoulders)'
                      : 'بازوها (Arms)'}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-500 fa-num">
                      (کف: {prior.mev} | سقف: {prior.mrv})
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() =>
                          setMuscleSets((prev) => ({
                            ...prev,
                            [muscleId]: Math.max(prior.mev - 2, prev[muscleId] - 1)
                          }))
                        }
                        className="w-5 h-5 rounded bg-white/5 hover:bg-white/10 text-[10px] font-bold text-slate-300 flex items-center justify-center cursor-pointer"
                      >
                        -
                      </button>
                      <span className="font-black fa-num text-emerald-400 text-sm w-7 text-center">
                        {sets}
                      </span>
                      <button
                        onClick={() =>
                          setMuscleSets((prev) => ({
                            ...prev,
                            [muscleId]: Math.min(prior.mrv + 2, prev[muscleId] + 1)
                          }))
                        }
                        className="w-5 h-5 rounded bg-white/5 hover:bg-white/10 text-[10px] font-bold text-slate-300 flex items-center justify-center cursor-pointer"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>

                {/* Progress track */}
                <div className="w-full h-2 rounded-full bg-white/5 overflow-hidden flex">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      sets >= prior.mrv
                        ? 'bg-rose-500'
                        : sets >= prior.mav
                        ? 'bg-emerald-400'
                        : 'bg-cyan-400'
                    }`}
                    style={{ width: `${percentOfMrv}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Algorithm 4-A: Planned Sessions & Exercises (MILP Generated) */}
      <section className="flex flex-col gap-2.5">
        <span className="text-xs font-bold text-slate-400 px-1">
          جلسات بهینه‌سازی‌شده هفته (الگوریتم ۴-الف)
        </span>

        {plannedSessions.map((session) => (
          <div key={session.dayIndex} className="glass-panel p-4 rounded-2xl flex flex-col gap-3">
            <div className="flex items-center justify-between border-b border-white/5 pb-2.5">
              <div>
                <span className="text-xs font-black text-slate-100">{session.nameFa}</span>
                <span className="text-[10px] text-slate-500 mr-2 fa-num">
                  تخمین زمان: ~{session.estimatedMinutes} دقیقه
                </span>
              </div>
              <span className="text-[10px] font-bold fa-num px-2 py-0.5 rounded-md bg-white/5 text-emerald-300">
                {session.totalSets} ست موثر
              </span>
            </div>

            {/* Exercises List with Rationale */}
            <div className="flex flex-col gap-2">
              {session.exercises.map((ex) => (
                <div
                  key={ex.exerciseId}
                  className="bg-white/[0.02] p-2.5 rounded-xl border border-white/5 flex flex-col gap-1"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-md bg-emerald-500/10 text-emerald-400 text-[10px] font-black fa-num flex items-center justify-center">
                        {ex.movementOrder}
                      </span>
                      <span className="text-xs font-bold text-slate-200">{ex.exerciseName}</span>
                    </div>
                    <span className="text-xs font-black fa-num text-emerald-400">
                      {ex.sets} ست
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 leading-relaxed pr-7">
                    💡 {ex.rationaleFa}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
