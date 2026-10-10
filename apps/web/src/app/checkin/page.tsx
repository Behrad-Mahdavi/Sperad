'use client';

import React, { useState } from 'react';
import { db } from '@/lib/db';
import { enqueueOutbox } from '@/lib/sync';
import type { DailyCheckin } from '@sperad/shared';

export default function CheckinPage() {
  const todayDate = new Date().toISOString().split('T')[0];
  const [sleepHours, setSleepHours] = useState<number>(7.5);
  const [sleepQuality, setSleepQuality] = useState<number>(4);
  const [stressLevel, setStressLevel] = useState<number>(2);
  const [motivation, setMotivation] = useState<number>(4);
  const [soreness, setSoreness] = useState<Record<string, number>>({
    chest: 0,
    back: 1,
    quads: 0,
    hamstrings: 0,
    shoulders: 0,
    arms: 0
  });
  const [isSaved, setIsSaved] = useState<boolean>(false);

  const handleSorenessChange = (muscle: string, level: number) => {
    setSoreness((prev) => ({ ...prev, [muscle]: level }));
  };

  const handleSave = async () => {
    const checkin: DailyCheckin = {
      checkinDate: todayDate,
      sleepHours,
      sleepQuality,
      stressLevel,
      motivation,
      muscleSoreness: soreness,
      restingHeartRate: null,
      hrvMs: null,
      createdAt: new Date().toISOString()
    };

    const clientUuid = crypto.randomUUID();
    await db.dailyCheckins.put(checkin);
    await enqueueOutbox('daily_checkins', 'UPSERT', clientUuid, checkin);

    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  return (
    <div className="flex flex-col gap-3.5 pb-8">
      {/* Header card */}
      <div className="glass-panel rounded-2xl p-4 flex justify-between items-center">
        <div>
          <h1 className="text-base font-black text-slate-100 tracking-tight">چک‌این آمادگی روزانه</h1>
          <p className="text-[11px] text-slate-400 mt-0.5">
            ارزیابی آمادگی عصبی و عضلانی قبل از تمرین
          </p>
        </div>
        <span className="text-xs font-bold fa-num px-2.5 py-1 rounded-xl bg-white/5 border border-white/5 text-slate-300">
          {todayDate}
        </span>
      </div>

      {/* Sleep Section */}
      <section className="glass-panel rounded-2xl p-4 flex flex-col gap-3">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="text-base">🌙</span>
            <span className="text-xs font-bold text-slate-200">میزان خواب شب گذشته</span>
          </div>
          <span className="text-xl font-black fa-num text-emerald-400">{sleepHours} ساعت</span>
        </div>

        <input
          type="range"
          min="4"
          max="11"
          step="0.5"
          value={sleepHours}
          onChange={(e) => setSleepHours(parseFloat(e.target.value))}
          className="w-full accent-emerald-500 cursor-pointer h-2 bg-slate-800 rounded-lg"
        />

        <div className="pt-2">
          <span className="text-[11px] text-slate-400 font-semibold block mb-2">کیفیت خواب</span>
          <div className="grid grid-cols-5 gap-1.5">
            {[
              { val: 1, label: 'خیلی بد' },
              { val: 2, label: 'ضعیف' },
              { val: 3, label: 'معمولی' },
              { val: 4, label: 'خوب' },
              { val: 5, label: 'عالی' }
            ].map((item) => (
              <button
                key={item.val}
                onClick={() => setSleepQuality(item.val)}
                className={`py-2 rounded-xl text-xs font-black transition cursor-pointer ${
                  sleepQuality === item.val
                    ? 'bg-emerald-500 text-slate-950 font-black shadow-lg shadow-emerald-500/20'
                    : 'bg-white/[0.03] text-slate-300 hover:bg-white/[0.06] border border-white/5'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Stress & Motivation */}
      <div className="grid grid-cols-2 gap-3">
        <section className="glass-panel rounded-2xl p-3.5 flex flex-col gap-2">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-slate-300">استرس روزمره</span>
            <span className="text-xs font-black fa-num text-amber-400">{stressLevel} از ۵</span>
          </div>
          <div className="grid grid-cols-5 gap-1 pt-1">
            {[1, 2, 3, 4, 5].map((lvl) => (
              <button
                key={lvl}
                onClick={() => setStressLevel(lvl)}
                className={`py-1.5 rounded-lg text-xs font-black fa-num transition cursor-pointer ${
                  stressLevel === lvl
                    ? 'bg-amber-500 text-slate-950 font-black shadow-lg shadow-amber-500/20'
                    : 'bg-white/[0.03] text-slate-400 hover:bg-white/[0.06] border border-white/5'
                }`}
              >
                {lvl}
              </button>
            ))}
          </div>
        </section>

        <section className="glass-panel rounded-2xl p-3.5 flex flex-col gap-2">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-slate-300">انگیزه تمرین</span>
            <span className="text-xs font-black fa-num text-cyan-400">{motivation} از ۵</span>
          </div>
          <div className="grid grid-cols-5 gap-1 pt-1">
            {[1, 2, 3, 4, 5].map((lvl) => (
              <button
                key={lvl}
                onClick={() => setMotivation(lvl)}
                className={`py-1.5 rounded-lg text-xs font-black fa-num transition cursor-pointer ${
                  motivation === lvl
                    ? 'bg-cyan-500 text-slate-950 font-black shadow-lg shadow-cyan-500/20'
                    : 'bg-white/[0.03] text-slate-400 hover:bg-white/[0.06] border border-white/5'
                }`}
              >
                {lvl}
              </button>
            ))}
          </div>
        </section>
      </div>

      {/* Soreness Map */}
      <section className="glass-panel rounded-2xl p-4 flex flex-col gap-2.5">
        <div className="flex justify-between items-center">
          <span className="text-xs font-bold text-slate-200">کوفتگی و درد عضلانی (DOMS)</span>
          <span className="text-[10px] text-slate-500">۰ تا ۴</span>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs">
          {[
            { id: 'chest', label: 'سینه' },
            { id: 'back', label: 'پشت / زیربغل' },
            { id: 'quads', label: 'چهارسر ران' },
            { id: 'hamstrings', label: 'همسترینگ' },
            { id: 'shoulders', label: 'سرشانه' },
            { id: 'arms', label: 'بازوها' }
          ].map((item) => (
            <div
              key={item.id}
              className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5 flex flex-col gap-1.5"
            >
              <div className="flex justify-between items-center font-bold text-slate-300">
                <span>{item.label}</span>
                <span
                  className={`text-xs font-black fa-num ${
                    (soreness[item.id] || 0) > 2
                      ? 'text-rose-400'
                      : (soreness[item.id] || 0) > 0
                      ? 'text-amber-400'
                      : 'text-slate-500'
                  }`}
                >
                  {soreness[item.id] || 0}
                </span>
              </div>

              <div className="grid grid-cols-5 gap-1">
                {[0, 1, 2, 3, 4].map((val) => (
                  <button
                    key={val}
                    onClick={() => handleSorenessChange(item.id, val)}
                    className={`py-1 rounded text-[11px] font-black fa-num transition cursor-pointer ${
                      soreness[item.id] === val
                        ? val > 2
                          ? 'bg-rose-500 text-slate-950 font-black'
                          : val > 0
                          ? 'bg-amber-500 text-slate-950 font-black'
                          : 'bg-emerald-500 text-slate-950 font-black'
                        : 'bg-white/[0.03] text-slate-400 hover:bg-white/[0.06]'
                    }`}
                  >
                    {val}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Submit Button */}
      <button
        onClick={handleSave}
        className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 text-slate-950 font-black text-base shadow-xl shadow-emerald-500/20 active:scale-[0.98] transition cursor-pointer glow-emerald"
      >
        {isSaved ? '✓ چک‌این روزانه ذخیره شد' : 'ثبت چک‌این روزانه'}
      </button>
    </div>
  );
}
