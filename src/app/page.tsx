'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthChange } from '@/lib/firebase/auth';
import { getProfile } from '@/lib/firebase/db';

export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    const unsub = onAuthChange(async (user) => {
      if (!user) {
        router.push('/login');
        return;
      }
      const profile = await getProfile(user.uid);
      if (!profile || !profile.familyId) {
        router.push('/onboarding');
        return;
      }
      router.push(profile.role === 'parent' ? '/parent' : '/child');
    });
    return () => unsub();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-orange-50">
      <p className="text-gray-400 text-sm">로딩 중...</p>
    </div>
  );
}
