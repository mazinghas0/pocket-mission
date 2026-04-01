import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { Card } from '@/components/ui/card';
import { UpgradeBanner } from '@/components/ui/upgradeBanner';
import { formatPoints } from '@/lib/utils';

export default async function ParentDashboard() {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, family_id, name, role')
    .eq('user_id', user.id)
    .single();

  if (!profile?.family_id) redirect('/onboarding');
  if (profile.role !== 'parent') redirect('/child');

  // 인증 대기 수
  const { count: pendingCount } = await supabase
    .from('mission_submissions')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'pending');

  // 자녀 목록과 포인트
  const { data: children } = await supabase
    .from('profiles')
    .select('id, name, points')
    .eq('family_id', profile.family_id)
    .eq('role', 'child');

  // 가족 정보 (초대코드)
  const { data: family } = await supabase
    .from('families')
    .select('name, invite_code, subscription_status')
    .eq('id', profile.family_id)
    .single();

  return (
    <div className="min-h-screen bg-orange-50 pb-20">
      {/* 헤더 */}
      <div className="bg-gradient-to-br from-orange-500 to-orange-600 px-4 pt-12 pb-8 text-white">
        <p className="text-orange-100 text-sm">안녕하세요,</p>
        <h1 className="text-2xl font-bold mt-1">{profile.name} 님</h1>
        {family && (
          <div className="flex items-center gap-2 mt-3">
            <span className="text-orange-100 text-sm">{family.name}</span>
            <span className="bg-white/20 rounded-lg px-2 py-0.5 text-xs font-mono">
              {family.invite_code}
            </span>
            {family.subscription_status === 'premium' && (
              <span className="bg-yellow-300 text-yellow-900 rounded-full px-2 py-0.5 text-xs font-semibold">
                프리미엄
              </span>
            )}
          </div>
        )}
      </div>

      <div className="px-4 -mt-4 space-y-4">
        {/* 빠른 메뉴 */}
        <div className="grid grid-cols-2 gap-3">
          <Link href="/parent/approvals">
            <Card className="text-center py-5 hover:shadow-md transition-shadow relative">
              {(pendingCount ?? 0) > 0 && (
                <span className="absolute top-3 right-3 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {pendingCount}
                </span>
              )}
              <div className="text-3xl mb-1">✅</div>
              <p className="text-sm font-semibold text-gray-700">인증 승인</p>
              <p className="text-xs text-gray-400 mt-0.5">
                {(pendingCount ?? 0) > 0 ? `${pendingCount}건 대기중` : '대기 없음'}
              </p>
            </Card>
          </Link>

          <Link href="/parent/missions/new">
            <Card className="text-center py-5 hover:shadow-md transition-shadow">
              <div className="text-3xl mb-1">✏️</div>
              <p className="text-sm font-semibold text-gray-700">미션 만들기</p>
              <p className="text-xs text-gray-400 mt-0.5">새 미션 추가</p>
            </Card>
          </Link>

          <Link href="/parent/missions">
            <Card className="text-center py-5 hover:shadow-md transition-shadow">
              <div className="text-3xl mb-1">📋</div>
              <p className="text-sm font-semibold text-gray-700">미션 목록</p>
              <p className="text-xs text-gray-400 mt-0.5">전체 현황</p>
            </Card>
          </Link>

          <Link href="/parent/wallet">
            <Card className="text-center py-5 hover:shadow-md transition-shadow">
              <div className="text-3xl mb-1">💰</div>
              <p className="text-sm font-semibold text-gray-700">용돈 현황</p>
              <p className="text-xs text-gray-400 mt-0.5">자녀 포인트</p>
            </Card>
          </Link>
        </div>

        {/* 자녀 포인트 요약 */}
        {children && children.length > 0 && (
          <Card>
            <h2 className="font-semibold text-gray-800 mb-3">자녀 포인트 현황</h2>
            <div className="space-y-2">
              {children.map((child) => (
                <div key={child.id} className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">{child.name}</span>
                  <span className="font-bold text-orange-600 text-sm">
                    {formatPoints(child.points)}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* 프리미엄 업그레이드 배너 */}
        {family?.subscription_status === 'free' && (
          <UpgradeBanner />
        )}
      </div>
    </div>
  );
}
