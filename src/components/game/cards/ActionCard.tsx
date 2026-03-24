import { cn } from '@/lib/utils';
import { type GameCard } from '@/data/cards';

interface ActionCardProps {
  card: GameCard;
  onClick?: () => void;
  selected?: boolean;
}

const ACTION_STYLES: Record<string, { bg: string; light: string; emoji: string }> = {
  'Deal Breaker':     { bg: '#B088C0', light: '#D4B8E0', emoji: '💰' },
  'Just Say No':      { bg: '#8BC34A', light: '#B8E070', emoji: '🚫' },
  'Sly Deal':         { bg: '#90CAF9', light: '#BBDEFB', emoji: '🦊' },
  'Forced Deal':      { bg: '#90CAF9', light: '#BBDEFB', emoji: '🔄' },
  'Debt Collector':   { bg: '#90CAF9', light: '#BBDEFB', emoji: '🎩' },
  "It's Your Birthday": { bg: '#E91E78', light: '#F48FB1', emoji: '🎂' },
  'Pass Go':          { bg: '#F5F0E8', light: '#FFFFFF', emoji: '➡️' },
  'House':            { bg: '#64B5F6', light: '#90CAF9', emoji: '🏠' },
  'Hotel':            { bg: '#81C784', light: '#A5D6A7', emoji: '🏨' },
  'Double The Rent':  { bg: '#F5F0E8', light: '#FFFFFF', emoji: '💸' },
};

export function ActionCard({ card, onClick, selected }: ActionCardProps) {
  const style = ACTION_STYLES[card.name] || { bg: '#9E9E9E', light: '#BDBDBD', emoji: '⚡' };
  const isDark = ['Deal Breaker', "It's Your Birthday", 'Just Say No'].includes(card.name);
  const textColor = isDark ? '#FFF' : '#333';

  return (
    <div
      onClick={onClick}
      className={cn(
        'relative rounded-xl shadow-lg cursor-pointer transition-all duration-200 select-none overflow-hidden flex flex-col w-36 h-52',
        selected && 'ring-2 ring-primary scale-105 -translate-y-2',
        onClick && 'hover:scale-105 hover:-translate-y-1'
      )}
      style={{ backgroundColor: style.bg, border: `2px solid ${style.bg}` }}
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

      {/* Inner bordered area with circle */}
      <div className="flex-1 flex flex-col items-center mx-2 mb-1"
        style={{ border: '2px solid #333' }}>
        
        {/* Large circle with action name */}
        <div className="rounded-full flex flex-col items-center justify-center w-20 h-20 mt-2"
          style={{ border: '3px solid #333', backgroundColor: style.light }}>
          <span className="text-lg">{style.emoji}</span>
          <span className="font-black text-center uppercase leading-none text-[9px] px-1"
            style={{ color: '#333' }}>
            {card.name}
          </span>
        </div>
      </div>

      {/* Description text below bordered area */}
      {card.description && (
        <p className="text-[8px] text-center px-2 pb-1.5 leading-tight font-medium" style={{ color: textColor }}>
          {card.description}
        </p>
      )}
    </div>
  );
}
