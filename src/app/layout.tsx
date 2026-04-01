import type { Metadata, Viewport } from 'next';
import './globals.css';

export const runtime = 'edge';

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
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
      </head>
      <body className="bg-orange-50 min-h-screen font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
