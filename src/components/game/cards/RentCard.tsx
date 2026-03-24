import { cn } from '@/lib/utils';
import { type GameCard, COLOR_CONFIG } from '@/data/cards';

interface RentCardProps {
  card: GameCard;
  onClick?: () => void;
  selected?: boolean;
}

export function RentCard({ card, onClick, selected }: RentCardProps) {
  const colors = card.colors || [];
  const isWild = colors.length > 2;

  // For wild rent, use a multi-color gradient
  const bgStyle = isWild
    ? { background: 'linear-gradient(135deg, #DF3341, #F68B29, #FFDF00, #28A745, #1C52A3, #C95FA8)' }
    : { background: `linear-gradient(135deg, ${COLOR_CONFIG[colors[0]].bg} 50%, ${COLOR_CONFIG[colors[1]].bg} 50%)` };

  return (
    <div
      onClick={onClick}
      className={cn(
        'relative rounded-xl shadow-[0_4px_10px_rgba(0,0,0,0.15)] cursor-pointer transition-all duration-200 select-none overflow-hidden flex flex-col w-36 h-52 bg-white p-[3px]',
        selected && 'ring-2 ring-primary scale-105 -translate-y-2',
        onClick && 'hover:scale-105 hover:-translate-y-1'
      )}
    >
      <div 
        className="relative flex-1 rounded-[8px] flex flex-col pt-1 font-sans"
        style={{ ...bgStyle, border: '1.5px solid #1a1a1a' }}
      >
        {/* Chevron pattern overlay */}
        <div className="absolute inset-0 bg-monopoly-pattern opacity-[0.85] mix-blend-overlay pointer-events-none rounded-[8px]" />

        {/* Top area */}
        <div className="relative z-10 flex items-start justify-between px-1.5 pt-0.5 pointer-events-none">
          {/* Top-left value circle */}
          <div className="w-[34px] h-[34px] rounded-[50%] flex items-center justify-center bg-[#FEFEFE] shadow-sm transform -translate-x-[2px] -translate-y-[2px]"
            style={{ border: '2.5px solid #1a1a1a', color: '#1a1a1a' }}>
            <span className="font-display font-black text-xl leading-none flex items-start -ml-0.5">
              <span className="text-[9px] mt-[2px] tracking-tighter">M</span>
              <span className="tracking-tighter">{card.value}</span>
            </span>
          </div>

          {/* ACTION banner */}
          <div className="font-display font-black italic text-[#FEFEFE] px-2 py-0.5 text-[15px] transform translate-x-1"
            style={{ 
              backgroundColor: '#1a1a1a', 
              clipPath: 'polygon(15% 0, 100% 0, 100% 100%, 0% 100%)',
              filter: 'drop-shadow(0px 2px 0px rgba(0,0,0,0.2))'
            }}>
            ACTION
          </div>
        </div>

        {/* Center illustration circle */}
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center -mt-2">
          
          <div className="font-display font-black text-[22px] tracking-tighter shadow-sm bg-white px-2 rounded-t-[12px] transform translate-y-1" style={{ color: '#1a1a1a', border: '2.5px solid #1a1a1a', borderBottom: 'none' }}>
            RENT
          </div>

          <div className="rounded-[50%] flex flex-col items-center justify-center w-[78px] h-[78px] shadow-sm bg-white overflow-hidden relative"
            style={{ border: '3px solid #1a1a1a' }}>
            {isWild ? (
              <div className="w-full h-full" style={{
                background: `conic-gradient(${colors.slice(0, 8).map((c, i) => `${COLOR_CONFIG[c].bg} ${i * (360/8)}deg ${(i+1) * (360/8)}deg`).join(', ')})`
              }} />
            ) : (
              <div className="w-full h-full flex transform -rotate-45">
                <div className="w-1/2 h-full" style={{ backgroundColor: COLOR_CONFIG[colors[0]].bg }} />
                <div className="w-1/2 h-full" style={{ backgroundColor: COLOR_CONFIG[colors[1]].bg }} />
              </div>
            )}
            {/* Inner emoji / money symbol */}
            <span className="absolute text-5xl filter drop-shadow-md">🤝</span>
          </div>
        </div>

        {/* Text descriptions below circle */}
        <div className="relative z-10 pb-[6px] px-2 flex flex-col items-center justify-end h-[50px] pointer-events-none">
          <p className="font-display font-black uppercase text-[7px] text-center leading-[1.1] mb-1" style={{ color: '#1a1a1a', textShadow: '0 0 2px white, 0 0 2px white' }}>
            {isWild
              ? 'CHOOSE ANY COLOR'
              : `CHOOSE ${COLOR_CONFIG[colors[0]].label}\nOR ${COLOR_CONFIG[colors[1]].label}`}
          </p>
          <p className="font-sans text-[7.5px] text-center leading-[1.15] font-semibold tracking-tight text-[#111] bg-white/70 px-1 rounded">
            {card.description || 'Collect rent from each player for each property you own in that color.'}
          </p>
        </div>
      </div>
    </div>
  );
}
