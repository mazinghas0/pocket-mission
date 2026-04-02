'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { onAuthChange } from '@/lib/firebase/auth';
import {
  getProfile, getFamilyMembers, subscribeFamilyDefinitions,
  getDefinitionAssignments, deleteMissionDefinition,
} from '@/lib/firebase/db';
import { BottomNav } from '@/components/ui/bottomNav';
import { Badge } from '@/components/ui/badge';
import { getMissionStatusColor, getMissionStatusLabel, formatPoints } from '@/lib/utils';
import type { MissionDefinition, MissionAssignment, Profile } from '@/types';

interface DefinitionWithAssignments {
  definition: MissionDefinition;
  assignments: MissionAssignment[];
}

export default function ParentMissionsPage() {
  const router = useRouter();
  const [items, setItems] = useState<DefinitionWithAssignments[]>([]);
  const [members, setMembers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState<string | null>(null);

  useEffect(() => {
    let unsubDefs: (() => void) | null = null;

    const unsubAuth = onAuthChange(async (user) => {
      if (!user) { router.replace('/login'); return; }

      const profile = await getProfile(user.uid);
      if (!profile?.familyId || profile.role !== 'parent') { router.replace('/parent'); return; }

      const familyMembers = await getFamilyMembers(profile.familyId);
      setMembers(familyMembers.filter(m => m.role === 'child'));

      unsubDefs = subscribeFamilyDefinitions(profile.familyId, async (defs) => {
        try {
          const withAssignments = await Promise.all(
            defs.map(async (def) => ({
              definition: def,
              assignments: await getDefinitionAssignments(def.id, def.familyId),
            })),
          );
          setItems(withAssignments);
        } catch (err) {
          console.error('[ParentMissions] 미션 로드 실패:', err);
          setItems([]);
        } finally {
          setLoading(false);
        }
      });
    });

    return () => { unsubAuth(); unsubDefs?.(); };
  }, [router]);

  async function handleDelete(defId: string, familyId: string) {
    await deleteMissionDefinition(defId, familyId);
    setConfirming(null);
  }

  return (
    <div className="min-h-screen bg-quest-cream pb-20">
      <div className="bg-white px-4 pt-12 pb-4 shadow-quest">
        <div className="flex items-center justify-between mb-1">
          <Link href="/parent" className="text-gray-400 text-sm">← 뒤로</Link>
          <h1 className="font-black text-quest-navy">미션 목록</h1>
          <Link href="/parent/missions/new" className="text-quest-coral text-sm font-black">+ 추가</Link>
        </div>
      </div>

      <div className="px-4 mt-4 space-y-3">
        {loading ? (
          <p className="text-center text-gray-400 py-10 text-sm">불러오는 중...</p>
        ) : items.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <div className="text-5xl mb-3">⚔️</div>
            <p className="text-sm font-semibold text-gray-500">아직 미션이 없어요</p>
            <p className="text-xs mt-1">자녀의 첫 퀘스트를 만들어보세요!</p>
            <Link href="/parent/missions/new" className="inline-block mt-4 bg-quest-coral text-white text-sm font-black px-6 py-2.5 rounded-xl">
              첫 미션 만들기
            </Link>
          </div>
        ) : (
          items.map(({ definition, assignments }) => (
            <div key={definition.id} className="bg-white rounded-2xl shadow-quest p-4 border-l-4 border-l-quest-coral">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-quest-navy truncate">{definition.title}</h3>
                  {definition.description && (
                    <p className="text-sm text-gray-500 mt-0.5 line-clamp-2">{definition.description}</p>
                  )}
                </div>
                <span className="text-quest-gold font-black text-sm shrink-0">
                  ★ {formatPoints(definition.points)}
                </span>
              </div>

              {definition.isRecurring && (
                <div className="mt-2">
                  <Badge className="bg-blue-50 text-blue-600">반복</Badge>
                </div>
              )}

              {assignments.length > 0 && (
                <div className="mt-3 space-y-1.5">
                  {assignments.map((a) => {
                    const child = members.find(m => m.id === a.childId);
                    return (
                      <div key={a.id} className="flex items-center justify-between text-xs">
                        <span className="text-gray-500">{child?.name ?? '자녀'}</span>
                        <Badge className={getMissionStatusColor(a.status)}>
                          {getMissionStatusLabel(a.status)}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-3">
                <button
                  onClick={() => router.push(`/parent/missions/new?edit=${assignments[0]?.id ?? ''}`)}
                  className="text-xs text-gray-500 hover:text-quest-coral transition-colors"
                >
                  수정
                </button>
                {confirming !== definition.id ? (
                  <button
                    onClick={() => setConfirming(definition.id)}
                    className="text-xs text-gray-500 hover:text-red-500 transition-colors"
                  >
                    삭제
                  </button>
                ) : (
                  <>
                    <span className="text-xs text-red-500">전체 삭제할까요?</span>
                    <button
                      onClick={() => handleDelete(definition.id, definition.familyId)}
                      className="text-xs text-red-600 font-semibold"
                    >
                      확인
                    </button>
                    <button
                      onClick={() => setConfirming(null)}
                      className="text-xs text-gray-400"
                    >
                      취소
                    </button>
                  </>
                )}
              </div>
            </div>
          ))
        )}
      </div>
      <BottomNav role="parent" />
    </div>
  );
}
