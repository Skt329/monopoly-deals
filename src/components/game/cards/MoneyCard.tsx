import { cn } from '@/lib/utils';
import { type GameCard } from '@/data/cards';

interface MoneyCardProps {
  card: GameCard;
  onClick?: () => void;
  selected?: boolean;
}

const MONEY_COLORS: Record<number, string> = {
  1: '#E4DEC5', // Tan
  2: '#F5C5C9', // Pink
  3: '#BDDCED', // Light Blue
  4: '#91C8D4', // Teal/Cyan
  5: '#BFA7D4', // Purple
  10: '#F1D28C',// Gold/Orange
};

// Corner text colors for faded effect
const CORNER_COLORS: Record<number, string> = {
  1: '#C8C2A8',
  2: '#DF9FA5',
  3: '#A3ADC0',
  4: '#71AABA',
  5: '#A38CB9',
  10: '#D5A866',
};

export function MoneyCard({ card, onClick, selected }: MoneyCardProps) {
  const bg = MONEY_COLORS[card.value] || MONEY_COLORS[1];
  const cornerColor = CORNER_COLORS[card.value] || CORNER_COLORS[1];

  return (
    <div
      onClick={onClick}
      className={cn(
        'relative rounded-xl shadow-[0_4px_10px_rgba(0,0,0,0.15)] cursor-pointer transition-all duration-200 select-none flex flex-col w-36 h-52 bg-white p-[3px]',
        selected && 'ring-2 ring-primary scale-105 -translate-y-2',
        onClick && 'hover:scale-105 hover:-translate-y-1'
      )}
    >
      <div 
        className="relative flex-1 rounded-[8px] flex flex-col font-sans overflow-hidden"
        style={{ backgroundColor: bg, border: '1.5px solid #1a1a1a' }}
      >
        {/* Chevron pattern overlay */}
        <div className="absolute inset-0 bg-monopoly-pattern opacity-[0.85] mix-blend-overlay pointer-events-none rounded-[8px]" />

        {/* Top-left value circle */}
        <div className="absolute z-10 top-1.5 left-1.5 w-[34px] h-[34px] rounded-[50%] flex items-center justify-center bg-[#FEFEFE] shadow-sm"
          style={{ border: '2.5px solid #1a1a1a', color: '#1a1a1a' }}>
          <span className="font-display font-black text-xl leading-none flex items-start -ml-0.5 pointer-events-none">
            <span className="text-[9px] mt-[2px] tracking-tighter">M</span>
            <span className="tracking-tighter">{card.value}</span>
          </span>
        </div>

        {/* Inner bordered area */}
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center p-2 mt-4">
          
          {/* Large center graphic */}
          <div className="relative flex flex-col items-center justify-center mt-2 pointer-events-none">
            {/* The giant white circle */}
            <div className="rounded-[50%] flex items-center justify-center w-[90px] h-[90px] bg-white shadow-sm"
              style={{ border: '3px solid #1a1a1a' }}>
              
              <div className="text-center transform -translate-y-1">
                <span className="font-display font-black text-5xl tracking-tighter"
                  style={{ 
                    color: '#1a1a1a',
                    textShadow: '-1.5px -1.5px 0 #fff, 1.5px -1.5px 0 #fff, -1.5px 1.5px 0 #fff, 1.5px 1.5px 0 #fff, 0px 3px 0px rgba(0,0,0,0.2)' 
                  }}>
                  <span className="text-2xl align-top mr-0.5 tracking-tighter font-extrabold">M</span>
                  {card.value}
                </span>
              </div>
            </div>

            {/* MONOPOLY banner crossing the bottom of the circle */}
            <div className="absolute -bottom-3 px-3 py-1 font-display font-black tracking-widest text-[#FEFEFE] uppercase text-[10px] transform skew-x-[-10deg]"
              style={{ 
                backgroundColor: '#1a1a1a', 
                border: '1px solid #FEFEFE',
                boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
              }}>
              <div className="transform skew-x-[10deg]">Monopoly</div>
            </div>
          </div>
        </div>

        {/* Bottom-right large faded denomination */}
        <div className="absolute bottom-0 right-0 overflow-hidden w-full h-[60px] pointer-events-none">
          <div className="absolute -bottom-4 -right-1 flex items-baseline filter drop-shadow-sm opacity-60">
            <span className="font-display font-black text-[65px] leading-none" style={{ color: cornerColor }}>{card.value}</span>
            <span className="font-display font-black text-[28px] leading-none ml-0.5" style={{ color: cornerColor }}>M</span>
          </div>
        </div>
        
        {/* Faint logo/symbol lower-left */}
        <div className="absolute bottom-1 left-2 pointer-events-none">
          <span className="text-xl" style={{ color: cornerColor, opacity: 0.5 }}>💰</span>
        </div>
      </div>
    </div>
  );
}
