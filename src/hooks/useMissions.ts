'use client';

import { useEffect, useState, useCallback } from 'react';
import type { Mission } from '@/types';

export function useMissions() {
  const [missions, setMissions] = useState<Mission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchMissions = useCallback(async () => {
    setLoading(true);
    const response = await fetch('/api/missions');
    const data = await response.json() as Mission[] | { error: string };

    if (!response.ok) {
      setError((data as { error: string }).error ?? '미션을 불러오지 못했습니다.');
    } else {
      setMissions(data as Mission[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchMissions();
  }, [fetchMissions]);

  return { missions, loading, error, refetch: fetchMissions };
}
