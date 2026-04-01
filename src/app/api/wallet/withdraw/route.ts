import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { WithdrawalRequest, WithdrawRequest, ApiError } from '@/types';

// POST /api/wallet/withdraw — 출금 요청 (자녀 전용)
export async function POST(request: Request): Promise<NextResponse<WithdrawalRequest | ApiError>> {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, role, points')
    .eq('user_id', user.id)
    .single();

  if (!profile) {
    return NextResponse.json({ error: '프로필을 찾을 수 없습니다.' }, { status: 404 });
  }

  if (profile.role !== 'child') {
    return NextResponse.json({ error: '자녀만 출금 요청을 할 수 있습니다.' }, { status: 403 });
  }

  const body = await request.json() as WithdrawRequest;
  const { points } = body;

  if (!points || points < 1) {
    return NextResponse.json({ error: '출금할 포인트를 입력해주세요.' }, { status: 400 });
  }

  if (points > profile.points) {
    return NextResponse.json({ error: '잔액이 부족합니다.' }, { status: 400 });
  }

  const { data: withdrawal, error } = await supabase
    .from('withdrawal_requests')
    .insert({
      child_id: profile.id,
      points,
      status: 'pending',
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: '출금 요청에 실패했습니다.' }, { status: 500 });
  }

  // 포인트 트랜잭션 기록
  await supabase
    .from('point_transactions')
    .insert({
      profile_id: profile.id,
      amount: -points,
      type: 'requested',
      description: '출금 요청',
    });

  return NextResponse.json(withdrawal, { status: 201 });
}

// GET /api/wallet/withdraw — 출금 요청 목록 (부모: 가족 전체, 자녀: 본인)
export async function GET(): Promise<NextResponse<WithdrawalRequest[] | ApiError>> {
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

  if (profile.role === 'parent') {
    // 가족 내 자녀들의 출금 요청 전체 조회
    const { data: children } = await supabase
      .from('profiles')
      .select('id')
      .eq('family_id', profile.family_id)
      .eq('role', 'child');

    const childIds = (children ?? []).map((c) => c.id);

    const { data: withdrawals } = await supabase
      .from('withdrawal_requests')
      .select('*')
      .in('child_id', childIds)
      .order('created_at', { ascending: false });

    return NextResponse.json(withdrawals ?? []);
  } else {
    const { data: withdrawals } = await supabase
      .from('withdrawal_requests')
      .select('*')
      .eq('child_id', profile.id)
      .order('created_at', { ascending: false });

    return NextResponse.json(withdrawals ?? []);
  }
}
