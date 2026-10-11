'use client';

import React, { useState, useEffect } from 'react';
import { db } from '@/lib/db';
import { enqueueOutbox } from '@/lib/sync';
import type { BodyMetrics } from '@sperad/shared';
import {
  updateWeightKalman,
  analyzeWeightTrend,
  DEFAULT_WEIGHT_STATE,
  type WeightKalmanState,
  type WeightAnalysisResult
} from '@sperad/engine';

export default function WeightPage() {
  const [weightKg, setWeightKg] = useState<number>(78.5);
  const [history, setHistory] = useState<BodyMetrics[]>([]);
  const [isSaved, setIsSaved] = useState<boolean>(false);
  const [trendAnalysis, setTrendAnalysis] = useState<WeightAnalysisResult | null>(null);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    const list = await db.bodyMetrics.orderBy('recordedAt').reverse().limit(14).toArray();
    setHistory(list);
    if (list.length > 0) {
      setWeightKg(list[0].weightKg);

      // Replay chronological weigh-ins through Algorithm 5-A Kalman Filter
      let kalmanState: WeightKalmanState = {
        ...DEFAULT_WEIGHT_STATE,
        weightTrendKg: list[list.length - 1].weightKg,
        lastRecordedDate: list[list.length - 1].recordedAt.split('T')[0]
      };

      const sortedChronological = list.slice().reverse();
      for (const item of sortedChronological) {
        kalmanState = updateWeightKalman(kalmanState, {
          weightKg: item.weightKg,
          date: item.recordedAt.split('T')[0]
        });
      }

      const analysis = analyzeWeightTrend(kalmanState, 'hypertrophy');
      setTrendAnalysis(analysis);
    }
  };

  const handleSave = async () => {
    const metric: BodyMetrics = {
      id: crypto.randomUUID(),
      recordedAt: new Date().toISOString(),
      weightKg,
      waistCm: null,
      chestCm: null,
      armsCm: null,
      thighsCm: null,
      calvesCm: null,
      photoStoragePath: null
    };

    await db.bodyMetrics.put(metric);
    await enqueueOutbox('body_metrics', 'INSERT', metric.id!, metric);

    setIsSaved(true);
    await loadHistory();
    setTimeout(() => setIsSaved(false), 2500);
  };

  return (
    <div className="flex flex-col gap-3.5 pb-8">
      {/* Header */}
      <div className="glass-panel rounded-2xl p-4">
        <h1 className="text-base font-black text-slate-100 tracking-tight">ثبت وزن صبحگاهی</h1>
        <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
          برای فیلتر کالمن سطح محلی و تفکیک روند واقعی وزن از نوسانات نویزی آب بدن
        </p>
      </div>

      {/* Hero Weight Card */}
      <section className="glass-panel-elevated rounded-3xl p-6 flex flex-col items-center justify-center glow-emerald">
        <span className="text-xs font-bold text-slate-400">وزن ناشتا</span>
        <div className="flex items-baseline gap-1 my-3">
          <span className="text-6xl font-black fa-num text-slate-100 tracking-tight">
            {weightKg.toFixed(1)}
          </span>
          <span className="text-sm font-black text-emerald-400">KG</span>
        </div>

        {/* Steppers */}
        <div className="grid grid-cols-4 gap-2 w-full mt-2">
          <button
            onClick={() => setWeightKg((w) => parseFloat((w - 0.5).toFixed(1)))}
            className="py-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] active:bg-white/[0.12] text-xs font-extrabold fa-num text-slate-300 border border-white/5 transition cursor-pointer"
          >
            -۰.۵
          </button>
          <button
            onClick={() => setWeightKg((w) => parseFloat((w - 0.1).toFixed(1)))}
            className="py-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] active:bg-white/[0.12] text-xs font-extrabold fa-num text-slate-300 border border-white/5 transition cursor-pointer"
          >
            -۰.۱
          </button>
          <button
            onClick={() => setWeightKg((w) => parseFloat((w + 0.1).toFixed(1)))}
            className="py-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] active:bg-white/[0.12] text-xs font-extrabold fa-num text-slate-300 border border-white/5 transition cursor-pointer"
          >
            +۰.۱
          </button>
          <button
            onClick={() => setWeightKg((w) => parseFloat((w + 0.5).toFixed(1)))}
            className="py-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] active:bg-white/[0.12] text-xs font-extrabold fa-num text-slate-300 border border-white/5 transition cursor-pointer"
          >
            +۰.۵
          </button>
        </div>
      </section>

      {/* Log Button */}
      <button
        onClick={handleSave}
        className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 text-slate-950 font-black text-base shadow-xl shadow-emerald-500/20 active:scale-[0.98] transition cursor-pointer glow-emerald"
      >
        {isSaved ? '✓ وزن امروز ثبت شد' : 'ثبت وزن'}
      </button>

      {/* Algorithm 5-A: Kalman Weight Trend Card */}
      {trendAnalysis && (
        <section className="glass-panel-elevated p-4 rounded-2xl border-emerald-500/20 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-black text-slate-100">روند کالمن وزن (الگوریتم ۵-الف)</span>
            </div>
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                trendAnalysis.goalStatus === 'on_track'
                  ? 'bg-emerald-500/15 text-emerald-300'
                  : 'bg-amber-500/15 text-amber-300'
              }`}
            >
              {trendAnalysis.goalStatus === 'on_track' ? 'مطلوب' : 'هشدار نرخ'}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="glass-panel p-2.5 rounded-xl flex flex-col">
              <span className="text-[10px] text-slate-400">سطح هموارشده</span>
              <span className="text-sm font-black fa-num text-emerald-400 mt-1">
                {trendAnalysis.smoothedWeightKg.toFixed(1)} kg
              </span>
            </div>

            <div className="glass-panel p-2.5 rounded-xl flex flex-col">
              <span className="text-[10px] text-slate-400">تغییر هفتگی</span>
              <span className="text-sm font-black fa-num text-cyan-400 mt-1">
                {trendAnalysis.weeklyChangePercent > 0 ? '+' : ''}
                {trendAnalysis.weeklyChangePercent.toFixed(2)}%
              </span>
            </div>

            <div className="glass-panel p-2.5 rounded-xl flex flex-col">
              <span className="text-[10px] text-slate-400">باند اطمینان ۸۰٪</span>
              <span className="text-[11px] font-bold fa-num text-slate-300 mt-1">
                ±{trendAnalysis.upperBound80Percent.toFixed(2)}%
              </span>
            </div>
          </div>

          <p className="text-[11px] text-slate-400 leading-relaxed bg-white/[0.02] p-2.5 rounded-xl border border-white/5">
            {trendAnalysis.explanationFa}
          </p>
        </section>
      )}

      {/* Algorithm 5-B: Nutrition & Daily Protein Target Card */}
      <section className="glass-panel p-4 rounded-2xl flex flex-col gap-2.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-black text-slate-100">اهداف کالری و پروتئین (برنامه ۴ هفته‌ای)</span>
          <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md">
            سورپلاس تمیز
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2 mt-0.5">
          <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5 flex flex-col">
            <span className="text-[10px] text-slate-400">کالری هدف روزانه</span>
            <span className="text-xs font-black fa-num text-emerald-400 mt-0.5">
              ۳۱۰۰ تا ۳۳۰۰ kcal
            </span>
            <span className="text-[9px] text-slate-500 mt-0.5">نگهداری: ~۲۸۰۰ تا ۳۱۰۰</span>
          </div>

          <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5 flex flex-col">
            <span className="text-[10px] text-slate-400">هدف آهنگ رشد وزن</span>
            <span className="text-xs font-black fa-num text-cyan-400 mt-0.5">
              +۰.۲۵ تا +۰.۵۰ kg/هفته
            </span>
            <span className="text-[9px] text-slate-500 mt-0.5">پایش با روند کالمن</span>
          </div>
        </div>

        <div className="flex items-center justify-between mt-1 text-xs">
          <span className="text-slate-400">پروتئین (۱.۶ تا ۲.۲ g/kg):</span>
          <span className="font-black fa-num text-slate-100">
            {Math.round(weightKg * 1.6)} تا {Math.round(weightKg * 2.2)} گرم روزانه
          </span>
        </div>

        <div className="flex items-center justify-between text-xs border-t border-white/5 pt-2">
          <span className="text-slate-400">کراتین روزانه:</span>
          <span className="font-black fa-num text-emerald-400">
            ۳ تا ۵ گرم (همراه وعده غذایی)
          </span>
        </div>
      </section>

      {/* History */}
      <section className="mt-2 flex flex-col gap-2">
        <span className="text-xs font-bold text-slate-400 px-1">سوابق اخیر (۷ روز گذشته)</span>
        <div className="flex flex-col gap-1.5">
          {history.length === 0 ? (
            <div className="text-xs text-slate-600 text-center py-6 glass-panel rounded-2xl">
              هنوز وزنی ثبت نشده است.
            </div>
          ) : (
            history.map((m, idx) => {
              const prev = history[idx + 1];
              const diff = prev ? m.weightKg - prev.weightKg : null;
              return (
                <div
                  key={m.id}
                  className="glass-panel p-3 rounded-xl flex justify-between items-center text-xs"
                >
                  <span className="text-slate-400 fa-num font-semibold">
                    {new Date(m.recordedAt).toLocaleDateString('fa-IR')}
                  </span>
                  <div className="flex items-center gap-2">
                    {diff !== null && (
                      <span
                        className={`text-[11px] font-bold fa-num px-1.5 py-0.5 rounded-md ${
                          diff > 0
                            ? 'text-amber-400 bg-amber-500/10'
                            : diff < 0
                            ? 'text-cyan-400 bg-cyan-500/10'
                            : 'text-slate-500'
                        }`}
                      >
                        {diff > 0 ? `+${diff.toFixed(1)}` : diff.toFixed(1)} kg
                      </span>
                    )}
                    <span className="font-black fa-num text-emerald-400 text-sm">
                      {m.weightKg.toFixed(1)} kg
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>
    </div>
  );
}
