'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useMissions } from '@/hooks/useMissions';
import { MissionCard } from '@/components/missions/missionCard';
import type { MissionAssignment } from '@/types';
import { BottomNav } from '@/components/ui/bottomNav';

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
    <div className="min-h-screen bg-quest-cream pb-20">
      <div className="bg-white px-4 pt-12 pb-4 shadow-quest">
        <Link href="/child" className="text-gray-400 text-sm block mb-1">← 뒤로</Link>
        <h1 className="font-black text-quest-navy text-lg">내 퀘스트</h1>
      </div>

      <div className="px-4 mt-4 space-y-6">
        {loading && (
          <p className="text-center text-gray-400 py-10 text-sm">퀘스트 불러오는 중...</p>
        )}

        {error && (
          <p className="text-red-500 text-sm text-center">{error}</p>
        )}

        {!loading && missions.length === 0 && (
          <div className="text-center py-16 text-gray-400">
            <div className="text-5xl mb-3">🎯</div>
            <p className="text-sm font-semibold text-gray-500">아직 퀘스트가 없어요</p>
            <p className="text-xs mt-1">부모님이 미션을 배정해주실 거예요!</p>
          </div>
        )}

        {activeMissions.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="w-1.5 h-1.5 rounded-full bg-quest-coral" />
              <h2 className="font-bold text-quest-navy text-sm">진행 중인 퀘스트</h2>
              <span className="ml-auto text-xs font-black text-quest-coral">{activeMissions.length}개</span>
            </div>
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
            <div className="flex items-center gap-2 mb-2">
              <span className="w-1.5 h-1.5 rounded-full bg-quest-gold" />
              <h2 className="font-bold text-quest-navy text-sm">승인 대기 중</h2>
              <span className="ml-auto text-xs font-black text-quest-gold">{submittedMissions.length}개</span>
            </div>
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
            <div className="flex items-center gap-2 mb-2">
              <span className="w-1.5 h-1.5 rounded-full bg-gray-300" />
              <h2 className="font-bold text-gray-500 text-sm">완료 / 반려된 퀘스트</h2>
            </div>
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
