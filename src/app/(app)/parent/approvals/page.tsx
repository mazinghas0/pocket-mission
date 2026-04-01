'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { SubmissionCard } from '@/components/missions/submissionCard';
import type { SubmissionWithDetails } from '@/types';

export default function ApprovalsPage() {
  const [submissions, setSubmissions] = useState<SubmissionWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [rejectTarget, setRejectTarget] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [processing, setProcessing] = useState(false);

  const fetchSubmissions = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: profile } = await supabase
      .from('profiles')
      .select('family_id')
      .eq('user_id', user.id)
      .single();

    if (!profile?.family_id) return;

    const { data } = await supabase
      .from('mission_submissions')
      .select(`
        *,
        mission:missions(*),
        child_profile:profiles!child_id(*)
      `)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    setSubmissions((data as SubmissionWithDetails[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchSubmissions();
  }, [fetchSubmissions]);

  async function handleApprove(submissionId: string) {
    setProcessing(true);
    const response = await fetch(`/api/submissions/${submissionId}/review`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'approve' }),
    });

    if (response.ok) {
      await fetchSubmissions();
    }
    setProcessing(false);
  }

  async function handleReject(submissionId: string) {
    if (!rejectReason.trim()) return;
    setProcessing(true);

    const response = await fetch(`/api/submissions/${submissionId}/review`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'reject', reason: rejectReason }),
    });

    if (response.ok) {
      setRejectTarget(null);
      setRejectReason('');
      await fetchSubmissions();
    }
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

      {/* 반려 모달 */}
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
