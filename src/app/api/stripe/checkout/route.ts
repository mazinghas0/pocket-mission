import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getStripe } from '@/lib/stripe';
import type { ApiError } from '@/types';

interface CheckoutResponse {
  url: string;
}

// POST /api/stripe/checkout — Stripe Checkout 세션 생성
export async function POST(): Promise<NextResponse<CheckoutResponse | ApiError>> {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, family_id, role')
    .eq('user_id', user.id)
    .single();

  if (!profile?.family_id) {
    return NextResponse.json({ error: '가족이 연결되지 않았습니다.' }, { status: 403 });
  }

  if (profile.role !== 'parent') {
    return NextResponse.json({ error: '부모만 구독할 수 있습니다.' }, { status: 403 });
  }

  const { data: family } = await supabase
    .from('families')
    .select('stripe_customer_id, subscription_status')
    .eq('id', profile.family_id)
    .single();

  if (family?.subscription_status === 'premium') {
    return NextResponse.json({ error: '이미 프리미엄 구독 중입니다.' }, { status: 400 });
  }

  const priceId = process.env.STRIPE_PRICE_ID;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;

  if (!priceId || !appUrl) {
    return NextResponse.json({ error: '결제 설정이 누락되었습니다.' }, { status: 500 });
  }

  const session = await getStripe().checkout.sessions.create({
    mode: 'subscription',
    payment_method_types: ['card'],
    customer: family?.stripe_customer_id ?? undefined,
    customer_email: family?.stripe_customer_id ? undefined : user.email,
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    success_url: `${appUrl}/parent?subscription=success`,
    cancel_url: `${appUrl}/parent?subscription=cancel`,
    metadata: {
      family_id: profile.family_id,
      user_id: user.id,
    },
  });

  if (!session.url) {
    return NextResponse.json({ error: '결제 페이지 생성에 실패했습니다.' }, { status: 500 });
  }

  return NextResponse.json({ url: session.url });
}
