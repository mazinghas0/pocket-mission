import { NextResponse } from 'next/server';
import { getStripe } from '@/lib/stripe';
import { createServiceClient } from '@/lib/supabase/server';
import type Stripe from 'stripe';

// POST /api/stripe/webhook — Stripe Webhook 처리
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

  const supabase = createServiceClient();

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.CheckoutSession;
      const familyId = session.metadata?.family_id;
      const customerId = session.customer as string;

      if (familyId) {
        await supabase
          .from('families')
          .update({
            subscription_status: 'premium',
            stripe_customer_id: customerId,
          })
          .eq('id', familyId);
      }
      break;
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId = subscription.customer as string;

      await supabase
        .from('families')
        .update({ subscription_status: 'free' })
        .eq('stripe_customer_id', customerId);
      break;
    }

    case 'customer.subscription.updated': {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId = subscription.customer as string;
      const status = subscription.status === 'active' ? 'premium' : 'free';

      await supabase
        .from('families')
        .update({ subscription_status: status })
        .eq('stripe_customer_id', customerId);
      break;
    }

    default:
      break;
  }

  return NextResponse.json({ received: true });
}
