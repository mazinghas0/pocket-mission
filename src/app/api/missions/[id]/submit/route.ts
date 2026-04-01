import { NextResponse } from 'next/server';

// 미션 인증 제출은 클라이언트에서 Firebase 직접 처리 (createSubmission in @/lib/firebase/db)
export async function POST(): Promise<NextResponse> {
  return NextResponse.json({ error: '이 엔드포인트는 더 이상 사용되지 않습니다.' }, { status: 410 });
}
