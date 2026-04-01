'use client';

import { useEffect, useState, useCallback } from 'react';
import type { WalletResponse } from '@/types';

export function useWallet() {
  const [wallet, setWallet] = useState<WalletResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchWallet = useCallback(async () => {
    setLoading(true);
    const response = await fetch('/api/wallet');
    const data = await response.json() as WalletResponse | { error: string };

    if (!response.ok) {
      setError((data as { error: string }).error ?? '지갑 정보를 불러오지 못했습니다.');
    } else {
      setWallet(data as WalletResponse);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchWallet();
  }, [fetchWallet]);

  return { wallet, loading, error, refetch: fetchWallet };
}
