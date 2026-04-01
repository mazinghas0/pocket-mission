import { NextResponse } from 'next/server';
import { getStripe } from '@/lib/stripe';
import type Stripe from 'stripe';

// POST /api/stripe/webhook — Stripe Webhook 처리
// TODO: Firebase Admin SDK 설정 후 Firestore 업데이트 연결 필요
// FIREBASE_SERVICE_ACCOUNT_KEY 환경변수에 서비스 계정 JSON (base64) 설정
export async function POST(request: Request): Promise<NextResponse> {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return NextResponse.json({ error: 'Webhook 시크릿이 설정되지 않았습니다.' }, { status: 500 });
  }

  if (!signature) {
    return NextResponse.json({ error: '서명이 없습니다.' }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(body, signature, webhookSecret);
  } catch {
    return NextResponse.json({ error: '유효하지 않은 서명입니다.' }, { status: 400 });
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      console.log('[Stripe] checkout.session.completed', {
        familyId: session.metadata?.family_id,
        customerId: session.customer,
      });
      // Firebase Admin SDK 연결 후 families/{familyId} subscriptionStatus: 'premium' 업데이트
      break;
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription;
      console.log('[Stripe] subscription.deleted', { customerId: subscription.customer });
      // Firebase Admin SDK 연결 후 subscriptionStatus: 'free' 업데이트
      break;
    }

    case 'customer.subscription.updated': {
      const subscription = event.data.object as Stripe.Subscription;
      const status = subscription.status === 'active' ? 'premium' : 'free';
      console.log('[Stripe] subscription.updated', { customerId: subscription.customer, status });
      // Firebase Admin SDK 연결 후 subscriptionStatus 업데이트
      break;
    }

    default:
      break;
  }

  return NextResponse.json({ received: true });
}
