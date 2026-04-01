'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { onAuthChange } from '@/lib/firebase/auth';
import {
  getProfile, getPendingFamilySubmissions,
  approveSubmission, rejectSubmission,
} from '@/lib/firebase/db';
import { SubmissionCard } from '@/components/missions/submissionCard';
import type { SubmissionWithDetails } from '@/types';

export default function ApprovalsPage() {
  const router = useRouter();
  const [submissions, setSubmissions] = useState<SubmissionWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [rejectTarget, setRejectTarget] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [processing, setProcessing] = useState(false);
  const [parentUid, setParentUid] = useState('');
  const [familyId, setFamilyId] = useState('');

  const fetchSubmissions = useCallback(async (fid: string) => {
    setLoading(true);
    const data = await getPendingFamilySubmissions(fid);
    setSubmissions(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    const unsub = onAuthChange(async (user) => {
      if (!user) { router.push('/login'); return; }
      const profile = await getProfile(user.uid);
      if (!profile?.familyId || profile.role !== 'parent') { router.push('/parent'); return; }
      setParentUid(user.uid);
      setFamilyId(profile.familyId);
      await fetchSubmissions(profile.familyId);
    });
    return () => unsub();
  }, [router, fetchSubmissions]);

  async function handleApprove(submissionId: string) {
    setProcessing(true);
    const sub = submissions.find(s => s.id === submissionId);
    if (!sub?.mission) { setProcessing(false); return; }
    await approveSubmission(sub.mission.id, submissionId, sub.childId, sub.mission.points, parentUid);
    await fetchSubmissions(familyId);
    setProcessing(false);
  }

  async function handleReject(submissionId: string) {
    if (!rejectReason.trim()) return;
    setProcessing(true);
    const sub = submissions.find(s => s.id === submissionId);
    if (!sub?.mission) { setProcessing(false); return; }
    await rejectSubmission(sub.mission.id, submissionId, parentUid, rejectReason);
    setRejectTarget(null);
    setRejectReason('');
    await fetchSubmissions(familyId);
    setProcessing(false);
  }

  return (
    <div className="min-h-screen bg-orange-50 pb-20">
      <div className="bg-white px-4 pt-12 pb-4 shadow-sm">
        <div className="flex items-center gap-3 mb-1">
          <Link href="/parent" className="text-gray-500 text-sm">← 뒤로</Link>
        </div>
        <h1 className="font-bold text-gray-800 text-lg">인증 승인</h1>
        <p className="text-sm text-gray-500">자녀들의 미션 인증을 확인하세요</p>
      </div>

      <div className="px-4 mt-4 space-y-3">
        {loading ? (
          <p className="text-center text-gray-400 py-10 text-sm">불러오는 중...</p>
        ) : submissions.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <div className="text-4xl mb-3">✅</div>
            <p className="text-sm">인증 대기 중인 미션이 없습니다</p>
          </div>
        ) : (
          submissions.map((submission) => (
            <SubmissionCard
              key={submission.id}
              submission={submission}
              onApprove={handleApprove}
              onReject={(id) => setRejectTarget(id)}
            />
          ))
        )}
      </div>

      {rejectTarget && (
        <div className="fixed inset-0 bg-black/40 flex items-end justify-center z-50">
          <div className="bg-white rounded-t-2xl w-full max-w-lg p-6">
            <h3 className="font-semibold text-gray-800 mb-3">반려 사유 입력</h3>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="자녀에게 전달할 반려 사유를 입력하세요"
              rows={3}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 resize-none mb-4"
            />
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => { setRejectTarget(null); setRejectReason(''); }}
                className="py-3 rounded-xl border-2 border-gray-200 text-gray-600 text-sm font-semibold"
              >
                취소
              </button>
              <button
                onClick={() => handleReject(rejectTarget)}
                disabled={processing || !rejectReason.trim()}
                className="py-3 rounded-xl bg-red-500 hover:bg-red-600 disabled:bg-red-300 text-white text-sm font-semibold transition-colors"
              >
                {processing ? '처리 중...' : '반려하기'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
