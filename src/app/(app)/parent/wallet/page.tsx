import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatPoints, formatDateTime } from '@/lib/utils';

export default async function ParentWalletPage() {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, family_id, role')
    .eq('user_id', user.id)
    .single();

  if (!profile?.family_id || profile.role !== 'parent') redirect('/parent');

  // 가족 내 자녀 목록
  const { data: children } = await supabase
    .from('profiles')
    .select('id, name, points')
    .eq('family_id', profile.family_id)
    .eq('role', 'child');

  // 출금 요청 목록
  const childIds = (children ?? []).map((c) => c.id);
  const { data: withdrawals } = await supabase
    .from('withdrawal_requests')
    .select('*')
    .in('child_id', childIds.length > 0 ? childIds : ['none'])
    .eq('status', 'pending')
    .order('created_at', { ascending: false });

  return (
    <div className="min-h-screen bg-orange-50 pb-20">
      <div className="bg-white px-4 pt-12 pb-4 shadow-sm">
        <Link href="/parent" className="text-gray-500 text-sm block mb-1">← 뒤로</Link>
        <h1 className="font-bold text-gray-800 text-lg">용돈 현황</h1>
      </div>

      <div className="px-4 mt-4 space-y-4">
        {/* 자녀별 잔액 */}
        <div>
          <h2 className="font-semibold text-gray-700 mb-2 text-sm">자녀 포인트 잔액</h2>
          <div className="space-y-2">
            {(children ?? []).length === 0 ? (
              <Card>
                <p className="text-sm text-gray-400 text-center py-4">연결된 자녀가 없습니다</p>
              </Card>
            ) : (
              (children ?? []).map((child) => (
                <Card key={child.id} className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-gray-800">{child.name}</p>
                  </div>
                  <span className="text-orange-600 font-bold text-lg">
                    {formatPoints(child.points)}
                  </span>
                </Card>
              ))
            )}
          </div>
        </div>

        {/* 출금 요청 목록 */}
        <div>
          <h2 className="font-semibold text-gray-700 mb-2 text-sm">출금 요청</h2>
          {(withdrawals ?? []).length === 0 ? (
            <Card>
              <p className="text-sm text-gray-400 text-center py-4">대기 중인 출금 요청이 없습니다</p>
            </Card>
          ) : (
            <div className="space-y-2">
              {withdrawals?.map((w) => {
                const child = children?.find((c) => c.id === w.child_id);
                return (
                  <Card key={w.id}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-gray-800">{child?.name ?? '자녀'}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{formatDateTime(w.created_at)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-orange-600 font-bold">{formatPoints(w.points)}</p>
                        <Badge className="bg-yellow-100 text-yellow-700 mt-1">대기중</Badge>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-2 bg-gray-50 rounded-lg px-3 py-2">
                      실제 현금으로 직접 전달 후 처리해주세요
                    </p>
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
