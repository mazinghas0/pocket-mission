import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { Mission, CreateMissionRequest, ApiError } from '@/types';

const FREE_PLAN_MISSION_LIMIT = 5;

// GET /api/missions — 미션 목록 조회
export async function GET(): Promise<NextResponse<Mission[] | ApiError>> {
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

  let query = supabase
    .from('missions')
    .select('*')
    .eq('family_id', profile.family_id)
    .order('created_at', { ascending: false });

  // 자녀는 본인에게 배정된 미션만 조회
  if (profile.role === 'child') {
    query = query.eq('assigned_to', profile.id);
  }

  const { data: missions, error } = await query;

  if (error) {
    return NextResponse.json({ error: '미션 목록 조회에 실패했습니다.' }, { status: 500 });
  }

  return NextResponse.json(missions ?? []);
}

// POST /api/missions — 미션 생성 (부모 전용)
export async function POST(request: Request): Promise<NextResponse<Mission | ApiError>> {
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
    return NextResponse.json({ error: '부모만 미션을 생성할 수 있습니다.' }, { status: 403 });
  }

  // 구독 상태 확인 후 제한 체크
  const { data: family } = await supabase
    .from('families')
    .select('subscription_status')
    .eq('id', profile.family_id)
    .single();

  if (family?.subscription_status === 'free') {
    const { count } = await supabase
      .from('missions')
      .select('*', { count: 'exact', head: true })
      .eq('family_id', profile.family_id)
      .in('status', ['pending', 'in_progress', 'submitted']);

    if (count !== null && count >= FREE_PLAN_MISSION_LIMIT) {
      return NextResponse.json(
        { error: `무료 플랜은 미션을 ${FREE_PLAN_MISSION_LIMIT}개까지만 생성할 수 있습니다. 프리미엄으로 업그레이드해주세요.` },
        { status: 403 }
      );
    }
  }

  const body = await request.json() as CreateMissionRequest;
  const { title, description, points, due_date, is_recurring, template_id, assigned_to } = body;

  if (!title || title.trim().length === 0) {
    return NextResponse.json({ error: '미션 제목을 입력해주세요.' }, { status: 400 });
  }

  if (!points || points < 1) {
    return NextResponse.json({ error: '포인트는 1 이상이어야 합니다.' }, { status: 400 });
  }

  const { data: mission, error } = await supabase
    .from('missions')
    .insert({
      family_id: profile.family_id,
      created_by: profile.id,
      assigned_to: assigned_to ?? null,
      title: title.trim(),
      description: description?.trim() ?? '',
      points,
      template_id: template_id ?? null,
      due_date: due_date ?? null,
      is_recurring: is_recurring ?? false,
      status: 'pending',
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: '미션 생성에 실패했습니다.' }, { status: 500 });
  }

  return NextResponse.json(mission, { status: 201 });
}
