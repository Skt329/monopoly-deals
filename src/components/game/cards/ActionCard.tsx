import { cn } from '@/lib/utils';
import { type GameCard } from '@/data/cards';
import { Zap, Shield, ArrowRightLeft, Gift, CreditCard, Home, Hotel, Repeat, Copy } from 'lucide-react';

interface ActionCardProps {
  card: GameCard;
  onClick?: () => void;
  selected?: boolean;
  small?: boolean;
}

const ACTION_ICONS: Record<string, React.ReactNode> = {
  'Pass Go': <Repeat className="w-5 h-5" />,
  'Deal Breaker': <Zap className="w-5 h-5" />,
  'Just Say No': <Shield className="w-5 h-5" />,
  'Sly Deal': <Copy className="w-5 h-5" />,
  'Forced Deal': <ArrowRightLeft className="w-5 h-5" />,
  'Debt Collector': <CreditCard className="w-5 h-5" />,
  "It's Your Birthday": <Gift className="w-5 h-5" />,
  'House': <Home className="w-5 h-5" />,
  'Hotel': <Hotel className="w-5 h-5" />,
  'Double The Rent': <Zap className="w-5 h-5" />,
};

const ACTION_COLORS: Record<string, string> = {
  'Pass Go': 'from-sky-400 to-sky-600',
  'Deal Breaker': 'from-red-500 to-red-700',
  'Just Say No': 'from-indigo-500 to-indigo-700',
  'Sly Deal': 'from-teal-500 to-teal-700',
  'Forced Deal': 'from-orange-500 to-orange-700',
  'Debt Collector': 'from-emerald-500 to-emerald-700',
  "It's Your Birthday": 'from-pink-400 to-pink-600',
  'House': 'from-lime-500 to-lime-700',
  'Hotel': 'from-red-600 to-red-800',
  'Double The Rent': 'from-amber-500 to-amber-700',
};

export function ActionCard({ card, onClick, selected, small }: ActionCardProps) {
  const gradient = ACTION_COLORS[card.name] || 'from-zinc-500 to-zinc-700';
  const icon = ACTION_ICONS[card.name];

  return (
    <div
      onClick={onClick}
      className={cn(
        'relative rounded-xl border-2 border-border bg-card shadow-md cursor-pointer transition-all duration-200 select-none overflow-hidden flex flex-col',
        small ? 'w-20 h-28' : 'w-32 h-44',
        selected && 'ring-2 ring-primary scale-105 -translate-y-1',
        onClick && 'hover:scale-105 hover:-translate-y-1'
      )}
    >
      {/* Gradient header */}
      <div className={cn('bg-gradient-to-br text-white flex items-center gap-1', gradient, small ? 'px-1.5 py-1' : 'px-2.5 py-2')}>
        {!small && icon}
        <p className={cn('font-bold leading-tight', small ? 'text-[7px]' : 'text-[10px]')}>
          {card.name}
        </p>
      </div>

      {/* Description */}
      <div className={cn('flex-1 flex flex-col items-center justify-center', small ? 'px-1 py-0.5' : 'px-2.5 py-2')}>
        {!small && icon && (
          <div className={cn('bg-gradient-to-br text-white rounded-full p-2 mb-1.5', gradient)}>
            {icon}
          </div>
        )}
        {!small && card.description && (
          <p className="text-[8px] text-muted-foreground text-center leading-tight">{card.description}</p>
        )}
      </div>

      {/* Value badge */}
      <div className={cn(
        'absolute rounded-full font-bold flex items-center justify-center bg-muted text-foreground',
        small ? 'top-0.5 right-0.5 w-4 h-4 text-[7px]' : 'top-1 right-1 w-5 h-5 text-[9px]'
      )}>
        {card.value}M
      </div>
    </div>
  );
}
