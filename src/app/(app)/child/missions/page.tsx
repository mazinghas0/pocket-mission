'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useMissions } from '@/hooks/useMissions';
import { MissionCard } from '@/components/missions/missionCard';
import type { MissionAssignment } from '@/types';
import { BottomNav } from '@/components/ui/bottomNav';
import { ListSkeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/emptyState';

export default function ChildMissionsPage() {
  const router = useRouter();
  const { missions, loading, error } = useMissions();

  const activeMissions = missions.filter((m: MissionAssignment) =>
    ['pending', 'in_progress'].includes(m.status)
  );
  const submittedMissions = missions.filter((m: MissionAssignment) => m.status === 'submitted');
  const doneMissions = missions.filter((m: MissionAssignment) =>
    ['approved', 'rejected'].includes(m.status)
  );

  return (
    <div className="min-h-screen bg-purple-50 pb-20">
      <div className="bg-white px-4 pt-12 pb-4 shadow-sm">
        <Link href="/child" className="text-gray-500 text-sm block mb-1">← 뒤로</Link>
        <h1 className="font-bold text-gray-800 text-lg">내 미션</h1>
      </div>

      <div className="px-4 mt-4 space-y-6">
        {loading && (
          <ListSkeleton count={3} />
        )}

        {error && (
          <p className="text-red-500 text-sm text-center">{error}</p>
        )}

        {!loading && missions.length === 0 && (
          <EmptyState
            emoji="🎯"
            title="아직 미션이 없어요"
            description="부모님이 미션을 배정해주실 거예요!"
          />
        )}

        {activeMissions.length > 0 && (
          <div>
            <h2 className="font-semibold text-gray-700 mb-2 text-sm">진행 중인 미션</h2>
            <div className="space-y-3">
              {activeMissions.map((mission) => (
                <MissionCard
                  key={mission.id}
                  mission={mission}
                  onClick={() => router.push(`/child/missions/${mission.id}`)}
                />
              ))}
            </div>
          </div>
        )}

        {submittedMissions.length > 0 && (
          <div>
            <h2 className="font-semibold text-gray-700 mb-2 text-sm">승인 대기 중</h2>
            <div className="space-y-3">
              {submittedMissions.map((mission) => (
                <MissionCard
                  key={mission.id}
                  mission={mission}
                  onClick={() => router.push(`/child/missions/${mission.id}`)}
                />
              ))}
            </div>
          </div>
        )}

        {doneMissions.length > 0 && (
          <div>
            <h2 className="font-semibold text-gray-700 mb-2 text-sm">완료/반려된 미션</h2>
            <div className="space-y-3">
              {doneMissions.map((mission) => (
                <MissionCard
                  key={mission.id}
                  mission={mission}
                  onClick={() => router.push(`/child/missions/${mission.id}`)}
                />
              ))}
            </div>
          </div>
        )}
      </div>
      <BottomNav role="child" />
    </div>
  );
}
