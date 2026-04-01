import { NextResponse } from 'next/server';
import { getStripe } from '@/lib/stripe';
import type { ApiError } from '@/types';

interface CheckoutRequest {
  familyId: string;
  stripeCustomerId?: string;
  userEmail?: string;
}

interface CheckoutResponse {
  url: string;
}

// POST /api/stripe/checkout — Stripe Checkout 세션 생성
// 클라이언트에서 familyId, stripeCustomerId, userEmail을 전달
export async function POST(request: Request): Promise<NextResponse<CheckoutResponse | ApiError>> {
  const body = await request.json() as CheckoutRequest;
  const { familyId, stripeCustomerId, userEmail } = body;

  if (!familyId) {
    return NextResponse.json({ error: '가족 ID가 필요합니다.' }, { status: 400 });
  }

  const priceId = process.env.STRIPE_PRICE_ID;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;

  if (!priceId || !appUrl) {
    return NextResponse.json({ error: '결제 설정이 누락되었습니다.' }, { status: 500 });
  }

  const session = await getStripe().checkout.sessions.create({
    mode: 'subscription',
    payment_method_types: ['card'],
    customer: stripeCustomerId ?? undefined,
    customer_email: stripeCustomerId ? undefined : userEmail,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${appUrl}/parent?subscription=success`,
    cancel_url: `${appUrl}/parent?subscription=cancel`,
    metadata: { family_id: familyId },
  });

  if (!session.url) {
    return NextResponse.json({ error: '결제 페이지 생성에 실패했습니다.' }, { status: 500 });
  }

  return NextResponse.json({ url: session.url });
}
