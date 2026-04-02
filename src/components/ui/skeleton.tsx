import { cn } from '@/lib/utils';

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div className={cn('animate-pulse rounded-xl bg-gray-200', className)} />
  );
}

export function CardSkeleton() {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm space-y-3">
      <Skeleton className="h-4 w-2/3" />
      <Skeleton className="h-3 w-1/2" />
      <Skeleton className="h-8 w-full" />
    </div>
  );
}

export function DashboardSkeleton({ color = 'orange' }: { color?: 'orange' | 'purple' }) {
  const bgClass = color === 'orange' ? 'bg-orange-50' : 'bg-purple-50';
  const headerClass = color === 'orange'
    ? 'bg-gradient-to-br from-orange-500 to-orange-600'
    : 'bg-gradient-to-br from-purple-500 to-purple-600';

  return (
    <div className={`min-h-screen ${bgClass}`}>
      <div className={`${headerClass} px-4 pt-12 pb-8`}>
        <Skeleton className="h-4 w-20 bg-white/20" />
        <Skeleton className="h-7 w-32 bg-white/30 mt-2" />
        <Skeleton className="h-3 w-40 bg-white/20 mt-3" />
      </div>
      <div className="px-4 -mt-4 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <CardSkeleton />
          <CardSkeleton />
        </div>
        <CardSkeleton />
      </div>
    </div>
  );
}

export function StatsSkeleton() {
  return (
    <div className="min-h-screen bg-orange-50">
      <div className="bg-gradient-to-br from-orange-500 to-orange-600 px-4 pt-12 pb-8">
        <Skeleton className="h-7 w-16 bg-white/30" />
        <Skeleton className="h-3 w-32 bg-white/20 mt-2" />
      </div>
      <div className="px-4 -mt-4 space-y-4">
        <div className="grid grid-cols-3 gap-3">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
        <CardSkeleton />
        <CardSkeleton />
      </div>
    </div>
  );
}

export function ListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-white rounded-2xl p-4 shadow-sm flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-full flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}
