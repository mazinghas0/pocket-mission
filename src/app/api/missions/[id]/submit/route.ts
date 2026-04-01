import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { MissionSubmission, SubmitMissionRequest, ApiError } from '@/types';

interface RouteParams {
  params: { id: string };
}

// POST /api/missions/[id]/submit — 미션 인증 제출 (자녀 전용)
export async function POST(
  request: Request,
  { params }: RouteParams
): Promise<NextResponse<MissionSubmission | ApiError>> {
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

  if (profile.role !== 'child') {
    return NextResponse.json({ error: '자녀만 미션을 인증할 수 있습니다.' }, { status: 403 });
  }

  const body = await request.json() as SubmitMissionRequest;
  const { photo_url, memo } = body;

  if (!photo_url) {
    return NextResponse.json({ error: '인증 사진을 업로드해주세요.' }, { status: 400 });
  }

  // 미션 존재 및 자녀 배정 확인
  const { data: mission } = await supabase
    .from('missions')
    .select('id, assigned_to, status')
    .eq('id', params.id)
    .eq('family_id', profile.family_id)
    .single();

  if (!mission) {
    return NextResponse.json({ error: '미션을 찾을 수 없습니다.' }, { status: 404 });
  }

  if (mission.assigned_to && mission.assigned_to !== profile.id) {
    return NextResponse.json({ error: '본인에게 배정된 미션만 인증할 수 있습니다.' }, { status: 403 });
  }

  if (mission.status === 'approved') {
    return NextResponse.json({ error: '이미 완료된 미션입니다.' }, { status: 400 });
  }

  // 인증 제출 + 미션 상태 업데이트 (트랜잭션 효과를 위해 순차 처리)
  const { data: submission, error: submissionError } = await supabase
    .from('mission_submissions')
    .insert({
      mission_id: params.id,
      child_id: profile.id,
      photo_url,
      memo: memo?.trim() ?? '',
      status: 'pending',
    })
    .select()
    .single();

  if (submissionError) {
    return NextResponse.json({ error: '인증 제출에 실패했습니다.' }, { status: 500 });
  }

  await supabase
    .from('missions')
    .update({ status: 'submitted' })
    .eq('id', params.id);

  return NextResponse.json(submission, { status: 201 });
}
