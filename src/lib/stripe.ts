import Stripe from 'stripe';

// lazy initialization — 빌드 타임이 아닌 API 호출 시점에 검증
let stripeInstance: Stripe | null = null;

export function getStripe(): Stripe {
  if (stripeInstance) return stripeInstance;

  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeSecretKey) {
    throw new Error('STRIPE_SECRET_KEY 환경변수가 설정되지 않았습니다.');
  }

  stripeInstance = new Stripe(stripeSecretKey, {
    apiVersion: '2024-06-20',
    typescript: true,
  });

  return stripeInstance;
}

// 하위 호환 export
export const stripe = {
  get checkout() { return getStripe().checkout; },
  get webhooks() { return getStripe().webhooks; },
  get customers() { return getStripe().customers; },
  get subscriptions() { return getStripe().subscriptions; },
};
