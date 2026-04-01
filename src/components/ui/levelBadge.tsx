'use client';

import { getLevel, formatPoints } from '@/lib/utils';

interface LevelBadgeProps {
  points: number;
  compact?: boolean;
}

export function LevelBadge({ points, compact = false }: LevelBadgeProps) {
  const level = getLevel(points);

  if (compact) {
    return (
      <span className="inline-flex items-center gap-1 bg-orange-100 text-orange-700 rounded-full px-2.5 py-0.5 text-xs font-semibold">
        {level.emoji} Lv.{level.level} {level.title}
      </span>
    );
  }

  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{level.emoji}</span>
          <div>
            <p className="text-sm font-bold text-gray-800">Lv.{level.level} {level.title}</p>
            <p className="text-xs text-gray-400">{formatPoints(points)} 획득</p>
          </div>
        </div>
        {level.nextLevelPoints && (
          <p className="text-xs text-gray-400">
            다음: {formatPoints(level.nextLevelPoints)}
          </p>
        )}
      </div>
      {level.nextLevelPoints && (
        <div className="w-full bg-gray-100 rounded-full h-2">
          <div
            className="bg-gradient-to-r from-orange-400 to-orange-500 h-2 rounded-full transition-all duration-500"
            style={{ width: `${level.progress}%` }}
          />
        </div>
      )}
      {!level.nextLevelPoints && (
        <p className="text-xs text-center text-orange-500 font-semibold">MAX LEVEL</p>
      )}
    </div>
  );
}
