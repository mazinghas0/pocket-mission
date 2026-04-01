import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { nanoid } from 'nanoid';
import type { CreateFamilyRequest, CreateFamilyResponse, ApiError } from '@/types';

// POST /api/families — 가족 생성 + 초대코드 발급
export async function POST(request: Request): Promise<NextResponse<CreateFamilyResponse | ApiError>> {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
  }

  const body = await request.json() as CreateFamilyRequest;
  const { name } = body;

  if (!name || name.trim().length === 0) {
    return NextResponse.json({ error: '가족 이름을 입력해주세요.' }, { status: 400 });
  }

  const inviteCode = nanoid(6).toUpperCase();

  const { data: family, error: familyError } = await supabase
    .from('families')
    .insert({ name: name.trim(), invite_code: inviteCode })
    .select()
    .single();

  if (familyError) {
    return NextResponse.json({ error: '가족 생성에 실패했습니다.' }, { status: 500 });
  }

  // 현재 유저를 부모로 프로필 연결
  const { error: profileError } = await supabase
    .from('profiles')
    .update({ family_id: family.id })
    .eq('user_id', user.id);

  if (profileError) {
    return NextResponse.json({ error: '프로필 연결에 실패했습니다.' }, { status: 500 });
  }

  return NextResponse.json({ id: family.id, invite_code: family.invite_code }, { status: 201 });
}
