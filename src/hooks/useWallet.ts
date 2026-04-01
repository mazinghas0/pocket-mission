'use client';

import { useEffect, useState, useCallback } from 'react';
import { onAuthChange } from '@/lib/firebase/auth';
import { getProfile, getTransactions } from '@/lib/firebase/db';
import type { WalletResponse } from '@/types';

export function useWallet() {
  const [wallet, setWallet] = useState<WalletResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [uid, setUid] = useState<string | null>(null);

  useEffect(() => {
    const unsub = onAuthChange((user) => {
      setUid(user?.uid ?? null);
    });
    return () => unsub();
  }, []);

  const fetchWallet = useCallback(async () => {
    if (!uid) return;
    setLoading(true);
    try {
      const [profile, transactions] = await Promise.all([
        getProfile(uid),
        getTransactions(uid),
      ]);
      if (!profile) {
        setError('프로필을 찾을 수 없습니다.');
      } else {
        setWallet({ balance: profile.points, transactions });
      }
    } catch {
      setError('지갑 정보를 불러오지 못했습니다.');
    }
    setLoading(false);
  }, [uid]);

  useEffect(() => {
    if (uid) fetchWallet();
  }, [uid, fetchWallet]);

  return { wallet, loading, error, refetch: fetchWallet };
}
