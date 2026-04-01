'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { TemplatePicker } from '@/components/missions/templatePicker';
import { getCurrentUser } from '@/lib/firebase/auth';
import { getProfile, createMission } from '@/lib/firebase/db';
import { Timestamp } from 'firebase/firestore';
import type { MissionTemplate } from '@/types';

type Mode = 'select' | 'form';

export default function NewMissionPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>('select');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [points, setPoints] = useState(30);
  const [dueDate, setDueDate] = useState('');
  const [isRecurring, setIsRecurring] = useState(false);
  const [templateId, setTemplateId] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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
      const user = getCurrentUser();
      if (!user) throw new Error('로그인이 필요합니다.');

      const profile = await getProfile(user.uid);
      if (!profile?.familyId) throw new Error('가족이 연결되지 않았습니다.');

      await createMission({
        familyId: profile.familyId,
        createdBy: user.uid,
        assignedTo: null,
        title,
        description,
        points,
        isRecurring,
        status: 'pending',
        ...(dueDate && { dueDate: Timestamp.fromDate(new Date(dueDate)) }),
        ...(templateId && { templateId }),
      });

      router.push('/parent/missions');
    } catch (err) {
      setError(err instanceof Error ? err.message : '미션 생성에 실패했습니다.');
      setLoading(false);
    }
  }

  if (mode === 'select') {
    return (
      <div className="min-h-screen bg-orange-50 pb-20">
        <div className="bg-white px-4 pt-12 pb-4 shadow-sm">
          <div className="flex items-center gap-3 mb-1">
            <Link href="/parent/missions" className="text-gray-500 text-sm">← 뒤로</Link>
          </div>
          <h1 className="font-bold text-gray-800 text-lg">새 미션 만들기</h1>
        </div>

        <div className="px-4 mt-4 space-y-4">
          <div>
            <h2 className="font-semibold text-gray-700 mb-3">템플릿에서 시작</h2>
            <TemplatePicker onSelect={handleTemplateSelect} />
          </div>

          <button
            onClick={() => setMode('form')}
            className="w-full py-4 border-2 border-dashed border-orange-300 rounded-2xl text-orange-500 font-semibold text-sm hover:border-orange-500 transition-colors"
          >
            직접 입력하기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-orange-50 pb-20">
      <div className="bg-white px-4 pt-12 pb-4 shadow-sm">
        <div className="flex items-center gap-3 mb-1">
          <button onClick={() => setMode('select')} className="text-gray-500 text-sm">← 뒤로</button>
        </div>
        <h1 className="font-bold text-gray-800 text-lg">미션 상세 설정</h1>
      </div>

      <div className="px-4 mt-4">
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">미션 제목 *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="미션 이름을 입력하세요"
                required
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">설명</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="미션에 대한 설명을 입력하세요"
                rows={3}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">포인트 *</label>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min={5}
                  max={200}
                  step={5}
                  value={points}
                  onChange={(e) => setPoints(Number(e.target.value))}
                  className="flex-1 accent-orange-500"
                />
                <span className="text-orange-600 font-bold text-lg w-16 text-right">{points}P</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">마감일</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
            </div>

            <div className="flex items-center justify-between py-2">
              <div>
                <p className="text-sm font-medium text-gray-700">반복 미션</p>
                <p className="text-xs text-gray-400">완료 후 자동으로 다시 생성</p>
              </div>
              <button
                type="button"
                onClick={() => setIsRecurring(!isRecurring)}
                className={`relative w-12 h-6 rounded-full transition-colors ${
                  isRecurring ? 'bg-orange-500' : 'bg-gray-200'
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
              <p className="text-red-500 text-sm bg-red-50 rounded-lg px-3 py-2">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white font-semibold py-3 rounded-xl transition-colors"
            >
              {loading ? '생성 중...' : '미션 만들기'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
