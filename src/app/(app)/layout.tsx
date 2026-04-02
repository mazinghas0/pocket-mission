'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthChange } from '@/lib/firebase/auth';
import { saveFcmToken } from '@/lib/firebase/db';
import { requestFcmToken, setupForegroundNotifications } from '@/lib/firebase/messaging';
import { IosInstallBanner } from '@/components/ui/iosInstallBanner';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    let unsubForeground: (() => void) | null = null;

    const unsub = onAuthChange(async (user) => {
      if (!user) {
        router.replace('/login');
        setChecked(true);
        return;
      }
      setChecked(true);
      const token = await requestFcmToken();
      if (token) {
        await saveFcmToken(user.uid, token).catch(() => {});
        unsubForeground = setupForegroundNotifications();
      }
    });

    return () => { unsub(); unsubForeground?.(); };
  }, [router]);

  if (!checked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-orange-50">
        <p className="text-gray-400 text-sm">로딩 중...</p>
      </div>
    );
  }

  return (
    <>
      {children}
      <IosInstallBanner />
    </>
  );
}
