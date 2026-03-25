import { cn } from '@/lib/utils';
import { type GameCard, COLOR_CONFIG, PROPERTY_SETS } from '@/data/cards';

interface WildPropertyCardProps {
  card: GameCard;
  onClick?: () => void;
  selected?: boolean;
}

export function WildPropertyCard({ card, onClick, selected }: WildPropertyCardProps) {
  const colors = card.colors || [];
  const isRainbow = colors.length > 2;

  if (isRainbow) {
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

          <div className="flex-1 flex flex-col p-[4px] bg-white relative">
            <div className="flex-1 flex flex-col rounded-[2px] relative overflow-hidden shadow-[inset_0_1px_4px_rgba(0,0,0,0.3)]" style={{
              background: 'linear-gradient(90deg, #DF3341 0%, #F68B29 20%, #FFDF00 40%, #28A745 60%, #1C52A3 80%, #C95FA8 100%)'
            }}>
              
              {/* Texture overlay */}
              <div className="absolute inset-0 bg-monopoly-pattern opacity-[0.35] mix-blend-color-burn pointer-events-none" />

              {/* Header Area filled with gradient */}
              <div className="relative z-10 flex flex-col items-center justify-center pt-2 pb-2 px-1 text-center min-h-[50px] border-b-2 border-[#1a1a1a] bg-black/10">
                <span className="text-[12px] font-display font-black uppercase text-white leading-tight drop-shadow-md" style={{ textShadow: '0px 1px 3px rgba(0,0,0,0.6)' }}>
                  PROPERTY<br/>WILD CARD
                </span>
              </div>

              {/* Content Area - White */}
              <div className="relative z-10 flex-1 bg-[#FDFDFD] flex flex-col items-center justify-center px-2 py-2 text-center m-[1px] rounded-b-[1px] shadow-[0_-1px_3px_rgba(0,0,0,0.1)]">
                <p className="font-display font-black uppercase text-[10px] text-[#1a1a1a] leading-tight mb-2 opacity-90 drop-shadow-sm">
                  This card can be used as part of any property set.
                </p>
                
                {/* Rainbow dots */}
                <div className="flex flex-wrap gap-1.5 justify-center max-w-[80%] my-1">
                  {colors.map(c => (
                    <span key={c} className="w-[12px] h-[12px] rounded-full shadow-sm hover:scale-125 transition-transform"
                      style={{ backgroundColor: COLOR_CONFIG[c].bg, border: '1.5px solid #1a1a1a' }} />
                  ))}
                </div>
                
                {card.chosenColor && (
                  <div className="mt-3 text-center font-display font-black text-white text-[8px] py-1 px-2.5 rounded-full shadow-[0_2px_4px_rgba(0,0,0,0.2)]" style={{ backgroundColor: COLOR_CONFIG[card.chosenColor].bg, border: '1.5px solid #1a1a1a' }}>
                    PLAYED AS: {COLOR_CONFIG[card.chosenColor].label}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Two-color wild
  const c1 = COLOR_CONFIG[colors[0]];
  const c2 = COLOR_CONFIG[colors[1]];

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

      <div 
        className="relative flex-1 rounded-[8px] flex flex-col bg-white overflow-hidden pointer-events-none"
        style={{ border: '1.5px solid #1a1a1a' }}
      >
        <div className="absolute z-20 top-1.5 left-1.5 w-[28px] h-[28px] rounded-[50%] flex items-center justify-center bg-[#FEFEFE] shadow-sm transition-transform duration-300 group-hover:scale-110"
          style={{ border: '2px solid #1a1a1a', color: '#1a1a1a' }}>
          <span className="font-display font-black text-sm leading-none flex items-start -ml-0.5">
            <span className="text-[7px] mt-[1px]">M</span>
            <span className="tracking-tighter">{card.value}</span>
          </span>
        </div>

        <div className="flex-1 flex flex-col p-[4px] bg-white relative">
          <div className="flex-1 flex flex-col rounded-[2px] relative overflow-hidden shadow-[inset_0_1px_4px_rgba(0,0,0,0.3)]" style={{ background: `linear-gradient(90deg, ${c1.bg} 50%, ${c2.bg} 50%)` }}>
            
            <div className="absolute inset-0 bg-monopoly-pattern opacity-40 mix-blend-color-burn pointer-events-none" />

            <div className="relative z-10 flex flex-col items-center justify-center pt-2 pb-2 px-1 text-center min-h-[42px] border-b-2 border-[#1a1a1a] bg-black/10">
              <span className="text-[5px] font-sans font-bold uppercase tracking-[0.15em] mb-0.5 text-white opacity-90" style={{ textShadow: '0px 1px 2px rgba(0,0,0,0.6)' }}>
                Property Wild Card
              </span>
              <span className="text-[7.5px] font-display font-black text-white uppercase leading-[1.1] drop-shadow-md" style={{ textShadow: '0px 1px 2px rgba(0,0,0,0.6)' }}>
                {c1.label} / {c2.label}
              </span>
            </div>

            <div className="relative z-10 flex-1 bg-[#FDFDFD] flex m-[1px] rounded-b-[1px] shadow-[0_-1px_3px_rgba(0,0,0,0.1)]">
              {/* Divider vertical line inside white area */}
              <div className="absolute left-[50%] top-0 bottom-0 w-[1px] bg-[#1a1a1a] z-0 opacity-20" />
              
              {colors.map((color, colIndex) => {
                const config = COLOR_CONFIG[color];
                const rentTable = PROPERTY_SETS[color].rent;
                const setSize = PROPERTY_SETS[color].size;
                return (
                  <div key={color} className="flex-1 px-1 pt-1 pb-1 flex flex-col relative z-10">
                    <div className="flex justify-between items-end border-b-[1px] border-[#1a1a1a] pb-[1px] mb-1">
                      <span className="text-[5px] font-display font-black text-center uppercase leading-tight text-[#1a1a1a]">
                        Rent
                      </span>
                    </div>
                    <div className="flex-1 flex flex-col justify-start gap-0.5">
                      {Object.entries(rentTable).map(([count, rent]) => {
                        const isComplete = Number(count) === setSize;
                        return (
                          <div key={count} className="flex items-center justify-between hover:bg-black/5 rounded-[2px] transition-colors px-[1px]">
                            <div className="flex items-center gap-[1px]">
                              {isComplete && <span className="text-[5px] text-amber-500 -ml-[3px] drop-shadow-sm">★</span>}
                              <span className="text-[5.5px] font-sans font-bold text-[#1a1a1a]">
                                {count} {Number(count) > 1 ? 'Cards' : 'Card'}
                              </span>
                            </div>
                            <span className="font-display font-black text-[8px] text-[#1a1a1a]">
                              <span className="text-[6px] align-top tracking-tighter mr-[1px] opacity-80">M</span>{rent}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                    <div className="text-center mt-auto border-t-[1px] border-[#1a1a1a] pt-[1px] bg-black/[0.02]">
                      <span className="text-[5px] font-display font-black uppercase text-[#1a1a1a]">
                        Set: {setSize}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
            
            {card.chosenColor && (
              <div className="absolute bottom-1.5 left-0 right-0 flex justify-center z-30">
                <div className="text-center font-display font-black text-white text-[7px] py-1 px-2.5 rounded-full shadow-[0_2px_4px_rgba(0,0,0,0.2)]" style={{ backgroundColor: COLOR_CONFIG[card.chosenColor].bg, border: '1.5px solid #1a1a1a' }}>
                  PLAYED AS: {COLOR_CONFIG[card.chosenColor].label}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
