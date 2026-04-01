import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { WalletResponse, ApiError } from '@/types';

// GET /api/wallet — 포인트 잔액 + 이력 조회
export async function GET(): Promise<NextResponse<WalletResponse | ApiError>> {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, points')
    .eq('user_id', user.id)
    .single();

  if (!profile) {
    return NextResponse.json({ error: '프로필을 찾을 수 없습니다.' }, { status: 404 });
  }

  const { data: transactions } = await supabase
    .from('point_transactions')
    .select('*')
    .eq('profile_id', profile.id)
    .order('created_at', { ascending: false })
    .limit(50);

  return NextResponse.json({
    balance: profile.points,
    transactions: transactions ?? [],
  });
}
