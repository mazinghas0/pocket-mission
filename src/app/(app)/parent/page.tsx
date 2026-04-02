'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { onAuthChange, signOut } from '@/lib/firebase/auth';
import { getProfile, getFamily, getFamilyMembers, subscribeToPendingSubmissions } from '@/lib/firebase/db';
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

      unsubMissions = subscribeToPendingSubmissions(p.familyId, (missions) => {
        setPendingCount(missions.length);
      });
    });

    return () => { unsubAuth(); unsubMissions?.(); };
  }, [router]);

  if (pageLoading) {
    return (
      <div className="min-h-screen bg-quest-cream flex items-center justify-center">
        <p className="text-gray-400 text-sm">불러오는 중...</p>
      </div>
    );
  }

  const children = members.filter(m => m.role === 'child');

  return (
    <div className="min-h-screen bg-quest-cream pb-20">
      {/* 헤더 */}
      <div className="relative bg-gradient-to-br from-quest-coral to-orange-500 px-4 pt-12 pb-6 text-white overflow-hidden">
        <div className="quest-dots absolute inset-0 pointer-events-none" />
        <div className="flex items-start justify-between mb-3">
          <div>
            <p className="text-orange-100 text-xs font-medium tracking-wide uppercase">Quest Master</p>
            <h1 className="text-2xl font-black mt-0.5">{profile?.name} 님</h1>
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
          <div className="flex items-center gap-2">
            <span className="bg-white/15 rounded-lg px-3 py-1 text-sm font-semibold">{family.name}</span>
            <button
              onClick={handleCopyInviteCode}
              className="bg-white/20 hover:bg-white/30 rounded-lg px-3 py-1 text-xs font-medium transition-colors"
            >
              {copied ? '✓ 복사됨' : '초대 링크'}
            </button>
            {family.subscriptionStatus === 'premium' && (
              <span className="bg-quest-gold text-white rounded-full px-2 py-0.5 text-xs font-black">
                PRO
              </span>
            )}
          </div>
        )}
      </div>

      <div className="px-4 -mt-3 space-y-3">
        {/* 승인 대기 배너 */}
        {pendingCount > 0 && (
          <Link href="/parent/approvals">
            <div className="bg-quest-coral rounded-2xl p-4 shadow-quest-coral text-white flex items-center justify-between quest-card-press">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center text-lg">✅</div>
                <div>
                  <p className="font-black text-sm">인증 승인 대기</p>
                  <p className="text-orange-100 text-xs mt-0.5">자녀들이 기다리고 있어요</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="bg-white text-quest-coral font-black text-lg w-8 h-8 rounded-full flex items-center justify-center">
                  {pendingCount}
                </span>
                <span className="text-white/60 text-sm">→</span>
              </div>
            </div>
          </Link>
        )}

        {/* 액션 카드 그리드 */}
        <div className="grid grid-cols-2 gap-3">
          <Link href="/parent/approvals" className="block">
            <div className="bg-white rounded-2xl shadow-quest p-4 quest-card-press min-h-[110px] flex flex-col items-center justify-center text-center">
              <div className="text-3xl mb-2">✅</div>
              <p className="text-sm font-bold text-quest-navy">인증 승인</p>
              <p className="text-xs text-gray-400 mt-0.5">
                {pendingCount > 0
                  ? <span className="text-quest-coral font-semibold">{pendingCount}건 대기중</span>
                  : '모두 처리됨'}
              </p>
            </div>
          </Link>

          <Link href="/parent/missions/new" className="block">
            <div className="bg-quest-coral-light border border-quest-coral/20 rounded-2xl shadow-quest p-4 quest-card-press min-h-[110px] flex flex-col items-center justify-center text-center">
              <div className="text-3xl mb-2">⚔️</div>
              <p className="text-sm font-bold text-quest-coral">미션 만들기</p>
              <p className="text-xs text-quest-coral/60 mt-0.5">새 퀘스트 추가</p>
            </div>
          </Link>

          <Link href="/parent/missions" className="block">
            <div className="bg-white rounded-2xl shadow-quest p-4 quest-card-press min-h-[110px] flex flex-col items-center justify-center text-center">
              <div className="text-3xl mb-2">📋</div>
              <p className="text-sm font-bold text-quest-navy">미션 목록</p>
              <p className="text-xs text-gray-400 mt-0.5">전체 현황</p>
            </div>
          </Link>

          <Link href="/parent/wallet" className="block">
            <div className="bg-quest-gold-light border border-quest-gold/20 rounded-2xl shadow-quest p-4 quest-card-press min-h-[110px] flex flex-col items-center justify-center text-center">
              <div className="text-3xl mb-2">💰</div>
              <p className="text-sm font-bold text-quest-navy">용돈 현황</p>
              <p className="text-xs text-gray-400 mt-0.5">자녀 포인트</p>
            </div>
          </Link>
        </div>

        {/* 자녀 현황 */}
        {children.length > 0 && (
          <div className="bg-white rounded-2xl shadow-quest p-4">
            <h2 className="font-black text-quest-navy mb-3 text-sm">우리 자녀 현황</h2>
            <div className="space-y-3">
              {children.map((child) => (
                <div key={child.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-quest-purple/10 flex items-center justify-center text-sm">👧</div>
                    <div>
                      <span className="text-sm font-semibold text-quest-navy">{child.name}</span>
                      <div className="mt-0.5">
                        <LevelBadge points={child.points} compact />
                      </div>
                    </div>
                  </div>
                  <span className="font-black text-quest-gold text-sm">
                    ★ {formatPoints(child.points)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {family?.subscriptionStatus === 'free' && (
          <button
            onClick={() => router.push('/parent/wallet')}
            className="w-full text-center text-xs text-gray-400 hover:text-quest-purple py-2 transition-colors"
          >
            프리미엄 업그레이드로 미션 무제한 사용하기 →
          </button>
        )}
      </div>
      <BottomNav role="parent" />
    </div>
  );
}
