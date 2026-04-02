'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { TemplatePicker } from '@/components/missions/templatePicker';
import { getCurrentUser } from '@/lib/firebase/auth';
import { getProfile, getFamilyMembers, createMissionDefinitionWithAssignments, getAssignment, updateDefinition } from '@/lib/firebase/db';
import { Timestamp } from 'firebase/firestore';
import { BottomNav } from '@/components/ui/bottomNav';
import type { MissionTemplate, MissionFrequency, MissionCategory, MissionColor } from '@/types';

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
  const [frequency, setFrequency] = useState<MissionFrequency>('once');
  const [category, setCategory] = useState<MissionCategory | undefined>();
  const [color, setColor] = useState<MissionColor>('orange');
  const [emoji, setEmoji] = useState('');
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
      if (m.frequency) setFrequency(m.frequency);
      if (m.category) setCategory(m.category);
      if (m.color) setColor(m.color);
      if (m.emoji) setEmoji(m.emoji);
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
            frequency,
            ...(category && { category }),
            color,
            ...(emoji && { emoji }),
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
        <BottomNav role="parent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-orange-50 pb-20">
      <div className="bg-white px-4 pt-12 pb-4 shadow-sm">
        <div className="flex items-center gap-3 mb-1">
          <button onClick={() => setMode('select')} className="text-gray-500 text-sm">← 뒤로</button>
        </div>
        <h1 className="font-bold text-gray-800 text-lg">{editId ? '미션 수정' : '미션 상세 설정'}</h1>
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

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">미션 주기</label>
              <div className="grid grid-cols-4 gap-2">
                {([
                  { value: 'once', label: '1회성', icon: '🎯' },
                  { value: 'daily', label: '매일', icon: '☀️' },
                  { value: 'weekly', label: '매주', icon: '📅' },
                  { value: 'monthly', label: '매달', icon: '🏆' },
                ] as { value: MissionFrequency; label: string; icon: string }[]).map((f) => (
                  <button
                    key={f.value}
                    type="button"
                    onClick={() => setFrequency(f.value)}
                    className={`flex flex-col items-center py-2 px-1 rounded-xl border-2 text-xs font-medium transition-colors ${
                      frequency === f.value
                        ? 'border-orange-500 bg-orange-50 text-orange-700'
                        : 'border-gray-200 bg-white text-gray-500'
                    }`}
                  >
                    <span className="text-lg mb-0.5">{f.icon}</span>
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">카테고리</label>
              <div className="flex flex-wrap gap-2">
                {([
                  { value: 'study', label: '공부', icon: '📚' },
                  { value: 'chore', label: '집안일', icon: '🧹' },
                  { value: 'health', label: '건강', icon: '💪' },
                  { value: 'creative', label: '창의', icon: '🎨' },
                  { value: 'social', label: '사회성', icon: '🤝' },
                ] as { value: MissionCategory; label: string; icon: string }[]).map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => setCategory(category === c.value ? undefined : c.value)}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-full border text-xs font-medium transition-colors ${
                      category === c.value
                        ? 'border-orange-500 bg-orange-50 text-orange-700'
                        : 'border-gray-200 bg-white text-gray-500'
                    }`}
                  >
                    <span>{c.icon}</span>
                    {c.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">색상</label>
              <div className="flex gap-2">
                {([
                  { value: 'orange', bg: 'bg-orange-400' },
                  { value: 'blue', bg: 'bg-blue-400' },
                  { value: 'green', bg: 'bg-green-400' },
                  { value: 'pink', bg: 'bg-pink-400' },
                  { value: 'purple', bg: 'bg-purple-400' },
                  { value: 'yellow', bg: 'bg-yellow-400' },
                ] as { value: MissionColor; bg: string }[]).map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => setColor(c.value)}
                    className={`w-8 h-8 rounded-full ${c.bg} transition-transform ${
                      color === c.value ? 'ring-2 ring-offset-2 ring-gray-400 scale-110' : ''
                    }`}
                  />
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">아이콘 (선택)</label>
              <div className="grid grid-cols-5 gap-2">
                {['⭐','🌟','🎯','🏅','💎','🚀','🦄','🐶','🐱','🌈','🎮','🎵','📖','🧩','🍰','🏀','✏️','🌸','🦋','💫'].map((e) => (
                  <button
                    key={e}
                    type="button"
                    onClick={() => setEmoji(emoji === e ? '' : e)}
                    className={`w-10 h-10 rounded-xl text-xl flex items-center justify-center transition-all ${
                      emoji === e
                        ? 'bg-orange-100 ring-2 ring-orange-400 scale-110'
                        : 'bg-gray-50 hover:bg-gray-100'
                    }`}
                  >
                    {e}
                  </button>
                ))}
              </div>
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
              {loading ? (editId ? '수정 중...' : '생성 중...') : (editId ? '미션 수정' : '미션 만들기')}
            </button>
          </form>
        </div>
      </div>
      <BottomNav role="parent" />
    </div>
  );
}
