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
          'rounded-xl border-2 border-red-800 shadow-lg select-none overflow-hidden flex flex-col items-center justify-center',
          'bg-gradient-to-br from-red-600 via-red-700 to-red-900 w-full h-full min-w-[3.5rem] min-h-[5rem]',
          !className?.includes('w-') && (small ? 'w-14 h-20' : 'w-20 h-28 md:w-32 md:h-44')
        )}
      >
        <div className="absolute inset-1 border-2 border-white/20 rounded-lg" />
        <div className="absolute inset-2.5 border border-yellow-400/30 rounded-md" />

        <span className={cn('font-black text-yellow-300 tracking-[0.15em]', small ? 'text-[5px]' : 'text-[8px]')}>
          MONOPOLY
        </span>
        <span className={cn('font-black text-white/90', small ? 'text-[4px]' : 'text-[6px]')}>
          DEAL
        </span>
      </div>
      {count !== undefined && count > 0 && (
        <div className={cn(
          'absolute -top-1 -right-1 rounded-full bg-primary text-primary-foreground font-bold flex items-center justify-center shadow-md',
          small ? 'w-4 h-4 text-[8px]' : 'w-6 h-6 text-[10px]'
        )}>
          {count}
        </div>
      )}
    </div>
  );
}
