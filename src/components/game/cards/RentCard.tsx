import { cn } from '@/lib/utils';
import { type GameCard, COLOR_CONFIG, type PropertyColor } from '@/data/cards';

interface RentCardProps {
  card: GameCard;
  onClick?: () => void;
  selected?: boolean;
}

const COLOR_HEX: Record<PropertyColor, string> = {
  'brown': '#8B4513', 'light-blue': '#87CEEB', 'magenta': '#C71585',
  'orange': '#FF8C00', 'red': '#DC143C', 'yellow': '#FFD700',
  'green': '#228B22', 'dark-blue': '#4169E1', 'railroad': '#2F2F2F', 'utility': '#32CD32',
};

export function RentCard({ card, onClick, selected }: RentCardProps) {
  const colors = card.colors || [];
  const isWild = colors.length > 2;

  return (
    <div
      onClick={onClick}
      className={cn(
        'relative rounded-xl shadow-lg cursor-pointer transition-all duration-200 select-none overflow-hidden flex flex-col bg-[#F5F0E8] w-36 h-52',
        selected && 'ring-2 ring-primary scale-105 -translate-y-2',
        onClick && 'hover:scale-105 hover:-translate-y-1'
      )}
      style={{ border: '2px solid #999' }}
    >
      {/* Top row: value circle + ACTION banner */}
      <div className="flex items-start justify-between p-1.5">
        <div className="w-8 h-8 text-xs rounded-full font-black flex items-center justify-center bg-white"
          style={{ border: '2px solid #333', color: '#333' }}>
          <span className="text-[5px] align-top">M</span>{card.value}
        </div>
        <div className="font-black italic text-white px-2 py-0.5 text-sm"
          style={{ backgroundColor: '#333', clipPath: 'polygon(10% 0, 100% 0, 100% 100%, 0% 100%)' }}>
          ACTION
        </div>
      </div>

      {/* Inner bordered area */}
      <div className="flex-1 flex flex-col items-center mx-2 mb-1"
        style={{ border: '2px solid #333' }}>
        
        {/* RENT text above circle */}
        <span className="font-black uppercase text-sm mt-1" style={{ color: '#333' }}>
          RENT
        </span>

        {/* Split-color circle */}
        <div className="rounded-full overflow-hidden relative flex items-center justify-center w-20 h-20"
          style={{ border: '3px solid #333' }}>
          {isWild ? (
            <div className="w-full h-full" style={{
              background: `conic-gradient(${colors.slice(0, 8).map((c, i) => `${COLOR_HEX[c]} ${i * (360/8)}deg ${(i+1) * (360/8)}deg`).join(', ')})`
            }} />
          ) : (
            <div className="w-full h-full flex">
              <div className="w-1/2 h-full" style={{ backgroundColor: COLOR_HEX[colors[0]] }} />
              <div className="w-1/2 h-full" style={{ backgroundColor: COLOR_HEX[colors[1]] }} />
            </div>
          )}
          <span className="absolute text-2xl">💵</span>
        </div>

        {/* Choose color text */}
        <p className="text-[7px] font-bold uppercase text-center mt-1 px-1" style={{ color: '#333' }}>
          {isWild
            ? 'CHOOSE ANY COLOR'
            : `CHOOSE ${COLOR_CONFIG[colors[0]].label.toUpperCase()} OR ${COLOR_CONFIG[colors[1]].label.toUpperCase()}`}
        </p>
      </div>

      {/* Description */}
      <p className="text-[7px] text-center px-2 pb-1 leading-tight" style={{ color: '#555' }}>
        Collect rent from each player for each property you own in that color.
      </p>
    </div>
  );
}
