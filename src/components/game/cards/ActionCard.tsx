import { cn } from '@/lib/utils';
import { type GameCard } from '@/data/cards';

interface ActionCardProps {
  card: GameCard;
  onClick?: () => void;
  selected?: boolean;
  small?: boolean;
}

const ACTION_BG: Record<string, string> = {
  'Pass Go': '#4CAF50',
  'Deal Breaker': '#E91E63',
  'Just Say No': '#3F51B5',
  'Sly Deal': '#009688',
  'Forced Deal': '#FF9800',
  'Debt Collector': '#607D8B',
  "It's Your Birthday": '#E91E63',
  'House': '#8BC34A',
  'Hotel': '#F44336',
  'Double The Rent': '#FF5722',
};

export function ActionCard({ card, onClick, selected, small }: ActionCardProps) {
  const bg = ACTION_BG[card.name] || '#9E9E9E';

  return (
    <div
      onClick={onClick}
      className={cn(
        'relative rounded-xl border-2 shadow-lg cursor-pointer transition-all duration-200 select-none overflow-hidden flex flex-col bg-white',
        small ? 'w-20 h-28' : 'w-36 h-52',
        selected && 'ring-2 ring-primary scale-105 -translate-y-2',
        onClick && 'hover:scale-105 hover:-translate-y-1'
      )}
      style={{ borderColor: bg }}
    >
      {/* Value circle - top left */}
      <div className={cn(
        'absolute z-10 rounded-full font-black flex items-center justify-center border-2 border-white shadow-sm text-white',
        small ? 'top-0.5 left-0.5 w-5 h-5 text-[7px]' : 'top-1 left-1 w-7 h-7 text-[10px]'
      )} style={{ backgroundColor: bg }}>
        M{card.value}
      </div>

      {/* "ACTION" label top-right */}
      <div className={cn(
        'absolute z-10 font-black text-white rounded-bl-lg',
        small ? 'top-0 right-0 px-1 py-0.5 text-[5px]' : 'top-0 right-0 px-2 py-1 text-[8px]'
      )} style={{ backgroundColor: bg }}>
        ACTION
      </div>

      {/* Card name - center top */}
      <div className={cn('text-center text-white font-black uppercase tracking-wide', small ? 'px-1 pt-5 pb-1 text-[6px]' : 'px-3 pt-8 pb-2 text-sm')}
        style={{ backgroundColor: bg }}>
        {card.name}
      </div>

      {/* Description */}
      <div className={cn('flex-1 flex items-center justify-center', small ? 'px-1 py-0.5' : 'px-3 py-2')}>
        {!small && card.description && (
          <p className="text-[9px] text-center text-muted-foreground leading-tight font-medium">
            {card.description}
          </p>
        )}
      </div>

      {/* Bottom brand */}
      {!small && (
        <div className="text-center pb-1">
          <span className="text-[6px] font-black tracking-[0.2em] text-muted-foreground/40">MONOPOLY DEAL</span>
        </div>
      )}
    </div>
  );
}
