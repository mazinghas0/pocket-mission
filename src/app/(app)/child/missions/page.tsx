'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useMissions } from '@/hooks/useMissions';
import { MissionCard } from '@/components/missions/missionCard';
import { BottomNav } from '@/components/ui/bottomNav';

export default function ChildMissionsPage() {
  const router = useRouter();
  const { missions, loading, error } = useMissions();

  const activeMissions = missions.filter((m) =>
    ['pending', 'in_progress'].includes(m.status)
  );
  const submittedMissions = missions.filter((m) => m.status === 'submitted');
  const doneMissions = missions.filter((m) =>
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
          <p className="text-center text-gray-400 py-10 text-sm">미션 불러오는 중...</p>
        )}

        {error && (
          <p className="text-red-500 text-sm text-center">{error}</p>
        )}

        {!loading && missions.length === 0 && (
          <div className="text-center py-16 text-gray-400">
            <div className="text-4xl mb-3">🎯</div>
            <p className="text-sm">부모님이 미션을 배정해주실 거예요!</p>
          </div>
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
                <MissionCard key={mission.id} mission={mission} />
              ))}
            </div>
          </div>
        )}

        {doneMissions.length > 0 && (
          <div>
            <h2 className="font-semibold text-gray-700 mb-2 text-sm">완료/반려된 미션</h2>
            <div className="space-y-3">
              {doneMissions.map((mission) => (
                <MissionCard key={mission.id} mission={mission} />
              ))}
            </div>
          </div>
        )}
      </div>
      <BottomNav role="child" />
    </div>
  );
}
