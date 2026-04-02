import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '포켓미션 — 미션 기반 용돈 관리',
  description: '아이가 미션을 완료하면 포인트를 받아요. 부모와 자녀가 함께하는 습관 형성 용돈 앱.',
  manifest: '/manifest.json',
  metadataBase: new URL('https://pocket-mission.pages.dev'),
  openGraph: {
    title: '포켓미션 — 미션 기반 용돈 관리',
    description: '아이가 미션을 완료하면 포인트를 받아요. 부모와 자녀가 함께하는 습관 형성 용돈 앱.',
    url: 'https://pocket-mission.pages.dev',
    siteName: '포켓미션',
    images: [
      {
        url: '/icons/icon-512.png',
        width: 512,
        height: 512,
        alt: '포켓미션 앱 아이콘',
      },
    ],
    locale: 'ko_KR',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: '포켓미션 — 미션 기반 용돈 관리',
    description: '아이가 미션을 완료하면 포인트를 받아요. 부모와 자녀가 함께하는 습관 형성 용돈 앱.',
    images: ['/icons/icon-512.png'],
  },
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
      <body className="bg-orange-50 min-h-screen font-sans antialiased">
        {children}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator && location.hostname !== 'localhost') {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js');
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
