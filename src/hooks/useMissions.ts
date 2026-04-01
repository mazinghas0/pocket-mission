'use client';

import { useEffect, useState } from 'react';
import { onAuthChange } from '@/lib/firebase/auth';
import { getProfile, subscribeToFamilyMissions } from '@/lib/firebase/db';
import type { Mission } from '@/types';

export function useMissions() {
  const [missions, setMissions] = useState<Mission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let unsubMissions: (() => void) | null = null;

    const unsubAuth = onAuthChange(async (user) => {
      if (!user) {
        setMissions([]);
        setLoading(false);
        return;
      }

      try {
        const profile = await getProfile(user.uid);
        if (!profile?.familyId) {
          setMissions([]);
          setLoading(false);
          return;
        }

        unsubMissions = subscribeToFamilyMissions(profile.familyId, (data) => {
          const filtered = profile.role === 'child'
            ? data.filter(m => m.assignedTo === user.uid || m.assignedTo === null)
            : data;
          setMissions(filtered);
          setLoading(false);
        });
      } catch {
        setError('미션을 불러오지 못했습니다.');
        setLoading(false);
      }
    });

    return () => {
      unsubAuth();
      unsubMissions?.();
    };
  }, []);

  return { missions, loading, error };
}
