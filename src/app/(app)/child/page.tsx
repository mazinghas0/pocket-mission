'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { onAuthChange, signOut } from '@/lib/firebase/auth';
import { getProfile, getFamily, getFamilyMembers, subscribeToFamilyMissions } from '@/lib/firebase/db';
import { LevelBadge } from '@/components/ui/levelBadge';
import { BottomNav } from '@/components/ui/bottomNav';
import { formatPoints } from '@/lib/utils';
import type { Profile, Mission } from '@/types';

export default function ChildDashboard() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [missions, setMissions] = useState<Mission[]>([]);
  const [familyMembers, setFamilyMembers] = useState<Profile[]>([]);
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
      const [fam, mbrs] = await Promise.all([
        getFamily(p.familyId),
        getFamilyMembers(p.familyId),
      ]);
      if (fam) setPointRate(fam.pointRate ?? 1);
      setFamilyMembers(mbrs);
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
      <div className="min-h-screen bg-quest-cream flex items-center justify-center">
        <p className="text-gray-400 text-sm">불러오는 중...</p>
      </div>
    );
  }

  const points = profile?.points ?? 0;
  const wonValue = points * pointRate;

  return (
    <div className="min-h-screen bg-quest-cream pb-20">
      {/* 헤더 */}
      <div className="relative bg-gradient-to-br from-quest-purple to-purple-700 px-4 pt-12 pb-6 text-white overflow-hidden">
        <div className="quest-dots absolute inset-0 pointer-events-none" />
        <div className="flex items-start justify-between">
          <div>
            <p className="text-purple-200 text-xs font-medium tracking-wide uppercase">Quest Hero</p>
            <h1 className="text-2xl font-black mt-0.5">{profile?.name} 님!</h1>
            <p className="text-purple-200 text-xs mt-1">오늘도 퀘스트를 완료해 보세요</p>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/settings" className="text-purple-300 hover:text-white text-xs transition-colors">
              설정
            </Link>
            <button
              onClick={async () => { await signOut(); router.replace('/login'); }}
              className="text-purple-300 hover:text-white text-xs transition-colors"
            >
              로그아웃
            </button>
          </div>
        </div>

        {/* 포인트 배지 */}
        <div className="mt-4 bg-white/15 rounded-2xl px-4 py-3 flex items-center justify-between backdrop-blur-sm">
          <div>
            <p className="text-purple-200 text-xs">내 포인트</p>
            <p className="text-white font-black text-xl mt-0.5">
              <span className="text-quest-gold">★</span> {formatPoints(points)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-purple-200 text-xs">용돈으로</p>
            <p className="text-white font-bold text-sm">{wonValue.toLocaleString('ko-KR')}원</p>
          </div>
        </div>
      </div>

      <div className="px-4 -mt-3 space-y-3">
        {/* 레벨 뱃지 */}
        <LevelBadge points={points} />

        {/* 퀘스트 현황 */}
        <div className="grid grid-cols-2 gap-3">
          <Link href="/child/missions" className="block">
            <div className="bg-white rounded-2xl shadow-quest p-4 quest-card-press text-center min-h-[90px] flex flex-col items-center justify-center">
              <p className="text-3xl font-black text-quest-purple">{activeMissionsCount}</p>
              <p className="text-xs font-semibold text-gray-600 mt-1">진행 중인 퀘스트</p>
            </div>
          </Link>

          <div className="bg-white rounded-2xl shadow-quest p-4 text-center min-h-[90px] flex flex-col items-center justify-center">
            <p className="text-3xl font-black text-quest-gold">{submittedCount}</p>
            <p className="text-xs font-semibold text-gray-600 mt-1">승인 대기 중</p>
          </div>
        </div>

        {/* 퀵 액션 */}
        <div className="grid grid-cols-2 gap-3">
          <Link href="/child/missions" className="block">
            <div className="bg-quest-purple-light border border-quest-purple/20 rounded-2xl shadow-quest p-4 quest-card-press text-center min-h-[90px] flex flex-col items-center justify-center">
              <div className="text-3xl mb-2">⚔️</div>
              <p className="text-sm font-bold text-quest-purple">내 퀘스트</p>
            </div>
          </Link>

          <Link href="/child/wallet" className="block">
            <div className="bg-quest-gold-light border border-quest-gold/20 rounded-2xl shadow-quest p-4 quest-card-press text-center min-h-[90px] flex flex-col items-center justify-center">
              <div className="text-3xl mb-2">💰</div>
              <p className="text-sm font-bold text-quest-navy">내 지갑</p>
            </div>
          </Link>
        </div>

        {/* 가족 구성원 */}
        {familyMembers.length > 0 && (
          <div className="bg-white rounded-2xl shadow-quest p-4">
            <h2 className="font-black text-quest-navy mb-3 text-sm">우리 가족</h2>
            <div className="space-y-3">
              {familyMembers.map((member) => (
                <div key={member.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center text-sm">
                      {member.role === 'parent' ? '👨' : '👧'}
                    </div>
                    <div>
                      <span className="text-sm font-semibold text-quest-navy">
                        {member.name}
                        {member.id === profile?.id && (
                          <span className="text-xs text-quest-purple ml-1">(나)</span>
                        )}
                      </span>
                      <div className="mt-0.5">
                        <LevelBadge points={member.points} compact />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      <BottomNav role="child" />
    </div>
  );
}
