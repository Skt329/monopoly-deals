import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { type GameCard, type PropertyColor, COLOR_CONFIG } from '@/data/cards';
import { type PublicGameState, type PlayerBoard } from '@/lib/gameEngine';
import { GameCardComponent } from './cards/GameCardComponent';
import { Shield, CreditCard, X } from 'lucide-react';

interface ActionResponsePanelProps {
  gameState: PublicGameState;
  userId: string;
  myHand: GameCard[];
  myBoard: PlayerBoard;
  players: { user_id: string; display_name: string }[];
  onPay: (bankCardUids: string[], propertyCards: { uid: string; color: PropertyColor }[]) => void;
  onJustSayNo: () => void;
  onAccept: () => void;
}

export function ActionResponsePanel({
  gameState, userId, myHand, myBoard, players, onPay, onJustSayNo, onAccept
}: ActionResponsePanelProps) {
  const [selectedBankCards, setSelectedBankCards] = useState<string[]>([]);
  const [selectedProps, setSelectedProps] = useState<{ uid: string; color: PropertyColor }[]>([]);

  const pending = gameState.pendingAction;
  if (!pending) return null;

  const isTarget = pending.targetPlayerIds.includes(userId) && !pending.respondedPlayers.includes(userId);
  if (!isTarget) return null;

  const sourceName = players.find(p => p.user_id === pending.sourcePlayerId)?.display_name || 'Unknown';
  const hasJustSayNo = myHand.some(c => c.name === 'Just Say No');

  const totalSelected = selectedBankCards.reduce((sum, uid) => {
    const card = myBoard.bank.find(c => c.uid === uid);
    return sum + (card?.value || 0);
  }, 0) + selectedProps.reduce((sum, p) => {
    for (const color of Object.keys(myBoard.properties) as PropertyColor[]) {
      const card = myBoard.properties[color].find(c => c.uid === p.uid);
      if (card) return sum + card.value;
    }
    return sum;
  }, 0);

  const amountOwed = pending.amountOwed || 0;
  const isPaymentAction = ['rent', 'birthday', 'debt_collector'].includes(pending.type);
  const isStealAction = ['deal_breaker', 'sly_deal', 'forced_deal'].includes(pending.type);

  // Calculate total assets for smart payment
  const totalAssets = myBoard.bank.reduce((sum, c) => sum + c.value, 0) +
    (Object.keys(myBoard.properties) as PropertyColor[]).reduce((sum, color) => {
      return sum + (myBoard.properties[color]?.reduce((s, c) => s + c.value, 0) || 0);
    }, 0);
  const cantAfford = totalAssets <= amountOwed;

  // Collect all card uids for "Pay Everything"
  const allBankUids = myBoard.bank.map(c => c.uid);
  const allPropCards: { uid: string; color: PropertyColor }[] = [];
  for (const color of Object.keys(myBoard.properties) as PropertyColor[]) {
    for (const card of myBoard.properties[color] || []) {
      allPropCards.push({ uid: card.uid, color });
    }
  }

  const toggleBankCard = (uid: string) => {
    setSelectedBankCards(prev => prev.includes(uid) ? prev.filter(id => id !== uid) : [...prev, uid]);
  };

  const togglePropCard = (uid: string, color: PropertyColor) => {
    setSelectedProps(prev =>
      prev.some(p => p.uid === uid)
        ? prev.filter(p => p.uid !== uid)
        : [...prev, { uid, color }]
    );
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
      <div className="bg-card rounded-2xl border-2 border-primary shadow-2xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
        <h2 className="text-lg font-black text-foreground mb-1">
          ⚡ Action Against You!
        </h2>
        <p className="text-sm text-muted-foreground mb-4">
          {pending.type === 'rent' && `${sourceName} is charging M${amountOwed} rent on ${pending.targetColor ? COLOR_CONFIG[pending.targetColor].label : 'properties'}!${pending.doubleRent ? ' (DOUBLED! 🔥)' : ''}`}
          {pending.type === 'birthday' && `It's ${sourceName}'s birthday! 🎂 Pay M${amountOwed}.`}
          {pending.type === 'debt_collector' && `${sourceName} is collecting M${amountOwed} debt from you! 🏦`}
          {pending.type === 'deal_breaker' && `${sourceName} wants to steal your complete ${pending.targetColor ? COLOR_CONFIG[pending.targetColor].label : ''} set! 💥`}
          {pending.type === 'sly_deal' && (() => {
            // Find the target card name
            if (pending.targetCardUid) {
              for (const color of Object.keys(myBoard.properties) as PropertyColor[]) {
                const card = myBoard.properties[color].find(c => c.uid === pending.targetCardUid);
                if (card) return `${sourceName} wants to steal your ${card.name}! 🕵️`;
              }
            }
            return `${sourceName} wants to steal one of your properties! 🕵️`;
          })()}
          {pending.type === 'forced_deal' && (() => {
            let targetCardName = 'a property';
            if (pending.targetCardUid) {
              for (const color of Object.keys(myBoard.properties) as PropertyColor[]) {
                const card = myBoard.properties[color].find(c => c.uid === pending.targetCardUid);
                if (card) { targetCardName = card.name; break; }
              }
            }
            let sourceCardName = 'one of their properties';
            if (pending.sourceCardUid) {
              const attackerBoard = gameState.boards[pending.sourcePlayerId];
              if (attackerBoard) {
                for (const color of Object.keys(attackerBoard.properties) as PropertyColor[]) {
                  const card = attackerBoard.properties[color].find(c => c.uid === pending.sourceCardUid);
                  if (card) { sourceCardName = card.name; break; }
                }
              }
            }
            return `${sourceName} wants to swap their ${sourceCardName} for your ${targetCardName}! 🔄`;
          })()}
        </p>

        {/* Payment selection for payment actions */}
        {isPaymentAction && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-foreground">Select cards to pay (M{amountOwed} owed)</span>
              <span className={`text-sm font-bold ${totalSelected >= amountOwed ? 'text-green-600' : 'text-red-500'}`}>
                Selected: M{totalSelected}
              </span>
            </div>

            {/* Bank cards */}
            {myBoard.bank.length > 0 && (
              <div>
                <p className="text-xs font-bold text-muted-foreground mb-1">Bank Cards:</p>
                <div className="flex gap-1 flex-wrap">
                  {myBoard.bank.map(card => (
                    <div key={card.uid} onClick={() => toggleBankCard(card.uid)} className="cursor-pointer">
                      <GameCardComponent
                        card={card}
                        small
                        selected={selectedBankCards.includes(card.uid)}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Property cards */}
            {(Object.keys(myBoard.properties) as PropertyColor[]).map(color => {
              const props = myBoard.properties[color];
              if (!props || props.length === 0) return null;
              return (
                <div key={color}>
                  <p className="text-xs font-bold text-muted-foreground mb-1">{color} Properties:</p>
                  <div className="flex gap-1 flex-wrap">
                    {props.map(card => (
                      <div key={card.uid} onClick={() => togglePropCard(card.uid, color)} className="cursor-pointer">
                        <GameCardComponent
                          card={card}
                          small
                          selected={selectedProps.some(p => p.uid === card.uid)}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-3 mt-6">
          {isPaymentAction && cantAfford && (
            <Button
              onClick={() => onPay(allBankUids, allPropCards)}
              className="flex-1 gap-2"
            >
              <CreditCard className="w-4 h-4" />
              Pay Everything (M{totalAssets})
            </Button>
          )}

          {isPaymentAction && !cantAfford && (
            <Button
              onClick={() => onPay(selectedBankCards, selectedProps)}
              disabled={totalSelected < amountOwed}
              className="flex-1 gap-2"
            >
              <CreditCard className="w-4 h-4" />
              Pay M{totalSelected}
            </Button>
          )}

          {isStealAction && (
            <Button onClick={onAccept} variant="destructive" className="flex-1 gap-2">
              <X className="w-4 h-4" />
              Accept
            </Button>
          )}

          {hasJustSayNo && (
            <Button onClick={onJustSayNo} variant="outline" className="flex-1 gap-2 border-green-500 text-green-600 hover:bg-green-50">
              <Shield className="w-4 h-4" />
              Just Say No!
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
