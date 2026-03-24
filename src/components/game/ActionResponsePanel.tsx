import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { type GameCard, type PropertyColor, COLOR_CONFIG } from '@/data/cards';
import { type PublicGameState, type PlayerBoard } from '@/lib/gameEngine';
import { GameCardComponent } from './cards/GameCardComponent';
import { Shield, CreditCard, X, ArrowRightLeft } from 'lucide-react';

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

  const totalAssets = myBoard.bank.reduce((sum, c) => sum + c.value, 0) +
    (Object.keys(myBoard.properties) as PropertyColor[]).reduce((sum, color) => {
      return sum + (myBoard.properties[color]?.reduce((s, c) => s + c.value, 0) || 0);
    }, 0);
  const cantAfford = totalAssets <= amountOwed;

  const allBankUids = myBoard.bank.map(c => c.uid);
  const allPropCards: { uid: string; color: PropertyColor }[] = [];
  for (const color of Object.keys(myBoard.properties) as PropertyColor[]) {
    for (const card of myBoard.properties[color] || []) {
      allPropCards.push({ uid: card.uid, color });
    }
  }

  // Find cards involved in steal actions for visual display
  const findTargetCard = (): GameCard | null => {
    const uid = pending.targetCardUid;
    if (!uid) return null;
    for (const color of Object.keys(myBoard.properties) as PropertyColor[]) {
      const found = myBoard.properties[color]?.find(c => c.uid === uid);
      if (found) return found;
    }
    return null;
  };

  const findSourceCard = (): GameCard | null => {
    const uid = pending.sourceCardUid;
    if (!uid) return null;
    const attackerBoard = gameState.boards[pending.sourcePlayerId];
    if (!attackerBoard) return null;
    for (const color of Object.keys(attackerBoard.properties) as PropertyColor[]) {
      const found = attackerBoard.properties[color]?.find(c => c.uid === uid);
      if (found) return found;
    }
    return null;
  };

  const getDealBreakerCards = (): GameCard[] => {
    const color = pending.targetColor;
    if (!color) return [];
    return myBoard.properties[color] || [];
  };

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
        <p className="text-sm text-muted-foreground mb-2">
          {pending.type === 'rent' && (
            <>
              {sourceName} is charging rent on{' '}
              <span className="font-bold text-foreground">
                {pending.targetColor ? COLOR_CONFIG[pending.targetColor]?.label || pending.targetColor : 'properties'}
              </span>
              ! You owe <span className="font-bold text-destructive">M{amountOwed}</span>.
              {pending.doubleRent ? ' (DOUBLED!)' : ''}
            </>
          )}
          {pending.type === 'birthday' && `It's ${sourceName}'s birthday! Pay M${amountOwed}.`}
          {pending.type === 'debt_collector' && `${sourceName} is collecting debt! Pay M${amountOwed}.`}
          {pending.type === 'deal_breaker' && `${sourceName} wants to steal your complete ${pending.targetColor ? COLOR_CONFIG[pending.targetColor]?.label || pending.targetColor.toUpperCase() : ''} set!`}
          {pending.type === 'sly_deal' && `${sourceName} wants to steal your property!`}
          {pending.type === 'forced_deal' && `${sourceName} wants to swap properties with you!`}
        </p>

        {/* Visual card display for steal actions */}
        {pending.type === 'sly_deal' && (() => {
          const targetCard = findTargetCard();
          return targetCard ? (
            <div className="flex justify-center my-3 p-3 bg-destructive/5 rounded-xl border border-destructive/20">
              <div className="text-center">
                <p className="text-[10px] font-bold text-destructive uppercase mb-1">Being Stolen</p>
                <GameCardComponent card={targetCard} small />
                <p className="text-[10px] font-semibold text-foreground mt-1">{targetCard.name}</p>
              </div>
            </div>
          ) : null;
        })()}

        {pending.type === 'forced_deal' && (() => {
          const targetCard = findTargetCard();
          const sourceCard = findSourceCard();
          return (
            <div className="flex items-center justify-center gap-3 my-3 p-3 bg-amber-50 rounded-xl border border-amber-200">
              <div className="text-center">
                <p className="text-[10px] font-bold text-destructive uppercase mb-1">Your Card</p>
                {targetCard ? <GameCardComponent card={targetCard} small /> : <div className="w-16 h-24 bg-muted rounded" />}
                <p className="text-[10px] font-semibold text-foreground mt-1">{targetCard?.name || '?'}</p>
              </div>
              <ArrowRightLeft className="w-6 h-6 text-amber-600 flex-none" />
              <div className="text-center">
                <p className="text-[10px] font-bold text-primary uppercase mb-1">Their Card</p>
                {sourceCard ? <GameCardComponent card={sourceCard} small /> : <div className="w-16 h-24 bg-muted rounded" />}
                <p className="text-[10px] font-semibold text-foreground mt-1">{sourceCard?.name || '?'}</p>
              </div>
            </div>
          );
        })()}

        {pending.type === 'deal_breaker' && (() => {
          const cards = getDealBreakerCards();
          return cards.length > 0 ? (
            <div className="my-3 p-3 bg-destructive/5 rounded-xl border border-destructive/20">
              <p className="text-[10px] font-bold text-destructive uppercase mb-2 text-center">Complete Set Being Stolen</p>
              <div className="flex gap-1 justify-center flex-wrap">
                {cards.map(card => (
                  <div key={card.uid} className="text-center">
                    <GameCardComponent card={card} small />
                  </div>
                ))}
              </div>
            </div>
          ) : null;
        })()}

        {/* Rent amount display */}
        {pending.type === 'rent' && (
          <div className="flex items-center justify-center my-3 p-3 bg-amber-50 rounded-xl border border-amber-200">
            <span className="text-2xl font-black text-amber-700">💰 M{amountOwed}</span>
            {pending.doubleRent && <span className="ml-2 text-sm font-bold text-destructive animate-pulse">×2 DOUBLED!</span>}
          </div>
        )}

        {/* Payment selection for payment actions */}
        {isPaymentAction && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-foreground">Select cards to pay (M{amountOwed} owed)</span>
              <span className={`text-sm font-bold ${totalSelected >= amountOwed ? 'text-green-600' : 'text-red-500'}`}>
                Selected: M{totalSelected}
              </span>
            </div>

            {!cantAfford && (
              <>
                {myBoard.bank.length > 0 && (
                  <div>
                    <p className="text-xs font-bold text-muted-foreground mb-1">Bank Cards:</p>
                    <div className="flex gap-1 flex-wrap">
                      {myBoard.bank.map(card => (
                        <div key={card.uid} onClick={() => toggleBankCard(card.uid)} className="cursor-pointer">
                          <GameCardComponent card={card} small selected={selectedBankCards.includes(card.uid)} />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {(Object.keys(myBoard.properties) as PropertyColor[]).map(color => {
                  const props = myBoard.properties[color];
                  if (!props || props.length === 0) return null;
                  return (
                    <div key={color}>
                      <p className="text-xs font-bold text-muted-foreground mb-1">{COLOR_CONFIG[color]?.label || color} Properties:</p>
                      <div className="flex gap-1 flex-wrap">
                        {props.map(card => (
                          <div key={card.uid} onClick={() => togglePropCard(card.uid, color)} className="cursor-pointer">
                            <GameCardComponent card={card} small selected={selectedProps.some(p => p.uid === card.uid)} />
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </>
            )}
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-3 mt-6">
          {isPaymentAction && cantAfford && (
            <Button onClick={() => onPay(allBankUids, allPropCards)} className="flex-1 gap-2">
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
