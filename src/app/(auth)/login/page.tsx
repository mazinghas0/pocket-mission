'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { signIn, resetPassword } from '@/lib/firebase/auth';
import { getProfile, getFamilyByInviteCode, updateProfile } from '@/lib/firebase/db';

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-orange-50"><p className="text-gray-400 text-sm">로딩 중...</p></div>}>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const inviteCode = searchParams.get('invite');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resetSent, setResetSent] = useState(false);

  async function handleResetPassword() {
    if (!email.trim()) {
      setError('이메일을 먼저 입력해주세요.');
      return;
    }
    try {
      await resetPassword(email);
      setResetSent(true);
      setError('');
    } catch {
      setError('비밀번호 재설정 메일 발송에 실패했습니다.');
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    let user;
    try {
      const credential = await signIn(email, password);
      user = credential.user;
    } catch {
      setError('이메일 또는 비밀번호가 올바르지 않습니다.');
      setLoading(false);
      return;
    }

    if (inviteCode) {
      try {
        const profile = await getProfile(user.uid);
        if (profile && !profile.familyId) {
          const family = await getFamilyByInviteCode(inviteCode.toUpperCase());
          if (family) {
            await updateProfile(user.uid, { familyId: family.id });
          }
        }
      } catch {
        // 초대코드 합류 실패 시 무시
      }
    }

    router.replace('/');
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-gradient-to-b from-orange-50 to-orange-100">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🎯</div>
          <h1 className="text-2xl font-bold text-orange-600">PocketMission</h1>
          <p className="text-gray-500 mt-1 text-sm">미션을 완료하고 용돈을 받아요!</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">로그인</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">이메일</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="example@email.com"
                required
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">비밀번호</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="비밀번호를 입력하세요"
                required
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
            </div>

            <div className="text-right">
              <button
                type="button"
                onClick={handleResetPassword}
                className="text-xs text-gray-400 hover:text-orange-500 transition-colors"
              >
                비밀번호를 잊으셨나요?
              </button>
            </div>

            {resetSent && (
              <p className="text-green-600 text-sm bg-green-50 rounded-lg px-3 py-2">
                비밀번호 재설정 메일을 보냈습니다. 이메일을 확인해주세요.
              </p>
            )}

            {error && (
              <p className="text-red-500 text-sm bg-red-50 rounded-lg px-3 py-2">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white font-semibold py-3 rounded-xl transition-colors"
            >
              {loading ? '로그인 중...' : '로그인'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-4">
            계정이 없으신가요?{' '}
            <Link href="/register" className="text-orange-500 font-medium">
              회원가입
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
