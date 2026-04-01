import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { MissionCard } from '@/components/missions/missionCard';
import type { Mission, MissionStatus } from '@/types';

const STATUS_FILTERS: Array<{ label: string; value: MissionStatus | 'all' }> = [
  { label: '전체', value: 'all' },
  { label: '대기중', value: 'pending' },
  { label: '진행중', value: 'in_progress' },
  { label: '인증대기', value: 'submitted' },
  { label: '완료', value: 'approved' },
];

interface PageProps {
  searchParams: { status?: string };
}

export default async function ParentMissionsPage({ searchParams }: PageProps) {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, family_id, role')
    .eq('user_id', user.id)
    .single();

  if (!profile?.family_id || profile.role !== 'parent') redirect('/parent');

  let query = supabase
    .from('missions')
    .select('*')
    .eq('family_id', profile.family_id)
    .order('created_at', { ascending: false });

  const statusFilter = searchParams.status as MissionStatus | undefined;
  if (statusFilter && statusFilter !== 'all') {
    query = query.eq('status', statusFilter);
  }

  const { data: missions } = await query;

  return (
    <div className="min-h-screen bg-orange-50 pb-20">
      <div className="bg-white px-4 pt-12 pb-4 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <Link href="/parent" className="text-gray-500 text-sm">← 뒤로</Link>
          <h1 className="font-bold text-gray-800">미션 목록</h1>
          <Link href="/parent/missions/new" className="text-orange-500 text-sm font-semibold">+ 추가</Link>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
          {STATUS_FILTERS.map((filter) => (
            <Link
              key={filter.value}
              href={filter.value === 'all' ? '/parent/missions' : `/parent/missions?status=${filter.value}`}
              className={`shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                (statusFilter ?? 'all') === filter.value
                  ? 'bg-orange-500 text-white'
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              {filter.label}
            </Link>
          ))}
        </div>
      </div>

      <div className="px-4 mt-4 space-y-3">
        {(missions ?? []).length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <div className="text-4xl mb-3">📋</div>
            <p className="text-sm">미션이 없습니다</p>
            <Link href="/parent/missions/new" className="text-orange-500 text-sm font-medium mt-2 block">
              첫 미션 만들기
            </Link>
          </div>
        ) : (
          (missions as Mission[]).map((mission) => (
            <MissionCard key={mission.id} mission={mission} />
          ))
        )}
      </div>
    </div>
  );
}
