'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { nanoid } from 'nanoid';
import { getCurrentUser, signOut } from '@/lib/firebase/auth';
import { createFamily, getFamilyByInviteCode, getProfile, updateProfile, createAssignmentsForNewChild } from '@/lib/firebase/db';

type Step = 'choice' | 'create' | 'join';

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('choice');
  const [familyName, setFamilyName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const user = getCurrentUser();
      if (!user) throw new Error('로그인이 필요합니다.');

      const code = nanoid(6).toUpperCase();
      const familyId = await createFamily({
        name: familyName,
        inviteCode: code,
        subscriptionStatus: 'free',
        pointRate: 1,
      });

      await updateProfile(user.uid, { familyId });
      router.replace('/parent');
    } catch (err) {
      setError(err instanceof Error ? err.message : '가족 생성에 실패했습니다.');
      setLoading(false);
    }
  }

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const user = getCurrentUser();
      if (!user) throw new Error('로그인이 필요합니다.');

      const family = await getFamilyByInviteCode(inviteCode.toUpperCase());
      if (!family) throw new Error('초대코드가 올바르지 않습니다.');

      const profile = await getProfile(user.uid);
      await updateProfile(user.uid, { familyId: family.id });

      if (profile?.role === 'child') {
        try {
          await createAssignmentsForNewChild(family.id, user.uid);
        } catch (err) {
          console.error('[Onboarding] 미션 자동 배정 실패:', err);
        }
      }

      router.replace(profile?.role === 'parent' ? '/parent' : '/child');
    } catch (err) {
      setError(err instanceof Error ? err.message : '가족 참여에 실패했습니다.');
      setLoading(false);
    }
  }

  if (step === 'choice') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-gradient-to-b from-orange-50 to-orange-100">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <div className="text-5xl mb-3">👨‍👩‍👧‍👦</div>
            <h1 className="text-xl font-bold text-gray-800">가족 설정</h1>
            <p className="text-gray-500 mt-1 text-sm">어떻게 시작하시겠어요?</p>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => setStep('create')}
              className="w-full bg-white border-2 border-orange-300 rounded-2xl p-5 text-left hover:border-orange-500 transition-colors"
            >
              <div className="text-2xl mb-2">🏠</div>
              <p className="font-semibold text-gray-800">새 가족 만들기</p>
              <p className="text-sm text-gray-500 mt-1">부모님이라면 여기서 시작하세요</p>
            </button>

            <button
              onClick={() => setStep('join')}
              className="w-full bg-white border-2 border-purple-300 rounded-2xl p-5 text-left hover:border-purple-500 transition-colors"
            >
              <div className="text-2xl mb-2">🔑</div>
              <p className="font-semibold text-gray-800">초대코드로 참여</p>
              <p className="text-sm text-gray-500 mt-1">부모님께 받은 코드가 있다면</p>
            </button>

            <button
              onClick={async () => { await signOut(); router.replace('/login'); }}
              className="w-full text-center text-sm text-gray-400 hover:text-red-500 py-3 transition-colors"
            >
              로그아웃
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'create') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-gradient-to-b from-orange-50 to-orange-100">
        <div className="w-full max-w-sm">
          <button onClick={() => setStep('choice')} className="text-gray-500 text-sm mb-6">
            ← 돌아가기
          </button>

          <div className="bg-white rounded-2xl shadow-sm p-6">
            <div className="text-3xl mb-3">🏠</div>
            <h2 className="text-lg font-semibold text-gray-800 mb-1">새 가족 만들기</h2>
            <p className="text-sm text-gray-500 mb-4">가족 이름을 정해주세요</p>

            <form onSubmit={handleCreate} className="space-y-4">
              <input
                type="text"
                value={familyName}
                onChange={(e) => setFamilyName(e.target.value)}
                placeholder="예: 김씨네 가족"
                required
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
              />

              {error && (
                <p className="text-red-500 text-sm bg-red-50 rounded-lg px-3 py-2">{error}</p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white font-semibold py-3 rounded-xl transition-colors"
              >
                {loading ? '생성 중...' : '가족 만들기'}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-gradient-to-b from-orange-50 to-orange-100">
      <div className="w-full max-w-sm">
        <button onClick={() => setStep('choice')} className="text-gray-500 text-sm mb-6">
          ← 돌아가기
        </button>

        <div className="bg-white rounded-2xl shadow-sm p-6">
          <div className="text-3xl mb-3">🔑</div>
          <h2 className="text-lg font-semibold text-gray-800 mb-1">초대코드로 참여</h2>
          <p className="text-sm text-gray-500 mb-4">부모님께 받은 6자리 코드를 입력하세요</p>

          <form onSubmit={handleJoin} className="space-y-4">
            <input
              type="text"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
              placeholder="예: ABC123"
              maxLength={6}
              required
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-center text-lg font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-purple-400 uppercase"
            />

            {error && (
              <p className="text-red-500 text-sm bg-red-50 rounded-lg px-3 py-2">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-purple-500 hover:bg-purple-600 disabled:bg-purple-300 text-white font-semibold py-3 rounded-xl transition-colors"
            >
              {loading ? '참여 중...' : '가족 참여'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
