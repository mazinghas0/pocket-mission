import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getMissionStatusLabel, getMissionStatusColor, formatPoints, formatDate } from '@/lib/utils';
import type { Mission } from '@/types';

interface MissionCardProps {
  mission: Mission;
  onClick?: () => void;
}

export function MissionCard({ mission, onClick }: MissionCardProps) {
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
      </Card>
    </div>
  );
}
