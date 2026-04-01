'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { onAuthChange } from '@/lib/firebase/auth';
import { getProfile, subscribeToFamilyMissions, deleteMission } from '@/lib/firebase/db';
import { MissionCard } from '@/components/missions/missionCard';
import { BottomNav } from '@/components/ui/bottomNav';
import type { Mission, MissionStatus } from '@/types';

const STATUS_FILTERS: Array<{ label: string; value: MissionStatus | 'all' }> = [
  { label: '전체', value: 'all' },
  { label: '대기중', value: 'pending' },
  { label: '진행중', value: 'in_progress' },
  { label: '인증대기', value: 'submitted' },
  { label: '완료', value: 'approved' },
];

export default function ParentMissionsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const statusFilter = (searchParams.get('status') ?? 'all') as MissionStatus | 'all';

  const [missions, setMissions] = useState<Mission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubMissions: (() => void) | null = null;

    const unsubAuth = onAuthChange(async (user) => {
      if (!user) { router.replace('/login'); return; }

      const profile = await getProfile(user.uid);
      if (!profile?.familyId || profile.role !== 'parent') { router.replace('/parent'); return; }

      unsubMissions = subscribeToFamilyMissions(profile.familyId, (data) => {
        setMissions(data);
        setLoading(false);
      });
    });

    return () => { unsubAuth(); unsubMissions?.(); };
  }, [router]);

  const filtered = statusFilter === 'all'
    ? missions
    : missions.filter(m => m.status === statusFilter);

  return (
    <div className="min-h-screen bg-orange-50 pb-20">
      <div className="bg-white px-4 pt-12 pb-4 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <Link href="/parent" className="text-gray-500 text-sm">← 뒤로</Link>
          <h1 className="font-bold text-gray-800">미션 목록</h1>
          <Link href="/parent/missions/new" className="text-orange-500 text-sm font-semibold">+ 추가</Link>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
          {STATUS_FILTERS.map((filter) => (
            <Link
              key={filter.value}
              href={filter.value === 'all' ? '/parent/missions' : `/parent/missions?status=${filter.value}`}
              className={`shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                statusFilter === filter.value
                  ? 'bg-orange-500 text-white'
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              {filter.label}
            </Link>
          ))}
        </div>
      </div>

      <div className="px-4 mt-4 space-y-3">
        {loading ? (
          <p className="text-center text-gray-400 py-10 text-sm">불러오는 중...</p>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <div className="text-4xl mb-3">📋</div>
            <p className="text-sm">아직 미션이 없어요</p>
            <p className="text-xs mt-1">아이의 첫 미션을 만들어보세요!</p>
            <Link href="/parent/missions/new" className="inline-block mt-3 bg-orange-500 text-white text-sm font-semibold px-5 py-2 rounded-xl">
              첫 미션 만들기
            </Link>
          </div>
        ) : (
          filtered.map((mission) => (
            <MissionCard
              key={mission.id}
              mission={mission}
              showActions
              onDelete={async (id) => { await deleteMission(id); }}
              onEdit={(m) => router.push(`/parent/missions/new?edit=${m.id}`)}
            />
          ))
        )}
      </div>
      <BottomNav role="parent" />
    </div>
  );
}
