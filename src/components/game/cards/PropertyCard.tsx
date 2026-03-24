import { cn } from '@/lib/utils';
import { type GameCard, type PropertyColor, PROPERTY_SETS } from '@/data/cards';

interface PropertyCardProps {
  card: GameCard;
  onClick?: () => void;
  selected?: boolean;
}

const COLOR_HEX: Record<PropertyColor, string> = {
  'brown': '#8B4513', 'light-blue': '#87CEEB', 'magenta': '#C71585',
  'orange': '#FF8C00', 'red': '#DC143C', 'yellow': '#FFD700',
  'green': '#228B22', 'dark-blue': '#4169E1', 'railroad': '#2F2F2F', 'utility': '#32CD32',
};

export function PropertyCard({ card, onClick, selected }: PropertyCardProps) {
  const color = card.chosenColor || card.color!;
  const hex = COLOR_HEX[color];
  const rentTable = PROPERTY_SETS[color].rent;
  const setSize = PROPERTY_SETS[color].size;

  return (
    <div
      onClick={onClick}
      className={cn(
        'relative rounded-xl shadow-lg cursor-pointer transition-all duration-200 select-none overflow-hidden flex flex-col bg-[#F5F0E8] w-36 h-52',
        selected && 'ring-2 ring-primary scale-105 -translate-y-2',
        onClick && 'hover:scale-105 hover:-translate-y-1'
      )}
      style={{ border: `2px solid ${hex}` }}
    >
      {/* Color header with property name */}
      <div
        className="text-center text-white font-black uppercase leading-tight px-2 py-2.5 text-[11px]"
        style={{ backgroundColor: hex }}
      >
        {card.name}
      </div>

      {/* Value circle overlapping header/body boundary */}
      <div className="absolute z-10 top-10 left-2 w-7 h-7 text-[10px] rounded-full font-black flex items-center justify-center bg-white"
        style={{ border: `2px solid ${hex}`, color: '#333' }}>
        M{card.value}
      </div>

      {/* Inner bordered content area */}
      <div className="flex-1 flex flex-col mx-1.5 mb-1.5 mt-0.5"
        style={{ border: `1.5px solid ${hex}` }}>
        <div className="flex-1 flex flex-col px-2 pt-4 pb-1">
          {/* Column headers */}
          <div className="flex justify-between mb-1">
            <span className="text-[7px] font-black text-center uppercase leading-tight" style={{ color: '#555' }}>
              PROPERTIES<br/>OWNED
            </span>
            <span className="text-[7px] font-black uppercase" style={{ color: '#555' }}>
              RENT
            </span>
          </div>

          {/* Rent rows with stacked card icons */}
          <div className="flex-1 flex flex-col justify-center gap-1.5">
            {Object.entries(rentTable).map(([count, rent]) => {
              const isComplete = Number(count) === setSize;
              return (
                <div key={count} className="flex items-center justify-between">
                  <div className="relative flex items-end">
                    {Array.from({ length: Number(count) }).map((_, i) => (
                      <div
                        key={i}
                        className="rounded-[2px] flex items-center justify-center font-black text-white"
                        style={{
                          backgroundColor: hex,
                          width: 16,
                          height: 20,
                          border: '1.5px solid white',
                          marginLeft: i > 0 ? -6 : 0,
                          transform: i > 0 ? `rotate(${i * 8}deg)` : undefined,
                          zIndex: i,
                          fontSize: 8,
                        }}
                      >
                        {Number(count)}
                      </div>
                    ))}
                    {isComplete && (
                      <span className="ml-0.5 text-[8px]">✨</span>
                    )}
                  </div>
                  <span className="font-black text-lg" style={{ color: '#333' }}>
                    <span className="text-[8px] align-top">M</span>{rent}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Complete set label */}
          <div className="text-center mt-1 pt-1">
            <span className="text-[7px] font-black uppercase" style={{ color: '#555' }}>
              COMPLETE SET
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
