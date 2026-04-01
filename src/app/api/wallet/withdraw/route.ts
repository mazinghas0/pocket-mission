import { NextResponse } from 'next/server';

// 출금 요청은 클라이언트에서 Firebase 직접 처리
// (createWithdrawalRequest in @/lib/firebase/db)
export async function POST(): Promise<NextResponse> {
  return NextResponse.json({ error: '이 엔드포인트는 더 이상 사용되지 않습니다.' }, { status: 410 });
}

export async function GET(): Promise<NextResponse> {
  return NextResponse.json({ error: '이 엔드포인트는 더 이상 사용되지 않습니다.' }, { status: 410 });
}
