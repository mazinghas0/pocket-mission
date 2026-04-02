import type { Metadata } from 'next';

export const runtime = 'edge';

export const metadata: Metadata = {
  title: '포켓미션 — 가족 초대',
  description: '가족이 당신을 초대했습니다! 미션을 완료하고 용돈을 받아요.',
  openGraph: {
    title: '포켓미션 — 가족 초대',
    description: '가족이 당신을 초대했습니다! 미션을 완료하고 용돈을 받아요.',
    siteName: '포켓미션',
    locale: 'ko_KR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: '포켓미션 — 가족 초대',
    description: '가족이 당신을 초대했습니다! 미션을 완료하고 용돈을 받아요.',
  },
};

export default function InviteLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
