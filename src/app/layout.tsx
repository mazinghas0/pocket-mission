import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'PocketMission — 미션 기반 용돈 관리',
  description: '부모와 자녀가 함께하는 미션 기반 용돈 관리 앱',
  manifest: '/manifest.json',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#f97316',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-180.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="포켓미션" />
        <link rel="apple-touch-startup-image" href="/icons/splash.png" />
      </head>
      <body className="bg-quest-cream min-h-screen font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
