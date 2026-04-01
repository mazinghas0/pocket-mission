'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Card } from '@/components/ui/card';
import { formatDateTime, formatPoints } from '@/lib/utils';
import type { SubmissionWithDetails } from '@/types';

interface SubmissionCardProps {
  submission: SubmissionWithDetails;
  onApprove?: (id: string) => void;
  onReject?: (id: string) => void;
}

export function SubmissionCard({ submission, onApprove, onReject }: SubmissionCardProps) {
  const [showPhoto, setShowPhoto] = useState(false);

  return (
    <>
    <Card>
      <div className="flex items-start justify-between gap-2 mb-3">
        <div>
          <h3 className="font-semibold text-gray-800">
            {submission.mission?.title ?? '미션'}
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            {submission.childProfile?.name} · {formatDateTime(submission.createdAt)}
          </p>
        </div>
        {submission.mission && (
          <span className="text-orange-600 font-bold text-sm shrink-0">
            {formatPoints(submission.mission.points)}
          </span>
        )}
      </div>

      {submission.photoUrl && (
        <div
          className="relative w-full h-48 rounded-xl overflow-hidden mb-3 cursor-pointer active:scale-[0.99] transition-transform"
          onClick={() => setShowPhoto(true)}
        >
          <Image
            src={submission.photoUrl}
            alt="인증 사진"
            fill
            className="object-cover"
          />
          <div className="absolute bottom-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded-lg">
            크게 보기
          </div>
        </div>
      )}

      {submission.memo && (
        <p className="text-sm text-gray-600 bg-gray-50 rounded-xl px-3 py-2 mb-3">
          {submission.memo}
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
            className="py-2.5 rounded-xl bg-green-500 hover:bg-green-600 text-white text-sm font-semibold transition-colors"
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
        <p className="text-sm text-green-600 bg-green-50 rounded-xl px-3 py-2 text-center font-medium">
          승인 완료
        </p>
      )}
    </Card>

    {showPhoto && submission.photoUrl && (
      <div
        className="fixed inset-0 bg-black/90 flex items-center justify-center z-50"
        onClick={() => setShowPhoto(false)}
      >
        <button
          className="absolute top-4 right-4 text-white text-2xl font-bold bg-black/50 rounded-full w-10 h-10 flex items-center justify-center"
          onClick={() => setShowPhoto(false)}
        >
          X
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
