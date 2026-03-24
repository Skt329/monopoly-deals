import { cn } from '@/lib/utils';
import { type GameCard, type PropertyColor, COLOR_CONFIG, PROPERTY_SETS } from '@/data/cards';

interface PropertyCardProps {
  card: GameCard;
  onClick?: () => void;
  selected?: boolean;
  small?: boolean;
}

export function PropertyCard({ card, onClick, selected, small }: PropertyCardProps) {
  const color = card.chosenColor || card.color!;
  const config = COLOR_CONFIG[color];
  const rentTable = PROPERTY_SETS[color].rent;
  const setSize = PROPERTY_SETS[color].size;

  return (
    <div
      onClick={onClick}
      className={cn(
        'relative rounded-xl border-2 border-border bg-card shadow-md cursor-pointer transition-all duration-200 select-none overflow-hidden',
        small ? 'w-20 h-28' : 'w-32 h-44',
        selected && 'ring-2 ring-primary scale-105 -translate-y-1',
        onClick && 'hover:scale-105 hover:-translate-y-1'
      )}
    >
      {/* Color header */}
      <div className={cn(config.bg, config.text, small ? 'px-1.5 py-1' : 'px-2.5 py-2')}>
        <p className={cn('font-bold leading-tight', small ? 'text-[7px]' : 'text-[10px]')}>
          {card.name}
        </p>
      </div>

      {/* Rent table */}
      <div className={cn('flex flex-col items-center justify-center flex-1', small ? 'px-1 py-0.5' : 'px-2 py-1.5')}>
        {!small && (
          <div className="w-full space-y-0.5">
            {Object.entries(rentTable).map(([count, rent]) => (
              <div key={count} className="flex items-center justify-between text-[8px] text-muted-foreground">
                <span className="flex gap-0.5">
                  {Array.from({ length: Number(count) }).map((_, i) => (
                    <span key={i} className={cn('w-2 h-2.5 rounded-[2px] inline-block', config.bg)} />
                  ))}
                </span>
                <span className="font-semibold text-foreground">{rent}M</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Value badge */}
      <div className={cn(
        'absolute rounded-full font-bold flex items-center justify-center bg-muted text-foreground',
        small ? 'top-0.5 right-0.5 w-4 h-4 text-[7px]' : 'top-1 right-1 w-5 h-5 text-[9px]'
      )}>
        {card.value}M
      </div>

      {/* Set size indicator */}
      <div className={cn('absolute bottom-0.5 left-0 right-0 flex justify-center gap-0.5')}>
        {Array.from({ length: setSize }).map((_, i) => (
          <span key={i} className={cn('rounded-full border', small ? 'w-1.5 h-1.5' : 'w-2 h-2', config.bg, 'opacity-40')} />
        ))}
      </div>
    </div>
  );
}
