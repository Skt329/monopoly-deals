import { cn } from '@/lib/utils';
import { type GameCard, COLOR_CONFIG } from '@/data/cards';

interface RentCardProps {
  card: GameCard;
  onClick?: () => void;
  selected?: boolean;
  small?: boolean;
}

export function RentCard({ card, onClick, selected, small }: RentCardProps) {
  const colors = card.colors || [];
  const isWild = colors.length > 2;

  return (
    <div
      onClick={onClick}
      className={cn(
        'relative rounded-xl border-2 border-border bg-card shadow-md cursor-pointer transition-all duration-200 select-none overflow-hidden flex flex-col',
        small ? 'w-20 h-28' : 'w-32 h-44',
        selected && 'ring-2 ring-primary scale-105 -translate-y-1',
        onClick && 'hover:scale-105 hover:-translate-y-1'
      )}
    >
      {/* Header */}
      <div className={cn(
        'text-white font-bold',
        isWild
          ? 'bg-gradient-to-r from-red-500 via-yellow-400 to-blue-500'
          : 'flex',
        small ? 'py-1' : 'py-1.5'
      )}>
        {isWild ? (
          <p className={cn('text-center', small ? 'text-[7px] px-1' : 'text-[10px] px-2')}>RENT</p>
        ) : (
          colors.map((color) => {
            const config = COLOR_CONFIG[color];
            return (
              <div key={color} className={cn(config.bg, config.text, 'flex-1 text-center', small ? 'py-0' : 'py-0')}>
                <p className={cn(small ? 'text-[6px]' : 'text-[9px]')}>RENT</p>
              </div>
            );
          })
        )}
      </div>

      {/* Body */}
      <div className={cn('flex-1 flex flex-col items-center justify-center', small ? 'p-1' : 'p-2')}>
        {!small && (
          <>
            <div className="flex gap-1.5 mb-1">
              {colors.slice(0, 4).map(color => (
                <span key={color} className={cn('rounded-full', COLOR_CONFIG[color].bg, 'w-4 h-4')} />
              ))}
            </div>
            <p className="text-[8px] text-muted-foreground text-center font-medium">
              {isWild ? 'Charge any color' : `Charge ${colors.map(c => COLOR_CONFIG[c].label).join(' or ')} rent`}
            </p>
          </>
        )}
      </div>

      {/* Value */}
      <div className={cn(
        'absolute rounded-full font-bold flex items-center justify-center bg-muted text-foreground',
        small ? 'top-0.5 right-0.5 w-4 h-4 text-[7px]' : 'top-1 right-1 w-5 h-5 text-[9px]'
      )}>
        {card.value}M
      </div>
    </div>
  );
}
