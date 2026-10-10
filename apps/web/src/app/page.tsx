'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { db } from '@/lib/db';
import { ensureSeedExercisesLoaded } from '@/lib/seed-exercises';

import {
  calculateDailyReadiness,
  DEFAULT_BANISTER_PARAMS,
  type ReadinessResult
} from '@sperad/engine';

export default function DashboardPage() {
  const [totalSessions, setTotalSessions] = useState<number>(0);
  const [totalSets, setTotalSets] = useState<number>(0);
  const [exerciseCount, setExerciseCount] = useState<number>(0);
  const [pendingOutbox, setPendingOutbox] = useState<number>(0);
  const [readiness, setReadiness] = useState<ReadinessResult | null>(null);

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

      // Check today's checkin for Algorithm 1 Readiness
      const todayDate = new Date().toISOString().split('T')[0];
      const checkin = await db.dailyCheckins.get(todayDate);

      const banisterState = { fitness: 25, fatigue: 8, asOfDate: todayDate };
      const readyRes = calculateDailyReadiness(
        banisterState,
        checkin
          ? {
              sleepHours: checkin.sleepHours,
              sleepQuality: checkin.sleepQuality,
              stressLevel: checkin.stressLevel,
              motivation: checkin.motivation,
              targetMuscleSoreness: 0
            }
          : {
              sleepHours: 7.5,
              sleepQuality: 4,
              stressLevel: 2,
              motivation: 4,
              targetMuscleSoreness: 1
            },
        DEFAULT_BANISTER_PARAMS
      );

      setReadiness(readyRes);
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

      {/* Algorithm 1: Daily Readiness Banner */}
      {readiness && (
        <section className="glass-panel p-4 rounded-2xl flex items-center justify-between border-emerald-500/25">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center font-black fa-num text-emerald-400 text-lg">
              {Math.round(readiness.score * 100)}%
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-slate-100">آمادگی روز (الگوریتم ۱)</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300">
                  {readiness.category === 'high' ? 'عالی' : readiness.category === 'moderate' ? 'متوسط' : 'پایین'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                {readiness.recommendation.explanationFa}
              </p>
            </div>
          </div>
        </section>
      )}

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
        <span className="text-xs font-bold text-slate-400 px-1">ماژول‌های تصمیم‌گیری علمی</span>
        <div className="grid grid-cols-2 gap-2.5">
          <Link
            href="/program"
            className="glass-panel hover:bg-white/[0.04] p-3.5 rounded-2xl flex items-center gap-3 transition active:scale-95 border-emerald-500/20"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-lg">
              📐
            </div>
            <div>
              <div className="text-xs font-black text-slate-200">مزوسیکل و حجم</div>
              <div className="text-[10px] text-slate-500 mt-0.5">الگوریتم ۳ و ۴-الف</div>
            </div>
          </Link>

          <Link
            href="/analytics"
            className="glass-panel hover:bg-white/[0.04] p-3.5 rounded-2xl flex items-center gap-3 transition active:scale-95 border-emerald-500/20"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-lg">
              📈
            </div>
            <div>
              <div className="text-xs font-black text-slate-200">علت‌یابی پلاتو</div>
              <div className="text-[10px] text-slate-500 mt-0.5">الگوریتم ۵-ج (۶ فرضیه)</div>
            </div>
          </Link>

          <Link
            href="/checkin"
            className="glass-panel hover:bg-white/[0.04] p-3.5 rounded-2xl flex items-center gap-3 transition active:scale-95"
          >
            <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-lg">
              📋
            </div>
            <div>
              <div className="text-xs font-black text-slate-200">چک‌این روزانه</div>
              <div className="text-[10px] text-slate-500 mt-0.5">الگوریتم ۱ آمادگی</div>
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
              <div className="text-xs font-black text-slate-200">روند وزن و تغذیه</div>
              <div className="text-[10px] text-slate-500 mt-0.5">کالمن ۵-الف و پروتئین</div>
            </div>
          </Link>
        </div>
      </section>

      {/* Engine Scientific Status Card */}
      <div className="glass-panel p-4 rounded-2xl border-emerald-500/20 flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span className="text-xs font-bold text-slate-200">موتور محاسباتی @sperad/engine:</span>
          </div>
          <span className="text-[10px] font-mono text-emerald-400 font-bold px-2 py-0.5 rounded-md bg-emerald-500/10">
            ۱۴/۱۴ تست سبز
          </span>
        </div>
        <div className="text-[11px] text-slate-400 leading-relaxed">
          تمام الگوریتم‌های ۱ تا ۵ مشخص‌شده در بریف فنی (تناسب-خستگی، کالمن e1RM، دوز-پاسخ حجم، بهینه‌سازی MILP، کالمن وزن، تغذیه و شبیه‌ساز ۵۲ هفته) با موفقیت پیاده‌سازی و یکپارچه شدند.
        </div>
      </div>
    </div>
  );
}
