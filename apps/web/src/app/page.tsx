'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { db } from '@/lib/db';
import { ensureSeedExercisesLoaded } from '@/lib/seed-exercises';

export default function DashboardPage() {
  const [totalSessions, setTotalSessions] = useState<number>(0);
  const [totalSets, setTotalSets] = useState<number>(0);
  const [exerciseCount, setExerciseCount] = useState<number>(0);
  const [pendingOutbox, setPendingOutbox] = useState<number>(0);

  useEffect(() => {
    ensureSeedExercisesLoaded().then(async () => {
      const sessCount = await db.sessions.count();
      const setCount = await db.sets.count();
      const exCount = await db.exercises.count();
      const outCount = await db.outbox.where('status').equals('pending').count();

      setTotalSessions(sessCount);
      setTotalSets(setCount);
      setExerciseCount(exCount);
      setPendingOutbox(outCount);
    });
  }, []);

  return (
    <div className="flex flex-col gap-4 pb-8">
      {/* Hero Card */}
      <section className="glass-panel-elevated rounded-3xl p-5 border border-white/10 glow-emerald relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[11px] font-black px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
              فاز ۰: پایه‌ی داده و پوسته
            </span>
          </div>
          <span className="text-[11px] font-mono font-bold text-slate-500">v0.1.0</span>
        </div>

        <h1 className="text-2xl font-black text-slate-100 tracking-tight">اسپراد | Sperad</h1>
        <p className="text-xs text-slate-400 mt-1 leading-relaxed">
          موتور تصمیم‌گیری تمرین بدنسازی با ثبت داده‌ی فوق‌سریع و معماری کاملاً مقاوم در برابر قطعی باشگاه.
        </p>

        <Link
          href="/gym"
          className="mt-5 w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 text-slate-950 font-black text-base shadow-xl shadow-emerald-500/25 active:scale-[0.98] transition flex items-center justify-center gap-2.5 glow-emerald cursor-pointer"
        >
          <span className="text-xl">🏋️</span>
          <span>ورود به حالت باشگاه (Gym Mode)</span>
        </Link>
      </section>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 gap-3">
        <div className="glass-panel rounded-2xl p-4 flex flex-col justify-between">
          <span className="text-[11px] font-bold text-slate-400">جلسات ثبت‌شده</span>
          <div className="text-3xl font-black fa-num text-slate-100 mt-1.5">{totalSessions}</div>
        </div>

        <div className="glass-panel rounded-2xl p-4 flex flex-col justify-between">
          <span className="text-[11px] font-bold text-slate-400">مجموع ست‌ها</span>
          <div className="text-3xl font-black fa-num text-emerald-400 mt-1.5">{totalSets}</div>
        </div>

        <div className="glass-panel rounded-2xl p-4 flex flex-col justify-between">
          <span className="text-[11px] font-bold text-slate-400">بانک حرکات (سید)</span>
          <div className="text-3xl font-black fa-num text-slate-100 mt-1.5">{exerciseCount}</div>
        </div>

        <div className="glass-panel rounded-2xl p-4 flex flex-col justify-between">
          <span className="text-[11px] font-bold text-slate-400">صف همگام‌سازی</span>
          <div className="text-3xl font-black fa-num text-cyan-400 mt-1.5">
            {pendingOutbox === 0 ? '✓ کامل' : `${pendingOutbox} ست`}
          </div>
        </div>
      </div>

      {/* Quick Action Tiles */}
      <section className="flex flex-col gap-2 mt-1">
        <span className="text-xs font-bold text-slate-400 px-1">اقدامات سریع</span>
        <div className="grid grid-cols-2 gap-2.5">
          <Link
            href="/checkin"
            className="glass-panel hover:bg-white/[0.04] p-3.5 rounded-2xl flex items-center gap-3 transition active:scale-95"
          >
            <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-lg">
              📋
            </div>
            <div>
              <div className="text-xs font-black text-slate-200">چک‌این امروز</div>
              <div className="text-[10px] text-slate-500 mt-0.5">خواب، استرس، درد</div>
            </div>
          </Link>

          <Link
            href="/weight"
            className="glass-panel hover:bg-white/[0.04] p-3.5 rounded-2xl flex items-center gap-3 transition active:scale-95"
          >
            <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-lg">
              ⚖️
            </div>
            <div>
              <div className="text-xs font-black text-slate-200">ثبت وزن صبح</div>
              <div className="text-[10px] text-slate-500 mt-0.5">پایش روند ناشتا</div>
            </div>
          </Link>
        </div>
      </section>

      {/* Gate 1 Acceptance Criteria Badge */}
      <div className="glass-panel p-4 rounded-2xl border-emerald-500/20 flex items-center gap-3">
        <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 font-bold text-sm">
          🎯
        </div>
        <div>
          <div className="text-xs font-bold text-slate-200">دروازه ۱ (Gate 1):</div>
          <div className="text-[11px] text-slate-400">
            ثبت هر ست زیر ۵ ثانیه و صفر ست گمشده در تست آفلاین باشگاه
          </div>
        </div>
      </div>
    </div>
  );
}
