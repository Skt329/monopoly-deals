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
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
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
  type LogEntry,
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
  addLogEntry,
  removePlayer,
} from '@/lib/gameEngine';
import { GameCardComponent } from '@/components/game/cards/GameCardComponent';
import { CardBack } from '@/components/game/cards/CardBack';
import { ActionResponsePanel } from '@/components/game/ActionResponsePanel';
import { TargetSelector } from '@/components/game/TargetSelector';
import { GameLog } from '@/components/game/GameLog';
import {
  DollarSign, Trophy, ChevronRight, Layers, Hand, RefreshCw,
  LogOut, ScrollText, Eye, X, Crown, Zap
} from 'lucide-react';

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
  const [previewReadOnly, setPreviewReadOnly] = useState(false);
  const [roomId, setRoomId] = useState('');
  const [showColorPicker, setShowColorPicker] = useState(false);
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
  const [rearrangeCardUid, setRearrangeCardUid] = useState<string | null>(null);
  const [rearrangeCard, setRearrangeCard] = useState<GameCard | null>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const forceEndRef = useRef(false);
  const [expandedOpponent, setExpandedOpponent] = useState<string | null>(null);
  const [celebration, setCelebration] = useState<{ type: string; message: string; emoji: string } | null>(null);
  const [showLog, setShowLog] = useState(false);
  const [flyingCards, setFlyingCards] = useState<{ id: string; delay: number; flyX: number; flyY: number }[]>([]);
  const deckRef = useRef<HTMLDivElement>(null);

  const getPlayerName = useCallback((pid: string) => {
    return players.find(p => p.user_id === pid)?.display_name || 'Unknown';
  }, [players]);

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
        // Ensure gameLog exists for older states
        if (!state.gameLog) state.gameLog = [];
        setGameState(state);

        const handData = await supabase
          .from('player_hands')
          .select('hand')
          .eq('room_id', room.id)
          .eq('user_id', user.id)
          .single();

        if (handData.data) {
          setMyHand(handData.data.hand as unknown as GameCard[]);
        }
      }
    };
    init();
  }, [roomCode, navigate]);

  // Realtime subscription
  useEffect(() => {
    if (!roomId || !userId) return;
    const channel = supabase
      .channel(`game-realtime-${roomId}`)
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public', table: 'game_states',
        filter: `room_id=eq.${roomId}`,
      }, (payload) => {
        if (payload.new?.current_state) {
          const s = payload.new.current_state as unknown as PublicGameState;
          if (!s.gameLog) s.gameLog = [];
          setGameState(s);
        }
      })
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public', table: 'player_hands',
        filter: `user_id=eq.${userId}`,
      }, (payload) => {
        if (payload.new?.hand) setMyHand(payload.new.hand as unknown as GameCard[]);
      })
      .subscribe();
    channelRef.current = channel;
    return () => { supabase.removeChannel(channel); };
  }, [roomId, userId]);

  // Polling backup
  useEffect(() => {
    if (!roomId || !userId) return;
    const interval = setInterval(async () => {
      const [stateRes, handRes] = await Promise.all([
        supabase.from('game_states').select('current_state').eq('room_id', roomId).single(),
        supabase.from('player_hands').select('hand').eq('room_id', roomId).eq('user_id', userId).single(),
      ]);
      if (stateRes.data) {
        const s = stateRes.data.current_state as unknown as PublicGameState;
        if (!s.gameLog) s.gameLog = [];
        setGameState(s);
      }
      if (handRes.data) setMyHand(handRes.data.hand as unknown as GameCard[]);
    }, 3000);
    return () => clearInterval(interval);
  }, [roomId, userId]);

  const isMyTurn = gameState ? getCurrentPlayerId(gameState) === userId : false;
  const currentPlayerName = gameState
    ? players.find(p => p.user_id === getCurrentPlayerId(gameState))?.display_name || 'Unknown'
    : '';

  const persistState = useCallback(async (newState: PublicGameState, newHand: GameCard[]) => {
    setGameState(newState);
    setMyHand(newHand);
    await Promise.all([
      supabase.from('game_states').update({ current_state: newState as unknown as import('@/integrations/supabase/types').Json }).eq('room_id', roomId),
      supabase.from('player_hands').update({ hand: newHand as unknown as import('@/integrations/supabase/types').Json }).eq('room_id', roomId).eq('user_id', userId),
    ]);
  }, [roomId, userId]);

  const triggerCelebration = useCallback((type: string, message: string, emoji: string) => {
    setCelebration({ type, message, emoji });
    setTimeout(() => setCelebration(null), 2500);
  }, []);

  const logAction = useCallback((state: PublicGameState, action: string, detail: string): PublicGameState => {
    return addLogEntry(state, userId, getPlayerName(userId), action, detail);
  }, [userId, getPlayerName]);

  // Draw cards with flying animation
  const handRef = useRef<HTMLDivElement>(null);

  const handleDraw = useCallback(async () => {
    if (!gameState || !isMyTurn || gameState.phase !== 'drawing') return;
    const result = drawCards(gameState, myHand);

    // Calculate flight path from deck to hand area
    const deckRect = deckRef.current?.getBoundingClientRect();
    const handRect = handRef.current?.getBoundingClientRect();
    const flyX = handRect && deckRect ? (handRect.left + handRect.width / 2) - deckRect.left : 200;
    const flyY = handRect && deckRect ? (handRect.top - deckRect.top) : 300;

    const cards = result.drawnCards.map((_, i) => ({
      id: `fly-${Date.now()}-${i}`,
      delay: i * 200,
      flyX,
      flyY,
    }));
    setFlyingCards(cards);
    setTimeout(() => setFlyingCards([]), 1200);

    let stateWithLog = logAction(result.state, 'draw', `drew ${result.drawnCards.length} cards`);
    await persistState(stateWithLog, result.hand);
    toast.success(`Drew ${result.drawnCards.length} cards`);
  }, [gameState, isMyTurn, myHand, persistState, logAction]);

  const checkAutoEndTurn = useCallback(async (newState: PublicGameState, newHand: GameCard[]) => {
    if (newState.cardsPlayedThisTurn >= 3 && !newState.winner) {
      if (newHand.length > MAX_HAND_SIZE) {
        setDiscardMode(true);
        setDiscardSelected([]);
        toast.info(`You've used all 3 plays. Discard down to ${MAX_HAND_SIZE} cards.`);
      } else {
        const endedState = endTurn(newState);
        const logged = addLogEntry(endedState, userId, getPlayerName(userId), 'end_turn', 'turn ended');
        setGameState(logged);
        await supabase.from('game_states').update({ current_state: logged as unknown as import('@/integrations/supabase/types').Json }).eq('room_id', roomId);
        toast.info('All 3 plays used — turn ended automatically');
      }
    }
  }, [roomId, userId, getPlayerName]);

  const handlePlayAsProperty = useCallback(async (color: PropertyColor) => {
    if (!gameState || !selectedCard) return;
    const card = myHand.find(c => c.uid === selectedCard);
    const result = playCardAsProperty(gameState, myHand, selectedCard, color);
    if (!result) { toast.error('Cannot play this card'); return; }
    setSelectedCard(null);
    setShowColorPicker(false);
    let stateWithLog = logAction(result.state, 'property', `played ${card?.name || 'property'} as ${COLOR_CONFIG[color].label}`);
    if (result.state.winner) {
      stateWithLog.winner = result.state.winner;
      stateWithLog.phase = 'finished';
    }
    await persistState(stateWithLog, result.hand);
    if (result.state.winner) {
      toast.success('🎉 You completed 3 sets! YOU WIN!', { duration: 10000 });
      triggerCelebration('win', 'YOU WIN!', '🏆');
    } else {
      toast.success('Property played!');
      await checkAutoEndTurn(stateWithLog, result.hand);
    }
  }, [gameState, selectedCard, myHand, persistState, checkAutoEndTurn, logAction, triggerCelebration]);

  const handlePlayAsMoney = useCallback(async () => {
    if (!gameState || !selectedCard) return;
    const card = myHand.find(c => c.uid === selectedCard);
    const result = playCardAsMoney(gameState, myHand, selectedCard);
    if (!result) { toast.error('Cannot play this card'); return; }
    setSelectedCard(null);
    let stateWithLog = logAction(result.state, 'money', `added M${card?.value || 0} to bank`);
    await persistState(stateWithLog, result.hand);
    toast.success('Added to bank!');
    await checkAutoEndTurn(stateWithLog, result.hand);
  }, [gameState, selectedCard, myHand, persistState, checkAutoEndTurn, logAction]);

  const handlePlayAction = useCallback(async () => {
    if (!gameState || !selectedCard) return;
    const card = myHand.find(c => c.uid === selectedCard);
    if (!card) return;

    if (card.name === 'Double The Rent') {
      const hasRentCard = myHand.some(c => c.uid !== card.uid && c.type === 'rent');
      if (!hasRentCard) { toast.error('You need a rent card to pair with Double The Rent!'); return; }
      if (gameState.cardsPlayedThisTurn >= 2) { toast.error('Not enough plays left for Double The Rent combo'); return; }
      setDoubleRentPending(true);
      setDoubleRentCardUid(selectedCard);
      setSelectedCard(null);
      toast.info('Double The Rent activated! Now select a rent card.');
      return;
    }

    if (card.name === 'Forced Deal') {
      const myBoard = gameState.boards[userId];
      if (!myBoard || !hasAnyProperties(myBoard)) { toast.error('You need at least one property!'); return; }
      if (!anyOpponentHasStealable(gameState.boards, userId)) { toast.error('No opponents have stealable properties!'); return; }
    }
    if (card.name === 'Sly Deal') {
      if (!anyOpponentHasStealable(gameState.boards, userId)) { toast.error('No opponents have stealable properties!'); return; }
    }
    if (card.name === 'Deal Breaker') {
      const has = Object.keys(gameState.boards).some(pid => pid !== userId && getCompleteSetColors(gameState.boards[pid]).length > 0);
      if (!has) { toast.error('No opponents have complete sets!'); return; }
    }
    if (card.name === 'Rent' || card.name === 'Wild Rent') {
      const myBoard = gameState.boards[userId];
      const rentColors = card.colors as PropertyColor[] | undefined;
      const hasProps = rentColors
        ? rentColors.some(c => (myBoard?.properties[c]?.length || 0) > 0)
        : Object.values(myBoard?.properties || {}).some((p: GameCard[]) => p.length > 0);
      if (!hasProps) { toast.error('You need properties in a matching color!'); return; }
    }
    if (card.name === 'House') {
      const myBoard = gameState.boards[userId];
      const ok = myBoard && (Object.keys(myBoard.properties) as PropertyColor[]).some(c => isSetComplete(myBoard, c) && !myBoard.hasHouse[c]);
      if (!ok) { toast.error('Need a complete set without a house!'); return; }
    }
    if (card.name === 'Hotel') {
      const myBoard = gameState.boards[userId];
      const ok = myBoard && (Object.keys(myBoard.properties) as PropertyColor[]).some(c => isSetComplete(myBoard, c) && myBoard.hasHouse[c] && !myBoard.hasHotel[c]);
      if (!ok) { toast.error('Need a complete set with a house!'); return; }
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

    if (card.name === "It's Your Birthday") {
      const result = playActionCard(gameState, myHand, selectedCard);
      if (!result) { toast.error('Cannot play this action'); return; }
      setSelectedCard(null);
      let stateWithLog = logAction(result.state, 'birthday', `played It's Your Birthday! Collecting M2 from everyone`);
      await persistState(stateWithLog, result.hand);
      triggerCelebration("It's Your Birthday", 'Happy Birthday! Collecting M2!', '🎂');
      return;
    }

    const result = playActionCard(gameState, myHand, selectedCard);
    if (!result) { toast.error('Cannot play this action'); return; }
    setSelectedCard(null);
    let stateWithLog = logAction(result.state, 'pass_go', `played ${card.name}`);
    await persistState(stateWithLog, result.hand);
    toast.success(`${card.name} played!`);
    if (card.name === 'Pass Go') triggerCelebration('pass_go', 'Drew 2 Cards!', '🎉');
    if (result.state.phase === 'playing') await checkAutoEndTurn(stateWithLog, result.hand);
  }, [gameState, selectedCard, myHand, persistState, checkAutoEndTurn, userId, logAction, triggerCelebration]);

  const handlePlayRentWithDouble = useCallback(async () => {
    if (!gameState || !selectedCard || !doubleRentCardUid) return;
    const rentCard = myHand.find(c => c.uid === selectedCard);
    if (!rentCard || rentCard.type !== 'rent') { toast.error('Please select a rent card'); return; }

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

    // Build detailed log message with specific card names
    let detail = `played ${card.name}`;
    const targetName = selectedTarget ? getPlayerName(selectedTarget) : '';
    if (card.name === 'Sly Deal' && targetName && selectedTargetCard) {
      const tBoard = gameState.boards[selectedTarget!];
      let cardName = 'a property';
      if (tBoard) {
        for (const c of Object.keys(tBoard.properties) as PropertyColor[]) {
          const found = tBoard.properties[c].find(p => p.uid === selectedTargetCard);
          if (found) { cardName = found.name; break; }
        }
      }
      detail = `used Sly Deal to steal ${cardName} from ${targetName}`;
    }
    if (card.name === 'Forced Deal' && targetName && selectedTargetCard && selectedSourceCard) {
      const tBoard = gameState.boards[selectedTarget!];
      let targetCardName = 'a property', sourceCardName = 'a property';
      if (tBoard) {
        for (const c of Object.keys(tBoard.properties) as PropertyColor[]) {
          const found = tBoard.properties[c].find(p => p.uid === selectedTargetCard);
          if (found) { targetCardName = found.name; break; }
        }
      }
      for (const c of Object.keys(myBoard.properties) as PropertyColor[]) {
        const found = myBoard.properties[c].find(p => p.uid === selectedSourceCard);
        if (found) { sourceCardName = found.name; break; }
      }
      detail = `used Forced Deal: swapped ${sourceCardName} for ${targetName}'s ${targetCardName}`;
    }
    if (card.name === 'Deal Breaker' && targetName && selectedColor) detail = `used Deal Breaker to steal ${COLOR_CONFIG[selectedColor].label} set from ${targetName}`;
    if (card.name === 'Debt Collector' && targetName) detail = `charged M5 debt from ${targetName}`;
    if ((card.name === 'Rent' || card.name === 'Wild Rent') && selectedColor) {
      const rentBoard = gameState.boards[userId];
      const rentAmount = rentBoard ? calculateRent(rentBoard, selectedColor) * (doubleRentPending ? 2 : 1) : 0;
      detail = `charged M${rentAmount} rent on ${COLOR_CONFIG[selectedColor].label}${doubleRentPending ? ' (DOUBLED!)' : ''}`;
    }
    if (card.name === 'House' && selectedColor) detail = `added House to ${COLOR_CONFIG[selectedColor].label} set`;
    if (card.name === 'Hotel' && selectedColor) detail = `added Hotel to ${COLOR_CONFIG[selectedColor].label} set`;

    let stateWithLog = logAction(result.state, card.name.toLowerCase().replace(/\s/g, '_'), detail);
    await persistState(stateWithLog, result.hand);
    toast.success(`${card.name} played!${doubleRentPending ? ' (DOUBLED!)' : ''}`);

    const celebrationMap: Record<string, { msg: string; emoji: string }> = {
      'Rent': { msg: `Collecting Rent!`, emoji: '💰' },
      'Wild Rent': { msg: `Collecting Rent!`, emoji: '💰' },
      'Sly Deal': { msg: 'Property Stolen!', emoji: '🕵️' },
      'Deal Breaker': { msg: 'Complete Set Stolen!', emoji: '💥' },
      'Forced Deal': { msg: 'Properties Swapped!', emoji: '🔄' },
      'Debt Collector': { msg: 'Collecting M5 Debt!', emoji: '🏦' },
      'House': { msg: 'House Added! +M3 Rent', emoji: '🏠' },
      'Hotel': { msg: 'Hotel Added! +M4 Rent', emoji: '🏨' },
    };
    const cele = celebrationMap[card.name];
    if (cele) triggerCelebration(card.name, cele.msg, cele.emoji);
  }, [gameState, selectedCard, myHand, selectedTarget, selectedColor, selectedTargetCard, selectedSourceCard, doubleRentPending, persistState, logAction, getPlayerName, userId, triggerCelebration]);

  const handlePay = useCallback(async (bankCardUids: string[], propertyCards: { uid: string; color: PropertyColor }[]) => {
    if (!gameState || !gameState.pendingAction) return;
    const pending = gameState.pendingAction;
    const myBoard = gameState.boards[userId] || createEmptyBoard();
    const payResult = payWithCards(gameState, myBoard, pending.sourcePlayerId, bankCardUids, propertyCards);
    const newResponded = [...pending.respondedPlayers, userId];
    const allResponded = pending.targetPlayerIds.every(id => newResponded.includes(id));
    let newState: PublicGameState = {
      ...payResult.state,
      pendingAction: allResponded ? null : { ...pending, respondedPlayers: newResponded },
      phase: allResponded ? 'playing' : 'responding',
    };
    newState = addLogEntry(newState, userId, getPlayerName(userId), 'pay', `paid M${bankCardUids.length + propertyCards.length} cards`);
    await persistState(newState, myHand);
    toast.success('Payment sent!');
  }, [gameState, userId, myHand, persistState, getPlayerName]);

  const handleJustSayNo = useCallback(async () => {
    if (!gameState || !gameState.pendingAction) return;
    const pending = gameState.pendingAction;
    const jsnIndex = myHand.findIndex(c => c.name === 'Just Say No');
    if (jsnIndex === -1) return;
    const newHand = myHand.filter((_, i) => i !== jsnIndex);
    const jsnCard = myHand[jsnIndex];
    const newResponded = [...pending.respondedPlayers, userId];
    const allResponded = pending.targetPlayerIds.every(id => newResponded.includes(id));
    let newState: PublicGameState = {
      ...gameState,
      discardPile: [...gameState.discardPile, jsnCard],
      pendingAction: allResponded ? null : { ...pending, respondedPlayers: newResponded },
      phase: allResponded ? 'playing' : 'responding',
      handCounts: { ...gameState.handCounts, [userId]: newHand.length },
    };
    newState = addLogEntry(newState, userId, getPlayerName(userId), 'just_say_no', `blocked with Just Say No! 🛡️`);
    await persistState(newState, newHand);
    toast.success('Just Say No! Action blocked! 🛡️');
    triggerCelebration('just_say_no', 'Action Blocked!', '🛡️');
  }, [gameState, userId, myHand, persistState, getPlayerName, triggerCelebration]);

  const handleAccept = useCallback(async () => {
    if (!gameState || !gameState.pendingAction) return;
    const pending = gameState.pendingAction;
    let stateAfterResolve = gameState;
    if (['deal_breaker', 'sly_deal', 'forced_deal'].includes(pending.type)) {
      stateAfterResolve = resolveStealAction(gameState, pending, userId);
    }
    const newResponded = [...pending.respondedPlayers, userId];
    const allResponded = pending.targetPlayerIds.every(id => newResponded.includes(id));
    let newState: PublicGameState = {
      ...stateAfterResolve,
      pendingAction: allResponded ? null : { ...pending, respondedPlayers: newResponded },
      phase: allResponded ? 'playing' : 'responding',
    };
    const attackerBoard = newState.boards[pending.sourcePlayerId];
    if (attackerBoard && countCompleteSets(attackerBoard) >= 3) {
      newState.winner = pending.sourcePlayerId;
      newState.phase = 'finished';
    }
    newState = addLogEntry(newState, userId, getPlayerName(userId), 'accept', `accepted the action`);
    await persistState(newState, myHand);
    toast.info('Action accepted');
  }, [gameState, userId, myHand, persistState, getPlayerName]);

  const handleEndTurn = useCallback(async () => {
    if (!gameState || !isMyTurn) return;
    if (needsDiscard(myHand) && gameState.cardsPlayedThisTurn < 3) {
      toast.warning(`You still have ${3 - gameState.cardsPlayedThisTurn} play(s) left!`, { id: 'end-turn-warn' });
      if (!forceEndRef.current) { forceEndRef.current = true; return; }
    }
    forceEndRef.current = false;
    if (needsDiscard(myHand)) {
      setDiscardMode(true);
      setDiscardSelected([]);
      return;
    }
    let newState = endTurn(gameState);
    newState = addLogEntry(newState, userId, getPlayerName(userId), 'end_turn', 'ended their turn');
    await persistState(newState, myHand);
    toast.info('Turn ended');
  }, [gameState, isMyTurn, myHand, persistState, userId, getPlayerName]);

  const handleDiscardToggle = (uid: string) => {
    setDiscardSelected(prev => prev.includes(uid) ? prev.filter(id => id !== uid) : [...prev, uid]);
  };

  const handleConfirmDiscard = useCallback(async () => {
    if (!gameState) return;
    const result = discardCards(gameState, myHand, discardSelected);
    setDiscardMode(false);
    setDiscardSelected([]);
    let stateWithLog = addLogEntry(result.state, userId, getPlayerName(userId), 'discard', `discarded ${discardSelected.length} card(s)`);
    await persistState(stateWithLog, result.hand);
    toast.info('Cards discarded, turn ended');
  }, [gameState, myHand, discardSelected, persistState, userId, getPlayerName]);

  const handleCardClick = (uid: string) => {
    if (discardMode) return;
    const card = myHand.find(c => c.uid === uid);
    if (!card) return;
    setPreviewCard(card);
    setPreviewReadOnly(false);
    setSelectedCard(uid);
    setShowColorPicker(false);
  };

  const handleRearrange = useCallback(async (cardUid: string, newColor: PropertyColor) => {
    if (!gameState) return;
    const result = rearrangeWildProperty(gameState, userId, cardUid, newColor);
    if (!result) { toast.error('Cannot rearrange this card'); return; }
    setRearrangeCardUid(null);
    setRearrangeCard(null);
    let stateWithLog = addLogEntry(result, userId, getPlayerName(userId), 'property', `rearranged wild property to ${COLOR_CONFIG[newColor].label}`);
    setGameState(stateWithLog);
    await supabase.from('game_states').update({ current_state: stateWithLog as unknown as import('@/integrations/supabase/types').Json }).eq('room_id', roomId);
    toast.success('Property rearranged!');
  }, [gameState, userId, roomId, getPlayerName]);

  const handleExitGame = useCallback(async () => {
    if (!gameState) return;
    let newState = removePlayer(gameState, userId, myHand);
    newState = addLogEntry(newState, userId, getPlayerName(userId), 'exit', 'left the game');
    await Promise.all([
      supabase.from('game_states').update({ current_state: newState as unknown as import('@/integrations/supabase/types').Json }).eq('room_id', roomId),
      supabase.from('player_hands').delete().eq('room_id', roomId).eq('user_id', userId),
      supabase.from('game_players').delete().eq('room_id', roomId).eq('user_id', userId),
    ]);
    navigate('/');
  }, [gameState, userId, myHand, roomId, navigate, getPlayerName]);

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

  // Winner screen
  if (gameState.winner) {
    const winnerName = players.find(p => p.user_id === gameState.winner)?.display_name || 'Unknown';
    const isMe = gameState.winner === userId;
    return (
      <div className="min-h-screen game-felt flex flex-col items-center justify-center gap-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-black/40" />
        <div className="relative z-10 flex flex-col items-center gap-4 animate-celebration-enter">
          <Trophy className="w-24 h-24 text-yellow-400 animate-bounce drop-shadow-2xl" />
          <h1 className="text-5xl font-black text-white drop-shadow-lg">
            {isMe ? 'YOU WIN!' : `${winnerName} Wins!`}
          </h1>
          <p className="text-white/80 text-lg">Completed 3 property sets 🎉</p>
          <Button onClick={() => navigate('/')} size="lg" className="mt-4 text-lg px-8">
            Back to Home
          </Button>
        </div>
      </div>
    );
  }

  const opponents = players.filter(p => p.user_id !== userId);
  const completeSetColors = getCompleteSetColors(myBoard);

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-background">
      {/* ═══ Celebration Overlay ═══ */}
      {celebration && (
        <div className="fixed inset-0 z-[60] pointer-events-none flex items-center justify-center">
          <div className="animate-celebration-enter bg-card/95 backdrop-blur-md border-2 border-primary rounded-2xl shadow-2xl px-10 py-8 text-center max-w-sm">
            <div className="text-6xl mb-3 animate-bounce">{celebration.emoji}</div>
            <h2 className="text-2xl font-black text-foreground">{celebration.message}</h2>
            <div className="h-1.5 bg-primary/20 rounded-full overflow-hidden mt-4">
              <div className="h-full bg-primary rounded-full animate-[shrink_2.5s_linear_forwards]" />
            </div>
          </div>
        </div>
      )}

      {/* ═══ Flying Cards Animation ═══ */}
      {flyingCards.map(fc => {
        const deckRect = deckRef.current?.getBoundingClientRect();
        return (
          <div
            key={fc.id}
            className="fixed z-50 pointer-events-none animate-fly-to-hand"
            style={{
              top: deckRect?.top ?? '40%',
              left: deckRect?.left ?? '10%',
              animationDelay: `${fc.delay}ms`,
              '--fly-x': `${fc.flyX}px`,
              '--fly-y': `${fc.flyY}px`,
            } as React.CSSProperties}
          >
            <CardBack small />
          </div>
        );
      })}

      {/* ═══ Action Response Panel ═══ */}
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

      {/* ═══ Target Selector ═══ */}
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
          currentPlayerBoard={myBoard}
        />
      )}

      {/* ═══ TOP BAR ═══ */}
      <header className="flex items-center justify-between px-4 py-2 border-b bg-card shadow-sm flex-none">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg game-felt flex items-center justify-center">
              <span className="text-white font-black text-xs">MD</span>
            </div>
            <div>
              <h1 className="font-black text-sm text-foreground leading-none">MONOPOLY DEAL</h1>
              <span className="text-[10px] text-muted-foreground font-mono">{roomCode}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge
            variant={isMyTurn ? 'default' : 'secondary'}
            className={`text-xs font-bold ${isMyTurn ? 'animate-pulse shadow-lg' : ''}`}
          >
            {isMyTurn ? (
              <><Zap className="w-3 h-3 mr-1" /> Your Turn</>
            ) : (
              <>{currentPlayerName}'s Turn</>
            )}
          </Badge>

          {isMyTurn && gameState.phase === 'playing' && (
            <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full font-bold text-xs border ${
              gameState.cardsPlayedThisTurn >= 3
                ? 'bg-destructive/10 border-destructive text-destructive'
                : gameState.cardsPlayedThisTurn >= 2
                  ? 'bg-amber-100 border-amber-400 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
                  : 'bg-primary/10 border-primary/30 text-primary'
            }`}>
              🎴 {gameState.cardsPlayedThisTurn}/3
            </div>
          )}

          {doubleRentPending && (
            <Badge variant="destructive" className="text-[10px] animate-pulse">⚡ Double Rent</Badge>
          )}

          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 relative"
            onClick={() => setShowLog(!showLog)}
          >
            <ScrollText className="w-4 h-4" />
            {(gameState.gameLog?.length || 0) > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-primary rounded-full text-[7px] text-primary-foreground flex items-center justify-center">
                {Math.min(gameState.gameLog?.length || 0, 99)}
              </span>
            )}
          </Button>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive hover:text-destructive">
                <LogOut className="w-4 h-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Exit Game?</AlertDialogTitle>
                <AlertDialogDescription>
                  Your cards will be returned to the deck. If you're the last player, the game ends for everyone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Stay</AlertDialogCancel>
                <AlertDialogAction onClick={handleExitGame} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                  Exit Game
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </header>

      {/* ═══ MAIN CONTENT ═══ */}
      <div className="flex-1 flex min-h-0 overflow-hidden">
        {/* ═══ GAME AREA ═══ */}
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">

          {/* ═══ OPPONENTS BAR ═══ */}
          <div className="flex-none flex gap-2 px-4 py-2 overflow-x-auto border-b bg-muted/20">
            {opponents.map(player => {
              const board: PlayerBoard = gameState.boards[player.user_id] || createEmptyBoard();
              const handCount = gameState.handCounts[player.user_id] || 0;
              const isTurn = getCurrentPlayerId(gameState) === player.user_id;
              const opponentComplete = getCompleteSetColors(board);
              const opponentInProgress = (Object.keys(board.properties) as PropertyColor[]).filter(
                c => board.properties[c].length > 0 && !opponentComplete.includes(c)
              );

              return (
                <div
                  key={player.user_id}
                  onClick={() => setExpandedOpponent(player.user_id)}
                  className={`flex-none rounded-xl border p-2.5 cursor-pointer transition-all hover:shadow-md min-w-[180px] max-w-[220px] ${
                    isTurn ? 'border-primary/50 bg-primary/5 shadow-sm' : 'border-border bg-card hover:bg-card/80'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-1.5">
                      {isTurn && <Crown className="w-3 h-3 text-primary" />}
                      <span className="font-bold text-xs text-foreground truncate">{player.display_name}</span>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                      <span className="flex items-center gap-0.5"><Hand className="w-3 h-3" />{handCount}</span>
                      <span className="flex items-center gap-0.5"><DollarSign className="w-3 h-3" />{getBankTotal(board)}M</span>
                    </div>
                  </div>

                  {/* Property badges */}
                  <div className="flex flex-wrap gap-0.5">
                    {opponentComplete.map(color => (
                      <span key={color} className={`${COLOR_CONFIG[color].bg} ${COLOR_CONFIG[color].text} px-1.5 py-0.5 rounded text-[8px] font-bold ring-1 ring-yellow-400`}>
                        ✨ {COLOR_CONFIG[color].label}
                      </span>
                    ))}
                    {opponentInProgress.map(color => (
                      <span key={color} className={`${COLOR_CONFIG[color].bg} ${COLOR_CONFIG[color].text} px-1.5 py-0.5 rounded text-[8px] font-bold opacity-80`}>
                        {board.properties[color].length}/{PROPERTY_SETS[color].size}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* ═══ CENTER: BOARD AREA ═══ */}
          <div className="flex-1 game-felt overflow-auto min-h-0 relative">
            <div className="absolute inset-0 bg-black/10" />
            <div className="relative z-10 flex gap-4 p-4 h-full">

              {/* Left column: Deck, Discard, Controls */}
              <div className="flex-none flex flex-col items-center gap-3 w-[100px]">
                <div ref={deckRef} className="text-center">
                  <CardBack count={gameState.deck.length} />
                  <p className="text-[10px] text-white/70 mt-1 font-medium">Deck ({gameState.deck.length})</p>
                </div>

                {isMyTurn && gameState.phase === 'drawing' && (
                  <Button onClick={handleDraw} size="sm" className="w-full gap-1 text-xs animate-pulse shadow-lg">
                    Draw Cards
                  </Button>
                )}

                <div className="text-center">
                  <div className="w-16 h-24 rounded-lg border-2 border-dashed border-white/20 flex items-center justify-center bg-white/5 backdrop-blur-sm">
                    {gameState.discardPile.length > 0 ? (
                      <div onClick={() => { setPreviewCard(gameState.discardPile[gameState.discardPile.length - 1]); setPreviewReadOnly(true); }} className="cursor-pointer">
                        <GameCardComponent card={gameState.discardPile[gameState.discardPile.length - 1]} small />
                      </div>
                    ) : (
                      <Layers className="w-5 h-5 text-white/20" />
                    )}
                  </div>
                  <p className="text-[10px] text-white/70 mt-1">Discard</p>
                </div>

                {/* Sets & End Turn */}
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center border border-white/10">
                  <p className="text-3xl font-black text-white">{countCompleteSets(myBoard)}</p>
                  <p className="text-[10px] text-white/60 font-medium">/ 3 Sets</p>
                </div>

                {isMyTurn && gameState.phase === 'playing' && (
                  <Button
                    onClick={handleEndTurn}
                    size="sm"
                    variant={gameState.cardsPlayedThisTurn >= 3 ? 'default' : 'secondary'}
                    className={`w-full gap-1 text-xs ${gameState.cardsPlayedThisTurn >= 3 ? 'animate-pulse' : ''}`}
                  >
                    End Turn <ChevronRight className="w-3 h-3" />
                  </Button>
                )}
              </div>

              {/* Center: My Properties & Bank */}
              <div className="flex-1 overflow-auto min-w-0">
                {/* Properties */}
                <div className="mb-3">
                  <h3 className="text-[11px] font-bold text-white/80 uppercase tracking-wider mb-2">
                    Your Properties
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {(Object.keys(myBoard.properties) as PropertyColor[]).map(color => {
                      const props = myBoard.properties[color] || [];
                      if (props.length === 0) return null;
                      const setSize = PROPERTY_SETS[color].size;
                      const complete = props.length >= setSize;
                      return (
                        <div
                          key={color}
                          className={`rounded-xl p-2 border transition-all ${
                            complete
                              ? 'border-yellow-400/80 bg-yellow-400/10 shadow-lg shadow-yellow-400/20 animate-set-complete'
                              : 'border-white/15 bg-white/5'
                          }`}
                        >
                          <div className="flex items-center gap-1 mb-1">
                            <span className={`${COLOR_CONFIG[color].bg} ${COLOR_CONFIG[color].text} px-1.5 py-0.5 rounded text-[8px] font-bold`}>
                              {COLOR_CONFIG[color].label} {props.length}/{setSize}
                            </span>
                            {complete && <span className="text-[9px] text-yellow-400 font-bold">✨ SET</span>}
                            {myBoard.hasHouse[color] && <span className="text-[10px]">🏠</span>}
                            {myBoard.hasHotel[color] && <span className="text-[10px]">🏨</span>}
                          </div>
                          <div className="flex gap-1">
                            {props.map(card => (
                              <div key={card.uid} className="relative group">
                                <div
                                  className="cursor-pointer transition-transform hover:scale-105"
                                  onClick={() => { setPreviewCard(card); setPreviewReadOnly(true); }}
                                >
                                  <GameCardComponent card={card} small />
                                </div>
                                {card.type === 'wild_property' && isMyTurn && gameState.phase === 'playing' && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setRearrangeCardUid(card.uid);
                                      setRearrangeCard(card);
                                    }}
                                    className="absolute -top-1 -right-1 w-4 h-4 bg-primary text-primary-foreground rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                                  >
                                    <RefreshCw className="w-2.5 h-2.5" />
                                  </button>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Bank */}
                <div>
                  <h3 className="text-[11px] font-bold text-white/80 uppercase tracking-wider mb-1">
                    💰 Bank: {getBankTotal(myBoard)}M ({myBoard.bank.length} cards)
                  </h3>
                  {myBoard.bank.length > 0 && (
                    <div className="flex gap-1 flex-wrap">
                      {myBoard.bank.map((card, i) => (
                        <div
                          key={card.uid}
                          className="cursor-pointer transition-transform hover:scale-105"
                          onClick={() => { setPreviewCard(card); setPreviewReadOnly(true); }}
                        >
                          <GameCardComponent card={card} small />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* ═══ DISCARD OVERLAY ═══ */}
          {discardMode && (
            <div className="flex-none px-4 py-3 border-t bg-destructive/5 border-destructive/30">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-bold text-destructive">
                  ⚠️ Discard {myHand.length - MAX_HAND_SIZE} card{myHand.length - MAX_HAND_SIZE > 1 ? 's' : ''}
                </span>
                <Button
                  size="sm"
                  variant="destructive"
                  disabled={discardSelected.length < myHand.length - MAX_HAND_SIZE}
                  onClick={handleConfirmDiscard}
                >
                  Confirm ({discardSelected.length}/{myHand.length - MAX_HAND_SIZE})
                </Button>
              </div>
              <div className="flex gap-2 overflow-x-auto pb-2 justify-center">
                {myHand.map(card => (
                  <div
                    key={card.uid}
                    className="flex-none cursor-pointer"
                    onClick={() => handleDiscardToggle(card.uid)}
                  >
                    <GameCardComponent card={card} selected={discardSelected.includes(card.uid)} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ═══ HAND ═══ */}
          {!discardMode && (
            <div className="flex-none border-t bg-card/95 backdrop-blur-sm px-4 py-2 shadow-[0_-4px_20px_rgba(0,0,0,0.1)]">
              <div className="flex items-center gap-2 mb-1.5">
                <Hand className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                  Hand ({myHand.length})
                </span>
                {doubleRentPending && (
                  <Badge variant="destructive" className="text-[9px] animate-pulse">Select a Rent card!</Badge>
                )}
              </div>
              <div ref={handRef} className="flex gap-1.5 overflow-x-auto pb-1 justify-center">
                {myHand.map((card, i) => (
                  <div
                    key={card.uid}
                    className="flex-none transition-transform hover:-translate-y-1 hover:scale-105 animate-card-deal-bounce"
                    style={{ animationDelay: `${i * 30}ms` }}
                  >
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

        {/* ═══ GAME LOG SIDEBAR ═══ */}
        {showLog && (
          <div className="w-[220px] flex-none border-l bg-card flex flex-col">
            <div className="flex items-center justify-between px-3 py-2 border-b">
              <span className="text-xs font-bold text-foreground uppercase tracking-wider">Activity</span>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => setShowLog(false)}>
                <X className="w-3 h-3" />
              </Button>
            </div>
            <div className="flex-1 min-h-0">
              <GameLog entries={gameState.gameLog || []} currentUserId={userId} />
            </div>
          </div>
        )}
      </div>

      {/* ═══ CARD PREVIEW DIALOG ═══ */}
      <Dialog open={!!previewCard} onOpenChange={(open) => { if (!open) { setPreviewCard(null); setSelectedCard(null); setShowColorPicker(false); setPreviewReadOnly(false); } }}>
        <DialogContent className="max-w-xs p-4">
          <DialogHeader>
            <DialogTitle className="text-center">{previewCard?.name}</DialogTitle>
            <DialogDescription className="text-center text-xs">
              {previewCard?.type === 'property' && previewCard.color && COLOR_CONFIG[previewCard.color].label}
              {previewCard?.type === 'money' && `M${previewCard.value}`}
              {previewCard?.type === 'action' && 'Action Card'}
              {previewCard?.type === 'rent' && 'Rent Card'}
              {previewCard?.type === 'wild_property' && 'Wild Property'}
            </DialogDescription>
          </DialogHeader>
          {previewCard && (
            <div className="flex flex-col items-center gap-4">
              <div className="transform scale-150 origin-center my-4">
                <GameCardComponent card={previewCard} />
              </div>
              <p className="text-xs text-muted-foreground text-center">
                Value: M{previewCard.value}
                {previewCard.description && ` · ${previewCard.description}`}
              </p>

              {!previewReadOnly && isMyTurn && gameState.phase === 'playing' && (
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

      {/* ═══ REARRANGE DIALOG ═══ */}
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

      {/* ═══ OPPONENT DETAIL SHEET ═══ */}
      <Sheet open={!!expandedOpponent} onOpenChange={(open) => { if (!open) setExpandedOpponent(null); }}>
        <SheetContent className="w-[350px] sm:w-[400px] overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <Eye className="w-4 h-4" />
              {expandedOpponent && getPlayerName(expandedOpponent)}'s Board
            </SheetTitle>
          </SheetHeader>
          {expandedOpponent && (() => {
            const board = gameState.boards[expandedOpponent] || createEmptyBoard();
            const opComplete = getCompleteSetColors(board);
            const opProgress = (Object.keys(board.properties) as PropertyColor[]).filter(
              c => board.properties[c].length > 0 && !opComplete.includes(c)
            );

            return (
              <div className="mt-4 space-y-4">
                {/* Complete sets */}
                {opComplete.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold text-yellow-600 uppercase mb-2 flex items-center gap-1">
                      <span>✨</span> Complete Sets ({opComplete.length})
                    </h4>
                    {opComplete.map(color => (
                      <div key={color} className="mb-2 rounded-xl p-2 border-2 border-yellow-400/60 bg-yellow-50/50 dark:bg-yellow-900/10">
                        <div className="flex items-center gap-1 mb-1.5">
                          <span className={`${COLOR_CONFIG[color].bg} ${COLOR_CONFIG[color].text} px-2 py-0.5 rounded text-[9px] font-bold`}>
                            {COLOR_CONFIG[color].label}
                          </span>
                          {board.hasHouse[color] && <span className="text-xs">🏠</span>}
                          {board.hasHotel[color] && <span className="text-xs">🏨</span>}
                        </div>
                        <div className="flex gap-1 flex-wrap">
                          {board.properties[color].map(card => (
                            <div key={card.uid} className="cursor-pointer" onClick={() => { setPreviewCard(card); setPreviewReadOnly(true); }}>
                              <GameCardComponent card={card} small />
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* In progress */}
                {opProgress.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold text-muted-foreground uppercase mb-2">In Progress</h4>
                    {opProgress.map(color => (
                      <div key={color} className="mb-2 rounded-xl p-2 border border-border">
                        <div className="flex items-center gap-1 mb-1.5">
                          <span className={`${COLOR_CONFIG[color].bg} ${COLOR_CONFIG[color].text} px-2 py-0.5 rounded text-[9px] font-bold`}>
                            {COLOR_CONFIG[color].label} ({board.properties[color].length}/{PROPERTY_SETS[color].size})
                          </span>
                        </div>
                        <div className="flex gap-1 flex-wrap">
                          {board.properties[color].map(card => (
                            <div key={card.uid} className="cursor-pointer" onClick={() => { setPreviewCard(card); setPreviewReadOnly(true); }}>
                              <GameCardComponent card={card} small />
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Bank */}
                <div>
                  <h4 className="text-xs font-bold text-muted-foreground uppercase mb-2">
                    💰 Bank ({getBankTotal(board)}M · {board.bank.length} cards)
                  </h4>
                  <div className="flex gap-1 flex-wrap">
                    {board.bank.map(card => (
                      <div key={card.uid} className="cursor-pointer" onClick={() => { setPreviewCard(card); setPreviewReadOnly(true); }}>
                        <GameCardComponent card={card} small />
                      </div>
                    ))}
                  </div>
                  {board.bank.length === 0 && (
                    <p className="text-xs text-muted-foreground italic">No cards in bank</p>
                  )}
                </div>
              </div>
            );
          })()}
        </SheetContent>
      </Sheet>
    </div>
  );
}
