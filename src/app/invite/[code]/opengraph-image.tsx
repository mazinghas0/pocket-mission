import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = '포켓미션 가족 초대';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(135deg, #fff7ed 0%, #ffedd5 50%, #fed7aa 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ fontSize: 80, marginBottom: 20 }}>👨‍👩‍👧‍👦</div>
        <div
          style={{
            fontSize: 48,
            fontWeight: 800,
            color: '#1f2937',
            marginBottom: 16,
          }}
        >
          포켓미션 가족 초대
        </div>
        <div
          style={{
            fontSize: 28,
            color: '#6b7280',
            marginBottom: 40,
            textAlign: 'center',
          }}
        >
          미션을 완료하고 용돈을 받아요!
        </div>
        <div
          style={{
            display: 'flex',
            gap: 24,
            fontSize: 20,
            color: '#9ca3af',
          }}
        >
          <span>📋 미션 만들기</span>
          <span>📷 사진 인증</span>
          <span>⭐ 포인트 적립</span>
        </div>
        <div
          style={{
            position: 'absolute',
            bottom: 30,
            fontSize: 16,
            color: '#d1d5db',
          }}
        >
          pocket-mission.pages.dev
        </div>
      </div>
    ),
    { ...size }
  );
}
