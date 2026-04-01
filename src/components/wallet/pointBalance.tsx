import { formatPoints } from '@/lib/utils';

interface PointBalanceProps {
  points: number;
  name?: string;
  pointRate?: number;
}

export function PointBalance({ points, name, pointRate = 1 }: PointBalanceProps) {
  const won = points * pointRate;
  return (
    <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl p-6 text-white text-center shadow-lg">
      {name && <p className="text-orange-100 text-sm mb-1">{name}의 포인트</p>}
      <p className="text-4xl font-bold tracking-tight">{formatPoints(points)}</p>
      <p className="text-orange-200 text-sm mt-1">{won.toLocaleString('ko-KR')}원</p>
      <p className="text-orange-100/60 text-xs mt-0.5">1P = {pointRate}원</p>
    </div>
  );
}
