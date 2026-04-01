'use client';

import { useEffect, useState } from 'react';
import { onAuthChange } from '@/lib/firebase/auth';
import { getProfile } from '@/lib/firebase/db';
import type { Profile } from '@/types';

export function useProfile() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthChange(async (user) => {
      if (!user) {
        setProfile(null);
        setLoading(false);
        return;
      }
      const data = await getProfile(user.uid);
      setProfile(data);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  return { profile, loading };
}
