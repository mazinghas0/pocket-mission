'use client';

export const runtime = 'edge';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { getCurrentUser } from '@/lib/firebase/auth';
import { getAssignment, createAssignmentSubmission } from '@/lib/firebase/db';
import { uploadMissionPhoto } from '@/lib/firebase/storage';
import { Badge } from '@/components/ui/badge';
import { BottomNav } from '@/components/ui/bottomNav';
import { getMissionStatusLabel, getMissionStatusColor, formatPoints } from '@/lib/utils';

export default function MissionSubmitPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [mission, setMission] = useState<import('@/types').MissionAssignment | null>(null);
  const [loading, setLoading] = useState(true);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState('');
  const [memo, setMemo] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    getAssignment(id).then((data) => {
      setMission(data);
      setLoading(false);
    });
  }, [id]);

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!photoFile || !mission) {
      setError('인증 사진을 선택해주세요.');
      return;
    }
    setError('');
    setSubmitting(true);

    try {
      const user = getCurrentUser();
      if (!user) throw new Error('로그인이 필요합니다.');

      const photoUrl = await uploadMissionPhoto(mission.familyId, id, photoFile);

      await createAssignmentSubmission(id, {
        assignmentId: id,
        childId: user.uid,
        photoUrl,
        memo,
        status: 'pending',
      });

      router.push('/child/missions');
    } catch (err) {
      setError(err instanceof Error ? err.message : '인증 제출에 실패했습니다.');
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-quest-cream flex items-center justify-center">
        <p className="text-gray-400 text-sm">불러오는 중...</p>
      </div>
    );
  }

  if (!mission) {
    return (
      <div className="min-h-screen bg-quest-cream flex items-center justify-center">
        <p className="text-gray-400 text-sm">미션을 찾을 수 없습니다.</p>
      </div>
    );
  }

  const canSubmit = !['approved', 'submitted'].includes(mission.status);

  return (
    <div className="min-h-screen bg-quest-cream pb-20">
      <div className="bg-white px-4 pt-12 pb-4 shadow-quest">
        <Link href="/child/missions" className="text-gray-400 text-sm block mb-1">← 뒤로</Link>
        <h1 className="font-black text-quest-navy text-lg">퀘스트 인증</h1>
      </div>

      <div className="px-4 mt-4 space-y-4">
        {/* 미션 정보 카드 */}
        <div className="bg-white rounded-2xl p-5 shadow-quest border-l-4 border-l-quest-purple">
          <div className="flex items-start justify-between gap-2 mb-2">
            <h2 className="font-black text-quest-navy text-lg flex-1">{mission.title}</h2>
            <Badge className={getMissionStatusColor(mission.status)}>
              {getMissionStatusLabel(mission.status)}
            </Badge>
          </div>
          {mission.description && (
            <p className="text-sm text-gray-600 mb-4">{mission.description}</p>
          )}
          <div className="bg-quest-gold-light border border-quest-gold/20 rounded-xl px-4 py-3 text-center">
            <span className="text-quest-gold font-black text-2xl">★ {formatPoints(mission.points)}</span>
            <span className="text-gray-400 text-sm ml-2">획득 예정</span>
          </div>
        </div>

        {canSubmit ? (
          <div className="bg-white rounded-2xl p-5 shadow-quest">
            <h3 className="font-black text-quest-navy mb-4">인증하기</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">인증 사진 *</label>
                {photoPreview ? (
                  <div className="relative">
                    <img
                      src={photoPreview}
                      alt="미리보기"
                      className="w-full h-48 object-cover rounded-xl"
                    />
                    <button
                      type="button"
                      onClick={() => { setPhotoFile(null); setPhotoPreview(''); }}
                      className="absolute top-2 right-2 bg-black/50 text-white rounded-full w-7 h-7 text-xs flex items-center justify-center backdrop-blur-sm"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-quest-purple/30 rounded-xl cursor-pointer hover:border-quest-purple transition-colors bg-quest-purple-light">
                    <div className="text-3xl mb-2">📷</div>
                    <p className="text-sm text-quest-purple font-semibold">사진을 선택하세요</p>
                    <p className="text-xs text-gray-400 mt-0.5">탭하여 촬영 또는 선택</p>
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={handlePhotoChange}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">한줄 메모</label>
                <input
                  type="text"
                  value={memo}
                  onChange={(e) => setMemo(e.target.value)}
                  placeholder="미션 완료 소감을 적어주세요"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-quest-purple/40"
                />
              </div>

              {error && (
                <p className="text-red-500 text-sm bg-red-50 rounded-lg px-3 py-2">{error}</p>
              )}

              <button
                type="submit"
                disabled={submitting || !photoFile}
                className="w-full bg-quest-purple hover:bg-purple-700 disabled:bg-quest-purple/30 text-white font-black py-3 rounded-xl transition-colors"
              >
                {submitting ? '제출 중...' : '✓ 인증 제출'}
              </button>
            </form>
          </div>
        ) : (
          <div className="bg-white rounded-2xl p-5 shadow-quest text-center">
            <div className="text-3xl mb-2">
              {mission.status === 'submitted' ? '⏳' : '✅'}
            </div>
            <p className="text-gray-500 text-sm font-semibold">
              {mission.status === 'submitted'
                ? '부모님의 승인을 기다리고 있어요'
                : '이미 완료된 미션입니다'}
            </p>
          </div>
        )}
      </div>
      <BottomNav role="child" />
    </div>
  );
}
