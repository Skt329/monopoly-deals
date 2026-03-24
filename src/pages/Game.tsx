import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  type GameCard,
  type PropertyColor,
  COLOR_CONFIG,
  PROPERTY_SETS,
  MAX_HAND_SIZE,
} from '@/data/cards';
import {
  type PublicGameState,
  type PlayerBoard,
  getCurrentPlayerId,
  drawCards,
  playCardAsProperty,
  playCardAsMoney,
  playActionCard,
  endTurn,
  needsDiscard,
  discardCards,
  countCompleteSets,
  getBankTotal,
  createEmptyBoard,
  payWithCards,
} from '@/lib/gameEngine';
import { GameCardComponent } from '@/components/game/cards/GameCardComponent';
import { CardBack } from '@/components/game/cards/CardBack';
import { ActionResponsePanel } from '@/components/game/ActionResponsePanel';
import { TargetSelector } from '@/components/game/TargetSelector';
import { DollarSign, Trophy, ChevronRight, Layers, Hand, Sparkles } from 'lucide-react';

interface Player {
  user_id: string;
  display_name: string;
  player_order: number;
}

export default function Game() {
  const { roomCode } = useParams<{ roomCode: string }>();
  const navigate = useNavigate();
  const [gameState, setGameState] = useState<PublicGameState | null>(null);
  const [myHand, setMyHand] = useState<GameCard[]>([]);
  const [userId, setUserId] = useState('');
  const [players, setPlayers] = useState<Player[]>([]);
  const [selectedCard, setSelectedCard] = useState<string | null>(null);
  const [roomId, setRoomId] = useState('');
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [dealing, setDealing] = useState(false);
  const [dealtCards, setDealtCards] = useState<number>(0);
  const [showTargetSelector, setShowTargetSelector] = useState(false);
  const [targetAction, setTargetAction] = useState<string>('');
  const [selectedTarget, setSelectedTarget] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<PropertyColor | null>(null);
  const [discardMode, setDiscardMode] = useState(false);
  const [discardSelected, setDiscardSelected] = useState<string[]>([]);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // Initialize
  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate('/'); return; }
      setUserId(user.id);

      const { data: room } = await supabase
        .from('game_rooms')
        .select('id')
        .eq('room_code', roomCode)
        .single();
      if (!room) { navigate('/'); return; }
      setRoomId(room.id);

      const { data: playersData } = await supabase
        .from('game_players')
        .select('user_id, display_name, player_order')
        .eq('room_id', room.id)
        .order('player_order');
      setPlayers(playersData || []);

      const { data: stateData } = await supabase
        .from('game_states')
        .select('current_state')
        .eq('room_id', room.id)
        .single();
      if (stateData) {
        const state = stateData.current_state as unknown as PublicGameState;
        setGameState(state);
        
        const handData = await supabase
          .from('player_hands')
          .select('hand')
          .eq('room_id', room.id)
          .eq('user_id', user.id)
          .single();
        
        if (handData.data) {
          const hand = handData.data.hand as unknown as GameCard[];
          const noCardsPlayed = Object.values(state.boards).every(
            (b: PlayerBoard) => b.bank.length === 0 && Object.values(b.properties).every((p: GameCard[]) => p.length === 0)
          );
          
          if (noCardsPlayed && hand.length > 0) {
            setDealing(true);
            setDealtCards(0);
            for (let i = 0; i < hand.length; i++) {
              await new Promise(r => setTimeout(r, 200));
              setDealtCards(i + 1);
            }
            await new Promise(r => setTimeout(r, 400));
            setDealing(false);
          }
          setMyHand(hand);
        }
      }
    };
    init();
  }, [roomCode, navigate]);

  // Subscribe to realtime game state changes
  useEffect(() => {
    if (!roomId || !userId) return;

    const channel = supabase
      .channel(`game-realtime-${roomId}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'game_states',
        filter: `room_id=eq.${roomId}`,
      }, (payload) => {
        if (payload.new && payload.new.current_state) {
          setGameState(payload.new.current_state as unknown as PublicGameState);
        }
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'player_hands',
        filter: `user_id=eq.${userId}`,
      }, (payload) => {
        if (payload.new && payload.new.hand) {
          setMyHand(payload.new.hand as unknown as GameCard[]);
        }
      })
      .subscribe();

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId, userId]);

  // Poll for game state changes as backup (every 3s)
  useEffect(() => {
    if (!roomId || !userId) return;
    const interval = setInterval(async () => {
      const [stateRes, handRes] = await Promise.all([
        supabase.from('game_states').select('current_state').eq('room_id', roomId).single(),
        supabase.from('player_hands').select('hand').eq('room_id', roomId).eq('user_id', userId).single(),
      ]);
      if (stateRes.data) setGameState(stateRes.data.current_state as unknown as PublicGameState);
      if (handRes.data) setMyHand(handRes.data.hand as unknown as GameCard[]);
    }, 3000);
    return () => clearInterval(interval);
  }, [roomId, userId]);

  const isMyTurn = gameState ? getCurrentPlayerId(gameState) === userId : false;
  const currentPlayerName = gameState
    ? players.find(p => p.user_id === getCurrentPlayerId(gameState))?.display_name || 'Unknown'
    : '';

  // Persist state helper
  const persistState = useCallback(async (newState: PublicGameState, newHand: GameCard[]) => {
    setGameState(newState);
    setMyHand(newHand);
    await Promise.all([
      supabase.from('game_states').update({ current_state: newState as unknown as import('@/integrations/supabase/types').Json }).eq('room_id', roomId),
      supabase.from('player_hands').update({ hand: newHand as unknown as import('@/integrations/supabase/types').Json }).eq('room_id', roomId).eq('user_id', userId),
    ]);
  }, [roomId, userId]);

  const handleDraw = useCallback(async () => {
    if (!gameState || !isMyTurn || gameState.phase !== 'drawing') return;
    const result = drawCards(gameState, myHand);
    await persistState(result.state, result.hand);
    toast.success(`Drew ${result.drawnCards.length} cards`);
  }, [gameState, isMyTurn, myHand, persistState]);

  const handlePlayAsProperty = useCallback(async (color: PropertyColor) => {
    if (!gameState || !selectedCard) return;
    const result = playCardAsProperty(gameState, myHand, selectedCard, color);
    if (!result) { toast.error('Cannot play this card'); return; }
    setSelectedCard(null);
    setShowColorPicker(false);
    await persistState(result.state, result.hand);

    if (result.state.winner) {
      toast.success('🎉 You completed 3 sets! YOU WIN!', { duration: 10000 });
    } else {
      toast.success('Property played!');
    }
  }, [gameState, selectedCard, myHand, persistState]);

  const handlePlayAsMoney = useCallback(async () => {
    if (!gameState || !selectedCard) return;
    const result = playCardAsMoney(gameState, myHand, selectedCard);
    if (!result) { toast.error('Cannot play this card'); return; }
    setSelectedCard(null);
    await persistState(result.state, result.hand);
    toast.success('Added to bank!');
  }, [gameState, selectedCard, myHand, persistState]);

  // Action card play - opens target selector if needed
  const handlePlayAction = useCallback(() => {
    if (!gameState || !selectedCard) return;
    const card = myHand.find(c => c.uid === selectedCard);
    if (!card) return;

    const needsTarget = ['Debt Collector', 'Sly Deal', 'Forced Deal', 'Deal Breaker', 'Wild Rent'].includes(card.name);
    const needsColor = ['Rent', 'Wild Rent', 'House', 'Hotel'].includes(card.name);

    if (needsTarget || needsColor) {
      setTargetAction(card.name);
      setSelectedTarget(null);
      setSelectedColor(null);
      setShowTargetSelector(true);
      return;
    }

    // Direct play (Pass Go, etc.)
    const result = playActionCard(gameState, myHand, selectedCard);
    if (!result) { toast.error('Cannot play this action'); return; }
    setSelectedCard(null);
    persistState(result.state, result.hand);
    toast.success(`${card.name} played!`);
  }, [gameState, selectedCard, myHand, persistState]);

  // Confirm target selection and play action
  const handleConfirmTarget = useCallback(async () => {
    if (!gameState || !selectedCard) return;
    const card = myHand.find(c => c.uid === selectedCard);
    if (!card) return;

    const result = playActionCard(gameState, myHand, selectedCard, selectedTarget || undefined, selectedColor || undefined);
    if (!result) { toast.error('Cannot play this action'); return; }
    
    setSelectedCard(null);
    setShowTargetSelector(false);
    setSelectedTarget(null);
    setSelectedColor(null);
    await persistState(result.state, result.hand);
    toast.success(`${card.name} played!`);
  }, [gameState, selectedCard, myHand, selectedTarget, selectedColor, persistState]);

  // Handle paying for an action (as a target)
  const handlePay = useCallback(async (bankCardUids: string[], propertyCards: { uid: string; color: PropertyColor }[]) => {
    if (!gameState || !gameState.pendingAction) return;
    const pending = gameState.pendingAction;
    const myBoard = gameState.boards[userId] || createEmptyBoard();

    const payResult = payWithCards(gameState, myBoard, pending.sourcePlayerId, bankCardUids, propertyCards);
    
    const newResponded = [...pending.respondedPlayers, userId];
    const allResponded = pending.targetPlayerIds.every(id => newResponded.includes(id));

    const newState: PublicGameState = {
      ...payResult.state,
      pendingAction: allResponded ? null : { ...pending, respondedPlayers: newResponded },
      phase: allResponded ? 'playing' : 'responding',
    };

    await persistState(newState, myHand);
    toast.success('Payment sent!');
  }, [gameState, userId, myHand, persistState]);

  // Handle Just Say No
  const handleJustSayNo = useCallback(async () => {
    if (!gameState || !gameState.pendingAction) return;
    const pending = gameState.pendingAction;

    // Remove Just Say No from hand
    const jsnIndex = myHand.findIndex(c => c.name === 'Just Say No');
    if (jsnIndex === -1) return;
    const newHand = myHand.filter((_, i) => i !== jsnIndex);
    const jsnCard = myHand[jsnIndex];

    const newResponded = [...pending.respondedPlayers, userId];
    const allResponded = pending.targetPlayerIds.every(id => newResponded.includes(id));

    const newState: PublicGameState = {
      ...gameState,
      discardPile: [...gameState.discardPile, jsnCard],
      pendingAction: allResponded ? null : { ...pending, respondedPlayers: newResponded },
      phase: allResponded ? 'playing' : 'responding',
      handCounts: { ...gameState.handCounts, [userId]: newHand.length },
    };

    await persistState(newState, newHand);
    toast.success('Just Say No! Action blocked! 🛡️');
  }, [gameState, userId, myHand, persistState]);

  // Handle accepting steal actions
  const handleAccept = useCallback(async () => {
    if (!gameState || !gameState.pendingAction) return;
    const pending = gameState.pendingAction;

    // For now, accept without transfer logic (simplified)
    const newResponded = [...pending.respondedPlayers, userId];
    const allResponded = pending.targetPlayerIds.every(id => newResponded.includes(id));

    const newState: PublicGameState = {
      ...gameState,
      pendingAction: allResponded ? null : { ...pending, respondedPlayers: newResponded },
      phase: allResponded ? 'playing' : 'responding',
    };

    await persistState(newState, myHand);
    toast.info('Action accepted');
  }, [gameState, userId, myHand, persistState]);

  const handleEndTurn = useCallback(async () => {
    if (!gameState || !isMyTurn) return;
    if (needsDiscard(myHand)) {
      setDiscardMode(true);
      setDiscardSelected([]);
      return;
    }
    const newState = endTurn(gameState);
    await persistState(newState, myHand);
    toast.info('Turn ended');
  }, [gameState, isMyTurn, myHand, persistState]);

  const handleDiscardToggle = (uid: string) => {
    setDiscardSelected(prev =>
      prev.includes(uid) ? prev.filter(id => id !== uid) : [...prev, uid]
    );
  };

  const handleConfirmDiscard = useCallback(async () => {
    if (!gameState) return;
    const result = discardCards(gameState, myHand, discardSelected);
    setDiscardMode(false);
    setDiscardSelected([]);
    await persistState(result.state, result.hand);
    toast.info('Cards discarded, turn ended');
  }, [gameState, myHand, discardSelected, persistState]);

  const handleCardClick = (uid: string) => {
    if (!isMyTurn || gameState?.phase !== 'playing') return;
    setSelectedCard(prev => prev === uid ? null : uid);
    setShowColorPicker(false);
  };

  const selectedCardData = selectedCard ? myHand.find(c => c.uid === selectedCard) : null;
  const myBoard = gameState?.boards[userId] || createEmptyBoard();

  if (!gameState) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
          <span className="text-muted-foreground">Loading game...</span>
        </div>
      </div>
    );
  }

  // Dealing animation screen
  if (dealing) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-6">
        <Sparkles className="w-12 h-12 text-primary animate-pulse" />
        <h2 className="text-2xl font-bold text-foreground">Dealing Cards...</h2>
        <div className="flex gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className={`transition-all duration-300 ${i < dealtCards ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-8'}`}>
              <CardBack />
            </div>
          ))}
        </div>
        <p className="text-muted-foreground text-sm">{dealtCards}/5 cards dealt</p>
      </div>
    );
  }

  // Winner screen
  if (gameState.winner) {
    const winnerName = players.find(p => p.user_id === gameState.winner)?.display_name || 'Unknown';
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-6">
        <Trophy className="w-20 h-20 text-yellow-500 animate-bounce" />
        <h1 className="text-4xl font-bold text-foreground">{winnerName} Wins!</h1>
        <p className="text-muted-foreground">Completed 3 property sets</p>
        <Button onClick={() => navigate('/')} className="mt-4">Back to Home</Button>
      </div>
    );
  }

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      {/* Action Response Panel - shown when an action is pending against us */}
      {gameState.phase === 'responding' && gameState.pendingAction && (
        <ActionResponsePanel
          gameState={gameState}
          userId={userId}
          myHand={myHand}
          myBoard={myBoard}
          players={players}
          onPay={handlePay}
          onJustSayNo={handleJustSayNo}
          onAccept={handleAccept}
        />
      )}

      {/* Target Selector - shown when playing action that needs target/color */}
      {showTargetSelector && (
        <TargetSelector
          players={players}
          userId={userId}
          boards={gameState.boards}
          actionType={targetAction}
          selectedTarget={selectedTarget}
          selectedColor={selectedColor}
          onSelectTarget={setSelectedTarget}
          onSelectColor={setSelectedColor}
          onConfirm={handleConfirmTarget}
          onCancel={() => { setShowTargetSelector(false); setSelectedCard(null); }}
          availableColors={selectedCardData?.colors as PropertyColor[] | undefined}
        />
      )}

      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-2 border-b bg-card shadow-sm">
        <div className="flex items-center gap-3">
          <h2 className="font-bold text-foreground tracking-tight">MONOPOLY DEAL</h2>
          <Badge variant="secondary" className="font-mono text-xs">{roomCode}</Badge>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <Badge variant={isMyTurn ? 'default' : 'secondary'} className={isMyTurn ? 'animate-pulse' : ''}>
            {isMyTurn ? "⭐ Your Turn" : `${currentPlayerName}'s Turn`}
          </Badge>
          {isMyTurn && (
            <Badge variant="outline">
              Plays: {gameState.cardsPlayedThisTurn}/3
            </Badge>
          )}
          {gameState.phase === 'responding' && (
            <Badge variant="destructive" className="animate-pulse">
              ⚡ Waiting for response...
            </Badge>
          )}
        </div>
      </div>

      {/* Opponents area */}
      <div className="flex-none flex gap-3 px-4 py-3 overflow-x-auto border-b bg-muted/30">
        {players.filter(p => p.user_id !== userId).map(player => {
          const board: PlayerBoard = gameState.boards[player.user_id] || createEmptyBoard();
          const handCount = gameState.handCounts[player.user_id] || 0;
          const isCurrentTurn = getCurrentPlayerId(gameState) === player.user_id;

          return (
            <div
              key={player.user_id}
              className={`flex-none rounded-xl border-2 p-3 min-w-[240px] ${isCurrentTurn ? 'border-primary bg-primary/5' : 'border-border bg-card'}`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-sm text-foreground">{player.display_name}</span>
                <div className="flex items-center gap-2">
                  <span className="flex items-center gap-0.5 text-xs text-muted-foreground">
                    <Hand className="w-3 h-3" /> {handCount}
                  </span>
                  <span className="flex items-center gap-0.5 text-xs text-muted-foreground">
                    <DollarSign className="w-3 h-3" /> {getBankTotal(board)}M
                  </span>
                </div>
              </div>

              {/* Opponent's played properties */}
              <div className="flex flex-wrap gap-1 mb-2">
                {(Object.keys(board.properties) as PropertyColor[]).map(color => {
                  const props = board.properties[color];
                  if (!props || props.length === 0) return null;
                  const setSize = PROPERTY_SETS[color].size;
                  const isComplete = props.length >= setSize;
                  return (
                    <div key={color} className={`rounded-lg border p-1 ${isComplete ? 'border-yellow-400 shadow-md bg-yellow-50' : 'border-border'}`}>
                      <div className="flex gap-0.5">
                        {props.map(card => (
                          <GameCardComponent key={card.uid} card={card} small />
                        ))}
                      </div>
                      {isComplete && <span className="text-[7px] font-bold text-yellow-600 block text-center">✓ SET</span>}
                    </div>
                  );
                })}
              </div>

              {/* Opponent's bank */}
              {board.bank.length > 0 && (
                <div className="flex gap-0.5 flex-wrap">
                  <span className="text-[8px] text-muted-foreground font-bold mr-1">Bank:</span>
                  {board.bank.map(card => (
                    <GameCardComponent key={card.uid} card={card} small />
                  ))}
                </div>
              )}

              {/* Hidden hand */}
              <div className="flex gap-0.5 mt-2">
                {Array.from({ length: Math.min(handCount, 7) }).map((_, i) => (
                  <CardBack key={i} small className="scale-[0.5] -mx-1.5" />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Center area */}
      <div className="flex-1 flex items-center justify-center gap-8 px-4 overflow-auto">
        {/* My properties */}
        <div className="flex flex-col gap-2 max-w-[450px]">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Your Properties</h3>
          <div className="flex flex-wrap gap-2">
            {(Object.keys(myBoard.properties) as PropertyColor[]).map(color => {
              const props = myBoard.properties[color] || [];
              if (props.length === 0) return null;
              const setSize = PROPERTY_SETS[color].size;
              const isComplete = props.length >= setSize;
              return (
                <div key={color} className={`rounded-lg p-2 border ${isComplete ? 'border-yellow-400 shadow-lg bg-yellow-50' : 'border-border'}`}>
                  <div className="flex gap-1 mb-1">
                    {props.map(card => (
                      <GameCardComponent key={card.uid} card={card} small />
                    ))}
                  </div>
                  {isComplete && <Badge className="text-[8px] bg-yellow-400 text-yellow-900">COMPLETE</Badge>}
                </div>
              );
            })}
          </div>
          {/* Bank */}
          <div className="mt-2">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
              Bank: {getBankTotal(myBoard)}M
            </h3>
            <div className="flex gap-1 flex-wrap">
              {myBoard.bank.map(card => (
                <GameCardComponent key={card.uid} card={card} small />
              ))}
            </div>
          </div>
        </div>

        {/* Deck & Discard */}
        <div className="flex flex-col items-center gap-3">
          <div className="text-center">
            <CardBack count={gameState.deck.length} />
            <p className="text-[10px] text-muted-foreground mt-1">Draw Pile</p>
          </div>
          {isMyTurn && gameState.phase === 'drawing' && (
            <Button onClick={handleDraw} className="gap-1 text-sm animate-pulse">
              Draw Cards
            </Button>
          )}
          <div className="text-center">
            <div className="w-20 h-28 rounded-xl border-2 border-dashed border-border flex items-center justify-center bg-muted/20">
              {gameState.discardPile.length > 0 ? (
                <GameCardComponent card={gameState.discardPile[gameState.discardPile.length - 1]} small />
              ) : (
                <Layers className="w-6 h-6 text-muted-foreground/30" />
              )}
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">Discard</p>
          </div>
        </div>

        {/* Sets counter */}
        <div className="flex flex-col items-center gap-2">
          <div className="text-center">
            <p className="text-4xl font-bold text-foreground">
              {countCompleteSets(myBoard)}
            </p>
            <p className="text-xs text-muted-foreground">/ 3 Sets</p>
          </div>
          {isMyTurn && gameState.phase === 'playing' && (
            <Button onClick={handleEndTurn} variant="secondary" className="gap-1 text-sm">
              End Turn <ChevronRight className="w-3 h-3" />
            </Button>
          )}
        </div>
      </div>

      {/* Action bar for selected card */}
      {selectedCardData && isMyTurn && gameState.phase === 'playing' && (
        <div className="flex-none px-4 py-2 border-t bg-card flex items-center justify-center gap-3 shadow-lg">
          <span className="text-sm text-muted-foreground font-medium">{selectedCardData.name}</span>

          {(selectedCardData.type === 'property') && (
            <Button size="sm" onClick={() => handlePlayAsProperty(selectedCardData.color!)}>
              Play as Property
            </Button>
          )}

          {selectedCardData.type === 'wild_property' && (
            <>
              <Button size="sm" variant="outline" onClick={() => setShowColorPicker(!showColorPicker)}>
                Play as Property
              </Button>
              {showColorPicker && (
                <div className="flex gap-1">
                  {selectedCardData.colors?.map(color => (
                    <button
                      key={color}
                      onClick={() => handlePlayAsProperty(color)}
                      className={`${COLOR_CONFIG[color].bg} w-6 h-6 rounded-full border-2 border-background hover:scale-110 transition-transform`}
                      title={COLOR_CONFIG[color].label}
                    />
                  ))}
                </div>
              )}
            </>
          )}

          {(selectedCardData.type === 'action' || selectedCardData.type === 'rent') && (
            <Button size="sm" onClick={handlePlayAction}>
              Play Action
            </Button>
          )}

          <Button size="sm" variant="secondary" onClick={handlePlayAsMoney}>
            Play as Money (M{selectedCardData.value})
          </Button>
        </div>
      )}

      {/* My hand */}
      <div className="flex-none border-t bg-card/90 backdrop-blur-sm px-4 py-3 shadow-inner">
        <div className="flex items-center gap-2 mb-2">
          <Hand className="w-4 h-4 text-muted-foreground" />
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Your Hand ({myHand.length})
          </span>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 justify-center">
          {myHand.map((card, i) => (
            <div key={card.uid} className="flex-none" style={{ animationDelay: `${i * 50}ms` }}>
              <GameCardComponent
                card={card}
                onClick={() => handleCardClick(card.uid)}
                selected={selectedCard === card.uid}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
