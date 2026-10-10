'use client';

import React, { useState, useEffect } from 'react';
import {
  analyzePlateauRootCause,
  type PlateauHypothesis
} from '@sperad/engine';

export default function AnalyticsPage() {
  const [selectedExercise, setSelectedExercise] = useState<string>('bench_press');
  const [weeklySets, setWeeklySets] = useState<number>(8);
  const [avgSleepHours, setAvgSleepHours] = useState<number>(7.5);
  const [avgStressLevel, setAvgStressLevel] = useState<number>(2);
  const [weightRate, setWeightRate] = useState<number>(0.2);
  const [mesocycleCount, setMesocycleCount] = useState<number>(2);
  const [isPlateaued, setIsPlateaued] = useState<boolean>(false);
  const [hypotheses, setHypotheses] = useState<PlateauHypothesis[]>([]);

  useEffect(() => {
    // Run Algorithm 5-C Plateau Diagnostic
    const result = analyzePlateauRootCause({
      exerciseId: selectedExercise,
      slope3Weeks: -0.001, // Flat or negative slope
      slopeStdDev: 0.002,
      currentWeeklySets: weeklySets,
      mev: 8,
      mrv: 20,
      avgSleepHours,
      avgStressLevel,
      weeklyWeightRatePercent: weightRate,
      mesocyclesWithThisExercise: mesocycleCount,
      hasErraticRir: false
    });

    setIsPlateaued(result.isPlateaued);
    setHypotheses(result.rankedHypotheses);
  }, [selectedExercise, weeklySets, avgSleepHours, avgStressLevel, weightRate, mesocycleCount]);

  return (
    <div className="flex flex-col gap-4 pb-12">
      {/* Header */}
      <div className="glass-panel rounded-2xl p-4">
        <h1 className="text-base font-black text-slate-100 tracking-tight">
          آنالیز پیشرفته و علت‌یابی پلاتو
        </h1>
        <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
          تشخیص توقف پیشرفت (پلاتو) و امتیازدهی ۶ فرضیه علّی علمی (الگوریتم ۵-ج)
        </p>
      </div>

      {/* Hero Plateau Diagnosis Card */}
      <section className="glass-panel-elevated rounded-3xl p-5 border border-emerald-500/20 glow-emerald">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
            <span className="text-xs font-black text-slate-100">
              تشخیص پلاتو در حرکت انتخابی
            </span>
          </div>
          <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30">
            {isPlateaued ? 'توقف پیشرفت شناسایی شد' : 'روند انطباقی فعال'}
          </span>
        </div>

        <div className="flex items-center justify-between text-xs my-2">
          <span className="text-slate-400">حرکت تحت ارزیابی:</span>
          <select
            value={selectedExercise}
            onChange={(e) => setSelectedExercise(e.target.value)}
            className="bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-slate-200 text-xs font-bold focus:outline-none"
          >
            <option value="bench_press">پرس سینه هالتر</option>
            <option value="squat">اسکوات هالتر</option>
            <option value="lat_pulldown">زیربغل سیم‌کش</option>
          </select>
        </div>

        <p className="text-[11px] text-slate-400 leading-relaxed mt-2 bg-white/[0.02] p-2.5 rounded-xl border border-white/5">
          شیب کالمن پسین e1RM در ۳ هفته اخیر نزدیک به صفر یا منفی برآورد شده است. موتور فرضیه‌های علت‌شناختی زیر را با وزن شواهد رتبه‌بندی کرده است:
        </p>
      </section>

      {/* Interactive Controls for Scenario Simulation */}
      <section className="glass-panel p-4 rounded-2xl flex flex-col gap-3">
        <span className="text-xs font-black text-slate-200">
          متغیرهای سیگنال شبیه‌سازی
        </span>

        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1">
            <span className="text-[10px] text-slate-400">ست‌های موثر هفتگی:</span>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min="6"
                max="24"
                value={weeklySets}
                onChange={(e) => setWeeklySets(Number(e.target.value))}
                className="w-full accent-emerald-400"
              />
              <span className="text-xs font-black fa-num text-emerald-400 w-8">{weeklySets}</span>
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-[10px] text-slate-400">میانگین خواب (ساعت):</span>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min="5"
                max="9"
                step="0.5"
                value={avgSleepHours}
                onChange={(e) => setAvgSleepHours(Number(e.target.value))}
                className="w-full accent-emerald-400"
              />
              <span className="text-xs font-black fa-num text-cyan-400 w-8">{avgSleepHours}</span>
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-[10px] text-slate-400">سطح استرس (۱ تا ۵):</span>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min="1"
                max="5"
                value={avgStressLevel}
                onChange={(e) => setAvgStressLevel(Number(e.target.value))}
                className="w-full accent-emerald-400"
              />
              <span className="text-xs font-black fa-num text-amber-400 w-8">{avgStressLevel}</span>
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-[10px] text-slate-400">نرخ تغییر وزن هفتگی (%):</span>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min="-1"
                max="1"
                step="0.1"
                value={weightRate}
                onChange={(e) => setWeightRate(Number(e.target.value))}
                className="w-full accent-emerald-400"
              />
              <span className="text-xs font-black fa-num text-slate-300 w-8">{weightRate}%</span>
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-[10px] text-slate-400">مزوسیکل‌های متوالی با این حرکت:</span>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min="1"
                max="5"
                value={mesocycleCount}
                onChange={(e) => setMesocycleCount(Number(e.target.value))}
                className="w-full accent-emerald-400"
              />
              <span className="text-xs font-black fa-num text-rose-300 w-8">{mesocycleCount}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Ranked Hypotheses List */}
      <section className="flex flex-col gap-2.5">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-bold text-slate-400">
            فرضیه‌های رتبه‌بندی‌شده علت پلاتو (الگوریتم ۵-ج)
          </span>
          <span className="text-[10px] text-slate-500">امتیاز اطمینان شواهد</span>
        </div>

        {hypotheses.map((hypo, idx) => (
          <div
            key={hypo.hypothesis}
            className="glass-panel p-3.5 rounded-2xl flex flex-col gap-2 transition hover:bg-white/[0.04]"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-md bg-white/5 text-slate-300 text-[10px] font-black fa-num flex items-center justify-center">
                  #{idx + 1}
                </span>
                <span className="text-xs font-black text-slate-100">
                  {hypo.hypothesis === 'insufficient_volume'
                    ? 'حجم ناکافی (زیر نقطه بازده)'
                    : hypo.hypothesis === 'excessive_volume'
                    ? 'حجم بیش از حد (تجاوز از MRV)'
                    : hypo.hypothesis === 'sleep_or_stress'
                    ? 'نقص خواب یا استرس مزمن'
                    : hypo.hypothesis === 'energy_deficit'
                    ? 'کسری انرژی شدید (کاهش وزن)'
                    : hypo.hypothesis === 'exercise_staleness'
                    ? 'کهنگی انطباقی حرکت'
                    : 'خطای اندازه‌گیری / بی‌دقتی RIR'}
                </span>
              </div>
              <span className="text-xs font-black fa-num text-emerald-400">
                {Math.round(hypo.score * 100)}%
              </span>
            </div>

            <p className="text-[11px] text-slate-400 leading-relaxed bg-white/[0.02] p-2 rounded-xl">
              🎯 <strong className="text-slate-300">اقدام تجربی پیشنهادی:</strong> {hypo.actionFa}
            </p>
          </div>
        ))}
      </section>
    </div>
  );
}
