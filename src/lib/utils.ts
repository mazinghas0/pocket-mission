import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { Timestamp } from 'firebase/firestore';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPoints(points: number): string {
  return `${points.toLocaleString('ko-KR')}P`;
}

export function formatPointsWithWon(points: number, rate: number): string {
  const won = points * rate;
  return `${points.toLocaleString('ko-KR')}P (${won.toLocaleString('ko-KR')}원)`;
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

// ── 레벨 시스템 ─────────────────────────────────────────

interface LevelInfo {
  level: number;
  title: string;
  emoji: string;
  currentPoints: number;
  nextLevelPoints: number | null;
  progress: number;
}

const LEVELS = [
  { min: 0, title: '새싹', emoji: '🌱' },
  { min: 100, title: '도전자', emoji: '🔥' },
  { min: 300, title: '습관왕', emoji: '👑' },
  { min: 700, title: '미션마스터', emoji: '🏆' },
  { min: 1500, title: '포켓히어로', emoji: '🦸' },
] as const;

export function getLevel(points: number): LevelInfo {
  let levelIdx = 0;
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (points >= LEVELS[i].min) { levelIdx = i; break; }
  }

  const current = LEVELS[levelIdx];
  const next = LEVELS[levelIdx + 1] ?? null;
  const progress = next
    ? Math.min(100, Math.round(((points - current.min) / (next.min - current.min)) * 100))
    : 100;

  return {
    level: levelIdx + 1,
    title: current.title,
    emoji: current.emoji,
    currentPoints: points,
    nextLevelPoints: next?.min ?? null,
    progress,
  };
}
