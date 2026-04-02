import { cn } from '@/lib/utils';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'gold' | 'coral' | 'purple';
}

export function Card({ children, className, variant }: CardProps) {
  return (
    <div className={cn(
      'bg-white rounded-2xl p-4 shadow-quest',
      variant === 'gold' && 'border border-quest-gold/20',
      variant === 'coral' && 'border border-quest-coral/20',
      variant === 'purple' && 'border border-quest-purple/20',
      className
    )}>
      {children}
    </div>
  );
}
