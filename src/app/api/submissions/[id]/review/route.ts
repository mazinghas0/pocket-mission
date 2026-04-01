import { NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import type { ReviewSubmissionRequest, ReviewSubmissionResponse, ApiError } from '@/types';

interface RouteParams {
  params: { id: string };
}

// POST /api/submissions/[id]/review — 인증 승인/반려 (부모 전용)
export async function POST(
  request: Request,
  { params }: RouteParams
): Promise<NextResponse<ReviewSubmissionResponse | ApiError>> {
  const supabase = createClient();
  const serviceSupabase = createServiceClient();

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
    return NextResponse.json({ error: '부모만 인증을 승인/반려할 수 있습니다.' }, { status: 403 });
  }

  const body = await request.json() as ReviewSubmissionRequest;
  const { action, reason } = body;

  if (!action || !['approve', 'reject'].includes(action)) {
    return NextResponse.json({ error: '유효하지 않은 액션입니다.' }, { status: 400 });
  }

  if (action === 'reject' && (!reason || reason.trim().length === 0)) {
    return NextResponse.json({ error: '반려 사유를 입력해주세요.' }, { status: 400 });
  }

  // 인증 조회
  const { data: submission } = await supabase
    .from('mission_submissions')
    .select('id, mission_id, child_id, status')
    .eq('id', params.id)
    .single();

  if (!submission) {
    return NextResponse.json({ error: '인증을 찾을 수 없습니다.' }, { status: 404 });
  }

  if (submission.status !== 'pending') {
    return NextResponse.json({ error: '이미 처리된 인증입니다.' }, { status: 400 });
  }

  // 미션 정보 조회
  const { data: mission } = await supabase
    .from('missions')
    .select('points, family_id')
    .eq('id', submission.mission_id)
    .single();

  if (!mission || mission.family_id !== profile.family_id) {
    return NextResponse.json({ error: '접근 권한이 없습니다.' }, { status: 403 });
  }

  const now = new Date().toISOString();

  if (action === 'approve') {
    // 인증 상태 업데이트
    await serviceSupabase
      .from('mission_submissions')
      .update({
        status: 'approved',
        reviewed_by: profile.id,
        reviewed_at: now,
      })
      .eq('id', params.id);

    // 미션 상태 완료로 변경
    await serviceSupabase
      .from('missions')
      .update({ status: 'approved' })
      .eq('id', submission.mission_id);

    // 포인트 지급 — SQL 레벨 원자적 증가로 레이스 컨디션 방지
    await serviceSupabase.rpc('increment_points', {
      profile_id: submission.child_id,
      amount: mission.points,
    });

    // 포인트 트랜잭션 기록
    await serviceSupabase
      .from('point_transactions')
      .insert({
        profile_id: submission.child_id,
        amount: mission.points,
        type: 'earned',
        mission_id: submission.mission_id,
        description: '미션 완료 포인트',
      });

    return NextResponse.json({
      status: 'approved',
      points_awarded: mission.points,
    });
  } else {
    // 반려
    await serviceSupabase
      .from('mission_submissions')
      .update({
        status: 'rejected',
        rejection_reason: reason?.trim(),
        reviewed_by: profile.id,
        reviewed_at: now,
      })
      .eq('id', params.id);

    await serviceSupabase
      .from('missions')
      .update({ status: 'rejected' })
      .eq('id', submission.mission_id);

    return NextResponse.json({ status: 'rejected' });
  }
}
