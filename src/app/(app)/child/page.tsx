'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { onAuthChange, signOut } from '@/lib/firebase/auth';
import { getProfile, getFamily, subscribeToFamilyMissions } from '@/lib/firebase/db';
import { Card } from '@/components/ui/card';
import { LevelBadge } from '@/components/ui/levelBadge';
import { BottomNav } from '@/components/ui/bottomNav';
import { PointBalance } from '@/components/wallet/pointBalance';
import type { Profile, Mission } from '@/types';

export default function ChildDashboard() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [missions, setMissions] = useState<Mission[]>([]);
  const [pointRate, setPointRate] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubMissions: (() => void) | null = null;

    const unsubAuth = onAuthChange(async (user) => {
      if (!user) { router.replace('/login'); return; }

      const p = await getProfile(user.uid);
      if (!p?.familyId) { router.replace('/onboarding'); return; }
      if (p.role !== 'child') { router.replace('/parent'); return; }

      setProfile(p);
      const fam = await getFamily(p.familyId);
      if (fam) setPointRate(fam.pointRate ?? 1);
      setLoading(false);

      unsubMissions = subscribeToFamilyMissions(p.familyId, (data) => {
        setMissions(data.filter(m => m.assignedTo === user.uid));
      });
    });

    return () => { unsubAuth(); unsubMissions?.(); };
  }, [router]);

  const activeMissionsCount = missions.filter(m =>
    ['pending', 'in_progress'].includes(m.status)
  ).length;

  const submittedCount = missions.filter(m => m.status === 'submitted').length;

  if (loading) {
    return (
      <div className="min-h-screen bg-purple-50 flex items-center justify-center">
        <p className="text-gray-400 text-sm">불러오는 중...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-purple-50 pb-20">
      <div className="bg-gradient-to-br from-purple-500 to-purple-600 px-4 pt-12 pb-8 text-white">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-purple-100 text-sm">안녕하세요,</p>
            <h1 className="text-2xl font-bold mt-1">{profile?.name} 님!</h1>
            <p className="text-purple-100 text-sm mt-1">오늘도 미션을 완료해 보세요</p>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/settings" className="text-purple-200 hover:text-white text-xs transition-colors">
              설정
            </Link>
            <button
              onClick={async () => { await signOut(); router.replace('/login'); }}
              className="text-purple-200 hover:text-white text-xs transition-colors"
            >
              로그아웃
            </button>
          </div>
        </div>
      </div>

      <div className="px-4 -mt-4 space-y-4">
        <LevelBadge points={profile?.points ?? 0} />
        <PointBalance points={profile?.points ?? 0} pointRate={pointRate} />

        <div className="grid grid-cols-2 gap-3">
          <Link href="/child/missions">
            <Card className="text-center py-5 hover:shadow-md transition-shadow">
              <p className="text-3xl font-bold text-purple-600">{activeMissionsCount}</p>
              <p className="text-sm font-medium text-gray-700 mt-1">진행 중인 미션</p>
            </Card>
          </Link>

          <Card className="text-center py-5">
            <p className="text-3xl font-bold text-yellow-600">{submittedCount}</p>
            <p className="text-sm font-medium text-gray-700 mt-1">승인 대기 중</p>
          </Card>
        </div>

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
      <BottomNav role="child" />
    </div>
  );
}
