'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { TemplatePicker } from '@/components/missions/templatePicker';
import { getCurrentUser } from '@/lib/firebase/auth';
import { getProfile, getFamilyMembers, createMissionDefinitionWithAssignments, getAssignment, updateDefinition } from '@/lib/firebase/db';
import { Timestamp } from 'firebase/firestore';
import { BottomNav } from '@/components/ui/bottomNav';
import type { MissionTemplate } from '@/types';

type Mode = 'select' | 'form';

export default function NewMissionPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get('edit');

  const [mode, setMode] = useState<Mode>(editId ? 'form' : 'select');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [points, setPoints] = useState(30);
  const [dueDate, setDueDate] = useState('');
  const [isRecurring, setIsRecurring] = useState(false);
  const [templateId, setTemplateId] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [defId, setDefId] = useState('');
  const [defFamilyId, setDefFamilyId] = useState('');

  useEffect(() => {
    if (!editId) return;
    getAssignment(editId).then((m) => {
      if (!m) return;
      setDefId(m.definitionId);
      setDefFamilyId(m.familyId);
      setTitle(m.title);
      setDescription(m.description);
      setPoints(m.points);
      setIsRecurring(m.isRecurring);
      if (m.dueDate) {
        const d = m.dueDate.toDate();
        setDueDate(d.toISOString().split('T')[0]);
      }
    });
  }, [editId]);

  function handleTemplateSelect(template: MissionTemplate) {
    setTitle(template.title);
    setDescription(template.description);
    setPoints(template.defaultPoints);
    setTemplateId(template.id);
    setMode('form');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (editId) {
        await updateDefinition(defId, defFamilyId, {
          title,
          description,
          points,
          isRecurring,
          ...(dueDate ? { dueDate: Timestamp.fromDate(new Date(dueDate)) } : {}),
        });
      } else {
        const user = getCurrentUser();
        if (!user) throw new Error('로그인이 필요합니다.');

        const profile = await getProfile(user.uid);
        if (!profile?.familyId) throw new Error('가족이 연결되지 않았습니다.');

        const members = await getFamilyMembers(profile.familyId);
        const childIds = members.filter(m => m.role === 'child').map(m => m.id);

        await createMissionDefinitionWithAssignments(
          {
            familyId: profile.familyId,
            createdBy: user.uid,
            title,
            description,
            points,
            isRecurring,
            ...(dueDate && { dueDate: Timestamp.fromDate(new Date(dueDate)) }),
            ...(templateId && { templateId }),
          },
          childIds,
        );
      }

      router.push('/parent/missions');
    } catch (err) {
      setError(err instanceof Error ? err.message : '미션 생성에 실패했습니다.');
      setLoading(false);
    }
  }

  if (mode === 'select') {
    return (
      <div className="min-h-screen bg-quest-cream pb-20">
        <div className="bg-white px-4 pt-12 pb-4 shadow-quest">
          <Link href="/parent/missions" className="text-gray-400 text-sm block mb-1">← 뒤로</Link>
          <h1 className="font-black text-quest-navy text-lg">새 미션 만들기</h1>
        </div>

        <div className="px-4 mt-4 space-y-4">
          <div>
            <p className="text-sm font-bold text-gray-500 mb-3">템플릿에서 시작</p>
            <TemplatePicker onSelect={handleTemplateSelect} />
          </div>

          <button
            onClick={() => setMode('form')}
            className="w-full py-4 border-2 border-dashed border-quest-coral/40 rounded-2xl text-quest-coral font-bold text-sm hover:border-quest-coral hover:bg-quest-coral-light transition-colors"
          >
            + 직접 입력하기
          </button>
        </div>
        <BottomNav role="parent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-quest-cream pb-20">
      <div className="bg-white px-4 pt-12 pb-4 shadow-quest">
        <button onClick={() => setMode('select')} className="text-gray-400 text-sm block mb-1">← 뒤로</button>
        <h1 className="font-black text-quest-navy text-lg">{editId ? '미션 수정' : '미션 상세 설정'}</h1>
      </div>

      <div className="px-4 mt-4">
        <div className="bg-white rounded-2xl p-5 shadow-quest">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">미션 제목 *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="미션 이름을 입력하세요"
                required
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-quest-coral/40 text-quest-navy"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">설명</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="미션에 대한 설명을 입력하세요"
                rows={3}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-quest-coral/40 resize-none text-quest-navy"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">포인트 *</label>
              <div className="bg-quest-gold-light border border-quest-gold/20 rounded-xl px-4 py-3 mb-2 text-center">
                <span className="text-quest-gold font-black text-2xl">★ {points}P</span>
              </div>
              <input
                type="range"
                min={5}
                max={200}
                step={5}
                value={points}
                onChange={(e) => setPoints(Number(e.target.value))}
                className="w-full accent-quest-coral"
              />
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>5P</span>
                <span>200P</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">마감일</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-quest-coral/40 text-quest-navy"
              />
            </div>

            <div className="flex items-center justify-between py-1">
              <div>
                <p className="text-sm font-bold text-gray-700">반복 미션</p>
                <p className="text-xs text-gray-400">완료 후 자동으로 다시 생성</p>
              </div>
              <button
                type="button"
                onClick={() => setIsRecurring(!isRecurring)}
                className={`relative w-12 h-6 rounded-full transition-colors ${
                  isRecurring ? 'bg-quest-coral' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                    isRecurring ? 'translate-x-6' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </div>

            {error && (
              <p className="text-red-500 text-sm bg-red-50 rounded-xl px-3 py-2">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-quest-coral hover:bg-orange-600 disabled:bg-quest-coral/40 text-white font-black py-3.5 rounded-xl transition-colors"
            >
              {loading ? (editId ? '수정 중...' : '생성 중...') : (editId ? '✓ 미션 수정' : '✓ 미션 만들기')}
            </button>
          </form>
        </div>
      </div>
      <BottomNav role="parent" />
    </div>
  );
}
