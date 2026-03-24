import { cn } from '@/lib/utils';
import { type GameCard } from '@/data/cards';

interface ActionCardProps {
  card: GameCard;
  onClick?: () => void;
  selected?: boolean;
}

const VALUE_COLORS: Record<number, string> = {
  1: '#E4DEC5', // Tan
  2: '#F5C5C9', // Pink
  3: '#BDDCED', // Light Blue
  4: '#91C8D4', // Teal/Cyan
  5: '#BFA7D4', // Purple
  10: '#F1D28C',// Gold/Orange
};

const VALUE_LIGHT: Record<number, string> = {
  1: '#F5EEDB',
  2: '#FDE9EC',
  3: '#EAF5FA',
  4: '#D7EDF2',
  5: '#EAE0F2',
  10: '#FDF0D0',
};

const ACTION_EMOJIS: Record<string, string> = {
  'Deal Breaker': '💰',
  'Just Say No': '🚫',
  'Sly Deal': '🦊',
  'Forced Deal': '🔄',
  'Debt Collector': '🎩',
  "It's Your Birthday": '🎂',
  'Pass Go': '➡️',
  'House': '🏠',
  'Hotel': '🏨',
  'Double The Rent': '💸',
};

export function ActionCard({ card, onClick, selected }: ActionCardProps) {
  const bg = VALUE_COLORS[card.value] || VALUE_COLORS[1];
  const lightBg = VALUE_LIGHT[card.value] || VALUE_LIGHT[1];
  const emoji = ACTION_EMOJIS[card.name] || '⚡';

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
        style={{ backgroundColor: bg, border: '1.5px solid #1a1a1a' }}
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
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center">
          <div className="rounded-[50%] flex flex-col items-center justify-center w-[90px] h-[90px] shadow-sm bg-white"
            style={{ border: '3px solid #1a1a1a' }}>
            <div className="rounded-[50%] w-[82px] h-[82px] flex flex-col items-center justify-center" style={{ backgroundColor: lightBg }}>
              <span className="text-4xl filter drop-shadow-md mb-0.5">{emoji}</span>
              <span className="font-display font-black text-center uppercase leading-[0.9] text-[11px] px-1 max-w-[80%] whitespace-pre-wrap break-words border-black"
                style={{ 
                  textShadow: '-1px -1px 0 #fff, 1px -1px 0 #fff, -1px 1px 0 #fff, 1px 1px 0 #fff',
                  color: '#1a1a1a' 
                }}>
                {card.name.replace(' ', '\n')}
              </span>
            </div>
          </div>
        </div>

        {/* Description text area */}
        <div className="relative z-10 pb-[6px] px-2 h-[45px] flex items-center justify-center pointer-events-none">
          <p className="font-sans text-[8.5px] text-center leading-[1.2] font-semibold tracking-tight text-[#111]">
            {card.description}
          </p>
        </div>
      </div>
    </div>
  );
}
