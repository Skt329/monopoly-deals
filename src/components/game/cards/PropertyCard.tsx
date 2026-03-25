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
  const hex = COLOR_HEX[color] || config.bg;
  const headerColor = HEADER_TEXT[color] || '#fff';

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

      {/* Single color header */}
      <div
        className="flex flex-col items-center justify-center text-center py-2 px-2 mt-[2px] mx-[2px] rounded-t-[2px]"
        style={{
          backgroundColor: hex,
          minHeight: 44,
          border: '1.5px solid #222',
          borderBottom: 'none'
        }}
      >
        <span
          className="font-black uppercase text-[10px] tracking-wide"
          style={{ color: headerColor, textShadow: headerColor === '#fff' ? '0 1px 2px rgba(0,0,0,0.6)' : 'none' }}
        >
          TITLE DEED
        </span>
        <span
          className="font-bold text-[8.5px] uppercase opacity-90 drop-shadow-sm"
          style={{ color: headerColor, textShadow: headerColor === '#fff' ? '0 1px 2px rgba(0,0,0,0.4)' : 'none' }}
        >
          {card.name}
        </span>
      </div>

      {/* Inner bordered rent table */}
      <div
        className="flex-1 flex flex-col mx-[2px] mb-[2px] px-3 py-2 bg-white rounded-b-[2px]"
        style={{ border: '1.5px solid #222' }}
      >
        <div className="flex justify-center border-b-[1.5px] border-[#222] pb-1 mb-2">
           <span className="text-[9px] font-black uppercase text-center text-[#222]">RENT</span>
        </div>

        {/* Rent rows */}
        <div className="flex-1 flex flex-col gap-1.5">
          {Object.entries(rentTable).map(([count, rent]) => {
            const n = Number(count);
            return (
              <div key={count} className="flex items-center justify-between">
                <div className="flex items-center gap-[2px]">
                  {Array.from({ length: n }).map((_, i) => (
                    <div
                      key={i}
                      className="rounded-[1.5px] shadow-sm"
                      style={{
                        width: 8.5,
                        height: 12,
                        backgroundColor: hex,
                        border: '1px solid #222',
                      }}
                    />
                  ))}
                </div>
                <span className="font-black text-[11px]" style={{ color: '#1a1a1a' }}>
                  M{rent}
                </span>
              </div>
            );
          })}
        </div>

        {/* Set size */}
        <div className="text-[7.5px] text-center font-bold uppercase mt-2 border-t-[1.5px] border-[#222] pt-1.5" style={{ color: '#222' }}>
          {setSize} {config.label} CARDS FORM A SET
        </div>
      </div>
    </div>
  );
}
