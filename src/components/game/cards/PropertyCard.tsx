import { cn } from '@/lib/utils';
import { type GameCard, COLOR_CONFIG, PROPERTY_SETS } from '@/data/cards';

interface PropertyCardProps {
  card: GameCard;
  onClick?: () => void;
  selected?: boolean;
}

export function PropertyCard({ card, onClick, selected }: PropertyCardProps) {
  const color = card.chosenColor || card.color!;
  const config = COLOR_CONFIG[color];
  const rentTable = PROPERTY_SETS[color].rent;
  const setSize = PROPERTY_SETS[color].size;

  return (
    <div
      onClick={onClick}
      className={cn(
        'relative rounded-xl shadow-[0_4px_12px_rgba(0,0,0,0.15)] cursor-pointer transition-all duration-300 select-none overflow-hidden flex flex-col w-36 h-52 bg-[#fcfcfc] p-[3px] group',
        selected && 'ring-2 ring-primary scale-105 -translate-y-2 shadow-[0_8px_20px_rgba(0,0,0,0.2)]',
        onClick && 'hover:scale-105 hover:-translate-y-1 hover:shadow-[0_8px_16px_rgba(0,0,0,0.15)]'
      )}
    >
      {/* Subtle glass shine effect on hover */}
      <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/40 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none z-50 mix-blend-overlay transform -skew-x-12 translate-x-[-100%] group-hover:translate-x-[100%]" />

      {/* Black thin border container */}
      <div 
        className="relative flex-1 rounded-[8px] flex flex-col bg-white overflow-hidden pointer-events-none"
        style={{ border: '1.5px solid #1a1a1a' }}
      >
        {/* Top-left value circle - overlapping everything */}
        <div className="absolute z-20 top-1.5 left-1.5 w-[28px] h-[28px] rounded-[50%] flex items-center justify-center bg-[#FEFEFE] shadow-sm transition-transform duration-300 group-hover:scale-110"
          style={{ border: '2px solid #1a1a1a', color: '#1a1a1a' }}>
          <span className="font-display font-black text-sm leading-none flex items-start -ml-0.5">
            <span className="text-[7px] mt-[1px]">M</span>
            <span className="tracking-tighter">{card.value}</span>
          </span>
        </div>

        {/* Thick color inner border effect using a container */}
        <div className="flex-1 flex flex-col p-[4px] bg-white relative">
          
          <div className="flex-1 flex flex-col rounded-[2px] relative overflow-hidden shadow-[inset_0_1px_4px_rgba(0,0,0,0.3)]" style={{ backgroundColor: config.bg }}>
            
            {/* Texture overlay on the colored border */}
            <div className="absolute inset-0 bg-monopoly-pattern opacity-40 mix-blend-color-burn pointer-events-none" />

            {/* Header Area filled with color */}
            <div className="relative z-10 flex flex-col items-center justify-center pt-2 pb-2 px-1 text-center min-h-[42px] border-b-2 border-[#1a1a1a] bg-black/5" style={{ color: config.text }}>
              <span className="text-[5px] font-sans font-bold uppercase tracking-[0.15em] mb-0.5 opacity-90" style={{ textShadow: '0px 1px 1px rgba(0,0,0,0.4)' }}>
                Title Deed
              </span>
              <span className="text-[8.5px] font-display font-black uppercase leading-[1.1] drop-shadow-sm" style={{ textShadow: '0px 1px 2px rgba(0,0,0,0.3)' }}>
                {card.name}
              </span>
            </div>

            {/* Content Area - White */}
            <div className="relative z-10 flex-1 bg-[#FDFDFD] flex flex-col m-[1px] rounded-b-[1px] shadow-[0_-1px_3px_rgba(0,0,0,0.1)]">
              <div className="flex flex-col flex-1 px-1.5 pt-2 pb-1 bg-white rounded-b-[1px]">
                <div className="flex justify-between items-end border-b-[1px] border-[#1a1a1a] pb-0.5 mb-1.5">
                  <span className="text-[6.5px] font-display font-black text-center uppercase leading-tight text-[#1a1a1a]">
                    Rent
                  </span>
                </div>

                {/* Rent Rows */}
                <div className="flex-1 flex flex-col justify-start gap-1">
                  {Object.entries(rentTable).map(([count, rent]) => {
                    const isComplete = Number(count) === setSize;
                    return (
                      <div key={count} className="flex items-center justify-between px-1 hover:bg-black/5 rounded-[2px] transition-colors">
                        <div className="flex items-center gap-[2px]">
                          {isComplete && <span className="text-[6px] text-amber-500 -ml-1 drop-shadow-sm">★</span>}
                          <span className="text-[7.5px] font-sans font-bold text-[#1a1a1a]">
                            {count} {config.label} {Number(count) > 1 ? 'Cards' : 'Card'}
                          </span>
                        </div>
                        <span className="font-display font-black text-[10px] text-[#1a1a1a]">
                          <span className="text-[7px] align-top tracking-tighter mr-[1px] opacity-80">M</span>{rent}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Complete set label at bottom */}
                <div className="text-center mt-auto border-t-[1px] border-[#1a1a1a] pt-0.5 bg-black/[0.02] -mx-1.5 px-1.5 pb-0.5">
                  <span className="text-[6.5px] font-display font-black uppercase tracking-wider text-[#1a1a1a]">
                    {setSize} Cards Form A Full Set
                  </span>
                </div>
              </div>
            </div>
            {/* End of White Content Area */}

          </div>
        </div>
      </div>
    </div>
  );
}
