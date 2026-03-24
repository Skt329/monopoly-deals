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
  'green': '#228B22', 'dark-blue': '#4169E1', 'railroad': '#2F2F2F', 'utility': '#32CD32',
};

export function WildPropertyCard({ card, onClick, selected, small }: WildPropertyCardProps) {
  const colors = card.colors || [];
  const isRainbow = colors.length > 2;

  if (isRainbow) {
    return (
      <div
        onClick={onClick}
        className={cn(
          'relative rounded-xl shadow-lg cursor-pointer transition-all duration-200 select-none overflow-hidden flex flex-col',
          small ? 'w-20 h-28' : 'w-36 h-52',
          selected && 'ring-2 ring-primary scale-105 -translate-y-2',
          onClick && 'hover:scale-105 hover:-translate-y-1'
        )}
        style={{ border: '2px solid #333' }}
      >
        {/* Rainbow top half - dark with rainbow text */}
        <div className={cn('flex flex-col items-center justify-center text-center', small ? 'py-2 px-1' : 'py-3 px-2')}
          style={{ backgroundColor: '#1a1a2e', flex: '0 0 55%' }}>
          <span className={cn('font-black uppercase', small ? 'text-[8px]' : 'text-lg')}
            style={{ background: 'linear-gradient(90deg, #DC143C, #FF8C00, #FFD700, #228B22, #4169E1, #C71585)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            WILD
          </span>
          <span className={cn('font-black uppercase', small ? 'text-[6px]' : 'text-sm')}
            style={{ background: 'linear-gradient(90deg, #228B22, #4169E1, #C71585, #DC143C)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            PROPERTY
          </span>
          {!small && (
            <p className="text-white font-bold text-[8px] mt-1 uppercase">
              USE THIS CARD AS<br/>PART OF ANY SET
            </p>
          )}
        </div>

        {/* Bottom half - light with color dots */}
        <div className="flex-1 bg-[#F5F0E8] flex flex-col items-center justify-center px-2">
          {!small && (
            <div className="flex flex-wrap gap-1 justify-center">
              {colors.map(c => (
                <span key={c} className="w-3 h-3 rounded-full border border-white shadow-sm"
                  style={{ backgroundColor: COLOR_HEX[c] }} />
              ))}
            </div>
          )}
        </div>

        {card.chosenColor && (
          <div className="text-center font-bold text-white text-[7px] py-0.5" style={{ backgroundColor: COLOR_HEX[card.chosenColor] }}>
            → {COLOR_CONFIG[card.chosenColor].label}
          </div>
        )}
      </div>
    );
  }

  // Two-color wild
  return (
    <div
      onClick={onClick}
      className={cn(
        'relative rounded-xl shadow-lg cursor-pointer transition-all duration-200 select-none overflow-hidden flex flex-col bg-[#F5F0E8]',
        small ? 'w-20 h-28' : 'w-36 h-52',
        selected && 'ring-2 ring-primary scale-105 -translate-y-2',
        onClick && 'hover:scale-105 hover:-translate-y-1'
      )}
      style={{ border: `2px solid ${COLOR_HEX[colors[0]]}` }}
    >
      {/* Header */}
      <div className={cn('text-center text-white font-black uppercase', small ? 'py-1 text-[5px]' : 'py-1.5 text-[9px]')}
        style={{ background: `linear-gradient(90deg, ${COLOR_HEX[colors[0]]}, ${COLOR_HEX[colors[1]]})` }}>
        WILD PROPERTY
        {!small && <p className="text-[7px] font-bold opacity-90">CHOOSE ONE COLOR</p>}
      </div>

      {/* Value circle */}
      <div className={cn(
        'absolute z-10 rounded-full font-black flex items-center justify-center bg-white',
        small ? 'top-0.5 left-0.5 w-5 h-5 text-[7px]' : 'top-1 left-1 w-7 h-7 text-[9px]'
      )} style={{ border: '2px solid #333', color: '#333' }}>
        M{card.value}
      </div>

      {/* Two rent tables side by side */}
      <div className={cn('flex-1 flex', small ? 'p-0.5' : 'p-1')}>
        {!small && colors.map(color => {
          const rentTable = PROPERTY_SETS[color].rent;
          const setSize = PROPERTY_SETS[color].size;
          return (
            <div key={color} className="flex-1 px-1 flex flex-col">
              <div className="text-[6px] font-black text-center mb-0.5 uppercase tracking-wider"
                style={{ color: COLOR_HEX[color] }}>
                {COLOR_CONFIG[color].label}
              </div>
              <div className="flex-1">
                {Object.entries(rentTable).map(([count, rent]) => (
                  <div key={count} className="flex justify-between text-[7px] py-0.5">
                    <div className="flex items-center gap-0.5">
                      {Array.from({ length: Number(count) }).map((_, i) => (
                        <div key={i} className="w-2 h-2.5 rounded-[1px]" style={{ backgroundColor: COLOR_HEX[color] }} />
                      ))}
                    </div>
                    <span className="font-black">M{rent}</span>
                  </div>
                ))}
              </div>
              <div className="text-[5px] text-center font-bold uppercase" style={{ color: '#888' }}>
                Set: {setSize}
              </div>
            </div>
          );
        })}
        {small && (
          <div className="flex-1 flex items-center justify-center">
            <div className="flex gap-0.5">
              {colors.map(c => (
                <span key={c} className="w-3 h-3 rounded-full" style={{ backgroundColor: COLOR_HEX[c] }} />
              ))}
            </div>
          </div>
        )}
      </div>

      {card.chosenColor && (
        <div className="text-center font-bold text-white text-[7px] py-0.5" style={{ backgroundColor: COLOR_HEX[card.chosenColor] }}>
          → {COLOR_CONFIG[card.chosenColor].label}
        </div>
      )}
    </div>
  );
}
