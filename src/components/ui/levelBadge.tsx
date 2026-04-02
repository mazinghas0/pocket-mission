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
      <span className="inline-flex items-center gap-1 bg-quest-gold/10 text-quest-gold border border-quest-gold/20 rounded-full px-2.5 py-0.5 text-xs font-bold">
        {level.emoji} Lv.{level.level}
      </span>
    );
  }

  const remaining = level.nextLevelPoints ? level.nextLevelPoints - points : 0;

  return (
    <div className="bg-white rounded-2xl p-4 shadow-quest">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-quest-gold/10 flex items-center justify-center text-2xl border border-quest-gold/20">
            {level.emoji}
          </div>
          <div>
            <p className="text-sm font-black text-quest-navy">Lv.{level.level} {level.title}</p>
            <p className="text-xs text-gray-400 mt-0.5">
              <span className="text-quest-gold font-bold">★</span>{' '}
              {formatPoints(points)} 획득
            </p>
          </div>
        </div>
        {level.nextLevelPoints && (
          <div className="text-right">
            <p className="text-xs text-gray-400">다음 레벨까지</p>
            <p className="text-xs font-black text-quest-coral">{formatPoints(remaining)}</p>
          </div>
        )}
      </div>
      {level.nextLevelPoints ? (
        <div>
          <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
            <div
              className="h-2.5 rounded-full transition-all duration-700"
              style={{
                width: `${level.progress}%`,
                background: 'linear-gradient(90deg, #F59E0B 0%, #FF6B35 100%)',
                boxShadow: '0 0 8px rgba(245, 158, 11, 0.45)',
              }}
            />
          </div>
          <p className="text-xs text-gray-400 mt-1 text-right">{Math.round(level.progress)}%</p>
        </div>
      ) : (
        <p className="text-xs font-black text-center text-quest-gold">★ MAX LEVEL ★</p>
      )}
    </div>
  );
}
