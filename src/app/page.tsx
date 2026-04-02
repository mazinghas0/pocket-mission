'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { onAuthChange } from '@/lib/firebase/auth';
import { getProfile } from '@/lib/firebase/db';

export default function RootPage() {
  const router = useRouter();
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    const unsub = onAuthChange(async (user) => {
      if (!user) {
        setAuthChecked(true);
        return;
      }
      const profile = await getProfile(user.uid);
      if (!profile || !profile.familyId) {
        router.replace('/onboarding');
        return;
      }
      router.replace(profile.role === 'parent' ? '/parent' : '/child');
    });
    return () => unsub();
  }, [router]);

  if (!authChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-orange-50">
        <p className="text-gray-400 text-sm">로딩 중...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* 헤더 */}
      <header className="px-5 py-4 flex items-center justify-between max-w-lg mx-auto">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🎯</span>
          <span className="font-bold text-gray-800 text-lg">포켓미션</span>
        </div>
        <Link
          href="/login"
          className="text-sm font-medium text-orange-500 border border-orange-300 rounded-full px-4 py-1.5 hover:bg-orange-50 transition-colors"
        >
          로그인
        </Link>
      </header>

      {/* 히어로 */}
      <section className="bg-gradient-to-b from-orange-50 to-white px-5 pt-10 pb-16 text-center max-w-lg mx-auto">
        <div className="text-5xl mb-5">🎯</div>
        <h1 className="text-3xl font-extrabold text-gray-900 leading-tight mb-4">
          미션을 완료하고<br />용돈을 받아요
        </h1>
        <p className="text-gray-500 text-base leading-relaxed mb-8">
          부모님이 미션을 만들면<br />
          아이가 사진으로 인증하고 포인트를 모아요.<br />
          용돈이 아니라 <span className="text-orange-500 font-semibold">습관</span>을 선물하세요.
        </p>
        <Link
          href="/register"
          className="block w-full bg-orange-500 hover:bg-orange-600 text-white font-bold text-base py-4 rounded-2xl transition-colors shadow-md shadow-orange-200"
        >
          무료로 시작하기
        </Link>
        <p className="text-xs text-gray-400 mt-3">
          가입 무료 · 신용카드 불필요
        </p>
      </section>

      {/* 기능 소개 */}
      <section className="px-5 py-12 max-w-lg mx-auto">
        <h2 className="text-xl font-bold text-gray-800 text-center mb-8">이렇게 사용해요</h2>
        <div className="space-y-4">
          <div className="flex items-start gap-4 bg-orange-50 rounded-2xl p-5">
            <div className="text-3xl mt-0.5">📋</div>
            <div>
              <p className="font-bold text-gray-800 mb-1">부모님이 미션을 만들어요</p>
              <p className="text-sm text-gray-500">방 청소, 독서 30분, 영어 단어 암기 등<br />다양한 미션을 직접 만들거나 템플릿에서 골라요</p>
            </div>
          </div>
          <div className="flex items-start gap-4 bg-purple-50 rounded-2xl p-5">
            <div className="text-3xl mt-0.5">📷</div>
            <div>
              <p className="font-bold text-gray-800 mb-1">아이가 사진으로 인증해요</p>
              <p className="text-sm text-gray-500">미션을 완료하면 사진을 찍어 제출해요.<br />직접 한 일을 눈으로 확인할 수 있어요</p>
            </div>
          </div>
          <div className="flex items-start gap-4 bg-green-50 rounded-2xl p-5">
            <div className="text-3xl mt-0.5">⭐</div>
            <div>
              <p className="font-bold text-gray-800 mb-1">포인트를 모아 용돈으로 받아요</p>
              <p className="text-sm text-gray-500">부모님이 승인하면 포인트가 쌓여요.<br />가족이 정한 환율로 실제 용돈이 됩니다</p>
            </div>
          </div>
        </div>
      </section>

      {/* 레벨 시스템 */}
      <section className="px-5 py-10 bg-orange-50 max-w-lg mx-auto rounded-3xl mx-4 mb-8">
        <div className="text-center">
          <p className="text-2xl mb-3">🏆</p>
          <h2 className="text-lg font-bold text-gray-800 mb-2">미션을 쌓을수록 레벨이 올라요</h2>
          <p className="text-sm text-gray-500 mb-5">새싹 → 도전자 → 습관왕 → 미션마스터 → 포켓히어로</p>
          <div className="flex justify-center gap-2 text-2xl">
            <span>🌱</span>
            <span>⚡</span>
            <span>👑</span>
            <span>🎯</span>
            <span>🦸</span>
          </div>
        </div>
      </section>

      {/* 최종 CTA */}
      <section className="px-5 py-14 text-center max-w-lg mx-auto">
        <h2 className="text-xl font-bold text-gray-800 mb-2">오늘부터 시작해보세요</h2>
        <p className="text-sm text-gray-400 mb-6">가족 모두 무료로 사용할 수 있어요</p>
        <Link
          href="/register"
          className="block w-full bg-orange-500 hover:bg-orange-600 text-white font-bold text-base py-4 rounded-2xl transition-colors"
        >
          무료로 시작하기
        </Link>
        <Link
          href="/login"
          className="block w-full mt-3 text-gray-500 font-medium text-sm py-3 rounded-2xl border border-gray-200 hover:bg-gray-50 transition-colors"
        >
          이미 계정이 있어요
        </Link>
      </section>

      {/* 푸터 */}
      <footer className="px-5 py-6 border-t border-gray-100 text-center">
        <p className="text-xs text-gray-300">© 2025 PocketMission. Kevin AI Corp.</p>
      </footer>
    </div>
  );
}
