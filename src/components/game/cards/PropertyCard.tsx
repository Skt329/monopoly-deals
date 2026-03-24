import { cn } from '@/lib/utils';
import { type GameCard, type PropertyColor, COLOR_CONFIG, PROPERTY_SETS } from '@/data/cards';

interface PropertyCardProps {
  card: GameCard;
  onClick?: () => void;
  selected?: boolean;
  small?: boolean;
}

const COLOR_HEX: Record<PropertyColor, string> = {
  'brown': '#8B4513',
  'light-blue': '#87CEEB',
  'magenta': '#C71585',
  'orange': '#FF8C00',
  'red': '#DC143C',
  'yellow': '#FFD700',
  'green': '#228B22',
  'dark-blue': '#00008B',
  'railroad': '#2F2F2F',
  'utility': '#32CD32',
};

export function PropertyCard({ card, onClick, selected, small }: PropertyCardProps) {
  const color = card.chosenColor || card.color!;
  const config = COLOR_CONFIG[color];
  const rentTable = PROPERTY_SETS[color].rent;
  const setSize = PROPERTY_SETS[color].size;

  return (
    <div
      onClick={onClick}
      className={cn(
        'relative rounded-xl border-2 shadow-lg cursor-pointer transition-all duration-200 select-none overflow-hidden flex flex-col',
        'bg-white',
        small ? 'w-20 h-28' : 'w-36 h-52',
        selected && 'ring-2 ring-primary scale-105 -translate-y-2',
        onClick && 'hover:scale-105 hover:-translate-y-1'
      )}
      style={{ borderColor: COLOR_HEX[color] }}
    >
      {/* Value circle - top left */}
      <div className={cn(
        'absolute z-10 rounded-full font-black flex items-center justify-center border-2 border-white shadow-sm',
        config.bg, config.text,
        small ? 'top-0.5 left-0.5 w-5 h-5 text-[7px]' : 'top-1 left-1 w-7 h-7 text-[10px]'
      )}>
        {card.value}M
      </div>

      {/* Color band with property name */}
      <div className={cn(config.bg, config.text, 'text-center', small ? 'px-1 py-2 pt-3' : 'px-2 py-3 pt-5')}>
        <p className={cn('font-black uppercase tracking-wide leading-tight', small ? 'text-[6px]' : 'text-[11px]')}>
          {card.name}
        </p>
      </div>

      {/* Rent table section */}
      <div className={cn('flex-1 flex flex-col', small ? 'px-1 py-0.5' : 'px-3 py-1.5')}>
        {!small && (
          <>
            <div className="flex justify-between text-[7px] font-bold text-muted-foreground uppercase tracking-wider border-b border-border pb-0.5 mb-1">
              <span>Rent</span>
              <span>Owned</span>
            </div>
            <div className="space-y-0.5 flex-1">
              {Object.entries(rentTable).map(([count, rent]) => (
                <div key={count} className="flex items-center justify-between text-[9px]">
                  <span className="font-bold text-foreground">M{rent}</span>
                  <span className="flex gap-0.5">
                    {Array.from({ length: Number(count) }).map((_, i) => (
                      <span key={i} className={cn('w-2.5 h-3 rounded-[2px] inline-block border', config.bg)} 
                        style={{ borderColor: COLOR_HEX[color] }} />
                    ))}
                  </span>
                </div>
              ))}
            </div>
            {/* Complete set indicator */}
            <div className="text-center border-t border-border pt-1 mt-1">
              <span className="text-[7px] font-bold uppercase text-muted-foreground tracking-wider">
                Complete Set
              </span>
              <div className="flex justify-center gap-0.5 mt-0.5">
                {Array.from({ length: setSize }).map((_, i) => (
                  <span key={i} className={cn('rounded-sm border', config.bg, 'w-3 h-3.5')}
                    style={{ borderColor: COLOR_HEX[color], opacity: 0.5 }} />
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
