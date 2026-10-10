'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function BottomNav() {
  const pathname = usePathname();

  const navItems = [
    { href: '/gym', label: 'باشگاه', icon: '🏋️' },
    { href: '/program', label: 'برنامه', icon: '📐' },
    { href: '/analytics', label: 'آنالیز', icon: '📈' },
    { href: '/checkin', label: 'چک‌این', icon: '📋' },
    { href: '/weight', label: 'وزن', icon: '⚖️' },
    { href: '/', label: 'داشبورد', icon: '⚡' }
  ];

  return (
    <div className="fixed bottom-3 left-3 right-3 z-50 max-w-md mx-auto">
      <nav className="glass-panel-elevated rounded-2xl px-1.5 py-1.5 flex items-center justify-around shadow-2xl shadow-black/80 border border-white/10 backdrop-blur-xl bg-[#06080d]/80">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-xl transition-all active:scale-95 group ${
                isActive
                  ? 'text-emerald-400 bg-emerald-500/10'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
              }`}
            >
              <div
                className={`w-7 h-7 rounded-lg flex items-center justify-center mb-0.5 transition ${
                  isActive ? 'bg-emerald-500/20' : 'bg-white/5 group-hover:bg-white/10'
                }`}
              >
                <span className="text-sm">{item.icon}</span>
              </div>
              <span
                className={`text-[10px] tracking-tight ${
                  isActive ? 'font-black text-emerald-400' : 'font-semibold'
                }`}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
