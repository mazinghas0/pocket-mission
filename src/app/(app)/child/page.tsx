import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { Card } from '@/components/ui/card';
import { PointBalance } from '@/components/wallet/pointBalance';

export default async function ChildDashboard() {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, family_id, name, role, points')
    .eq('user_id', user.id)
    .single();

  if (!profile?.family_id) redirect('/onboarding');
  if (profile.role !== 'child') redirect('/parent');

  // 진행 중인 미션 수
  const { count: activeMissionsCount } = await supabase
    .from('missions')
    .select('*', { count: 'exact', head: true })
    .eq('assigned_to', profile.id)
    .in('status', ['pending', 'in_progress']);

  // 인증 대기 중인 미션 수
  const { count: submittedCount } = await supabase
    .from('missions')
    .select('*', { count: 'exact', head: true })
    .eq('assigned_to', profile.id)
    .eq('status', 'submitted');

  return (
    <div className="min-h-screen bg-purple-50 pb-20">
      {/* 헤더 */}
      <div className="bg-gradient-to-br from-purple-500 to-purple-600 px-4 pt-12 pb-8 text-white">
        <p className="text-purple-100 text-sm">안녕하세요,</p>
        <h1 className="text-2xl font-bold mt-1">{profile.name} 님!</h1>
        <p className="text-purple-100 text-sm mt-1">오늘도 미션을 완료해 보세요</p>
      </div>

      <div className="px-4 -mt-4 space-y-4">
        {/* 포인트 잔액 */}
        <PointBalance points={profile.points} />

        {/* 미션 현황 */}
        <div className="grid grid-cols-2 gap-3">
          <Link href="/child/missions">
            <Card className="text-center py-5 hover:shadow-md transition-shadow">
              <p className="text-3xl font-bold text-purple-600">{activeMissionsCount ?? 0}</p>
              <p className="text-sm font-medium text-gray-700 mt-1">진행 중인 미션</p>
            </Card>
          </Link>

          <Card className="text-center py-5">
            <p className="text-3xl font-bold text-yellow-600">{submittedCount ?? 0}</p>
            <p className="text-sm font-medium text-gray-700 mt-1">승인 대기 중</p>
          </Card>
        </div>

        {/* 빠른 메뉴 */}
        <div className="grid grid-cols-2 gap-3">
          <Link href="/child/missions">
            <Card className="text-center py-5 hover:shadow-md transition-shadow">
              <div className="text-3xl mb-1">📋</div>
              <p className="text-sm font-semibold text-gray-700">내 미션</p>
            </Card>
          </Link>

          <Link href="/child/wallet">
            <Card className="text-center py-5 hover:shadow-md transition-shadow">
              <div className="text-3xl mb-1">💰</div>
              <p className="text-sm font-semibold text-gray-700">내 지갑</p>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  );
}
