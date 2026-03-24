import { cn } from '@/lib/utils';
import { type GameCard } from '@/data/cards';

interface MoneyCardProps {
  card: GameCard;
  onClick?: () => void;
  selected?: boolean;
}

const MONEY_STYLES: Record<number, { bg: string; border: string; circle: string }> = {
  1:  { bg: '#E8E6D8', border: '#999', circle: '#555' },
  2:  { bg: '#F8C8D4', border: '#D4708A', circle: '#C0607A' },
  3:  { bg: '#B8D8E8', border: '#6A9AB8', circle: '#5088A8' },
  4:  { bg: '#C8E8C0', border: '#6AAF60', circle: '#509F48' },
  5:  { bg: '#C8B8E0', border: '#8A70B0', circle: '#7A60A0' },
  10: { bg: '#F8D8A0', border: '#D4A040', circle: '#C49030' },
};

export function MoneyCard({ card, onClick, selected }: MoneyCardProps) {
  const style = MONEY_STYLES[card.value] || MONEY_STYLES[1];

  return (
    <div
      onClick={onClick}
      className={cn(
        'relative rounded-xl shadow-lg cursor-pointer transition-all duration-200 select-none overflow-hidden flex flex-col w-36 h-52',
        selected && 'ring-2 ring-primary scale-105 -translate-y-2',
        onClick && 'hover:scale-105 hover:-translate-y-1'
      )}
      style={{ backgroundColor: style.bg, border: `2px solid ${style.border}` }}
    >
      {/* Top-left value circle */}
      <div className="absolute z-10 top-2 left-2 w-8 h-8 text-xs rounded-full font-black flex items-center justify-center bg-white"
        style={{ border: `2px solid ${style.circle}`, color: '#333' }}>
        <span className="text-[6px] align-top">M</span>{card.value}
      </div>

      {/* Inner bordered area */}
      <div className="flex-1 flex flex-col items-center justify-center mx-2.5 my-8"
        style={{ border: `2px solid ${style.circle}` }}>
        
        {/* Large center circle with denomination */}
        <div className="rounded-full flex items-center justify-center w-20 h-20"
          style={{ border: `3px solid ${style.circle}` }}>
          <div className="text-center">
            <span className="font-black text-3xl" style={{ color: '#333' }}>
              <span className="text-xs align-top">M</span>
              {card.value}
            </span>
          </div>
        </div>

        {/* MONOPOLY text */}
        <div className="mt-1 text-center">
          <span className="font-black text-[10px] tracking-wider" style={{ color: '#333' }}>
            MONOPOLY
          </span>
        </div>
      </div>

      {/* Bottom-right large faded denomination */}
      <div className="absolute bottom-1 right-2 flex items-baseline opacity-30">
        <span className="font-black text-4xl" style={{ color: style.circle }}>{card.value}</span>
        <span className="font-black text-lg" style={{ color: style.circle }}>M</span>
      </div>
    </div>
  );
}
