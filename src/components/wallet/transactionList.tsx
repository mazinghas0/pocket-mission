import { formatPoints, formatDateTime } from '@/lib/utils';
import type { PointTransaction } from '@/types';

interface TransactionListProps {
  transactions: PointTransaction[];
}

function getTransactionLabel(type: string): string {
  const labels: Record<string, string> = {
    earned: '미션 완료',
    requested: '출금 요청',
    paid: '출금 완료',
  };
  return labels[type] ?? type;
}

function getTransactionColor(type: string, amount: number): string {
  if (amount > 0) return 'text-green-600';
  return 'text-red-500';
}

export function TransactionList({ transactions }: TransactionListProps) {
  if (transactions.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400 text-sm">
        포인트 이력이 없습니다.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {transactions.map((tx) => (
        <div
          key={tx.id}
          className="flex items-center justify-between bg-white rounded-xl px-4 py-3"
        >
          <div>
            <p className="text-sm font-medium text-gray-800">
              {tx.description || getTransactionLabel(tx.type)}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">{formatDateTime(tx.created_at)}</p>
          </div>
          <span className={`font-bold text-sm ${getTransactionColor(tx.type, tx.amount)}`}>
            {tx.amount > 0 ? '+' : ''}{formatPoints(tx.amount)}
          </span>
        </div>
      ))}
    </div>
  );
}
