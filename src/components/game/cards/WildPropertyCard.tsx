import { cn } from '@/lib/utils';
import { type GameCard, COLOR_CONFIG } from '@/data/cards';

interface WildPropertyCardProps {
  card: GameCard;
  onClick?: () => void;
  selected?: boolean;
  small?: boolean;
}

export function WildPropertyCard({ card, onClick, selected, small }: WildPropertyCardProps) {
  const colors = card.colors || [];
  const isRainbow = colors.length > 2;

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
      {/* Multi-color header */}
      {isRainbow ? (
        <div className={cn(
          'bg-gradient-to-r from-red-500 via-yellow-400 via-green-500 via-blue-500 to-purple-500 text-white',
          small ? 'px-1.5 py-1' : 'px-2.5 py-2'
        )}>
          <p className={cn('font-bold leading-tight', small ? 'text-[7px]' : 'text-[10px]')}>
            Wild Card
          </p>
        </div>
      ) : (
        <div className="flex">
          {colors.map((color, i) => {
            const config = COLOR_CONFIG[color];
            return (
              <div key={color} className={cn(config.bg, config.text, 'flex-1', small ? 'px-1 py-1' : 'px-1.5 py-2')}>
                {i === 0 && (
                  <p className={cn('font-bold leading-tight', small ? 'text-[6px]' : 'text-[9px]')}>
                    WILD
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Body */}
      <div className={cn('flex-1 flex flex-col items-center justify-center gap-1', small ? 'p-1' : 'p-2')}>
        {!small && (
          <>
            <div className="flex gap-1 flex-wrap justify-center">
              {colors.slice(0, isRainbow ? 5 : 2).map(color => {
                const config = COLOR_CONFIG[color];
                return (
                  <span key={color} className={cn('rounded-full', config.bg, 'w-4 h-4')} />
                );
              })}
              {isRainbow && colors.length > 5 && (
                <span className="text-[8px] text-muted-foreground">+{colors.length - 5}</span>
              )}
            </div>
            <p className="text-[8px] text-muted-foreground text-center font-medium mt-1">
              {isRainbow ? 'Any Color' : colors.map(c => COLOR_CONFIG[c].label).join(' / ')}
            </p>
          </>
        )}

        {card.chosenColor && (
          <div className={cn('rounded-md px-2 py-0.5 text-[7px] font-bold', COLOR_CONFIG[card.chosenColor].bg, COLOR_CONFIG[card.chosenColor].text)}>
            → {COLOR_CONFIG[card.chosenColor].label}
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
    </div>
  );
}
