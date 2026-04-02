'use client';

export const runtime = 'edge';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthChange, getCurrentUser } from '@/lib/firebase/auth';
import { getAdminUsers, getAdminFamilies } from '@/lib/firebase/db';
import type { AdminUser, AdminFamily } from '@/lib/firebase/db';

const ADMIN_EMAIL = 'mazinghas0@gmail.com';

function formatDate(ts: { toDate: () => Date } | null | undefined): string {
  if (!ts) return '-';
  const d = ts.toDate();
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
}

export default function AdminPage() {
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'authorized' | 'unauthorized'>('loading');
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [families, setFamilies] = useState<AdminFamily[]>([]);
  const [tab, setTab] = useState<'overview' | 'users' | 'families'>('overview');

  useEffect(() => {
    const unsub = onAuthChange(async (user) => {
      if (!user) {
        router.replace('/login');
        return;
      }
      if (user.email !== ADMIN_EMAIL) {
        setStatus('unauthorized');
        return;
      }
      const [u, f] = await Promise.all([getAdminUsers(), getAdminFamilies()]);
      setUsers(u);
      setFamilies(f);
      setStatus('authorized');
    });
    return () => unsub();
  }, [router]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <p className="text-gray-400 text-sm">로딩 중...</p>
      </div>
    );
  }

  if (status === 'unauthorized') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <p className="text-red-400 text-lg font-bold mb-2">접근 권한 없음</p>
          <p className="text-gray-500 text-sm">관리자 계정으로만 접근할 수 있습니다.</p>
        </div>
      </div>
    );
  }

  const totalUsers = users.length;
  const totalFamilies = families.length;
  const parents = users.filter(u => u.role === 'parent').length;
  const children = users.filter(u => u.role === 'child').length;
  const premiumFamilies = families.filter(f => f.subscriptionStatus === 'premium').length;
  const recentUsers = users.slice(0, 5);

  return (
    <div className="min-h-screen bg-gray-900 text-white pb-10">
      {/* 헤더 */}
      <div className="bg-gray-800 px-5 py-4 border-b border-gray-700">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="font-bold text-lg">PocketMission 어드민</h1>
            <p className="text-xs text-gray-400 mt-0.5">{getCurrentUser()?.email}</p>
          </div>
          <button
            onClick={() => router.push('/')}
            className="text-xs text-gray-400 hover:text-white transition-colors"
          >
            앱으로 →
          </button>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-5 mt-6">
        {/* 탭 */}
        <div className="flex gap-2 mb-6">
          {(['overview', 'users', 'families'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                tab === t ? 'bg-orange-500 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'
              }`}
            >
              {t === 'overview' ? '요약' : t === 'users' ? `유저 (${totalUsers})` : `가족 (${totalFamilies})`}
            </button>
          ))}
        </div>

        {/* 요약 탭 */}
        {tab === 'overview' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-800 rounded-2xl p-4">
                <p className="text-gray-400 text-xs mb-1">총 가입자</p>
                <p className="text-3xl font-bold text-white">{totalUsers}</p>
                <p className="text-xs text-gray-500 mt-1">부모 {parents} · 자녀 {children}</p>
              </div>
              <div className="bg-gray-800 rounded-2xl p-4">
                <p className="text-gray-400 text-xs mb-1">총 가족</p>
                <p className="text-3xl font-bold text-white">{totalFamilies}</p>
                <p className="text-xs text-gray-500 mt-1">프리미엄 {premiumFamilies} · 무료 {totalFamilies - premiumFamilies}</p>
              </div>
            </div>

            <div className="bg-gray-800 rounded-2xl p-4">
              <h2 className="text-sm font-semibold text-gray-300 mb-3">최근 가입자 5명</h2>
              <div className="space-y-2">
                {recentUsers.map((u) => (
                  <div key={u.id} className="flex items-center justify-between">
                    <div>
                      <span className="text-sm text-white">{u.name}</span>
                      <span className={`ml-2 text-xs px-1.5 py-0.5 rounded-full ${
                        u.role === 'parent' ? 'bg-orange-500/20 text-orange-400' : 'bg-purple-500/20 text-purple-400'
                      }`}>
                        {u.role === 'parent' ? '부모' : '자녀'}
                      </span>
                    </div>
                    <span className="text-xs text-gray-500">{formatDate(u.createdAt)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 유저 탭 */}
        {tab === 'users' && (
          <div className="bg-gray-800 rounded-2xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left px-4 py-3 text-gray-400 font-medium">이름</th>
                  <th className="text-left px-4 py-3 text-gray-400 font-medium">역할</th>
                  <th className="text-center px-4 py-3 text-gray-400 font-medium">알림</th>
                  <th className="text-right px-4 py-3 text-gray-400 font-medium">포인트</th>
                  <th className="text-right px-4 py-3 text-gray-400 font-medium">가입일</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-b border-gray-700/50 hover:bg-gray-700/30 transition-colors">
                    <td className="px-4 py-3 text-white">{u.name}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        u.role === 'parent' ? 'bg-orange-500/20 text-orange-400' : 'bg-purple-500/20 text-purple-400'
                      }`}>
                        {u.role === 'parent' ? '부모' : '자녀'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`text-xs px-1.5 py-0.5 rounded-full ${u.fcmToken ? 'bg-green-500/20 text-green-400' : 'bg-gray-600/40 text-gray-500'}`}>
                        {u.fcmToken ? 'ON' : '-'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-gray-300">{u.points.toLocaleString()}P</td>
                    <td className="px-4 py-3 text-right text-gray-500">{formatDate(u.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* 가족 탭 */}
        {tab === 'families' && (
          <div className="bg-gray-800 rounded-2xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left px-4 py-3 text-gray-400 font-medium">가족명</th>
                  <th className="text-left px-4 py-3 text-gray-400 font-medium">초대코드</th>
                  <th className="text-center px-4 py-3 text-gray-400 font-medium">구성원</th>
                  <th className="text-right px-4 py-3 text-gray-400 font-medium">가입일</th>
                </tr>
              </thead>
              <tbody>
                {families.map((f) => (
                  <tr key={f.id} className="border-b border-gray-700/50 hover:bg-gray-700/30 transition-colors">
                    <td className="px-4 py-3 text-white">
                      {f.name}
                      {f.subscriptionStatus === 'premium' && (
                        <span className="ml-2 text-xs bg-yellow-500/20 text-yellow-400 px-1.5 py-0.5 rounded-full">PRO</span>
                      )}
                    </td>
                    <td className="px-4 py-3 font-mono text-gray-400 text-xs">{f.inviteCode}</td>
                    <td className="px-4 py-3 text-center text-gray-300">{f.memberCount}명</td>
                    <td className="px-4 py-3 text-right text-gray-500">{formatDate(f.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
