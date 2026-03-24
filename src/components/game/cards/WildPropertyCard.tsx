import { cn } from '@/lib/utils';
import { type GameCard, COLOR_CONFIG, type PropertyColor, PROPERTY_SETS } from '@/data/cards';

interface WildPropertyCardProps {
  card: GameCard;
  onClick?: () => void;
  selected?: boolean;
  small?: boolean;
}

const COLOR_HEX: Record<PropertyColor, string> = {
  'brown': '#8B4513', 'light-blue': '#87CEEB', 'magenta': '#C71585',
  'orange': '#FF8C00', 'red': '#DC143C', 'yellow': '#FFD700',
  'green': '#228B22', 'dark-blue': '#00008B', 'railroad': '#2F2F2F', 'utility': '#32CD32',
};

export function WildPropertyCard({ card, onClick, selected, small }: WildPropertyCardProps) {
  const colors = card.colors || [];
  const isRainbow = colors.length > 2;

  return (
    <div
      onClick={onClick}
      className={cn(
        'relative rounded-xl border-2 shadow-lg cursor-pointer transition-all duration-200 select-none overflow-hidden flex flex-col bg-white',
        small ? 'w-20 h-28' : 'w-36 h-52',
        selected && 'ring-2 ring-primary scale-105 -translate-y-2',
        onClick && 'hover:scale-105 hover:-translate-y-1'
      )}
      style={{ borderColor: isRainbow ? '#FFD700' : COLOR_HEX[colors[0]] }}
    >
      {/* Value circle */}
      <div className={cn(
        'absolute z-10 rounded-full font-black flex items-center justify-center border-2 border-white shadow-sm text-white',
        small ? 'top-0.5 left-0.5 w-5 h-5 text-[7px]' : 'top-1 left-1 w-7 h-7 text-[10px]'
      )} style={{ backgroundColor: isRainbow ? '#FFD700' : COLOR_HEX[colors[0]] }}>
        M{card.value}
      </div>

      {/* Split/rainbow header */}
      {isRainbow ? (
        <div className={cn(
          'text-center text-white font-black uppercase',
          small ? 'py-2 pt-4 text-[6px]' : 'py-3 pt-6 text-[11px]'
        )} style={{ background: 'linear-gradient(135deg, #DC143C, #FF8C00, #FFD700, #228B22, #00008B, #C71585)' }}>
          Wild Property
          {!small && <p className="text-[8px] font-bold opacity-80 mt-0.5">CHOOSE ONE COLOR</p>}
        </div>
      ) : (
        <div className="flex">
          {colors.map((color, i) => (
            <div key={color} className={cn('flex-1 text-center text-white font-black uppercase', small ? 'py-2 pt-4 text-[5px]' : 'py-3 pt-6 text-[9px]')}
              style={{ backgroundColor: COLOR_HEX[color] }}>
              {i === 0 && 'WILD'}
              {i === 1 && 'CARD'}
            </div>
          ))}
        </div>
      )}

      {/* Rent tables for both colors */}
      <div className={cn('flex-1 flex', small ? 'p-0.5' : 'p-1')}>
        {!small && !isRainbow && colors.map(color => {
          const rentTable = PROPERTY_SETS[color].rent;
          const setSize = PROPERTY_SETS[color].size;
          return (
            <div key={color} className="flex-1 px-1">
              <div className="text-[6px] font-bold text-center mb-0.5 uppercase" style={{ color: COLOR_HEX[color] }}>
                {COLOR_CONFIG[color].label}
              </div>
              {Object.entries(rentTable).map(([count, rent]) => (
                <div key={count} className="flex justify-between text-[7px]">
                  <span className="font-bold">M{rent}</span>
                  <span className="text-muted-foreground">{count}</span>
                </div>
              ))}
              <div className="text-[5px] text-center mt-0.5 text-muted-foreground">Set: {setSize}</div>
            </div>
          );
        })}
        {!small && isRainbow && (
          <div className="flex-1 flex flex-wrap items-center justify-center gap-1 p-1">
            {colors.slice(0, 10).map(color => (
              <span key={color} className="w-3 h-3 rounded-full border border-white shadow-sm"
                style={{ backgroundColor: COLOR_HEX[color] }} />
            ))}
            <p className="w-full text-[7px] text-center text-muted-foreground font-bold mt-1">Any Color</p>
          </div>
        )}
      </div>

      {card.chosenColor && (
        <div className={cn('text-center font-bold text-white text-[7px] py-0.5')} style={{ backgroundColor: COLOR_HEX[card.chosenColor] }}>
          → {COLOR_CONFIG[card.chosenColor].label}
        </div>
      )}
    </div>
  );
}
