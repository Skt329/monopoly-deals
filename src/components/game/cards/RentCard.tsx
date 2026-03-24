import { cn } from '@/lib/utils';
import { type GameCard, COLOR_CONFIG, type PropertyColor } from '@/data/cards';

interface RentCardProps {
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

export function RentCard({ card, onClick, selected, small }: RentCardProps) {
  const colors = card.colors || [];
  const isWild = colors.length > 2;

  return (
    <div
      onClick={onClick}
      className={cn(
        'relative rounded-xl border-2 shadow-lg cursor-pointer transition-all duration-200 select-none overflow-hidden flex flex-col bg-white',
        small ? 'w-20 h-28' : 'w-36 h-52',
        selected && 'ring-2 ring-primary scale-105 -translate-y-2',
        onClick && 'hover:scale-105 hover:-translate-y-1'
      )}
      style={{ borderColor: isWild ? '#FFD700' : COLOR_HEX[colors[0]] }}
    >
      {/* Value + ACTION label */}
      <div className={cn(
        'absolute z-10 rounded-full font-black flex items-center justify-center border-2 border-white shadow-sm text-white',
        small ? 'top-0.5 left-0.5 w-5 h-5 text-[7px]' : 'top-1 left-1 w-7 h-7 text-[10px]'
      )} style={{ backgroundColor: isWild ? '#FFD700' : COLOR_HEX[colors[0]] }}>
        M{card.value}
      </div>

      <div className={cn(
        'absolute z-10 font-black text-white rounded-bl-lg',
        small ? 'top-0 right-0 px-1 py-0.5 text-[5px]' : 'top-0 right-0 px-2 py-1 text-[8px]'
      )} style={{ backgroundColor: isWild ? '#FFD700' : COLOR_HEX[colors[0]] }}>
        ACTION
      </div>

      {/* Color band header */}
      {isWild ? (
        <div className={cn('text-center text-white font-black', small ? 'py-2 pt-4 text-[6px]' : 'py-3 pt-6 text-sm')}
          style={{ background: 'linear-gradient(135deg, #DC143C, #FF8C00, #FFD700, #228B22, #00008B)' }}>
          RENT
        </div>
      ) : (
        <div className="flex">
          {colors.map(color => (
            <div key={color} className={cn('flex-1 text-center text-white font-black', small ? 'py-2 pt-4 text-[6px]' : 'py-3 pt-6 text-sm')}
              style={{ backgroundColor: COLOR_HEX[color] }}>
              RENT
            </div>
          ))}
        </div>
      )}

      {/* Body */}
      <div className={cn('flex-1 flex flex-col items-center justify-center', small ? 'p-1' : 'p-2')}>
        {!small && (
          <>
            <p className="text-[8px] font-bold uppercase text-muted-foreground mb-1">
              {isWild ? 'Choose any color' : `Choose ${colors.map(c => COLOR_CONFIG[c].label).join(' or ')}`}
            </p>
            <div className="flex gap-1.5 mt-1">
              {colors.slice(0, isWild ? 5 : 2).map(color => (
                <span key={color} className="rounded-full w-5 h-5 border border-white shadow-sm"
                  style={{ backgroundColor: COLOR_HEX[color] }} />
              ))}
            </div>
            <p className="text-[7px] text-muted-foreground text-center mt-2 leading-tight">
              Collect rent from each player for each property you own in that color.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
