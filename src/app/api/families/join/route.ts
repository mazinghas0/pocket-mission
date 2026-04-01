import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { JoinFamilyRequest, JoinFamilyResponse, ApiError } from '@/types';

// POST /api/families/join — 초대코드로 가족 참여
export async function POST(request: Request): Promise<NextResponse<JoinFamilyResponse | ApiError>> {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
  }

  const body = await request.json() as JoinFamilyRequest;
  const { invite_code } = body;

  if (!invite_code || invite_code.trim().length === 0) {
    return NextResponse.json({ error: '초대 코드를 입력해주세요.' }, { status: 400 });
  }

  // 초대코드로 가족 조회
  const { data: family, error: familyError } = await supabase
    .from('families')
    .select('id')
    .eq('invite_code', invite_code.trim().toUpperCase())
    .single();

  if (familyError || !family) {
    return NextResponse.json({ error: '유효하지 않은 초대 코드입니다.' }, { status: 404 });
  }

  // 현재 유저 프로필의 family_id 업데이트
  const { error: profileError } = await supabase
    .from('profiles')
    .update({ family_id: family.id })
    .eq('user_id', user.id);

  if (profileError) {
    return NextResponse.json({ error: '가족 참여에 실패했습니다.' }, { status: 500 });
  }

  return NextResponse.json({ family_id: family.id });
}
