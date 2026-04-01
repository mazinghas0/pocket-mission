'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { onAuthChange } from '@/lib/firebase/auth';
import { getProfile, getFamilyMembers, getFamilyWithdrawals, approveWithdrawal } from '@/lib/firebase/db';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatPoints, formatDateTime } from '@/lib/utils';
import type { Profile, WithdrawalRequest } from '@/types';

export default function ParentWalletPage() {
  const router = useRouter();
  const [children, setChildren] = useState<Profile[]>([]);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [parentUid, setParentUid] = useState('');

  const loadData = async (uid: string, familyId: string) => {
    const [members, wds] = await Promise.all([
      getFamilyMembers(familyId),
      getFamilyWithdrawals(familyId),
    ]);
    setChildren(members.filter(m => m.role === 'child'));
    setWithdrawals(wds.filter(w => w.status === 'pending'));
    setLoading(false);
    setParentUid(uid);
  };

  useEffect(() => {
    const unsub = onAuthChange(async (user) => {
      if (!user) { router.push('/login'); return; }
      const profile = await getProfile(user.uid);
      if (!profile?.familyId || profile.role !== 'parent') { router.push('/parent'); return; }
      await loadData(user.uid, profile.familyId);
    });
    return () => unsub();
  }, [router]);

  async function handleApprove(w: WithdrawalRequest) {
    await approveWithdrawal(w.id, w.childId, w.points, parentUid);
    setWithdrawals(prev => prev.filter(x => x.id !== w.id));
    setChildren(prev =>
      prev.map(c =>
        c.id === w.childId ? { ...c, points: Math.max(0, c.points - w.points) } : c
      )
    );
  }

  return (
    <div className="min-h-screen bg-orange-50 pb-20">
      <div className="bg-white px-4 pt-12 pb-4 shadow-sm">
        <Link href="/parent" className="text-gray-500 text-sm block mb-1">← 뒤로</Link>
        <h1 className="font-bold text-gray-800 text-lg">용돈 현황</h1>
      </div>

      <div className="px-4 mt-4 space-y-4">
        <div>
          <h2 className="font-semibold text-gray-700 mb-2 text-sm">자녀 포인트 잔액</h2>
          <div className="space-y-2">
            {loading ? (
              <p className="text-sm text-gray-400 text-center py-4">불러오는 중...</p>
            ) : children.length === 0 ? (
              <Card>
                <p className="text-sm text-gray-400 text-center py-4">연결된 자녀가 없습니다</p>
              </Card>
            ) : (
              children.map((child) => (
                <Card key={child.id} className="flex items-center justify-between">
                  <p className="font-semibold text-gray-800">{child.name}</p>
                  <span className="text-orange-600 font-bold text-lg">
                    {formatPoints(child.points)}
                  </span>
                </Card>
              ))
            )}
          </div>
        </div>

        <div>
          <h2 className="font-semibold text-gray-700 mb-2 text-sm">출금 요청</h2>
          {withdrawals.length === 0 ? (
            <Card>
              <p className="text-sm text-gray-400 text-center py-4">대기 중인 출금 요청이 없습니다</p>
            </Card>
          ) : (
            <div className="space-y-2">
              {withdrawals.map((w) => {
                const child = children.find(c => c.id === w.childId);
                return (
                  <Card key={w.id}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-gray-800">{child?.name ?? '자녀'}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{formatDateTime(w.createdAt)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-orange-600 font-bold">{formatPoints(w.points)}</p>
                        <Badge className="bg-yellow-100 text-yellow-700 mt-1">대기중</Badge>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-2 bg-gray-50 rounded-lg px-3 py-2">
                      실제 현금으로 직접 전달 후 처리해주세요
                    </p>
                    <button
                      onClick={() => handleApprove(w)}
                      className="w-full mt-3 py-2.5 rounded-xl bg-green-500 hover:bg-green-600 text-white text-sm font-semibold transition-colors"
                    >
                      처리 완료
                    </button>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
