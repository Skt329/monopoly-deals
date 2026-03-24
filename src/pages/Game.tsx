import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
  resolveStealAction,
  rearrangeWildProperty,
  hasAnyProperties,
  anyOpponentHasStealable,
  getStealableProperties,
  getCompleteSetColors,
  isSetComplete,
  calculateRent,
} from '@/lib/gameEngine';
import { GameCardComponent } from '@/components/game/cards/GameCardComponent';
import { CardBack } from '@/components/game/cards/CardBack';
import { ActionResponsePanel } from '@/components/game/ActionResponsePanel';
import { TargetSelector } from '@/components/game/TargetSelector';
import { DollarSign, Trophy, ChevronRight, ChevronDown, Layers, Hand, Sparkles, RefreshCw } from 'lucide-react';

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
  const [previewCard, setPreviewCard] = useState<GameCard | null>(null);
  const [roomId, setRoomId] = useState('');
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [dealing, setDealing] = useState(false);
  const [dealtCards, setDealtCards] = useState<number>(0);
  const [showTargetSelector, setShowTargetSelector] = useState(false);
  const [targetAction, setTargetAction] = useState<string>('');
  const [selectedTarget, setSelectedTarget] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<PropertyColor | null>(null);
  const [selectedTargetCard, setSelectedTargetCard] = useState<string | null>(null);
  const [selectedSourceCard, setSelectedSourceCard] = useState<string | null>(null);
  const [discardMode, setDiscardMode] = useState(false);
  const [discardSelected, setDiscardSelected] = useState<string[]>([]);
  const [doubleRentPending, setDoubleRentPending] = useState(false);
  const [doubleRentCardUid, setDoubleRentCardUid] = useState<string | null>(null);
  // Rearrange wild property state
  const [rearrangeCardUid, setRearrangeCardUid] = useState<string | null>(null);
  const [rearrangeCard, setRearrangeCard] = useState<GameCard | null>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const forceEndRef = useRef(false);

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

  // Check if turn should auto-end or discard after a play
  const checkAutoEndTurn = useCallback(async (newState: PublicGameState, newHand: GameCard[]) => {
    if (newState.cardsPlayedThisTurn >= 3 && !newState.winner) {
      if (newHand.length > MAX_HAND_SIZE) {
        setDiscardMode(true);
        setDiscardSelected([]);
        toast.info(`You've used all 3 plays. Discard down to ${MAX_HAND_SIZE} cards.`);
      } else {
        const endedState = endTurn(newState);
        setGameState(endedState);
        await supabase.from('game_states').update({ current_state: endedState as unknown as import('@/integrations/supabase/types').Json }).eq('room_id', roomId);
        toast.info('All 3 plays used — turn ended automatically');
      }
    }
  }, [roomId]);

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
      await checkAutoEndTurn(result.state, result.hand);
    }
  }, [gameState, selectedCard, myHand, persistState, checkAutoEndTurn]);

  const handlePlayAsMoney = useCallback(async () => {
    if (!gameState || !selectedCard) return;
    const result = playCardAsMoney(gameState, myHand, selectedCard);
    if (!result) { toast.error('Cannot play this card'); return; }
    setSelectedCard(null);
    await persistState(result.state, result.hand);
    toast.success('Added to bank!');
    await checkAutoEndTurn(result.state, result.hand);
  }, [gameState, selectedCard, myHand, persistState, checkAutoEndTurn]);

  // Action card play - opens target selector if needed
  const handlePlayAction = useCallback(async () => {
    if (!gameState || !selectedCard) return;
    const card = myHand.find(c => c.uid === selectedCard);
    if (!card) return;

    // Double The Rent: check if we have a rent card to pair with
    if (card.name === 'Double The Rent') {
      const hasRentCard = myHand.some(c => c.uid !== card.uid && (c.type === 'rent'));
      if (!hasRentCard) {
        toast.error('You need a rent card to pair with Double The Rent!');
        return;
      }
      if (gameState.cardsPlayedThisTurn >= 2) {
        toast.error('Not enough plays left for Double The Rent combo (needs 2 plays)');
        return;
      }
      setDoubleRentPending(true);
      setDoubleRentCardUid(selectedCard);
      setSelectedCard(null);
      toast.info('Double The Rent activated! Now select a rent card to play.');
      return;
    }

    // Forced Deal gate: check player has properties
    if (card.name === 'Forced Deal') {
      const myBoard = gameState.boards[userId];
      if (!myBoard || !hasAnyProperties(myBoard)) {
        toast.error('You need at least one property to use Forced Deal!');
        return;
      }
      if (!anyOpponentHasStealable(gameState.boards, userId)) {
        toast.error('No opponents have stealable properties!');
        return;
      }
    }

    // Sly Deal gate: check opponents have stealable properties
    if (card.name === 'Sly Deal') {
      if (!anyOpponentHasStealable(gameState.boards, userId)) {
        toast.error('No opponents have stealable properties!');
        return;
      }
    }

    // Deal Breaker gate: check opponents have complete sets
    if (card.name === 'Deal Breaker') {
      const hasCompleteSets = Object.keys(gameState.boards).some(pid => {
        if (pid === userId) return false;
        return getCompleteSetColors(gameState.boards[pid]).length > 0;
      });
      if (!hasCompleteSets) {
        toast.error('No opponents have complete sets to steal!');
        return;
      }
    }

    const needsTarget = ['Debt Collector', 'Sly Deal', 'Forced Deal', 'Deal Breaker', 'Wild Rent'].includes(card.name);
    const needsColor = ['Rent', 'Wild Rent', 'House', 'Hotel'].includes(card.name);

    if (needsTarget || needsColor) {
      setTargetAction(card.name);
      setSelectedTarget(null);
      setSelectedColor(null);
      setSelectedTargetCard(null);
      setSelectedSourceCard(null);
      setShowTargetSelector(true);
      return;
    }

    // Direct play (Pass Go, It's Your Birthday, etc.)
    if (card.name === "It's Your Birthday") {
      const result = playActionCard(gameState, myHand, selectedCard);
      if (!result) { toast.error('Cannot play this action'); return; }
      setSelectedCard(null);
      await persistState(result.state, result.hand);
      toast.success(`${card.name} played!`);
      return;
    }

    const result = playActionCard(gameState, myHand, selectedCard);
    if (!result) { toast.error('Cannot play this action'); return; }
    setSelectedCard(null);
    await persistState(result.state, result.hand);
    toast.success(`${card.name} played!`);
    if (result.state.phase === 'playing') {
      await checkAutoEndTurn(result.state, result.hand);
    }
  }, [gameState, selectedCard, myHand, persistState, checkAutoEndTurn, userId]);

  // When Double Rent is pending and user selects a rent card
  const handlePlayRentWithDouble = useCallback(async () => {
    if (!gameState || !selectedCard || !doubleRentCardUid) return;
    const rentCard = myHand.find(c => c.uid === selectedCard);
    if (!rentCard || rentCard.type !== 'rent') {
      toast.error('Please select a rent card');
      return;
    }

    const dtrIndex = myHand.findIndex(c => c.uid === doubleRentCardUid);
    if (dtrIndex === -1) return;
    const dtrCard = myHand[dtrIndex];
    const handAfterDTR = myHand.filter((_, i) => i !== dtrIndex);

    const stateAfterDTR: PublicGameState = {
      ...gameState,
      discardPile: [...gameState.discardPile, dtrCard],
      cardsPlayedThisTurn: gameState.cardsPlayedThisTurn + 1,
      handCounts: { ...gameState.handCounts, [userId]: handAfterDTR.length },
    };

    setTargetAction(rentCard.name);
    setSelectedTarget(null);
    setSelectedColor(null);
    setSelectedTargetCard(null);
    setSelectedSourceCard(null);
    setShowTargetSelector(true);

    setGameState(stateAfterDTR);
    setMyHand(handAfterDTR);
    await Promise.all([
      supabase.from('game_states').update({ current_state: stateAfterDTR as unknown as import('@/integrations/supabase/types').Json }).eq('room_id', roomId),
      supabase.from('player_hands').update({ hand: handAfterDTR as unknown as import('@/integrations/supabase/types').Json }).eq('room_id', roomId).eq('user_id', userId),
    ]);
  }, [gameState, selectedCard, doubleRentCardUid, myHand, userId, roomId]);

  // Confirm target selection and play action
  const handleConfirmTarget = useCallback(async () => {
    if (!gameState || !selectedCard) return;
    const card = myHand.find(c => c.uid === selectedCard);
    if (!card) return;

    const result = playActionCard(
      gameState, myHand, selectedCard,
      selectedTarget || undefined,
      selectedColor || undefined,
      selectedTargetCard || undefined,
      selectedSourceCard || undefined,
      doubleRentPending
    );
    if (!result) { toast.error('Cannot play this action'); return; }
    
    setSelectedCard(null);
    setShowTargetSelector(false);
    setSelectedTarget(null);
    setSelectedColor(null);
    setSelectedTargetCard(null);
    setSelectedSourceCard(null);
    setDoubleRentPending(false);
    setDoubleRentCardUid(null);
    await persistState(result.state, result.hand);
    toast.success(`${card.name} played!${doubleRentPending ? ' (DOUBLED!)' : ''}`);
  }, [gameState, selectedCard, myHand, selectedTarget, selectedColor, selectedTargetCard, selectedSourceCard, doubleRentPending, persistState]);

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

    let stateAfterResolve = gameState;

    if (['deal_breaker', 'sly_deal', 'forced_deal'].includes(pending.type)) {
      stateAfterResolve = resolveStealAction(gameState, pending, userId);
    }

    const newResponded = [...pending.respondedPlayers, userId];
    const allResponded = pending.targetPlayerIds.every(id => newResponded.includes(id));

    const newState: PublicGameState = {
      ...stateAfterResolve,
      pendingAction: allResponded ? null : { ...pending, respondedPlayers: newResponded },
      phase: allResponded ? 'playing' : 'responding',
    };

    // Check win condition for the attacker after steal
    const attackerBoard = newState.boards[pending.sourcePlayerId];
    if (attackerBoard && countCompleteSets(attackerBoard) >= 3) {
      newState.winner = pending.sourcePlayerId;
      newState.phase = 'finished';
    }

    await persistState(newState, myHand);
    toast.info('Action accepted — properties transferred');
  }, [gameState, userId, myHand, persistState]);

  const handleEndTurn = useCallback(async () => {
    if (!gameState || !isMyTurn) return;
    if (needsDiscard(myHand) && gameState.cardsPlayedThisTurn < 3) {
      toast.warning(`You still have ${3 - gameState.cardsPlayedThisTurn} play(s) left! Use them to reduce your hand, or click End Turn again to discard.`, { id: 'end-turn-warn' });
      if (!forceEndRef.current) {
        forceEndRef.current = true;
        return;
      }
    }
    forceEndRef.current = false;
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
    if (discardMode) return;
    const card = myHand.find(c => c.uid === uid);
    if (!card) return;
    setPreviewCard(card);
    setSelectedCard(uid);
    setShowColorPicker(false);
  };

  // Rearrange wild property
  const handleRearrange = useCallback(async (cardUid: string, newColor: PropertyColor) => {
    if (!gameState) return;
    const result = rearrangeWildProperty(gameState, userId, cardUid, newColor);
    if (!result) { toast.error('Cannot rearrange this card'); return; }
    setRearrangeCardUid(null);
    setRearrangeCard(null);
    setGameState(result);
    await supabase.from('game_states').update({ current_state: result as unknown as import('@/integrations/supabase/types').Json }).eq('room_id', roomId);
    toast.success('Property rearranged!');
  }, [gameState, userId, roomId]);

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
      {/* Action Response Panel */}
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

      {/* Target Selector */}
      {showTargetSelector && (
        <TargetSelector
          players={players}
          userId={userId}
          boards={gameState.boards}
          actionType={targetAction}
          selectedTarget={selectedTarget}
          selectedColor={selectedColor}
          selectedTargetCard={selectedTargetCard}
          selectedSourceCard={selectedSourceCard}
          onSelectTarget={setSelectedTarget}
          onSelectColor={setSelectedColor}
          onSelectTargetCard={setSelectedTargetCard}
          onSelectSourceCard={setSelectedSourceCard}
          onConfirm={handleConfirmTarget}
          onCancel={() => {
            setShowTargetSelector(false);
            setSelectedCard(null);
            setDoubleRentPending(false);
            setDoubleRentCardUid(null);
          }}
          availableColors={selectedCardData?.colors as PropertyColor[] | undefined}
        />
      )}

      {/* Top bar */}
      <div className="flex items-center justify-between px-3 py-1.5 border-b bg-card shadow-sm">
        <div className="flex items-center gap-2">
          <h2 className="font-bold text-sm text-foreground tracking-tight">MONOPOLY DEAL</h2>
          <Badge variant="secondary" className="font-mono text-[10px]">{roomCode}</Badge>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Badge variant={isMyTurn ? 'default' : 'secondary'} className={`text-xs ${isMyTurn ? 'animate-pulse' : ''}`}>
            {isMyTurn ? "⭐ Your Turn" : `${currentPlayerName}'s Turn`}
          </Badge>
          {isMyTurn && gameState.phase === 'playing' && (
            <div className={`flex items-center gap-1 px-2 py-1 rounded-full font-bold text-xs border ${
              gameState.cardsPlayedThisTurn >= 3
                ? 'bg-destructive/10 border-destructive text-destructive'
                : gameState.cardsPlayedThisTurn >= 2
                  ? 'bg-amber-100 border-amber-400 text-amber-700'
                  : 'bg-primary/10 border-primary text-primary'
            }`}>
              🎴 {gameState.cardsPlayedThisTurn}/3
            </div>
          )}
          {doubleRentPending && (
            <Badge variant="destructive" className="text-[10px] animate-pulse">⚡ Double Rent — Pick Rent!</Badge>
          )}
          {gameState.phase === 'responding' && (
            <Badge variant="destructive" className="text-[10px] animate-pulse">⚡ Waiting...</Badge>
          )}
        </div>
      </div>

      {/* Opponents area - compact */}
      <div className="flex-none flex gap-2 px-3 py-2 overflow-x-auto border-b bg-muted/30">
        {players.filter(p => p.user_id !== userId).map(player => {
          const board: PlayerBoard = gameState.boards[player.user_id] || createEmptyBoard();
          const handCount = gameState.handCounts[player.user_id] || 0;
          const isCurrentTurn = getCurrentPlayerId(gameState) === player.user_id;

          return (
            <div
              key={player.user_id}
              className={`flex-none rounded-lg border p-2 min-w-[200px] max-w-[260px] ${isCurrentTurn ? 'border-primary bg-primary/5' : 'border-border bg-card'}`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-semibold text-xs text-foreground truncate">{player.display_name}</span>
                <div className="flex items-center gap-1.5">
                  <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
                    <Hand className="w-3 h-3" /> {handCount}
                  </span>
                  <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
                    <DollarSign className="w-3 h-3" /> {getBankTotal(board)}M
                  </span>
                </div>
              </div>

              {/* Opponent's properties - compact */}
              <div className="flex flex-wrap gap-0.5 mb-1">
                {(Object.keys(board.properties) as PropertyColor[]).map(color => {
                  const props = board.properties[color];
                  if (!props || props.length === 0) return null;
                  const setSize = PROPERTY_SETS[color].size;
                  const isComplete = props.length >= setSize;
                  const config = COLOR_CONFIG[color];
                  return (
                    <div key={color} className={`rounded px-1.5 py-0.5 text-[9px] font-bold ${config.bg} ${config.text} ${isComplete ? 'ring-1 ring-yellow-400' : ''}`}>
                      {config.label} ({props.length}/{setSize}) {isComplete && '✓'}
                    </div>
                  );
                })}
              </div>

              {/* Opponent bank - stacked */}
              {board.bank.length > 0 && (
                <div className="text-[9px] text-muted-foreground font-semibold">
                  💰 Bank: {getBankTotal(board)}M ({board.bank.length} cards)
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Center area - more space */}
      <div className="flex-1 flex gap-4 px-3 py-2 overflow-auto min-h-0">
        {/* My properties */}
        <div className="flex-1 flex flex-col gap-1.5 overflow-y-auto min-w-0">
          <h3 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Your Properties</h3>
          <div className="flex flex-wrap gap-1.5">
            {(Object.keys(myBoard.properties) as PropertyColor[]).map(color => {
              const props = myBoard.properties[color] || [];
              if (props.length === 0) return null;
              const setSize = PROPERTY_SETS[color].size;
              const isComplete = props.length >= setSize;
              return (
                <div key={color} className={`rounded-lg p-1.5 border ${isComplete ? 'border-yellow-400 shadow-md bg-yellow-50' : 'border-border'}`}>
                  <div className="flex gap-0.5 mb-0.5">
                    {props.map(card => (
                      <div key={card.uid} className="relative group">
                        <GameCardComponent card={card} small />
                        {/* Rearrange button for wild properties */}
                        {card.type === 'wild_property' && isMyTurn && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setRearrangeCardUid(card.uid);
                              setRearrangeCard(card);
                            }}
                            className="absolute -top-1 -right-1 w-4 h-4 bg-primary text-primary-foreground rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Rearrange"
                          >
                            <RefreshCw className="w-2.5 h-2.5" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  {isComplete && <Badge className="text-[7px] bg-yellow-400 text-yellow-900 px-1 py-0">SET ✓</Badge>}
                </div>
              );
            })}
          </div>

          {/* Bank - stacked */}
          <div className="mt-1">
            <h3 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-0.5">
              💰 Bank: {getBankTotal(myBoard)}M ({myBoard.bank.length} cards)
            </h3>
            {myBoard.bank.length > 0 && (
              <div className="relative h-16 w-12">
                {myBoard.bank.slice(0, 5).map((card, i) => (
                  <div key={card.uid} className="absolute" style={{ top: i * 2, left: i * 2 }}>
                    <GameCardComponent card={card} small />
                  </div>
                ))}
                {myBoard.bank.length > 5 && (
                  <div className="absolute -bottom-1 -right-1 bg-primary text-primary-foreground text-[8px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                    +{myBoard.bank.length - 5}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Deck & Discard - center */}
        <div className="flex flex-col items-center gap-2 flex-none">
          <div className="text-center">
            <CardBack count={gameState.deck.length} />
            <p className="text-[9px] text-muted-foreground mt-0.5">Draw ({gameState.deck.length})</p>
          </div>
          {isMyTurn && gameState.phase === 'drawing' && (
            <Button onClick={handleDraw} size="sm" className="gap-1 text-xs animate-pulse">
              Draw Cards
            </Button>
          )}
          <div className="text-center">
            <div className="w-16 h-24 rounded-lg border-2 border-dashed border-border flex items-center justify-center bg-muted/20">
              {gameState.discardPile.length > 0 ? (
                <GameCardComponent card={gameState.discardPile[gameState.discardPile.length - 1]} small />
              ) : (
                <Layers className="w-5 h-5 text-muted-foreground/30" />
              )}
            </div>
            <p className="text-[9px] text-muted-foreground mt-0.5">Discard</p>
          </div>
        </div>

        {/* Sets counter + End Turn */}
        <div className="flex flex-col items-center gap-2 flex-none">
          <div className="text-center">
            <p className="text-3xl font-bold text-foreground">{countCompleteSets(myBoard)}</p>
            <p className="text-[10px] text-muted-foreground">/ 3 Sets</p>
          </div>
          {isMyTurn && gameState.phase === 'playing' && (
            <div className="flex flex-col items-center gap-1">
              <Button
                onClick={handleEndTurn}
                size="sm"
                variant={gameState.cardsPlayedThisTurn >= 3 ? 'default' : 'secondary'}
                className={`gap-1 text-xs ${gameState.cardsPlayedThisTurn >= 3 ? 'animate-pulse' : ''}`}
              >
                End Turn <ChevronRight className="w-3 h-3" />
              </Button>
              {gameState.cardsPlayedThisTurn >= 3 && (
                <span className="text-[9px] text-destructive font-semibold">No more plays!</span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Card Preview Dialog */}
      <Dialog open={!!previewCard} onOpenChange={(open) => { if (!open) { setPreviewCard(null); setSelectedCard(null); setShowColorPicker(false); } }}>
        <DialogContent className="max-w-xs p-4">
          <DialogHeader>
            <DialogTitle className="text-center">{previewCard?.name}</DialogTitle>
          </DialogHeader>
          {previewCard && (
            <div className="flex flex-col items-center gap-4">
              <div className="transform scale-150 origin-center my-4">
                <GameCardComponent card={previewCard} />
              </div>
              <p className="text-xs text-muted-foreground text-center">
                Type: {previewCard.type} · Value: M{previewCard.value}
                {previewCard.type === 'property' && previewCard.color && ` · ${COLOR_CONFIG[previewCard.color].label}`}
                {previewCard.description && ` · ${previewCard.description}`}
              </p>

              {isMyTurn && gameState.phase === 'playing' && (
                <div className="flex flex-col gap-2 w-full">
                  {previewCard.type === 'money' && (
                    <Button size="sm" className="w-full" onClick={() => { setPreviewCard(null); handlePlayAsMoney(); }}>
                      Play to Bank (M{previewCard.value})
                    </Button>
                  )}

                  {previewCard.type === 'property' && (
                    <Button size="sm" className="w-full" onClick={() => { setPreviewCard(null); handlePlayAsProperty(previewCard.color!); }}>
                      Play as Property
                    </Button>
                  )}

                  {previewCard.type === 'wild_property' && (
                    <>
                      <div className="flex flex-col gap-1">
                        <Button size="sm" variant="outline" className="w-full" onClick={() => setShowColorPicker(!showColorPicker)}>
                          Play as Property
                        </Button>
                        {showColorPicker && (
                          <div className="flex gap-1 justify-center flex-wrap">
                            {previewCard.colors?.map(color => (
                              <button
                                key={color}
                                onClick={() => { setPreviewCard(null); handlePlayAsProperty(color); }}
                                className={`${COLOR_CONFIG[color].bg} px-2 py-1 rounded text-[10px] font-bold ${COLOR_CONFIG[color].text} hover:scale-110 transition-transform`}
                                title={COLOR_CONFIG[color].label}
                              >
                                {COLOR_CONFIG[color].label}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                      <Button size="sm" variant="secondary" className="w-full" onClick={() => { setPreviewCard(null); handlePlayAsMoney(); }}>
                        Play as Money (M{previewCard.value})
                      </Button>
                    </>
                  )}

                  {previewCard.type === 'action' && !doubleRentPending && (
                    <>
                      {previewCard.name !== 'Just Say No' && (
                        <Button size="sm" className="w-full" onClick={() => { setPreviewCard(null); handlePlayAction(); }}>
                          Play Action
                        </Button>
                      )}
                      <Button size="sm" variant="secondary" className="w-full" onClick={() => { setPreviewCard(null); handlePlayAsMoney(); }}>
                        Play as Money (M{previewCard.value})
                      </Button>
                    </>
                  )}

                  {previewCard.type === 'rent' && !doubleRentPending && (
                    <>
                      <Button size="sm" className="w-full" onClick={() => { setPreviewCard(null); handlePlayAction(); }}>
                        Play Rent
                      </Button>
                      <Button size="sm" variant="secondary" className="w-full" onClick={() => { setPreviewCard(null); handlePlayAsMoney(); }}>
                        Play as Money (M{previewCard.value})
                      </Button>
                    </>
                  )}

                  {doubleRentPending && previewCard.type === 'rent' && (
                    <Button size="sm" variant="destructive" className="w-full" onClick={() => { setPreviewCard(null); handlePlayRentWithDouble(); }}>
                      🔥 Play with Double Rent!
                    </Button>
                  )}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Rearrange Wild Property Dialog */}
      <Dialog open={!!rearrangeCardUid} onOpenChange={(open) => { if (!open) { setRearrangeCardUid(null); setRearrangeCard(null); } }}>
        <DialogContent className="max-w-xs p-4">
          <DialogHeader>
            <DialogTitle className="text-center">Rearrange Wild Property</DialogTitle>
          </DialogHeader>
          {rearrangeCard && (
            <div className="flex flex-col items-center gap-3">
              <GameCardComponent card={rearrangeCard} />
              <p className="text-xs text-muted-foreground">Move to which color?</p>
              <div className="flex gap-1 flex-wrap justify-center">
                {rearrangeCard.colors?.map(color => (
                  <button
                    key={color}
                    onClick={() => handleRearrange(rearrangeCardUid!, color)}
                    className={`${COLOR_CONFIG[color].bg} ${COLOR_CONFIG[color].text} px-3 py-1.5 rounded text-xs font-bold hover:scale-110 transition-transform`}
                  >
                    {COLOR_CONFIG[color].label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Discard overlay */}
      {discardMode && (
        <div className="flex-none px-4 py-3 border-t bg-destructive/5 border-destructive/30">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-bold text-destructive">
              ⚠️ Discard {myHand.length - MAX_HAND_SIZE} card{myHand.length - MAX_HAND_SIZE > 1 ? 's' : ''} (you have {myHand.length}, max {MAX_HAND_SIZE})
            </span>
            <Button
              size="sm"
              variant="destructive"
              disabled={discardSelected.length < myHand.length - MAX_HAND_SIZE}
              onClick={handleConfirmDiscard}
            >
              Confirm Discard ({discardSelected.length}/{myHand.length - MAX_HAND_SIZE})
            </Button>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2 justify-center">
            {myHand.map((card) => (
              <div
                key={card.uid}
                className="flex-none cursor-pointer"
                onClick={() => handleDiscardToggle(card.uid)}
              >
                <GameCardComponent
                  card={card}
                  selected={discardSelected.includes(card.uid)}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* My hand */}
      {!discardMode && (
        <div className="flex-none border-t bg-card/90 backdrop-blur-sm px-3 py-2 shadow-inner">
          <div className="flex items-center gap-2 mb-1">
            <Hand className="w-3 h-3 text-muted-foreground" />
            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
              Hand ({myHand.length})
            </span>
            {doubleRentPending && (
              <Badge variant="destructive" className="text-[9px] animate-pulse">Select a Rent card!</Badge>
            )}
          </div>
          <div className="flex gap-1.5 overflow-x-auto pb-1 justify-center">
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
      )}
    </div>
  );
}
