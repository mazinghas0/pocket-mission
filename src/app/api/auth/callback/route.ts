import { NextResponse } from 'next/server';

// Firebase Auth 사용으로 이 엔드포인트는 더 이상 필요하지 않습니다.
export async function GET(request: Request): Promise<NextResponse> {
  const { origin } = new URL(request.url);
  return NextResponse.redirect(`${origin}/`);
}
