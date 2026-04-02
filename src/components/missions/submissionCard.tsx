'use client';

import { useState } from 'react';
import Image from 'next/image';
import { formatDateTime, formatPoints } from '@/lib/utils';
import type { AssignmentWithDetails } from '@/types';

interface SubmissionCardProps {
  submission: AssignmentWithDetails;
  onApprove?: (id: string) => void;
  onReject?: (id: string) => void;
}

export function SubmissionCard({ submission, onApprove, onReject }: SubmissionCardProps) {
  const [showPhoto, setShowPhoto] = useState(false);

  return (
    <>
      <div className="bg-white rounded-2xl shadow-quest p-4">
        <div className="flex items-start justify-between gap-2 mb-3">
          <div>
            <h3 className="font-bold text-quest-navy">
              {submission.assignment?.title ?? '미션'}
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">
              {submission.childProfile?.name} · {formatDateTime(submission.createdAt)}
            </p>
          </div>
          {submission.assignment && (
            <span className="text-quest-gold font-black text-sm shrink-0">
              ★ {formatPoints(submission.assignment.points)}
            </span>
          )}
        </div>

        {submission.photoUrl && (
          <div
            className="relative w-full h-48 rounded-xl overflow-hidden mb-3 cursor-pointer quest-card-press"
            onClick={() => setShowPhoto(true)}
          >
            <Image
              src={submission.photoUrl}
              alt="인증 사진"
              fill
              className="object-cover"
            />
            <div className="absolute bottom-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded-lg backdrop-blur-sm">
              크게 보기
            </div>
          </div>
        )}

        {submission.memo && (
          <p className="text-sm text-gray-600 bg-gray-50 rounded-xl px-3 py-2 mb-3">
            &ldquo;{submission.memo}&rdquo;
          </p>
        )}

        {submission.status === 'pending' && onApprove && onReject && (
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => onReject(submission.id)}
              className="py-2.5 rounded-xl border-2 border-red-200 text-red-500 text-sm font-semibold hover:bg-red-50 transition-colors"
            >
              반려
            </button>
            <button
              onClick={() => onApprove(submission.id)}
              className="py-2.5 rounded-xl bg-quest-mint hover:bg-emerald-600 text-white text-sm font-semibold transition-colors"
            >
              승인
            </button>
          </div>
        )}

        {submission.status === 'rejected' && submission.rejectionReason && (
          <p className="text-sm text-red-500 bg-red-50 rounded-xl px-3 py-2">
            반려 사유: {submission.rejectionReason}
          </p>
        )}

        {submission.status === 'approved' && (
          <p className="text-sm text-quest-mint bg-quest-mint/10 rounded-xl px-3 py-2 text-center font-bold">
            ✓ 승인 완료
          </p>
        )}
      </div>

      {showPhoto && submission.photoUrl && (
        <div
          className="fixed inset-0 bg-black/90 flex items-center justify-center z-50"
          onClick={() => setShowPhoto(false)}
        >
          <button
            className="absolute top-4 right-4 text-white text-lg font-bold bg-white/10 rounded-full w-10 h-10 flex items-center justify-center backdrop-blur-sm"
            onClick={() => setShowPhoto(false)}
          >
            ✕
          </button>
          <div className="relative w-full h-full max-w-lg max-h-[80vh] m-4">
            <Image
              src={submission.photoUrl}
              alt="인증 사진"
              fill
              className="object-contain"
            />
          </div>
        </div>
      )}
    </>
  );
}
