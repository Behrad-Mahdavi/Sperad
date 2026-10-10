'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function BottomNav() {
  const pathname = usePathname();

  const navItems = [
    { href: '/gym', label: 'باشگاه', icon: '🏋️' },
    { href: '/checkin', label: 'چک‌این', icon: '📋' },
    { href: '/weight', label: 'وزن', icon: '⚖️' },
    { href: '/', label: 'داشبورد', icon: '📊' }
  ];

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 max-w-md mx-auto">
      <nav className="glass-panel-elevated rounded-2xl px-2 py-2 flex items-center justify-around shadow-2xl shadow-black/80">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center flex-1 py-1.5 px-2 rounded-xl transition-all active:scale-95 group ${
                isActive
                  ? 'text-emerald-400 bg-emerald-500/10'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
              }`}
            >
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center mb-1 transition ${
                  isActive ? 'bg-emerald-500/20' : 'bg-white/5 group-hover:bg-white/10'
                }`}
              >
                <span className="text-base">{item.icon}</span>
              </div>
              <span
                className={`text-[11px] tracking-tight ${
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
