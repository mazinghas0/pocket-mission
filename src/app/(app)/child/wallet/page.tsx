'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useWallet } from '@/hooks/useWallet';
import { PointBalance } from '@/components/wallet/pointBalance';
import { TransactionList } from '@/components/wallet/transactionList';

export default function ChildWalletPage() {
  const { wallet, loading, error, refetch } = useWallet();
  const [withdrawPoints, setWithdrawPoints] = useState('');
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);
  const [withdrawError, setWithdrawError] = useState('');

  async function handleWithdraw(e: React.FormEvent) {
    e.preventDefault();
    setWithdrawError('');
    const points = Number(withdrawPoints);

    if (!points || points < 1) {
      setWithdrawError('출금할 포인트를 입력해주세요.');
      return;
    }

    if (wallet && points > wallet.balance) {
      setWithdrawError('잔액이 부족합니다.');
      return;
    }

    setWithdrawing(true);
    const response = await fetch('/api/wallet/withdraw', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ points }),
    });

    const data = await response.json() as { error?: string };

    if (!response.ok) {
      setWithdrawError(data.error ?? '출금 요청에 실패했습니다.');
      setWithdrawing(false);
      return;
    }

    setWithdrawPoints('');
    setShowWithdraw(false);
    await refetch();
    setWithdrawing(false);
  }

  return (
    <div className="min-h-screen bg-purple-50 pb-20">
      <div className="bg-white px-4 pt-12 pb-4 shadow-sm">
        <Link href="/child" className="text-gray-500 text-sm block mb-1">← 뒤로</Link>
        <h1 className="font-bold text-gray-800 text-lg">내 지갑</h1>
      </div>

      <div className="px-4 mt-4 space-y-4">
        {loading && (
          <p className="text-center text-gray-400 py-10 text-sm">불러오는 중...</p>
        )}

        {error && (
          <p className="text-red-500 text-sm text-center">{error}</p>
        )}

        {wallet && (
          <>
            <PointBalance points={wallet.balance} />

            <button
              onClick={() => setShowWithdraw(true)}
              className="w-full bg-purple-500 hover:bg-purple-600 text-white font-semibold py-3 rounded-xl transition-colors"
            >
              출금 요청하기
            </button>

            <div>
              <h2 className="font-semibold text-gray-700 mb-2 text-sm">포인트 이력</h2>
              <TransactionList transactions={wallet.transactions} />
            </div>
          </>
        )}
      </div>

      {/* 출금 모달 */}
      {showWithdraw && (
        <div className="fixed inset-0 bg-black/40 flex items-end justify-center z-50">
          <div className="bg-white rounded-t-2xl w-full max-w-lg p-6">
            <h3 className="font-semibold text-gray-800 mb-1">출금 요청</h3>
            <p className="text-sm text-gray-500 mb-4">
              부모님께 현금으로 전달해 달라고 요청할게요
            </p>

            <form onSubmit={handleWithdraw} className="space-y-4">
              <div className="relative">
                <input
                  type="number"
                  value={withdrawPoints}
                  onChange={(e) => setWithdrawPoints(e.target.value)}
                  placeholder="출금할 포인트"
                  min={1}
                  max={wallet?.balance ?? 0}
                  required
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 pr-8"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm">P</span>
              </div>

              {wallet && (
                <p className="text-xs text-gray-400">잔액: {wallet.balance.toLocaleString()}P</p>
              )}

              {withdrawError && (
                <p className="text-red-500 text-sm bg-red-50 rounded-lg px-3 py-2">{withdrawError}</p>
              )}

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => { setShowWithdraw(false); setWithdrawError(''); }}
                  className="py-3 rounded-xl border-2 border-gray-200 text-gray-600 text-sm font-semibold"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={withdrawing}
                  className="py-3 rounded-xl bg-purple-500 hover:bg-purple-600 disabled:bg-purple-300 text-white text-sm font-semibold transition-colors"
                >
                  {withdrawing ? '요청 중...' : '출금 요청'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
