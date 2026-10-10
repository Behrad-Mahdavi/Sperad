import type { Metadata, Viewport } from 'next';
import localFont from 'next/font/local';
import './globals.css';
import { BottomNav } from '@/components/layout/BottomNav';

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

        {/* Modular Floating Glass Dock Bar */}
        <BottomNav />
      </body>
    </html>
  );
}
