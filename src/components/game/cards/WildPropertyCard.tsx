import { cn } from '@/lib/utils';
import { type GameCard, COLOR_CONFIG, PROPERTY_SETS } from '@/data/cards';

const COLOR_HEX: Record<string, string> = {
  'brown':      '#8B5E3C',
  'light-blue': '#AAD1F0',
  'magenta':    '#D93A8C',
  'orange':     '#F7941D',
  'red':        '#ED1C24',
  'yellow':     '#FEE821',
  'green':      '#1DB25A',
  'dark-blue':  '#0072BB',
  'railroad':   '#2B2B2B',
  'utility':    '#C2D9A0',
};

const HEADER_TEXT: Record<string, string> = {
  'brown': '#fff', 'light-blue': '#1a1a1a', 'magenta': '#fff',
  'orange': '#fff', 'red': '#fff', 'yellow': '#1a1a1a',
  'green': '#fff', 'dark-blue': '#fff', 'railroad': '#fff', 'utility': '#1a1a1a',
};

const CHEVRON_BG = `
  repeating-linear-gradient(
    135deg,
    transparent,
    transparent 4px,
    rgba(0,0,0,0.04) 4px,
    rgba(0,0,0,0.04) 5px
  )
`.trim();

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
  const c1 = colors[0];
  const c2 = colors[1];
  const centerText = '#fff';

  return (
    <div
      onClick={onClick}
      className={cn(
        'relative rounded-xl shadow-lg cursor-pointer transition-all duration-300 select-none overflow-hidden flex flex-col w-36 h-52 group',
        selected && 'ring-2 ring-primary scale-105 -translate-y-2 shadow-xl',
        onClick && 'hover:scale-105 hover:-translate-y-1 hover:shadow-xl'
      )}
      style={{
        backgroundColor: '#f4f0e4',
        backgroundImage: CHEVRON_BG,
        border: '2px solid #222',
      }}
    >
      <div className="absolute z-20 top-1.5 left-1.5 w-[24px] h-[24px] rounded-full flex items-center justify-center bg-[#FEFEFE] shadow-sm transition-transform duration-300 group-hover:scale-110"
        style={{ border: '1.5px solid #222', color: '#222' }}>
        <span className="font-display font-black text-xs leading-none flex items-start -ml-0.5">
          <span className="text-[6px] mt-[1px]">M</span>
          <span className="tracking-tighter">{card.value}</span>
        </span>
      </div>

      {/* Gradient color header */}
      <div
        className="flex flex-col items-center justify-center text-center py-2 px-2 mt-[2px] mx-[2px] rounded-t-[2px]"
        style={{
          background: `linear-gradient(90deg, ${COLOR_HEX[c1] || COLOR_CONFIG[c1]?.bg} 50%, ${COLOR_HEX[c2] || COLOR_CONFIG[c2]?.bg} 50%)`,
          minHeight: 44,
          border: '1.5px solid #222',
          borderBottom: 'none'
        }}
      >
        <span
          className="font-black uppercase text-[10px] tracking-wide"
          style={{ color: centerText, textShadow: '0 1px 2px rgba(0,0,0,0.8)' }}
        >
          WILD PROPERTY CARD
        </span>
        <span
          className="font-bold text-[7.5px] uppercase opacity-90"
          style={{ color: centerText, textShadow: '0 1px 2px rgba(0,0,0,0.8)' }}
        >
          CHOOSE ONE COLOR
        </span>
      </div>

      {/* Inner bordered dual rent table */}
      <div
        className="flex-1 flex mx-[2px] mb-[2px] bg-white rounded-b-[2px]"
        style={{ border: '1.5px solid #222' }}
      >
        {colors.map((color, colIdx) => {
          const rentTable = PROPERTY_SETS[color].rent;
          const setSize = PROPERTY_SETS[color].size;
          return (
            <div
              key={color}
              className="flex-1 flex flex-col px-1 py-1"
              style={colIdx === 0 ? { borderRight: '1.5px solid #222' } : {}}
            >
              {/* Color label */}
              <div
                className="text-[6px] font-black uppercase text-center mb-1 py-0.5 rounded-[1px] shadow-sm"
                style={{ color: HEADER_TEXT[color] || '#fff', backgroundColor: COLOR_HEX[color] || COLOR_CONFIG[color]?.bg, border: '1px solid #222' }}
              >
                {COLOR_CONFIG[color].label}
              </div>

              {/* Rent rows */}
              <div className="flex-1 flex flex-col gap-[3px] mt-1">
                {Object.entries(rentTable).map(([count, rent]) => {
                  const n = Number(count);
                  return (
                    <div key={count} className="flex items-center justify-between">
                      <div className="flex items-center gap-[1.5px]">
                        {Array.from({ length: n }).map((_, i) => (
                          <div
                            key={i}
                            className="rounded-[1.5px] shadow-sm"
                            style={{
                              width: 6.5,
                              height: 9,
                              backgroundColor: COLOR_HEX[color] || COLOR_CONFIG[color]?.bg,
                              border: '1px solid #222',
                            }}
                          />
                        ))}
                      </div>
                      <span className="font-black text-[8.5px]" style={{ color: '#1a1a1a' }}>
                        M{rent}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Set size */}
              <div className="text-[5.5px] text-center font-bold uppercase mt-1 border-t-[1.5px] border-[#222] pt-1" style={{ color: '#222' }}>
                Set: {setSize}
              </div>
            </div>
          );
        })}
      </div>

      {card.chosenColor && (
        <div
          className="text-center font-bold text-[7px] py-[3px] absolute bottom-0 left-0 right-0 border-t-[2px] border-[#222] rounded-b-xl"
          style={{ 
            backgroundColor: COLOR_HEX[card.chosenColor] || COLOR_CONFIG[card.chosenColor]?.bg,
             color: HEADER_TEXT[card.chosenColor] || '#fff'
          }}
        >
          PLAYED AS: {COLOR_CONFIG[card.chosenColor].label}
        </div>
      )}
    </div>
  );
}
