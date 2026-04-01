import { NextResponse, type NextRequest } from 'next/server';

// Firebase Auth はクライアント側で管理するため、ミドルウェアでは静的リソースのみ除外する
export function middleware(request: NextRequest) {
  return NextResponse.next({ request });
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|icons|manifest.json|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
