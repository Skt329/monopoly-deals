import { type PropertyColor, type GameCard, COLOR_CONFIG, PROPERTY_SETS } from '@/data/cards';
import { type PlayerBoard, getStealableProperties, getCompleteSetColors, isSetComplete } from '@/lib/gameEngine';
import { Button } from '@/components/ui/button';
import { GameCardComponent } from './cards/GameCardComponent';

interface TargetSelectorProps {
  players: { user_id: string; display_name: string }[];
  userId: string;
  boards: Record<string, PlayerBoard>;
  actionType: string;
  selectedTarget: string | null;
  selectedColor: PropertyColor | null;
  selectedTargetCard: string | null;
  selectedSourceCard: string | null;
  onSelectTarget: (targetId: string) => void;
  onSelectColor: (color: PropertyColor) => void;
  onSelectTargetCard: (uid: string) => void;
  onSelectSourceCard: (uid: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
  availableColors?: PropertyColor[];
}

export function TargetSelector({
  players, userId, boards, actionType, selectedTarget, selectedColor,
  selectedTargetCard, selectedSourceCard,
  onSelectTarget, onSelectColor, onSelectTargetCard, onSelectSourceCard,
  onConfirm, onCancel, availableColors
}: TargetSelectorProps) {
  const opponents = players.filter(p => p.user_id !== userId);
  const needsTarget = ['Debt Collector', 'Sly Deal', 'Forced Deal', 'Deal Breaker', 'Wild Rent'].includes(actionType);
  const needsColor = ['Rent', 'Wild Rent', 'House', 'Hotel'].includes(actionType);
  const needsTargetCard = ['Sly Deal', 'Forced Deal'].includes(actionType);
  const needsSourceCard = actionType === 'Forced Deal';
  const needsDealBreakerColor = actionType === 'Deal Breaker';

  const targetBoard = selectedTarget ? boards[selectedTarget] : null;
  const myBoard = boards[userId];

  // For Sly Deal: show non-complete-set properties of target
  const stealableProps = targetBoard ? getStealableProperties(targetBoard) : [];
  // For Deal Breaker: show complete sets of target
  const completeSetColors = targetBoard ? getCompleteSetColors(targetBoard) : [];
  // For Forced Deal: my properties to offer (non-complete sets)
  const myOfferableProps = myBoard ? getStealableProperties(myBoard) : [];

  // Validation
  let canConfirm = true;
  if (needsTarget && !selectedTarget) canConfirm = false;
  if (needsColor && !selectedColor) canConfirm = false;
  if (needsTargetCard && !selectedTargetCard) canConfirm = false;
  if (needsSourceCard && !selectedSourceCard) canConfirm = false;
  if (needsDealBreakerColor && !selectedColor) canConfirm = false;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
      <div className="bg-card rounded-2xl border shadow-2xl max-w-lg w-full p-6 max-h-[85vh] overflow-y-auto">
        <h2 className="text-lg font-black text-foreground mb-4">
          {actionType === 'Rent' || actionType === 'Wild Rent' ? '🎯 Choose Rent Color'
            : actionType === 'Deal Breaker' ? '💥 Deal Breaker'
            : actionType === 'Sly Deal' ? '🕵️ Sly Deal'
            : actionType === 'Forced Deal' ? '🔄 Forced Deal'
            : '🎯 Select Target'}
        </h2>

        {/* Step 1: Target selection */}
        {needsTarget && (
          <div className="mb-4">
            <p className="text-sm font-semibold text-muted-foreground mb-2">Choose a player:</p>
            <div className="flex flex-col gap-2">
              {opponents.map(p => {
                // For Deal Breaker, only show players with complete sets
                if (actionType === 'Deal Breaker') {
                  const opBoard = boards[p.user_id];
                  if (opBoard && getCompleteSetColors(opBoard).length === 0) {
                    return (
                      <button key={p.user_id} disabled
                        className="p-3 rounded-lg border-2 border-border text-left text-sm opacity-50 cursor-not-allowed"
                      >
                        {p.display_name} <span className="text-xs text-muted-foreground">(no complete sets)</span>
                      </button>
                    );
                  }
                }
                // For Sly Deal, only show players with stealable properties
                if (actionType === 'Sly Deal') {
                  const opBoard = boards[p.user_id];
                  if (opBoard && getStealableProperties(opBoard).length === 0) {
                    return (
                      <button key={p.user_id} disabled
                        className="p-3 rounded-lg border-2 border-border text-left text-sm opacity-50 cursor-not-allowed"
                      >
                        {p.display_name} <span className="text-xs text-muted-foreground">(no stealable properties)</span>
                      </button>
                    );
                  }
                }
                return (
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
                );
              })}
            </div>
          </div>
        )}

        {/* Step 2a: Deal Breaker - pick complete set color */}
        {needsDealBreakerColor && selectedTarget && completeSetColors.length > 0 && (
          <div className="mb-4">
            <p className="text-sm font-semibold text-muted-foreground mb-2">Choose a complete set to steal:</p>
            <div className="flex flex-wrap gap-2">
              {completeSetColors.map(color => {
                const config = COLOR_CONFIG[color];
                const props = targetBoard!.properties[color];
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
                    {config.label} ({props.length} cards)
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Step 2b: Sly Deal - pick target property card */}
        {actionType === 'Sly Deal' && selectedTarget && stealableProps.length > 0 && (
          <div className="mb-4">
            <p className="text-sm font-semibold text-muted-foreground mb-2">Choose a property to steal:</p>
            <div className="flex flex-wrap gap-2">
              {stealableProps.map(({ card, color }) => (
                <div
                  key={card.uid}
                  onClick={() => onSelectTargetCard(card.uid)}
                  className="cursor-pointer"
                >
                  <GameCardComponent
                    card={card}
                    small
                    selected={selectedTargetCard === card.uid}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step 2c: Forced Deal - pick target property then your own property */}
        {actionType === 'Forced Deal' && selectedTarget && (
          <>
            {stealableProps.length > 0 && (
              <div className="mb-4">
                <p className="text-sm font-semibold text-muted-foreground mb-2">Choose their property to take:</p>
                <div className="flex flex-wrap gap-2">
                  {stealableProps.map(({ card }) => (
                    <div
                      key={card.uid}
                      onClick={() => onSelectTargetCard(card.uid)}
                      className="cursor-pointer"
                    >
                      <GameCardComponent
                        card={card}
                        small
                        selected={selectedTargetCard === card.uid}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selectedTargetCard && myOfferableProps.length > 0 && (
              <div className="mb-4">
                <p className="text-sm font-semibold text-muted-foreground mb-2">Choose your property to give:</p>
                <div className="flex flex-wrap gap-2">
                  {myOfferableProps.map(({ card }) => (
                    <div
                      key={card.uid}
                      onClick={() => onSelectSourceCard(card.uid)}
                      className="cursor-pointer"
                    >
                      <GameCardComponent
                        card={card}
                        small
                        selected={selectedSourceCard === card.uid}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* Color selection for rent */}
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
            disabled={!canConfirm}
            className="flex-1"
          >
            Confirm
          </Button>
        </div>
      </div>
    </div>
  );
}
