'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthChange, signOut } from '@/lib/firebase/auth';
import { getProfile, updateProfile, getFamily, updateFamily, regenerateInviteCode } from '@/lib/firebase/db';
import { Card } from '@/components/ui/card';
import { LevelBadge } from '@/components/ui/levelBadge';
import { BottomNav } from '@/components/ui/bottomNav';
import { formatPoints } from '@/lib/utils';
import type { Profile, Family } from '@/types';

export default function SettingsPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [family, setFamily] = useState<Family | null>(null);
  const [name, setName] = useState('');
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthChange(async (user) => {
      if (!user) { router.replace('/login'); return; }
      const p = await getProfile(user.uid);
      if (!p) { router.replace('/login'); return; }
      setProfile(p);
      setName(p.name);
      if (p.familyId) {
        const fam = await getFamily(p.familyId);
        setFamily(fam);
      }
      setLoading(false);
    });
    return () => unsub();
  }, [router]);

  async function handleSaveName() {
    if (!profile || !name.trim()) return;
    setSaving(true);
    await updateProfile(profile.id, { name: name.trim() });
    setProfile({ ...profile, name: name.trim() });
    setEditing(false);
    setSaving(false);
  }

  async function handleLogout() {
    await signOut();
    router.replace('/login');
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-orange-50 flex items-center justify-center">
        <p className="text-gray-400 text-sm">불러오는 중...</p>
      </div>
    );
  }

  const backUrl = profile?.role === 'parent' ? '/parent' : '/child';

  return (
    <div className="min-h-screen bg-orange-50 pb-20">
      <div className="bg-white px-4 pt-12 pb-4 shadow-sm">
        <button onClick={() => router.push(backUrl)} className="text-gray-500 text-sm">← 뒤로</button>
        <h1 className="font-bold text-gray-800 text-lg mt-1">설정</h1>
      </div>

      <div className="px-4 mt-4 space-y-4">
        <Card>
          <h2 className="font-semibold text-gray-800 mb-3">내 정보</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">역할</span>
              <span className="text-sm font-medium text-gray-800">
                {profile?.role === 'parent' ? '부모' : '자녀'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">이름</span>
              {editing ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="border border-gray-200 rounded-lg px-2 py-1 text-sm w-24 focus:outline-none focus:ring-2 focus:ring-orange-400"
                  />
                  <button
                    onClick={handleSaveName}
                    disabled={saving}
                    className="text-orange-500 text-sm font-semibold"
                  >
                    {saving ? '...' : '저장'}
                  </button>
                  <button
                    onClick={() => { setEditing(false); setName(profile?.name ?? ''); }}
                    className="text-gray-400 text-sm"
                  >
                    취소
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-800">{profile?.name}</span>
                  <button
                    onClick={() => setEditing(true)}
                    className="text-orange-500 text-xs"
                  >
                    수정
                  </button>
                </div>
              )}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">포인트</span>
              <span className="text-sm font-bold text-orange-600">
                {formatPoints(profile?.points ?? 0)}
              </span>
            </div>
          </div>
        </Card>

        <LevelBadge points={profile?.points ?? 0} />

        {family && (
          <>
            <Card>
              <h2 className="font-semibold text-gray-800 mb-3">가족 정보</h2>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">가족 이름</span>
                  <span className="text-sm font-medium text-gray-800">{family.name}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">초대 코드</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-mono bg-gray-100 px-2 py-0.5 rounded">
                      {family.inviteCode}
                    </span>
                    <button
                      onClick={async () => {
                        const { code, expiresAt } = await regenerateInviteCode(family.id);
                        setFamily({ ...family, inviteCode: code, inviteCodeExpiresAt: expiresAt });
                      }}
                      className="text-xs text-orange-500 hover:text-orange-600 transition-colors"
                    >
                      재발급
                    </button>
                  </div>
                </div>
                {family.inviteCodeExpiresAt && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">초대코드 만료</span>
                    <span className={`text-sm ${family.inviteCodeExpiresAt.toMillis() < Date.now() ? 'text-red-500 font-semibold' : 'text-gray-600'}`}>
                      {family.inviteCodeExpiresAt.toMillis() < Date.now()
                        ? '만료됨'
                        : family.inviteCodeExpiresAt.toDate().toLocaleDateString('ko-KR')}
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">구독</span>
                  <span className="text-sm font-medium text-gray-800">
                    {family.subscriptionStatus === 'premium' ? '프리미엄' : '무료'}
                  </span>
                </div>
              </div>
            </Card>

            {profile?.role === 'parent' && (
              <Card>
                <h2 className="font-semibold text-gray-800 mb-3">포인트 환율 설정</h2>
                <p className="text-xs text-gray-400 mb-3">1포인트를 몇 원으로 환산할지 설정합니다</p>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-600">1P =</span>
                  <select
                    value={family.pointRate}
                    onChange={async (e) => {
                      const rate = Number(e.target.value);
                      await updateFamily(family.id, { pointRate: rate });
                      setFamily({ ...family, pointRate: rate });
                    }}
                    className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                  >
                    <option value={1}>1원</option>
                    <option value={5}>5원</option>
                    <option value={10}>10원</option>
                    <option value={50}>50원</option>
                    <option value={100}>100원</option>
                  </select>
                </div>
                <p className="text-xs text-gray-400 mt-2">
                  예: 미션 30P = {(30 * (family.pointRate ?? 1)).toLocaleString('ko-KR')}원
                </p>
              </Card>
            )}
          </>
        )}

        <Card>
          <h2 className="font-semibold text-gray-800 mb-3">의견 보내기</h2>
          <p className="text-xs text-gray-400 mb-3">
            앱을 사용하면서 불편한 점이나 추가했으면 하는 기능이 있으면 알려주세요
          </p>
          <a
            href="mailto:mazinghas0@email.com?subject=PocketMission%20피드백&body=안녕하세요!%0A%0A[의견 종류] 불편한 점 / 추가 기능 요청 / 칭찬%0A%0A[내용]%0A여기에 작성해주세요"
            className="block w-full text-center bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 rounded-xl transition-colors text-sm"
          >
            이메일로 의견 보내기
          </a>
        </Card>

        <div className="text-center text-xs text-gray-300 py-2">
          PocketMission v0.1.0 · Kevin AI Corp
        </div>

        <button
          onClick={handleLogout}
          className="w-full bg-white border border-red-200 text-red-500 font-semibold py-3 rounded-xl hover:bg-red-50 transition-colors"
        >
          로그아웃
        </button>
      </div>
      <BottomNav role={profile?.role === 'parent' ? 'parent' : 'child'} />
    </div>
  );
}
