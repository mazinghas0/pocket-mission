'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { onAuthChange, signOut } from '@/lib/firebase/auth';
import { getProfile, getFamily, getFamilyMembers, subscribeToPendingAssignmentCount } from '@/lib/firebase/db';
import { Card } from '@/components/ui/card';
import { LevelBadge } from '@/components/ui/levelBadge';
import { BottomNav } from '@/components/ui/bottomNav';
import { formatPoints } from '@/lib/utils';
import type { Profile, Family } from '@/types';

export default function ParentDashboard() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [family, setFamily] = useState<Family | null>(null);
  const [members, setMembers] = useState<Profile[]>([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  async function handleCopyInviteCode() {
    if (!family) return;
    const url = `${window.location.origin}/invite/${family.inviteCode}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleLogout() {
    await signOut();
    router.replace('/login');
  }

  const [pageLoading, setPageLoading] = useState(true);

  useEffect(() => {
    let unsubMissions: (() => void) | null = null;

    const unsubAuth = onAuthChange(async (user) => {
      if (!user) { router.replace('/login'); return; }

      const p = await getProfile(user.uid);
      if (!p?.familyId) { router.replace('/onboarding'); return; }
      if (p.role !== 'parent') { router.replace('/child'); return; }

      setProfile(p);

      const [fam, members] = await Promise.all([
        getFamily(p.familyId),
        getFamilyMembers(p.familyId),
      ]);
      setFamily(fam);
      setMembers(members);
      setPageLoading(false);

      unsubMissions = subscribeToPendingAssignmentCount(p.familyId, (count) => {
        setPendingCount(count);
      });
    });

    return () => { unsubAuth(); unsubMissions?.(); };
  }, [router]);

  if (pageLoading) {
    return (
      <div className="min-h-screen bg-orange-50 flex items-center justify-center">
        <p className="text-gray-400 text-sm">불러오는 중...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-orange-50 pb-20">
      <div className="bg-gradient-to-br from-orange-500 to-orange-600 px-4 pt-12 pb-8 text-white">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-orange-100 text-sm">안녕하세요,</p>
            <h1 className="text-2xl font-bold mt-1">{profile?.name} 님</h1>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/settings" className="text-orange-200 hover:text-white text-xs transition-colors">
              설정
            </Link>
            <button
              onClick={handleLogout}
              className="text-orange-200 hover:text-white text-xs transition-colors"
            >
              로그아웃
            </button>
          </div>
        </div>
        {family && (
          <div className="flex items-center gap-2 mt-3">
            <span className="text-orange-100 text-sm">{family.name}</span>
            <button
              onClick={handleCopyInviteCode}
              className="bg-white/20 hover:bg-white/30 rounded-lg px-2 py-0.5 text-xs font-mono transition-colors"
            >
              {copied ? '링크 복사됨!' : `초대 링크 복사`}
            </button>
            {family.subscriptionStatus === 'premium' && (
              <span className="bg-yellow-300 text-yellow-900 rounded-full px-2 py-0.5 text-xs font-semibold">
                프리미엄
              </span>
            )}
          </div>
        )}
      </div>

      <div className="px-4 -mt-4 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Link href="/parent/approvals">
            <Card className="text-center py-5 hover:shadow-md transition-shadow relative">
              {pendingCount > 0 && (
                <span className="absolute top-3 right-3 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {pendingCount}
                </span>
              )}
              <div className="text-3xl mb-1">✅</div>
              <p className="text-sm font-semibold text-gray-700">인증 승인</p>
              <p className="text-xs text-gray-400 mt-0.5">
                {pendingCount > 0 ? `${pendingCount}건 대기중` : '대기 없음'}
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

        {members.length > 0 && (
          <Card>
            <h2 className="font-semibold text-gray-800 mb-3">가족 구성원</h2>
            <div className="space-y-3">
              {members.map((member) => (
                <div key={member.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{member.role === 'parent' ? '👨' : '👧'}</span>
                    <div>
                      <span className="text-sm text-gray-700">{member.name}</span>
                      <span className="text-xs text-gray-400 ml-1">
                        {member.role === 'parent' ? '부모' : '자녀'}
                      </span>
                    </div>
                    <LevelBadge points={member.points} compact />
                  </div>
                  {member.role === 'child' && (
                    <span className="font-bold text-orange-600 text-sm">
                      {formatPoints(member.points)}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </Card>
        )}


      </div>
      <BottomNav role="parent" />
    </div>
  );
}
