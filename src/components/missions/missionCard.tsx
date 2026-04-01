import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getMissionStatusLabel, getMissionStatusColor, formatPoints, formatDate } from '@/lib/utils';
import type { Mission, MissionAssignment } from '@/types';

interface MissionCardProps {
  mission: Mission | MissionAssignment;
  onClick?: () => void;
  onDelete?: (missionId: string) => void;
  onEdit?: (mission: Mission | MissionAssignment) => void;
  showActions?: boolean;
}

export function MissionCard({ mission, onClick, onDelete, onEdit, showActions = false }: MissionCardProps) {
  const [confirming, setConfirming] = useState(false);

  return (
    <div
      className={onClick ? 'cursor-pointer active:scale-[0.99]' : ''}
      onClick={onClick}
    >
      <Card className="hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-800 truncate">{mission.title}</h3>
            {mission.description && (
              <p className="text-sm text-gray-500 mt-0.5 line-clamp-2">{mission.description}</p>
            )}
            {mission.dueDate && (
              <p className="text-xs text-gray-400 mt-1">마감: {formatDate(mission.dueDate)}</p>
            )}
          </div>

          <div className="flex flex-col items-end gap-2 shrink-0">
            <Badge className={getMissionStatusColor(mission.status)}>
              {getMissionStatusLabel(mission.status)}
            </Badge>
            <span className="text-orange-600 font-bold text-sm">
              {formatPoints(mission.points)}
            </span>
          </div>
        </div>

        {mission.isRecurring && (
          <div className="mt-2">
            <Badge className="bg-blue-50 text-blue-600">반복</Badge>
          </div>
        )}

        {showActions && (
          <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-2">
            {onEdit && mission.status === 'pending' && (
              <button
                onClick={(e) => { e.stopPropagation(); onEdit(mission); }}
                className="text-xs text-gray-500 hover:text-orange-500 transition-colors"
              >
                수정
              </button>
            )}
            {onDelete && !confirming && (
              <button
                onClick={(e) => { e.stopPropagation(); setConfirming(true); }}
                className="text-xs text-gray-500 hover:text-red-500 transition-colors"
              >
                삭제
              </button>
            )}
            {onDelete && confirming && (
              <>
                <span className="text-xs text-red-500">정말 삭제할까요?</span>
                <button
                  onClick={(e) => { e.stopPropagation(); onDelete(mission.id); }}
                  className="text-xs text-red-600 font-semibold"
                >
                  확인
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); setConfirming(false); }}
                  className="text-xs text-gray-400"
                >
                  취소
                </button>
              </>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}
