'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthChange } from '@/lib/firebase/auth';
import { getProfile, getFamily, getChildStats } from '@/lib/firebase/db';
import type { ChildStats } from '@/lib/firebase/db';
import { Card } from '@/components/ui/card';
import { LevelBadge } from '@/components/ui/levelBadge';
import { BottomNav } from '@/components/ui/bottomNav';
import { formatPoints } from '@/lib/utils';
import { StatsSkeleton } from '@/components/ui/skeleton';
import type { Family } from '@/types';

export default function StatsPage() {
  const router = useRouter();
  const [stats, setStats] = useState<ChildStats[]>([]);
  const [family, setFamily] = useState<Family | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthChange(async (user) => {
      if (!user) { router.replace('/login'); return; }
      const p = await getProfile(user.uid);
      if (!p?.familyId) { router.replace('/onboarding'); return; }
      if (p.role !== 'parent') { router.replace('/child'); return; }

      const [fam, childStats] = await Promise.all([
        getFamily(p.familyId),
        getChildStats(p.familyId),
      ]);
      setFamily(fam);
      setStats(childStats);
      setLoading(false);
    });
    return () => unsub();
  }, [router]);

  if (loading) {
    return <StatsSkeleton />;
  }

  const totalApproved = stats.reduce((sum, s) => sum + s.approvedCount, 0);
  const totalAssignments = stats.reduce((sum, s) => sum + s.totalAssignments, 0);
  const overallRate = totalAssignments > 0 ? Math.round((totalApproved / totalAssignments) * 100) : 0;

  return (
    <div className="min-h-screen bg-orange-50 pb-20">
      <div className="bg-gradient-to-br from-orange-500 to-orange-600 px-4 pt-12 pb-8 text-white">
        <h1 className="text-2xl font-bold">통계</h1>
        <p className="text-orange-100 text-sm mt-1">{family?.name} 미션 현황</p>
      </div>

      <div className="px-4 -mt-4 space-y-4">
        <div className="grid grid-cols-3 gap-3">
          <Card className="text-center py-4">
            <p className="text-2xl font-bold text-orange-600">{totalApproved}</p>
            <p className="text-xs text-gray-500 mt-1">완료 미션</p>
          </Card>
          <Card className="text-center py-4">
            <p className="text-2xl font-bold text-blue-600">{totalAssignments}</p>
            <p className="text-xs text-gray-500 mt-1">전체 미션</p>
          </Card>
          <Card className="text-center py-4">
            <p className="text-2xl font-bold text-green-600">{overallRate}%</p>
            <p className="text-xs text-gray-500 mt-1">달성률</p>
          </Card>
        </div>

        {stats.length === 0 ? (
          <Card className="text-center py-8">
            <div className="text-3xl mb-2">👧</div>
            <p className="text-sm text-gray-500">아직 등록된 자녀가 없습니다</p>
            <p className="text-xs text-gray-400 mt-1">초대 코드를 공유해서 자녀를 초대해 보세요</p>
          </Card>
        ) : (
          stats.map((child) => (
            <Card key={child.childId}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-lg">👧</span>
                  <span className="font-semibold text-gray-800">{child.childName}</span>
                  <LevelBadge points={child.totalPoints} compact />
                </div>
                <span className="font-bold text-orange-600 text-sm">
                  {formatPoints(child.totalPoints)}
                </span>
              </div>

              <div className="mb-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-gray-500">달성률</span>
                  <span className="text-xs font-semibold text-gray-700">{child.completionRate}%</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2.5">
                  <div
                    className="bg-gradient-to-r from-orange-400 to-orange-500 h-2.5 rounded-full transition-all"
                    style={{ width: `${child.completionRate}%` }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-4 gap-2 text-center">
                <div className="bg-green-50 rounded-xl py-2">
                  <p className="text-lg font-bold text-green-600">{child.approvedCount}</p>
                  <p className="text-xs text-gray-500">완료</p>
                </div>
                <div className="bg-yellow-50 rounded-xl py-2">
                  <p className="text-lg font-bold text-yellow-600">{child.submittedCount}</p>
                  <p className="text-xs text-gray-500">대기</p>
                </div>
                <div className="bg-blue-50 rounded-xl py-2">
                  <p className="text-lg font-bold text-blue-600">{child.pendingCount}</p>
                  <p className="text-xs text-gray-500">진행</p>
                </div>
                <div className="bg-red-50 rounded-xl py-2">
                  <p className="text-lg font-bold text-red-600">{child.rejectedCount}</p>
                  <p className="text-xs text-gray-500">반려</p>
                </div>
              </div>

              {child.streak > 0 && (
                <div className="mt-3 flex items-center gap-2 bg-orange-50 rounded-xl px-3 py-2">
                  <span className="text-lg">🔥</span>
                  <span className="text-sm font-semibold text-orange-700">
                    {child.streak}일 연속 달성 중!
                  </span>
                </div>
              )}
            </Card>
          ))
        )}
      </div>
      <BottomNav role="parent" />
    </div>
  );
}
