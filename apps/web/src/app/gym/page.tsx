'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { db } from '@/lib/db';
import { enqueueOutbox } from '@/lib/sync';
import { ensureSeedExercisesLoaded, INITIAL_EXERCISES } from '@/lib/seed-exercises';
import type { Exercise, Set as WorkoutSet, WorkoutSession } from '@sperad/shared';
import {
  recommendNextSetLoad,
  updateKalmanE1RM,
  DEFAULT_E1RM_STATE,
  type KalmanStateE1RM,
  type LoadRecommendationResult
} from '@sperad/engine';
import {
  USER_PROGRAM_DAYS,
  USER_PROGRAM_VOLUMES,
  type ProgramDayDef,
  type ProgramExerciseDef
} from '@/lib/user-program';

export default function GymModePage() {
  const [exercises, setExercises] = useState<Exercise[]>(INITIAL_EXERCISES);
  const [selectedDayId, setSelectedDayId] = useState<string>('pull_a');
  const [selectedWeek, setSelectedWeek] = useState<number>(1);
  const [selectedExerciseId, setSelectedExerciseId] = useState<string>('tbar_machine_chest_supported_row');
  const [todayReadinessScore, setTodayReadinessScore] = useState<number | null>(null);
  const [currentSession, setCurrentSession] = useState<WorkoutSession | null>(null);
  const [sessionSets, setSessionSets] = useState<WorkoutSet[]>([]);
  const [outboxPendingCount, setOutboxPendingCount] = useState<number>(0);
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showFinishModal, setShowFinishModal] = useState<boolean>(false);
  const [srpeRating, setSrpeRating] = useState<number>(7);

  // Input states for current set
  const [loadKg, setLoadKg] = useState<number>(60);
  const [reps, setReps] = useState<number>(8);
  const [rir, setRir] = useState<number>(2);
  const [isWarmup, setIsWarmup] = useState<boolean>(false);

  // Rest timer
  const [restTimerSeconds, setRestTimerSeconds] = useState<number>(0);
  const [totalWorkoutSeconds, setTotalWorkoutSeconds] = useState<number>(0);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize DB and exercises
  useEffect(() => {
    setIsOnline(navigator.onLine);
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    ensureSeedExercisesLoaded().then(async () => {
      const allEx = await db.exercises.toArray();
      if (allEx.length > 0) setExercises(allEx);
    });

    const todayDate = new Date().toISOString().split('T')[0];
    db.dailyCheckins.get(todayDate).then((ch) => {
      if (ch) {
        const score = (ch.sleepQuality + ch.motivation + (5 - ch.stressLevel)) / 15;
        setTodayReadinessScore(Math.round(score * 10 * 10) / 10);
      }
    });

    initSession();

    const checkOutbox = async () => {
      const count = await db.outbox.where('status').equals('pending').count();
      setOutboxPendingCount(count);
    };
    checkOutbox();
    const outboxInterval = setInterval(checkOutbox, 3000);

    // Workout duration timer
    const workoutTimer = setInterval(() => {
      setTotalWorkoutSeconds((s) => s + 1);
    }, 1000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(outboxInterval);
      clearInterval(workoutTimer);
    };
  }, []);

  // Timer countdown
  useEffect(() => {
    if (restTimerSeconds > 0) {
      timerIntervalRef.current = setTimeout(() => {
        setRestTimerSeconds((prev) => prev - 1);
      }, 1000);
    } else {
      if (timerIntervalRef.current) clearTimeout(timerIntervalRef.current);
    }
    return () => {
      if (timerIntervalRef.current) clearTimeout(timerIntervalRef.current);
    };
  }, [restTimerSeconds]);

  const initSession = async () => {
    const activeSession = await db.sessions
      .filter((s) => !s.completedAt)
      .last();

    if (activeSession) {
      setCurrentSession(activeSession);
      const sets = await db.sets.where('sessionId').equals(activeSession.clientUuid).toArray();
      setSessionSets(sets);

      // calculate elapsed seconds
      const startMs = new Date(activeSession.startedAt).getTime();
      const elapsed = Math.max(0, Math.floor((Date.now() - startMs) / 1000));
      setTotalWorkoutSeconds(elapsed);
    } else {
      const newSession: WorkoutSession = {
        clientUuid: crypto.randomUUID(),
        mesocycleId: null,
        plannedSessionId: null,
        name: 'تمرین امروز',
        startedAt: new Date().toISOString(),
        completedAt: null,
        readinessScore: null,
        srpe: null
      };
      await db.sessions.put(newSession);
      await enqueueOutbox('sessions', 'INSERT', newSession.clientUuid, newSession);
      setCurrentSession(newSession);
    }
  };

  const selectedExercise = useMemo(
    () => exercises.find((e) => e.id === selectedExerciseId) || exercises[0],
    [exercises, selectedExerciseId]
  );

  const currentProgramDay = useMemo<ProgramDayDef | undefined>(
    () => USER_PROGRAM_DAYS.find((d) => d.id === selectedDayId),
    [selectedDayId]
  );

  const currentProgramExercise = useMemo<ProgramExerciseDef | undefined>(
    () => currentProgramDay?.exercises.find((e) => e.exerciseId === selectedExerciseId),
    [currentProgramDay, selectedExerciseId]
  );

  const currentWeekVolume = useMemo(
    () => USER_PROGRAM_VOLUMES[selectedWeek],
    [selectedWeek]
  );

  const handleSelectDay = (dayId: string) => {
    setSelectedDayId(dayId);
    const day = USER_PROGRAM_DAYS.find((d) => d.id === dayId);
    if (day && day.exercises.length > 0) {
      setSelectedExerciseId(day.exercises[0].exerciseId);
    }
  };

  // Find previous set for this exercise
  const ghostSet = useMemo(() => {
    const exerciseSets = sessionSets
      .filter((s) => s.exerciseId === selectedExerciseId && !s.supersededBy)
      .sort((a, b) => (a.performedAt > b.performedAt ? 1 : -1));
    return exerciseSets.length > 0 ? exerciseSets[exerciseSets.length - 1] : null;
  }, [sessionSets, selectedExerciseId]);

  // Pre-fill values when exercise changes or ghost set found
  useEffect(() => {
    if (ghostSet) {
      setLoadKg(ghostSet.loadKg);
      setReps(ghostSet.reps);
      setRir(ghostSet.rir ?? 2);
    } else {
      setLoadKg(
        selectedExercise?.defaultLoadIncrementKg
          ? selectedExercise.defaultLoadIncrementKg * 20
          : 50
      );
      // Pre-fill target reps from user program if defined
      if (currentProgramExercise) {
        const parsedReps = parseInt(currentProgramExercise.repsRange.split(' ')[0], 10);
        setReps(isNaN(parsedReps) ? 8 : parsedReps);
        // Pre-fill RIR target
        setRir(selectedWeek === 1 ? 3 : selectedWeek === 2 ? 2 : currentProgramExercise.isCompound ? 2 : 1);
      } else {
        setReps(8);
        setRir(2);
      }
    }
  }, [selectedExerciseId, ghostSet, currentProgramExercise, selectedWeek]);

  const [kalmanState, setKalmanState] = useState<KalmanStateE1RM>(DEFAULT_E1RM_STATE);
  const [prAlert, setPrAlert] = useState<string | null>(null);

  // Dynamic Engine Recommendation (Algorithm 2)
  const engineRecommendation = useMemo<LoadRecommendationResult>(() => {
    return recommendNextSetLoad(
      kalmanState,
      {
        targetReps: 8,
        targetRir: 2,
        repRange: [6, 10],
        availableIncrementsKg: [selectedExercise?.defaultLoadIncrementKg || 2.5]
      },
      ghostSet
        ? {
            loadKg: ghostSet.loadKg,
            reps: ghostSet.reps,
            rir: ghostSet.rir ?? 2,
            setNumberInSession: ghostSet.setNumber,
            performedDate: ghostSet.performedAt.split('T')[0]
          }
        : undefined
    );
  }, [kalmanState, selectedExercise, ghostSet]);

  const nextSetNumber = useMemo(() => {
    const exerciseSets = sessionSets.filter(
      (s) => s.exerciseId === selectedExerciseId && !s.isWarmup && !s.supersededBy
    );
    return exerciseSets.length + 1;
  }, [sessionSets, selectedExerciseId]);

  // Log set in < 1 second
  const handleLogSet = async () => {
    if (!currentSession) return;

    const newSet: WorkoutSet = {
      clientUuid: crypto.randomUUID(),
      sessionId: currentSession.clientUuid,
      exerciseId: selectedExerciseId,
      setNumber: isWarmup ? 0 : nextSetNumber,
      loadKg,
      reps,
      rir,
      restSeconds: 90,
      isWarmup,
      supersededBy: null,
      performedAt: new Date().toISOString()
    };

    await db.sets.put(newSet);
    setSessionSets((prev) => [...prev, newSet]);
    await enqueueOutbox('sets', 'INSERT', newSet.clientUuid, newSet);

    // Update Algorithm 2 Bayesian e1RM & PR detection
    if (!isWarmup) {
      const { newState, isNewPR } = updateKalmanE1RM(
        kalmanState,
        {
          loadKg,
          reps,
          rir,
          setNumberInSession: nextSetNumber,
          performedDate: new Date().toISOString().split('T')[0]
        }
      );
      setKalmanState(newState);
      if (isNewPR) {
        setPrAlert(`🔥 رکورد جدید توان ۱RM: ${newState.allTimeRecordE1RM} کیلوگرم!`);
        setTimeout(() => setPrAlert(null), 4500);
      }
    }

    setRestTimerSeconds(90);
    if (isWarmup) setIsWarmup(false);
  };

  const handleFinishWorkout = async () => {
    if (!currentSession) return;

    const updated = {
      ...currentSession,
      completedAt: new Date().toISOString(),
      srpe: srpeRating
    };

    await db.sessions.put(updated);
    await enqueueOutbox('sessions', 'UPDATE', updated.clientUuid, updated);
    setCurrentSession(null);
    setShowFinishModal(false);
    alert('جلسه با موفقیت ثبت شد!');
  };

  // Filtered exercises for modal
  const filteredExercises = useMemo(() => {
    return exercises.filter((ex) => {
      const matchesSearch =
        ex.nameFa.includes(searchQuery) ||
        ex.nameEn.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory =
        selectedCategory === 'all' ||
        ex.primaryMuscles.some((m) => m.muscleId === selectedCategory);
      return matchesSearch && matchesCategory;
    });
  }, [exercises, searchQuery, selectedCategory]);

  const formatTime = (totalSeconds: number) => {
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col gap-3.5 pb-8">
      {/* 1. Sleek Top Bar (Workout Time, Offline status, Finish Button) */}
      <header className="glass-panel rounded-2xl p-3 flex justify-between items-center">
        <div className="flex items-center gap-2.5">
          <div className="relative flex items-center justify-center">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
            <span className="absolute w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping opacity-75" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-medium block leading-none">مدت تمرین</span>
            <span className="text-sm font-black fa-num text-slate-200 tracking-tight">
              {formatTime(totalWorkoutSeconds)}
            </span>
          </div>
        </div>

        {/* Sync Status Badge */}
        <div className="flex items-center gap-2">
          {outboxPendingCount > 0 ? (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[11px] font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
              <span className="fa-num">{outboxPendingCount} ست در صف</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[11px] font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span>{isOnline ? 'همگام با سرور' : 'آماده آفلاین'}</span>
            </div>
          )}

          <button
            onClick={() => setShowFinishModal(true)}
            className="text-[11px] font-bold px-3 py-1.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 active:scale-95 text-rose-300 border border-rose-500/30 transition-all cursor-pointer"
          >
            پایان جلسه
          </button>
        </div>
      </header>

      {/* 2. Interactive Rest Timer Ring Banner */}
      {restTimerSeconds > 0 && (
        <section className="glass-panel-elevated rounded-2xl p-3.5 flex items-center justify-between border-emerald-500/30 glow-emerald">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center">
              <span className="text-lg">⏱️</span>
            </div>
            <div>
              <span className="text-[11px] text-emerald-400 font-semibold block">زمان استراحت</span>
              <span className="text-2xl font-black fa-num text-emerald-300 tracking-tight leading-none">
                {Math.floor(restTimerSeconds / 60)}:
                {(restTimerSeconds % 60).toString().padStart(2, '0')}
              </span>
            </div>
          </div>
          <div className="flex gap-1.5">
            <button
              onClick={() => setRestTimerSeconds((s) => s + 30)}
              className="px-3 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 active:scale-95 text-emerald-300 text-xs rounded-xl font-bold border border-emerald-500/30 transition cursor-pointer"
            >
              +۳۰ ثانیه
            </button>
            <button
              onClick={() => setRestTimerSeconds(0)}
              className="px-3 py-1.5 bg-slate-800/80 hover:bg-slate-700 active:scale-95 text-slate-300 text-xs rounded-xl font-semibold border border-white/5 transition cursor-pointer"
            >
              پایان
            </button>
          </div>
        </section>
      )}

      {/* Program Routine Day Selector & Exercise Navigation */}
      <section className="glass-panel p-3.5 rounded-2xl flex flex-col gap-2.5 border-emerald-500/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-black text-slate-100">
              {currentProgramDay?.titleFa.split('(')[0]?.trim() || 'برنامه جلسات'}
            </span>
          </div>

          {/* Week Pills */}
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4].map((wk) => (
              <button
                key={wk}
                onClick={() => setSelectedWeek(wk)}
                className={`text-[10px] font-black px-2 py-0.5 rounded-lg transition cursor-pointer fa-num ${
                  selectedWeek === wk
                    ? 'bg-emerald-400 text-slate-950 font-black shadow-md'
                    : 'bg-white/5 text-slate-400 hover:text-slate-200'
                }`}
              >
                هفته {wk}
              </button>
            ))}
          </div>
        </div>

        {/* Current Week Target Volume & RIR badge */}
        {currentWeekVolume && (
          <div className="flex items-center justify-between text-[11px] px-2.5 py-1 rounded-xl bg-slate-900/60 border border-slate-800 text-slate-400">
            <span className="text-emerald-400 font-bold">{currentWeekVolume.generalRirFa}</span>
            <span className="text-slate-500 text-[10px]">برنامه بازگشت ۴ هفته‌ای</span>
          </div>
        )}

        {/* Routine Day Selector Tabs */}
        <div className="flex gap-1.5 overflow-x-auto pb-0.5 no-scrollbar">
          {USER_PROGRAM_DAYS.map((d) => (
            <button
              key={d.id}
              onClick={() => handleSelectDay(d.id)}
              className={`px-2.5 py-1.5 rounded-xl text-[11px] font-black whitespace-nowrap transition cursor-pointer ${
                selectedDayId === d.id
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : 'bg-white/5 text-slate-400 hover:text-slate-200'
              }`}
            >
              {d.titleFa.split(':')[1]?.split('(')[0]?.trim() || d.titleFa}
            </button>
          ))}
        </div>

        {/* Warmup notice for Push A / Push B */}
        {currentProgramDay?.warmupFa && (
          <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-300 text-[11px] flex items-center gap-2">
            <span>🛡️</span>
            <span className="leading-relaxed font-semibold">{currentProgramDay.warmupFa}</span>
          </div>
        )}

        {/* Autoregulation Alert (< 6) */}
        {todayReadinessScore !== null && todayReadinessScore < 6 && (
          <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-300 text-[11px] flex items-center gap-2">
            <span>⚠️</span>
            <span className="leading-relaxed">
              آمادگی امروز ({todayReadinessScore}/۱۰) زیر ۶ است؛ طبق اصل خودتنظیمی ۱ ست از هر حرکت کسر شد.
            </span>
          </div>
        )}

        {/* Day Exercises Chips Carousel */}
        {currentProgramDay && (
          <div className="flex flex-col gap-1 mt-0.5">
            <span className="text-[10px] text-slate-400 font-bold">حرکات این جلسه (به ترتیب اجرای بهینه):</span>
            <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
              {currentProgramDay.exercises.map((ex, idx) => {
                const isSelected = ex.exerciseId === selectedExerciseId;
                const completedSetsCount = sessionSets.filter(
                  (s) => s.exerciseId === ex.exerciseId && !s.isWarmup && !s.supersededBy
                ).length;
                let targetSets = ex.setsByWeek[selectedWeek - 1];
                if (todayReadinessScore !== null && todayReadinessScore < 6) {
                  targetSets = Math.max(1, targetSets - 1);
                }

                return (
                  <button
                    key={ex.exerciseId}
                    onClick={() => setSelectedExerciseId(ex.exerciseId)}
                    className={`px-2.5 py-1.5 rounded-xl text-[11px] flex items-center gap-1.5 whitespace-nowrap transition cursor-pointer border ${
                      isSelected
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 font-black'
                        : 'bg-white/[0.03] text-slate-300 border-white/5 hover:bg-white/[0.06]'
                    }`}
                  >
                    <span className="opacity-60 fa-num">{idx + 1}.</span>
                    <span>{ex.nameFa}</span>
                    <span className={`text-[10px] font-bold fa-num px-1.5 py-0.2 rounded-md ${
                      completedSetsCount >= targetSets
                        ? 'bg-emerald-500/30 text-emerald-200'
                        : 'bg-white/10 text-slate-400'
                    }`}>
                      {completedSetsCount}/{targetSets}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </section>

      {/* 3. Exercise Card with Quick Search Drawer */}
      <section className="glass-panel rounded-2xl p-4 flex flex-col gap-2.5">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold text-slate-400">حرکت انتخابی</span>
            {currentProgramExercise && (
              <span className="text-[10px] font-black fa-num px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                هدف: {currentProgramExercise.repsRange} تکرار @ RIR {selectedWeek === 1 ? '۳-۴' : selectedWeek === 2 ? '۲-۳' : currentProgramExercise.isCompound ? '۲' : '۱-۲'}
              </span>
            )}
          </div>
          <button
            onClick={() => setIsSearchOpen(true)}
            className="text-xs font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 cursor-pointer transition active:scale-95"
          >
            <span>تعویض حرکت</span>
            <span className="text-base leading-none">⇄</span>
          </button>
        </div>

        <div
          onClick={() => setIsSearchOpen(true)}
          className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/5 cursor-pointer transition"
        >
          <div>
            <h2 className="text-base font-black text-slate-100 tracking-tight">
              {selectedExercise.nameFa}
            </h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[10px] text-slate-400 font-mono">
                {selectedExercise.nameEn}
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-medium">
                {selectedExercise.equipment}
              </span>
            </div>
            {currentProgramExercise?.notesFa && (
              <p className="text-[11px] text-emerald-400/90 font-medium mt-2 leading-relaxed bg-emerald-500/10 p-2 rounded-lg border border-emerald-500/20">
                💡 <span className="font-bold">نکته اجرای اصولی:</span> {currentProgramExercise.notesFa}
              </p>
            )}
          </div>
          <span className="text-slate-500 text-sm">❯</span>
        </div>

        {/* Ghost Set Insight Pill */}
        {ghostSet ? (
          <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-emerald-500/5 border border-emerald-500/20 text-xs">
            <div className="flex items-center gap-2 text-slate-300">
              <span className="text-emerald-400 font-bold">ست قبلی:</span>
              <span className="font-extrabold fa-num text-slate-100">{ghostSet.loadKg} kg</span>
              <span>×</span>
              <span className="font-extrabold fa-num text-slate-100">{ghostSet.reps} تکرار</span>
              <span className="text-slate-500">|</span>
              <span className="text-slate-300 font-medium">
                RIR <span className="fa-num font-bold text-emerald-400">{ghostSet.rir ?? '-'}</span>
              </span>
            </div>
            <button
              onClick={() => {
                setLoadKg(ghostSet.loadKg);
                setReps(ghostSet.reps);
                setRir(ghostSet.rir ?? 2);
              }}
              className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 px-2 py-0.5 rounded-lg transition"
            >
              کپی مقادیر
            </button>
          </div>
        ) : (
          <div className="text-[11px] text-slate-500 px-1">
            اولین ست این حرکت در این جلسه
          </div>
        )}

        {/* Engine Recommendation Card (Algorithm 2) */}
        {engineRecommendation && (
          <div className="p-3 rounded-xl bg-cyan-500/[0.05] border border-cyan-500/25 flex flex-col gap-1.5">
            <div className="flex justify-between items-center">
              <span className="text-[11px] font-black text-cyan-400 flex items-center gap-1.5">
                <span>🧠</span>
                <span>پیشنهاد موتور (الگوریتم ۲ بیزی)</span>
              </span>
              <button
                onClick={() => {
                  setLoadKg(engineRecommendation.suggestedLoadKg);
                  setReps(engineRecommendation.targetReps);
                  setRir(engineRecommendation.targetRir);
                }}
                className="text-[10px] font-black px-2.5 py-0.5 rounded-lg bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30 transition cursor-pointer"
              >
                اعمال پیشنهاد ✓
              </button>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="font-extrabold text-slate-100 fa-num">
                {engineRecommendation.suggestedLoadKg} kg × {engineRecommendation.targetReps} تکرار @ RIR {engineRecommendation.targetRir}
              </span>
              <span className="text-[10px] text-slate-400 fa-num">
                e1RM تخمینی: {engineRecommendation.e1rmMeanKg} kg
              </span>
            </div>
            <p className="text-[10px] text-slate-400 leading-relaxed">
              {engineRecommendation.explanationFa}
            </p>
          </div>
        )}
      </section>

      {/* PR Alert Celebration Banner */}
      {prAlert && (
        <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/20 to-rose-500/20 border border-amber-500/40 text-amber-200 text-xs font-black flex items-center justify-between glow-amber animate-bounce">
          <span>{prAlert}</span>
          <span className="text-base">🏆</span>
        </div>
      )}

      {/* 4. Set Header (Set count & Warmup Pill) */}
      <div className="flex justify-between items-center px-1">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-400">ست جاری:</span>
          <span className="text-sm font-black fa-num px-2.5 py-0.5 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            #{nextSetNumber}
          </span>
        </div>

        <button
          onClick={() => setIsWarmup(!isWarmup)}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
            isWarmup
              ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
              : 'bg-white/[0.03] border-white/10 text-slate-400 hover:text-slate-200'
          }`}
        >
          <span className={`w-2 h-2 rounded-full ${isWarmup ? 'bg-amber-400' : 'bg-slate-600'}`} />
          <span>ست گرم‌کردن</span>
        </button>
      </div>

      {/* 5. Big Ergonomic Weight & Reps Controllers */}
      <div className="grid grid-cols-2 gap-3">
        {/* Weight Panel */}
        <div className="glass-panel rounded-2xl p-3.5 flex flex-col items-center justify-between">
          <span className="text-[11px] font-bold text-slate-400">وزنه (کیلوگرم)</span>
          <div className="my-1.5 flex items-baseline gap-1">
            <span className="text-4xl font-black fa-num text-slate-100 tracking-tight">
              {loadKg}
            </span>
            <span className="text-xs font-bold text-slate-500">KG</span>
          </div>

          {/* Steppers */}
          <div className="grid grid-cols-2 gap-1.5 w-full">
            <button
              onClick={() => setLoadKg((w) => Math.max(0, parseFloat((w - 2.5).toFixed(2))))}
              className="py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] active:bg-white/[0.12] text-xs font-extrabold fa-num text-slate-300 border border-white/5 transition cursor-pointer"
            >
              -۲.۵
            </button>
            <button
              onClick={() => setLoadKg((w) => parseFloat((w + 2.5).toFixed(2)))}
              className="py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] active:bg-white/[0.12] text-xs font-extrabold fa-num text-slate-300 border border-white/5 transition cursor-pointer"
            >
              +۲.۵
            </button>
            <button
              onClick={() => setLoadKg((w) => Math.max(0, parseFloat((w - 5).toFixed(2))))}
              className="py-1.5 rounded-xl bg-white/[0.02] hover:bg-white/[0.06] active:bg-white/[0.1] text-[11px] font-bold fa-num text-slate-500 border border-white/5 transition cursor-pointer"
            >
              -۵
            </button>
            <button
              onClick={() => setLoadKg((w) => parseFloat((w + 5).toFixed(2)))}
              className="py-1.5 rounded-xl bg-white/[0.02] hover:bg-white/[0.06] active:bg-white/[0.1] text-[11px] font-bold fa-num text-slate-500 border border-white/5 transition cursor-pointer"
            >
              +۵
            </button>
          </div>
        </div>

        {/* Reps Panel */}
        <div className="glass-panel rounded-2xl p-3.5 flex flex-col items-center justify-between">
          <span className="text-[11px] font-bold text-slate-400">تعداد تکرار</span>
          <div className="my-1.5 flex items-baseline gap-1">
            <span className="text-4xl font-black fa-num text-slate-100 tracking-tight">
              {reps}
            </span>
            <span className="text-xs font-bold text-slate-500">REPS</span>
          </div>

          {/* Steppers */}
          <div className="grid grid-cols-2 gap-1.5 w-full">
            <button
              onClick={() => setReps((r) => Math.max(1, r - 1))}
              className="py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] active:bg-white/[0.12] text-xs font-extrabold fa-num text-slate-300 border border-white/5 transition cursor-pointer"
            >
              -۱
            </button>
            <button
              onClick={() => setReps((r) => r + 1)}
              className="py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] active:bg-white/[0.12] text-xs font-extrabold fa-num text-slate-300 border border-white/5 transition cursor-pointer"
            >
              +۱
            </button>
            <button
              onClick={() => setReps((r) => Math.max(1, r - 2))}
              className="py-1.5 rounded-xl bg-white/[0.02] hover:bg-white/[0.06] active:bg-white/[0.1] text-[11px] font-bold fa-num text-slate-500 border border-white/5 transition cursor-pointer"
            >
              -۲
            </button>
            <button
              onClick={() => setReps((r) => r + 2)}
              className="py-1.5 rounded-xl bg-white/[0.02] hover:bg-white/[0.06] active:bg-white/[0.1] text-[11px] font-bold fa-num text-slate-500 border border-white/5 transition cursor-pointer"
            >
              +۲
            </button>
          </div>
        </div>
      </div>

      {/* 6. Dynamic RIR Selector with Color Feedback */}
      <section className="glass-panel rounded-2xl p-3.5 flex flex-col gap-2">
        <div className="flex justify-between items-center">
          <span className="text-[11px] font-bold text-slate-400">
            تکرار مانده تا نارسایی (RIR)
          </span>
          <span
            className={`text-[11px] font-extrabold px-2.5 py-0.5 rounded-lg border ${
              rir === 0
                ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 glow-rose'
                : rir === 1
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 glow-amber'
                : rir === 2
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 glow-emerald'
                : rir === 3
                ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                : 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30'
            }`}
          >
            {rir === 0 && 'نارسایی مطلق (Failure)'}
            {rir === 1 && '۱ تکرار توان داشتم'}
            {rir === 2 && '۲ تکرار توان داشتم'}
            {rir === 3 && '۳ تکرار توان داشتم'}
            {rir >= 4 && '۴+ تکرار (سبک)'}
          </span>
        </div>

        <div className="grid grid-cols-5 gap-1.5 pt-1">
          {[0, 1, 2, 3, 4].map((val) => (
            <button
              key={val}
              onClick={() => setRir(val)}
              className={`py-2.5 rounded-xl text-sm font-black fa-num transition-all cursor-pointer ${
                rir === val
                  ? val === 0
                    ? 'bg-rose-500 text-slate-950 font-black shadow-lg shadow-rose-500/30 scale-[1.03]'
                    : val === 1
                    ? 'bg-amber-500 text-slate-950 font-black shadow-lg shadow-amber-500/30 scale-[1.03]'
                    : 'bg-emerald-500 text-slate-950 font-black shadow-lg shadow-emerald-500/30 scale-[1.03]'
                  : 'bg-white/[0.04] text-slate-300 hover:bg-white/[0.08] active:bg-white/[0.12] border border-white/5'
              }`}
            >
              {val === 4 ? '۴+' : val}
            </button>
          ))}
        </div>
      </section>

      {/* 7. Massive High-Impact "LOG SET" Button (< 5s target) */}
      <button
        onClick={handleLogSet}
        className="w-full py-4.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 active:scale-[0.98] text-slate-950 font-black text-lg shadow-xl shadow-emerald-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer glow-emerald"
      >
        <span className="text-xl">✓</span>
        <span>ثبت ست</span>
      </button>

      {/* 8. Today's Completed Sets Feed */}
      <section className="mt-2 flex flex-col gap-2">
        <div className="flex justify-between items-center px-1">
          <span className="text-xs font-bold text-slate-400">
            ست‌های ثبت‌شده‌ی این جلسه ({sessionSets.length})
          </span>
        </div>

        <div className="flex flex-col gap-2">
          {sessionSets.length === 0 ? (
            <div className="text-xs text-slate-600 text-center py-8 glass-panel rounded-2xl">
              هنوز ستی ثبت نشده است. پس از زدن «ثبت ست»، اینجا نمایش داده می‌شود.
            </div>
          ) : (
            sessionSets
              .slice()
              .reverse()
              .map((s) => {
                const ex = exercises.find((e) => e.id === s.exerciseId);
                return (
                  <div
                    key={s.clientUuid}
                    className="glass-panel p-3 rounded-xl flex justify-between items-center text-xs transition hover:border-white/10"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="w-6 h-6 rounded-lg bg-white/5 border border-white/5 flex items-center justify-center font-bold fa-num text-slate-400 text-[11px]">
                        {s.isWarmup ? 'W' : s.setNumber}
                      </span>
                      <div>
                        <span className="font-black text-slate-200 block text-xs">
                          {ex?.nameFa || s.exerciseId}
                        </span>
                        {s.isWarmup && (
                          <span className="text-[10px] text-amber-400 font-semibold">
                            ست گرم‌کردن
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 font-bold fa-num text-slate-300">
                      <span className="text-emerald-400 font-black text-sm">{s.loadKg} kg</span>
                      <span className="text-slate-600">×</span>
                      <span className="text-slate-200 font-extrabold text-sm">{s.reps}</span>
                      <span className="px-2 py-0.5 rounded-md bg-white/5 text-[10px] text-slate-400">
                        RIR {s.rir ?? '-'}
                      </span>
                    </div>
                  </div>
                );
              })
          )}
        </div>
      </section>

      {/* Exercise Picker Modal */}
      {isSearchOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex flex-col justify-end max-w-md mx-auto">
          <div className="glass-panel-elevated rounded-t-3xl p-4 flex flex-col max-h-[85vh] animate-in slide-in-from-bottom duration-200">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-sm font-black text-slate-100">انتخاب حرکت تمرینی</h3>
              <button
                onClick={() => setIsSearchOpen(false)}
                className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            {/* Search Input */}
            <input
              type="text"
              placeholder="جستجوی نام فارسی یا انگلیسی..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#080a0f] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 mb-3"
            />

            {/* Category Chips */}
            <div className="flex gap-1.5 overflow-x-auto pb-2.5 mb-2 no-scrollbar">
              {[
                { id: 'all', label: 'همه' },
                { id: 'chest', label: 'سینه' },
                { id: 'lats', label: 'زیربغل' },
                { id: 'upper_back', label: 'پشت' },
                { id: 'side_delts', label: 'سرشانه' },
                { id: 'quads', label: 'چهارسر' },
                { id: 'hamstrings', label: 'همسترینگ' },
                { id: 'biceps', label: 'جلو بازو' },
                { id: 'triceps', label: 'پشت بازو' }
              ].map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`text-[11px] font-bold px-3 py-1.5 rounded-xl whitespace-nowrap transition cursor-pointer ${
                    selectedCategory === cat.id
                      ? 'bg-emerald-500 text-slate-950 font-black'
                      : 'bg-white/5 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Exercise List */}
            <div className="overflow-y-auto flex flex-col gap-1.5 pr-1">
              {filteredExercises.map((ex) => (
                <div
                  key={ex.id}
                  onClick={() => {
                    setSelectedExerciseId(ex.id);
                    setIsSearchOpen(false);
                  }}
                  className={`p-3 rounded-xl border cursor-pointer transition flex justify-between items-center ${
                    selectedExerciseId === ex.id
                      ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300'
                      : 'bg-white/[0.02] border-white/5 hover:bg-white/[0.06] text-slate-200'
                  }`}
                >
                  <div>
                    <span className="font-extrabold text-xs block">{ex.nameFa}</span>
                    <span className="text-[10px] text-slate-500 font-mono">{ex.nameEn}</span>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                    {ex.equipment}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Finish Workout Modal */}
      {showFinishModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 max-w-md mx-auto">
          <div className="glass-panel-elevated rounded-3xl p-5 w-full flex flex-col gap-4 border border-white/10">
            <h3 className="text-base font-black text-slate-100 text-center">پایان جلسه تمرینی</h3>
            <p className="text-xs text-slate-400 text-center leading-relaxed">
              برای ارزیابی خستگی سیستمیک و کالیبراسیون Banister، شدت سختی کل جلسه (sRPE) را مشخص کنید.
            </p>

            <div className="flex flex-col gap-2 my-2">
              <div className="flex justify-between text-xs font-bold text-slate-300">
                <span>درجه سختی (sRPE):</span>
                <span className="text-emerald-400 text-sm fa-num">{srpeRating} از ۱۰</span>
              </div>
              <div className="grid grid-cols-5 gap-1.5">
                {[5, 6, 7, 8, 9, 10].map((val) => (
                  <button
                    key={val}
                    onClick={() => setSrpeRating(val)}
                    className={`py-2 rounded-xl text-xs font-black fa-num transition cursor-pointer ${
                      srpeRating === val
                        ? 'bg-emerald-500 text-slate-950 font-black shadow-lg shadow-emerald-500/20'
                        : 'bg-white/5 text-slate-300 hover:bg-white/10'
                    }`}
                  >
                    {val}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleFinishWorkout}
                className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-sm transition"
              >
                ثبت و اتمام جلسه
              </button>
              <button
                onClick={() => setShowFinishModal(false)}
                className="px-4 py-3 bg-white/5 hover:bg-white/10 text-slate-300 font-bold rounded-xl text-xs transition"
              >
                انصراف
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
