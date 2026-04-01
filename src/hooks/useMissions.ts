'use client';

import { useEffect, useState } from 'react';
import { onAuthChange } from '@/lib/firebase/auth';
import { getProfile, subscribeChildAssignments } from '@/lib/firebase/db';
import type { MissionAssignment } from '@/types';

export function useMissions() {
  const [missions, setMissions] = useState<MissionAssignment[]>([]);
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

        unsubMissions = subscribeChildAssignments(user.uid, profile.familyId, (data) => {
          setMissions(data);
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
