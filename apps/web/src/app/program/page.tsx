'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  USER_PROGRAM_DAYS,
  USER_PROGRAM_VOLUMES,
  SAFETY_AND_PREHAB_RULES
} from '@/lib/user-program';

export default function ProgramPage() {
  const [selectedWeek, setSelectedWeek] = useState<number>(1);
  const [selectedDayId, setSelectedDayId] = useState<string>('pull_a');
  const [activeTab, setActiveTab] = useState<'routine' | 'volumes' | 'safety' | 'nutrition'>('routine');

  const currentVolume = USER_PROGRAM_VOLUMES[selectedWeek];
  const activeDay = USER_PROGRAM_DAYS.find((d) => d.id === selectedDayId) || USER_PROGRAM_DAYS[0];

  return (
    <div className="flex flex-col gap-4 pb-12">
      {/* Header */}
      <div className="glass-panel rounded-3xl p-5 border border-white/10 glow-emerald relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[11px] font-black px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
              برنامه بازگشت و حجم‌گیری (۴ هفته)
            </span>
          </div>
          <span className="text-[11px] font-mono font-bold text-slate-400">فاز صعود تدریجی</span>
        </div>

        <h1 className="text-xl font-black text-slate-100 tracking-tight">
          برنامه تخصصی بازگشت پس از وقفه
        </h1>
        <p className="text-xs text-slate-400 mt-1 leading-relaxed">
          تنظیم دقیق برای شانه راست، زانو و تاندون آشیل با صعود پله‌ای حجم و خودتنظیمی RIR
        </p>

        {/* Week Selector Pills */}
        <div className="grid grid-cols-4 gap-2 mt-4">
          {[1, 2, 3, 4].map((wk) => (
            <button
              key={wk}
              onClick={() => setSelectedWeek(wk)}
              className={`py-2 px-1 rounded-xl text-xs font-black transition cursor-pointer flex flex-col items-center justify-center ${
                selectedWeek === wk
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 shadow-lg shadow-emerald-500/20'
                  : 'bg-white/5 hover:bg-white/10 text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>هفته {wk}</span>
              <span className="text-[9px] font-normal opacity-80 fa-num">
                {wk === 1 ? 'RIR ۳-۴' : wk === 2 ? 'RIR ۲-۳' : wk === 3 ? 'RIR ۱-۲' : 'RIR ۱'}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Week Summary Banner */}
      <section className="glass-panel-elevated p-4 rounded-2xl border-emerald-500/25 flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-black text-slate-100">
            دستورالعمل شدت هفته {selectedWeek}
          </span>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300">
            {currentVolume.generalRirFa}
          </span>
        </div>
        <p className="text-[11px] text-slate-400 leading-relaxed">
          {selectedWeek === 1 && 'در هفته ۱ هیچ حرکتی را تحت فشار نگذارید؛ اولویت فقط بیدار کردن سیستم عصبی و سنجش مفاصل است.'}
          {selectedWeek === 2 && 'افزایش حجم ست‌ها به ۱۲ پشت و ۱۰ سینه؛ شدت حرکات روی RIR ۲ تا ۳ تنظیم شود.'}
          {selectedWeek === 3 && 'حجم کامل مزوسیکل (۱۶ ست پشت، ۱۴ سینه). در حرکات مرکب RIR ۲ و در ایزوله‌ها RIR ۱ تا ۲ مجاز است.'}
          {selectedWeek === 4 && 'هفته تثبیت و آزمون. در صورت نبود خستگی مفرط ادامه هفته ۳ با RIR ۱؛ در صورت بروز دو نشانه دیلود، ست‌ها نصف می‌شود.'}
        </p>
      </section>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-white/[0.03] border border-white/5 text-xs font-bold">
        <button
          onClick={() => setActiveTab('routine')}
          className={`flex-1 py-2 rounded-xl transition cursor-pointer ${
            activeTab === 'routine' ? 'bg-emerald-500/20 text-emerald-300 font-black' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          📅 برنامه جلسات
        </button>
        <button
          onClick={() => setActiveTab('volumes')}
          className={`flex-1 py-2 rounded-xl transition cursor-pointer ${
            activeTab === 'volumes' ? 'bg-emerald-500/20 text-emerald-300 font-black' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          📊 حجم هفتگی
        </button>
        <button
          onClick={() => setActiveTab('safety')}
          className={`flex-1 py-2 rounded-xl transition cursor-pointer ${
            activeTab === 'safety' ? 'bg-emerald-500/20 text-emerald-300 font-black' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          🛡️ شانه و زانو
        </button>
        <button
          onClick={() => setActiveTab('nutrition')}
          className={`flex-1 py-2 rounded-xl transition cursor-pointer ${
            activeTab === 'nutrition' ? 'bg-emerald-500/20 text-emerald-300 font-black' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          🥗 تغذیه و پایش
        </button>
      </div>

      {/* TAB 1: ROUTINE DAYS */}
      {activeTab === 'routine' && (
        <div className="flex flex-col gap-3">
          {/* Day Selector Chips */}
          <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            {USER_PROGRAM_DAYS.map((d) => (
              <button
                key={d.id}
                onClick={() => setSelectedDayId(d.id)}
                className={`px-3 py-2 rounded-xl text-xs font-black whitespace-nowrap transition cursor-pointer ${
                  selectedDayId === d.id
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : 'bg-white/5 text-slate-400 hover:text-slate-200'
                }`}
              >
                {d.titleFa.split('(')[0].trim()}
              </button>
            ))}
          </div>

          {/* Active Day Detail Card */}
          <div className="glass-panel p-4 rounded-3xl flex flex-col gap-3">
            <div className="flex items-center justify-between border-b border-white/5 pb-2">
              <h2 className="text-sm font-black text-slate-100">{activeDay.titleFa}</h2>
              <span className="text-[10px] text-slate-500 fa-num">
                {activeDay.exercises.length} حرکت
              </span>
            </div>

            {/* Warmup alert if present */}
            {activeDay.warmupFa && (
              <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/25 text-amber-300 text-xs flex items-center gap-2">
                <span className="text-base">⚠️</span>
                <span className="font-semibold leading-relaxed">{activeDay.warmupFa}</span>
              </div>
            )}

            {/* Exercises List */}
            <div className="flex flex-col gap-2">
              {activeDay.exercises.map((ex, idx) => {
                const prescribedSets = ex.setsByWeek[selectedWeek - 1];

                return (
                  <div
                    key={ex.exerciseId}
                    className={`p-3 rounded-2xl border transition flex flex-col gap-1.5 ${
                      prescribedSets === 0
                        ? 'bg-white/[0.01] border-white/5 opacity-50'
                        : 'bg-white/[0.03] hover:bg-white/[0.05] border-white/10'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-md bg-emerald-500/10 text-emerald-400 text-[10px] font-black fa-num flex items-center justify-center">
                          {idx + 1}
                        </span>
                        <span className="text-xs font-bold text-slate-100">{ex.nameFa}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-black fa-num px-2 py-0.5 rounded-lg bg-emerald-500/15 text-emerald-300">
                          {prescribedSets === 0 ? 'استراحت' : `${prescribedSets} ست`}
                        </span>
                        <span className="text-[11px] font-semibold text-slate-400 fa-num">
                          {ex.repsRange} تکرار
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-slate-400 pr-7">
                      <span className="leading-relaxed">💡 {ex.notesFa}</span>
                      <span className="text-slate-500 shrink-0">
                        {ex.isCompound ? 'مرکب' : 'ایزوله'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Quick Link to Gym mode with this workout */}
            <Link
              href="/gym"
              className="mt-2 w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 active:scale-98 transition cursor-pointer"
            >
              <span>🏋️</span>
              <span>ورود به باشگاه با {activeDay.titleFa.split(':')[1]?.trim() || 'این جلسه'}</span>
            </Link>
          </div>
        </div>
      )}

      {/* TAB 2: WEEKLY VOLUME PROGRESSION */}
      {activeTab === 'volumes' && (
        <div className="glass-panel p-4 rounded-3xl flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-slate-100">
              صعود حجم ست‌های مستقیم سخت (هفته {selectedWeek})
            </span>
            <span className="text-[10px] text-slate-500">هفته ۱ تا ۴</span>
          </div>

          <div className="flex flex-col gap-2.5">
            {[
              { id: 'back', name: 'پشت و زیربغل', sets: currentVolume.back, wks: '۸ ← ۱۲ ← ۱۶ ← ۱۶' },
              { id: 'chest', name: 'سینه', sets: currentVolume.chest, wks: '۶ ← ۱۰ ← ۱۴ ← ۱۴' },
              { id: 'biceps', name: 'جلوبازو', sets: currentVolume.biceps, wks: '۶ ← ۸ ← ۱۲ ← ۱۲' },
              { id: 'triceps', name: 'پشت‌بازو', sets: currentVolume.triceps, wks: '۶ ← ۸ ← ۱۰ ← ۱۰' },
              { id: 'shoulders', name: 'سرشانه (جانبی و خلفی)', sets: currentVolume.shoulders, wks: '۶ ← ۸ ← ۱۲ ← ۱۲' },
              { id: 'quads', name: 'چهارسر ران', sets: currentVolume.quads, wks: '۳ ← ۴ ← ۶ ← ۶' },
              { id: 'hamstrings', name: 'همسترینگ', sets: currentVolume.hamstrings, wks: '۳ ← ۴ ← ۶ ← ۶' },
              { id: 'calves', name: 'ساق پا', sets: currentVolume.calves, wks: '۳ ← ۴ ← ۶ ← ۶' },
              { id: 'abs', name: 'شکم', sets: currentVolume.abs, wks: '۲ ← ۳ ← ۴ ← ۴' }
            ].map((m) => (
              <div key={m.id} className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-slate-200">{m.name}</div>
                  <div className="text-[10px] text-slate-500 fa-num mt-0.5">روند ۴ هفته: {m.wks}</div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-black fa-num text-emerald-400">
                    {m.sets} ست
                  </span>
                </div>
              </div>
            ))}
          </div>
          <p className="text-[10px] text-slate-500 leading-relaxed mt-1">
            حجم پا عمداً کم تنظیم شده تا زانو و تاندون آشیل در فاز بازگشت کاملاً مصون بمانند و پاسخ رشد بهینه حاصل شود.
          </p>
        </div>
      )}

      {/* TAB 3: SAFETY & PREHAB */}
      {activeTab === 'safety' && (
        <div className="flex flex-col gap-3">
          {/* Right Shoulder Card */}
          <div className="glass-panel p-4 rounded-3xl flex flex-col gap-2.5 border-rose-500/20">
            <div className="flex items-center gap-2">
              <span className="text-base">🛡️</span>
              <h3 className="text-xs font-black text-rose-300">
                {SAFETY_AND_PREHAB_RULES.rightShoulder.titleFa}
              </h3>
            </div>
            <div className="text-[11px] text-slate-300 leading-relaxed">
              <strong>حرکات ممنوع:</strong> {SAFETY_AND_PREHAB_RULES.rightShoulder.bannedExercisesFa.join('، ')}.
            </div>
            <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5 text-[10px] text-slate-300 leading-relaxed">
              ✅ <strong>گرم‌کردن اختصاصی:</strong> {SAFETY_AND_PREHAB_RULES.rightShoulder.prehabRoutineFa}
            </div>
            <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5 text-[10px] text-slate-300 leading-relaxed">
              ⚠️ <strong>قانون درد:</strong> {SAFETY_AND_PREHAB_RULES.rightShoulder.painRuleFa}
            </div>
          </div>

          {/* Knee & Achilles Card */}
          <div className="glass-panel p-4 rounded-3xl flex flex-col gap-2.5 border-amber-500/20">
            <div className="flex items-center gap-2">
              <span className="text-base">🦵</span>
              <h3 className="text-xs font-black text-amber-300">
                {SAFETY_AND_PREHAB_RULES.kneeAndAchilles.titleFa}
              </h3>
            </div>
            <div className="text-[11px] text-slate-300 leading-relaxed">
              <strong>حرکات ممنوع:</strong> {SAFETY_AND_PREHAB_RULES.kneeAndAchilles.bannedExercisesFa.join('، ')}.
            </div>
            <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5 text-[10px] text-slate-300 leading-relaxed">
              📐 <strong>فرم لگ‌پرس:</strong> {SAFETY_AND_PREHAB_RULES.kneeAndAchilles.safeFootPlacementFa}
            </div>
            <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5 text-[10px] text-slate-300 leading-relaxed">
              🧘 <strong>کشش دورسیفلکشن:</strong> {SAFETY_AND_PREHAB_RULES.kneeAndAchilles.dorsiflexionStretchFa}
            </div>
            <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5 text-[10px] text-slate-300 leading-relaxed">
              🦶 <strong>پیشرفت ساق:</strong> {SAFETY_AND_PREHAB_RULES.kneeAndAchilles.calfProgressionFa}
            </div>
          </div>

          {/* Deload Triggers */}
          <div className="glass-panel p-4 rounded-3xl flex flex-col gap-2">
            <h3 className="text-xs font-black text-slate-200">
              تریگرهای دیلود هفته ۴
            </h3>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              {SAFETY_AND_PREHAB_RULES.deloadTriggers.ruleFa}
            </p>
            <ul className="flex flex-col gap-1 mt-1">
              {SAFETY_AND_PREHAB_RULES.deloadTriggers.triggersFa.map((trig, i) => (
                <li key={i} className="text-[10px] text-slate-300 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                  <span>{trig}</span>
                </li>
              ))}
            </ul>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-300 text-[10px] mt-1">
              {SAFETY_AND_PREHAB_RULES.deloadTriggers.deloadActionFa}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: NUTRITION & TRACKING */}
      {activeTab === 'nutrition' && (
        <div className="glass-panel p-4 rounded-3xl flex flex-col gap-3">
          <h3 className="text-xs font-black text-slate-100">
            اهداف تغذیه، کالری و وزن‌گیری تمیز
          </h3>

          <div className="grid grid-cols-2 gap-2.5">
            <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/5 flex flex-col">
              <span className="text-[10px] text-slate-400">کالری هدف (سورپلاس)</span>
              <span className="text-sm font-black fa-num text-emerald-400 mt-1">
                {SAFETY_AND_PREHAB_RULES.nutritionTargets.surplusTargetKcal}
              </span>
              <span className="text-[9px] text-slate-500 mt-0.5">
                نگهداری: {SAFETY_AND_PREHAB_RULES.nutritionTargets.maintenanceKcal}
              </span>
            </div>

            <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/5 flex flex-col">
              <span className="text-[10px] text-slate-400">هدف افزایش وزن</span>
              <span className="text-sm font-black fa-num text-cyan-400 mt-1">
                {SAFETY_AND_PREHAB_RULES.nutritionTargets.targetWeightGainRate}
              </span>
              <span className="text-[9px] text-slate-500 mt-0.5">افزایش تدریجی بدون چربی</span>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/5 flex flex-col gap-1 text-xs">
            <div className="flex justify-between items-center">
              <span className="font-bold text-slate-300">پروتئین روزانه:</span>
              <span className="font-black fa-num text-slate-100">
                {SAFETY_AND_PREHAB_RULES.nutritionTargets.proteinGramsPerKg}
              </span>
            </div>
            <div className="flex justify-between items-center mt-1">
              <span className="font-bold text-slate-300">حداقل چربی:</span>
              <span className="font-black fa-num text-slate-100">
                {SAFETY_AND_PREHAB_RULES.nutritionTargets.fatsMinimum}
              </span>
            </div>
            <div className="flex justify-between items-center mt-1">
              <span className="font-bold text-slate-300">کراتین:</span>
              <span className="font-black fa-num text-emerald-400">
                {SAFETY_AND_PREHAB_RULES.nutritionTargets.creatineDaily}
              </span>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-[11px] text-emerald-300 leading-relaxed">
            🧠 <strong>اصل خودتنظیمی (Autoregulation):</strong> {SAFETY_AND_PREHAB_RULES.autoregulation.ruleFa}
          </div>
        </div>
      )}
    </div>
  );
}
