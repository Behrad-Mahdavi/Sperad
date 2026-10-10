import type { Metadata, Viewport } from 'next';
import localFont from 'next/font/local';
import './globals.css';
import Link from 'next/link';

const iransans = localFont({
  src: [
    { path: '../../public/fonts/IRANSansXFaNum-ThinD4.ttf', weight: '100', style: 'normal' },
    { path: '../../public/fonts/IRANSansXFaNum-UltraLightD4.ttf', weight: '200', style: 'normal' },
    { path: '../../public/fonts/IRANSansXFaNum-LightD4.ttf', weight: '300', style: 'normal' },
    { path: '../../public/fonts/IRANSansXFaNum-RegularD4.ttf', weight: '400', style: 'normal' },
    { path: '../../public/fonts/IRANSansXFaNum-MediumD4.ttf', weight: '500', style: 'normal' },
    { path: '../../public/fonts/IRANSansXFaNum-DemiBoldD4.ttf', weight: '600', style: 'normal' },
    { path: '../../public/fonts/IRANSansXFaNum-BoldD4.ttf', weight: '700', style: 'normal' },
    { path: '../../public/fonts/IRANSansXFaNum-ExtraBoldD4.ttf', weight: '800', style: 'normal' },
    { path: '../../public/fonts/IRANSansXFaNum-BlackD4.ttf', weight: '900', style: 'normal' },
    { path: '../../public/fonts/IRANSansXFaNum-HeavyD4.ttf', weight: '950', style: 'normal' }
  ],
  variable: '--font-iransans',
  display: 'swap'
});

export const metadata: Metadata = {
  title: 'اسپراد | Sperad',
  description: 'موتور علمی تصمیم‌گیری تمرین بدنسازی',
  manifest: '/manifest.json'
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#06080d'
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fa" dir="rtl" className={iransans.variable}>
      <body className="min-h-screen bg-[#06080d] text-slate-100 flex flex-col justify-between font-sans antialiased overflow-x-hidden selection:bg-emerald-500/30 selection:text-emerald-200">
        {/* Subtle background ambient lights */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
          <div className="absolute -top-32 right-1/2 translate-x-1/2 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl" />
          <div className="absolute top-1/3 -left-20 w-72 h-72 bg-cyan-500/5 rounded-full blur-3xl" />
          <div className="absolute bottom-20 -right-20 w-80 h-80 bg-emerald-500/5 rounded-full blur-3xl" />
        </div>

        {/* Content area */}
        <main className="relative z-10 flex-1 pb-28 max-w-md mx-auto w-full px-4 pt-4">
          {children}
        </main>

        {/* Premium Floating Glass Dock Bar */}
        <div className="fixed bottom-4 left-4 right-4 z-50 max-w-md mx-auto">
          <nav className="glass-panel-elevated rounded-2xl px-2 py-2 flex items-center justify-around shadow-2xl shadow-black/80">
            <Link
              href="/gym"
              className="flex flex-col items-center justify-center flex-1 py-1.5 px-2 rounded-xl text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 transition-all active:scale-95 group"
            >
              <div className="w-8 h-8 rounded-lg bg-emerald-500/15 flex items-center justify-center mb-1 group-hover:bg-emerald-500/25 transition">
                <span className="text-base">🏋️</span>
              </div>
              <span className="text-[11px] font-bold tracking-tight">باشگاه</span>
            </Link>

            <Link
              href="/checkin"
              className="flex flex-col items-center justify-center flex-1 py-1.5 px-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-white/5 transition-all active:scale-95 group"
            >
              <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center mb-1 group-hover:bg-white/10 transition">
                <span className="text-base">📋</span>
              </div>
              <span className="text-[11px] font-semibold tracking-tight">چک‌این</span>
            </Link>

            <Link
              href="/weight"
              className="flex flex-col items-center justify-center flex-1 py-1.5 px-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-white/5 transition-all active:scale-95 group"
            >
              <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center mb-1 group-hover:bg-white/10 transition">
                <span className="text-base">⚖️</span>
              </div>
              <span className="text-[11px] font-semibold tracking-tight">وزن</span>
            </Link>

            <Link
              href="/"
              className="flex flex-col items-center justify-center flex-1 py-1.5 px-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-white/5 transition-all active:scale-95 group"
            >
              <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center mb-1 group-hover:bg-white/10 transition">
                <span className="text-base">📊</span>
              </div>
              <span className="text-[11px] font-semibold tracking-tight">داشبورد</span>
            </Link>
          </nav>
        </div>
      </body>
    </html>
  );
}
