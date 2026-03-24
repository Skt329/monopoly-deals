import { cn } from '@/lib/utils';
import { type GameCard } from '@/data/cards';
import { DollarSign } from 'lucide-react';

interface MoneyCardProps {
  card: GameCard;
  onClick?: () => void;
  selected?: boolean;
  small?: boolean;
}

const MONEY_GRADIENTS: Record<number, string> = {
  1: 'from-amber-100 to-amber-200',
  2: 'from-sky-100 to-sky-200',
  3: 'from-emerald-100 to-emerald-200',
  4: 'from-violet-100 to-violet-200',
  5: 'from-orange-200 to-orange-300',
  10: 'from-yellow-300 to-amber-400',
};

const MONEY_TEXT: Record<number, string> = {
  1: 'text-amber-700',
  2: 'text-sky-700',
  3: 'text-emerald-700',
  4: 'text-violet-700',
  5: 'text-orange-700',
  10: 'text-amber-800',
};

export function MoneyCard({ card, onClick, selected, small }: MoneyCardProps) {
  const gradient = MONEY_GRADIENTS[card.value] || 'from-zinc-100 to-zinc-200';
  const textColor = MONEY_TEXT[card.value] || 'text-zinc-700';

  return (
    <div
      onClick={onClick}
      className={cn(
        'relative rounded-xl border-2 border-border shadow-md cursor-pointer transition-all duration-200 select-none overflow-hidden flex flex-col items-center justify-center bg-gradient-to-br',
        gradient,
        small ? 'w-20 h-28' : 'w-32 h-44',
        selected && 'ring-2 ring-primary scale-105 -translate-y-1',
        onClick && 'hover:scale-105 hover:-translate-y-1'
      )}
    >
      <DollarSign className={cn('opacity-20', small ? 'w-8 h-8' : 'w-12 h-12', textColor)} />
      <span className={cn('font-bold', textColor, small ? 'text-xl' : 'text-3xl')}>
        {card.value}M
      </span>
      <span className={cn('text-[9px] font-medium opacity-50', textColor)}>
        MONOPOLY
      </span>
    </div>
  );
}
