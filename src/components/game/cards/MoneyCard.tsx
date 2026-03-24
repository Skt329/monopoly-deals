import { cn } from '@/lib/utils';
import { type GameCard } from '@/data/cards';

interface MoneyCardProps {
  card: GameCard;
  onClick?: () => void;
  selected?: boolean;
  small?: boolean;
}

const MONEY_COLORS: Record<number, { bg: string; border: string }> = {
  1: { bg: '#FFF9C4', border: '#F9A825' },
  2: { bg: '#E3F2FD', border: '#1565C0' },
  3: { bg: '#E8F5E9', border: '#2E7D32' },
  4: { bg: '#F3E5F5', border: '#7B1FA2' },
  5: { bg: '#FFF3E0', border: '#E65100' },
  10: { bg: '#FFFDE7', border: '#F57F17' },
};

export function MoneyCard({ card, onClick, selected, small }: MoneyCardProps) {
  const colors = MONEY_COLORS[card.value] || { bg: '#FAFAFA', border: '#757575' };

  return (
    <div
      onClick={onClick}
      className={cn(
        'relative rounded-xl border-2 shadow-lg cursor-pointer transition-all duration-200 select-none overflow-hidden flex flex-col items-center justify-center',
        small ? 'w-20 h-28' : 'w-36 h-52',
        selected && 'ring-2 ring-primary scale-105 -translate-y-2',
        onClick && 'hover:scale-105 hover:-translate-y-1'
      )}
      style={{ backgroundColor: colors.bg, borderColor: colors.border }}
    >
      {/* Large denomination */}
      <div className={cn('font-black', small ? 'text-2xl' : 'text-5xl')}
        style={{ color: colors.border }}>
        M{card.value}
      </div>
      <div className={cn('font-bold uppercase tracking-[0.3em]', small ? 'text-[6px]' : 'text-[10px]')}
        style={{ color: colors.border, opacity: 0.6 }}>
        MILLION
      </div>

      {/* Corner values */}
      <div className={cn(
        'absolute font-black rounded-full flex items-center justify-center border-2 border-white shadow-sm text-white',
        small ? 'top-0.5 left-0.5 w-5 h-5 text-[7px]' : 'top-1 left-1 w-7 h-7 text-[10px]'
      )} style={{ backgroundColor: colors.border }}>
        M{card.value}
      </div>

      {/* Bottom brand */}
      {!small && (
        <div className="absolute bottom-2 text-center">
          <span className="text-[7px] font-black tracking-[0.15em]" style={{ color: colors.border, opacity: 0.4 }}>
            MONOPOLY DEAL
          </span>
        </div>
      )}
    </div>
  );
}
