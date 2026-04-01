import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { Timestamp } from 'firebase/firestore';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPoints(points: number): string {
  return `${points.toLocaleString('ko-KR')}P`;
}

function toDate(value: Timestamp | string | Date): Date {
  if (typeof value === 'string') return new Date(value);
  if (value instanceof Date) return value;
  return value.toDate();
}

export function formatDate(value: Timestamp | string | Date): string {
  return toDate(value).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function formatDateTime(value: Timestamp | string | Date): string {
  return toDate(value).toLocaleString('ko-KR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function getMissionStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    pending: '대기중',
    in_progress: '진행중',
    submitted: '인증대기',
    approved: '완료',
    rejected: '반려',
  };
  return labels[status] ?? status;
}

export function getMissionStatusColor(status: string): string {
  const colors: Record<string, string> = {
    pending: 'bg-gray-100 text-gray-700',
    in_progress: 'bg-blue-100 text-blue-700',
    submitted: 'bg-yellow-100 text-yellow-700',
    approved: 'bg-green-100 text-green-700',
    rejected: 'bg-red-100 text-red-700',
  };
  return colors[status] ?? 'bg-gray-100 text-gray-700';
}
