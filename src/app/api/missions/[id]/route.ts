import { NextResponse } from 'next/server';

export const runtime = 'edge';

// 미션 상태 변경은 클라이언트에서 Firebase 직접 처리 (updateMissionStatus in @/lib/firebase/db)
export async function PATCH(): Promise<NextResponse> {
  return NextResponse.json({ error: '이 엔드포인트는 더 이상 사용되지 않습니다.' }, { status: 410 });
}
