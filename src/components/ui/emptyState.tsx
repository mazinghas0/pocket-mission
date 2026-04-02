import Link from 'next/link';

interface EmptyStateProps {
  emoji: string;
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
}

export function EmptyState({ emoji, title, description, actionLabel, actionHref }: EmptyStateProps) {
  return (
    <div className="bg-white rounded-2xl shadow-sm p-8 text-center">
      <div className="text-5xl mb-4">{emoji}</div>
      <h3 className="font-bold text-gray-800 mb-1">{title}</h3>
      <p className="text-sm text-gray-500 mb-4">{description}</p>
      {actionLabel && actionHref && (
        <Link
          href={actionHref}
          className="inline-block bg-orange-500 hover:bg-orange-600 text-white font-semibold text-sm px-5 py-2.5 rounded-xl transition-colors"
        >
          {actionLabel}
        </Link>
      )}
    </div>
  );
}
