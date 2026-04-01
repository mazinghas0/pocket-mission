'use client';

export const runtime = 'edge';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { onAuthChange } from '@/lib/firebase/auth';
import { getProfile, getFamilyByInviteCode, updateProfile } from '@/lib/firebase/db';
import type { Family } from '@/types';

export default function InvitePage() {
  const router = useRouter();
  const { code } = useParams<{ code: string }>();
  const [family, setFamily] = useState<Family | null>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    getFamilyByInviteCode(code.toUpperCase()).then((fam) => {
      setFamily(fam);
      setLoading(false);
    });

    const unsub = onAuthChange((user) => {
      setIsLoggedIn(!!user);
      setUserId(user?.uid ?? null);
    });
    return () => unsub();
  }, [code]);

  async function handleJoin() {
    if (!family || !userId) return;
    setJoining(true);
    setError('');
    try {
      const profile = await getProfile(userId);
      if (profile?.familyId) {
        setError('이미 가족에 가입되어 있습니다.');
        setJoining(false);
        return;
      }
      await updateProfile(userId, { familyId: family.id });
      router.replace(profile?.role === 'parent' ? '/parent' : '/child');
    } catch {
      setError('가족 참여에 실패했습니다.');
      setJoining(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-orange-50">
        <p className="text-gray-400 text-sm">초대 정보 확인 중...</p>
      </div>
    );
  }

  if (!family) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-orange-50">
        <div className="text-5xl mb-4">😥</div>
        <h1 className="text-lg font-bold text-gray-800">유효하지 않은 초대 링크</h1>
        <p className="text-sm text-gray-500 mt-2">초대 코드가 올바르지 않거나 만료되었습니다.</p>
        <Link href="/login" className="mt-6 text-orange-500 font-semibold text-sm">
          로그인 페이지로 →
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-gradient-to-b from-orange-50 to-orange-100">
      <div className="w-full max-w-sm text-center">
        <div className="text-5xl mb-4">👨‍👩‍👧‍👦</div>
        <h1 className="text-xl font-bold text-gray-800">가족 초대</h1>
        <p className="text-gray-500 mt-2">
          <span className="font-semibold text-orange-600">{family.name}</span>에서 초대했습니다
        </p>

        <div className="bg-white rounded-2xl shadow-sm p-6 mt-6 space-y-4">
          {isLoggedIn ? (
            <>
              <p className="text-sm text-gray-600">바로 가족에 참여할 수 있습니다</p>
              {error && (
                <p className="text-red-500 text-sm bg-red-50 rounded-lg px-3 py-2">{error}</p>
              )}
              <button
                onClick={handleJoin}
                disabled={joining}
                className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white font-semibold py-3 rounded-xl transition-colors"
              >
                {joining ? '참여 중...' : `${family.name}에 참여하기`}
              </button>
            </>
          ) : (
            <>
              <p className="text-sm text-gray-600">가족에 참여하려면 먼저 계정이 필요해요</p>
              <Link
                href={`/register?invite=${code}`}
                className="block w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 rounded-xl transition-colors text-center"
              >
                회원가입 후 참여하기
              </Link>
              <Link
                href={`/login?invite=${code}`}
                className="block text-sm text-gray-500 hover:text-orange-500 transition-colors"
              >
                이미 계정이 있으신가요? 로그인
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
