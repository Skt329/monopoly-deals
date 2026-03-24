import { cn } from '@/lib/utils';

interface CardBackProps {
  count?: number;
  small?: boolean;
  className?: string;
}

export function CardBack({ count, small, className }: CardBackProps) {
  return (
    <div className={cn('relative', className)}>
      <div
        className={cn(
          'rounded-xl border-2 border-border shadow-md select-none overflow-hidden flex flex-col items-center justify-center',
          'bg-gradient-to-br from-red-600 via-red-700 to-red-800',
          small ? 'w-14 h-20' : 'w-20 h-28'
        )}
      >
        {/* Decorative pattern */}
        <div className="absolute inset-1 border border-white/20 rounded-lg" />
        <div className="absolute inset-2 border border-white/10 rounded-md" />

        <span className={cn('font-bold text-white/90 tracking-wider', small ? 'text-[5px]' : 'text-[7px]')}>
          MONOPOLY
        </span>
        <span className={cn('font-bold text-white/70', small ? 'text-[4px]' : 'text-[5px]')}>
          DEAL
        </span>
      </div>
      {count !== undefined && count > 0 && (
        <div className={cn(
          'absolute -top-1 -right-1 rounded-full bg-primary text-primary-foreground font-bold flex items-center justify-center',
          small ? 'w-4 h-4 text-[8px]' : 'w-5 h-5 text-[10px]'
        )}>
          {count}
        </div>
      )}
    </div>
  );
}
