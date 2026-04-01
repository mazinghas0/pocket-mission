import { NextResponse } from 'next/server';

export const runtime = 'edge';

// 지갑 조회는 클라이언트에서 Firebase 직접 처리 (getProfile + getTransactions in @/lib/firebase/db)
export async function GET(): Promise<NextResponse> {
  return NextResponse.json({ error: '이 엔드포인트는 더 이상 사용되지 않습니다.' }, { status: 410 });
}
