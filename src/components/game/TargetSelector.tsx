import { type PropertyColor, COLOR_CONFIG, PROPERTY_SETS } from '@/data/cards';
import { type PlayerBoard } from '@/lib/gameEngine';
import { Button } from '@/components/ui/button';

interface TargetSelectorProps {
  players: { user_id: string; display_name: string }[];
  userId: string;
  boards: Record<string, PlayerBoard>;
  actionType: string;
  selectedTarget: string | null;
  selectedColor: PropertyColor | null;
  onSelectTarget: (targetId: string) => void;
  onSelectColor: (color: PropertyColor) => void;
  onConfirm: () => void;
  onCancel: () => void;
  availableColors?: PropertyColor[];
}

export function TargetSelector({
  players, userId, boards, actionType, selectedTarget, selectedColor,
  onSelectTarget, onSelectColor, onConfirm, onCancel, availableColors
}: TargetSelectorProps) {
  const opponents = players.filter(p => p.user_id !== userId);
  const needsTarget = ['Debt Collector', 'Sly Deal', 'Forced Deal', 'Deal Breaker', 'Wild Rent'].includes(actionType);
  const needsColor = ['Rent', 'Wild Rent', 'House', 'Hotel'].includes(actionType);

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
      <div className="bg-card rounded-2xl border shadow-2xl max-w-md w-full p-6">
        <h2 className="text-lg font-black text-foreground mb-4">
          {actionType === 'Rent' || actionType === 'Wild Rent' ? '🎯 Choose Rent Color' : '🎯 Select Target'}
        </h2>

        {/* Target selection */}
        {needsTarget && (
          <div className="mb-4">
            <p className="text-sm font-semibold text-muted-foreground mb-2">Choose a player:</p>
            <div className="flex flex-col gap-2">
              {opponents.map(p => (
                <button
                  key={p.user_id}
                  onClick={() => onSelectTarget(p.user_id)}
                  className={`p-3 rounded-lg border-2 text-left font-semibold text-sm transition-all ${
                    selectedTarget === p.user_id
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  {p.display_name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Color selection */}
        {needsColor && (
          <div className="mb-4">
            <p className="text-sm font-semibold text-muted-foreground mb-2">Choose a color:</p>
            <div className="flex flex-wrap gap-2">
              {(availableColors || (Object.keys(PROPERTY_SETS) as PropertyColor[])).map(color => {
                const config = COLOR_CONFIG[color];
                return (
                  <button
                    key={color}
                    onClick={() => onSelectColor(color)}
                    className={`px-3 py-2 rounded-lg border-2 text-xs font-bold transition-all ${
                      selectedColor === color
                        ? 'border-primary ring-2 ring-primary scale-105'
                        : 'border-border hover:scale-105'
                    } ${config.bg} ${config.text}`}
                  >
                    {config.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="flex gap-3 mt-4">
          <Button onClick={onCancel} variant="ghost" className="flex-1">Cancel</Button>
          <Button
            onClick={onConfirm}
            disabled={(needsTarget && !selectedTarget) || (needsColor && !selectedColor)}
            className="flex-1"
          >
            Confirm
          </Button>
        </div>
      </div>
    </div>
  );
}
