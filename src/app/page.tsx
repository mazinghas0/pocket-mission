import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

// 루트 페이지: 인증 상태 + 역할에 따라 적절한 페이지로 리다이렉트
export default async function RootPage() {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('family_id, role')
    .eq('user_id', user.id)
    .single();

  if (!profile || !profile.family_id) {
    redirect('/onboarding');
  }

  if (profile.role === 'parent') {
    redirect('/parent');
  } else {
    redirect('/child');
  }
}
