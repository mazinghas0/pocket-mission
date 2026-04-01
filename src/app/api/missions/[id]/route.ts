import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { Mission, MissionStatus, ApiError } from '@/types';

interface RouteParams {
  params: { id: string };
}

// PATCH /api/missions/[id] — 미션 상태 변경
export async function PATCH(
  request: Request,
  { params }: RouteParams
): Promise<NextResponse<Mission | ApiError>> {
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

  const body = await request.json() as { status: MissionStatus };
  const { status } = body;

  const { data: mission, error } = await supabase
    .from('missions')
    .update({ status })
    .eq('id', params.id)
    .eq('family_id', profile.family_id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: '미션 상태 변경에 실패했습니다.' }, { status: 500 });
  }

  return NextResponse.json(mission);
}
