import { useState, useEffect, useCallback } from 'react';
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
} from '@/lib/gameEngine';
import { GameCardComponent } from '@/components/game/cards/GameCardComponent';
import { CardBack } from '@/components/game/cards/CardBack';
import { DollarSign, Trophy, ChevronRight, Layers, Hand } from 'lucide-react';

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

      // Load game state
      const { data: stateData } = await supabase
        .from('game_states')
        .select('current_state')
        .eq('room_id', room.id)
        .single();
      if (stateData) setGameState(stateData.current_state as unknown as PublicGameState);

      // Load hand
      const { data: handData } = await supabase
        .from('player_hands')
        .select('hand')
        .eq('room_id', room.id)
        .eq('user_id', user.id)
        .single();
      if (handData) setMyHand(handData.hand as GameCard[]);
    };
    init();
  }, [roomCode, navigate]);

  // Subscribe to game state changes
  useEffect(() => {
    if (!roomId) return;

    const channel = supabase
      .channel(`game-${roomId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'game_states',
        filter: `room_id=eq.${roomId}`,
      }, (payload) => {
        if (payload.new) {
          setGameState((payload.new as any).current_state as PublicGameState);
        }
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'player_hands',
        filter: `room_id=eq.${roomId}`,
      }, async () => {
        // Reload own hand
        const { data } = await supabase
          .from('player_hands')
          .select('hand')
          .eq('room_id', roomId)
          .eq('user_id', userId)
          .single();
        if (data) setMyHand(data.hand as GameCard[]);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
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
      supabase.from('game_states').update({ current_state: newState }).eq('room_id', roomId),
      supabase.from('player_hands').update({ hand: newHand }).eq('room_id', roomId).eq('user_id', userId),
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

  const handlePlayAction = useCallback(async () => {
    if (!gameState || !selectedCard) return;
    const card = myHand.find(c => c.uid === selectedCard);
    if (!card) return;

    // For now, play action without target selection (simplified)
    const result = playActionCard(gameState, myHand, selectedCard);
    if (!result) { toast.error('Cannot play this action'); return; }
    setSelectedCard(null);
    await persistState(result.state, result.hand);
    toast.success(`${card.name} played!`);
  }, [gameState, selectedCard, myHand, persistState]);

  const handleEndTurn = useCallback(async () => {
    if (!gameState || !isMyTurn) return;
    if (needsDiscard(myHand)) {
      toast.error(`Discard down to 7 cards (you have ${myHand.length})`);
      return;
    }
    const newState = endTurn(gameState);
    await persistState(newState, myHand);
    toast.info('Turn ended');
  }, [gameState, isMyTurn, myHand, persistState]);

  const handleCardClick = (uid: string) => {
    if (!isMyTurn || gameState?.phase !== 'playing') return;
    setSelectedCard(prev => prev === uid ? null : uid);
    setShowColorPicker(false);
  };

  const selectedCardData = selectedCard ? myHand.find(c => c.uid === selectedCard) : null;

  if (!gameState) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Loading game...</div>
      </div>
    );
  }

  // Winner screen
  if (gameState.winner) {
    const winnerName = players.find(p => p.user_id === gameState.winner)?.display_name || 'Unknown';
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-6">
        <Trophy className="w-20 h-20 text-game-gold animate-coin-collect" />
        <h1 className="text-4xl font-display font-bold text-foreground">{winnerName} Wins!</h1>
        <p className="text-muted-foreground">Completed 3 property sets</p>
        <Button onClick={() => navigate('/')} className="mt-4">Back to Home</Button>
      </div>
    );
  }

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-2 border-b bg-card">
        <div className="flex items-center gap-3">
          <h2 className="font-display font-bold text-foreground">MONOPOLY DEAL</h2>
          <Badge variant="secondary" className="font-mono">{roomCode}</Badge>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <Badge variant={isMyTurn ? 'default' : 'secondary'}>
            {isMyTurn ? "Your Turn" : `${currentPlayerName}'s Turn`}
          </Badge>
          {isMyTurn && (
            <Badge variant="outline">
              Plays: {gameState.cardsPlayedThisTurn}/3
            </Badge>
          )}
        </div>
      </div>

      {/* Opponents area */}
      <div className="flex-none flex gap-4 px-4 py-3 overflow-x-auto border-b">
        {players.filter(p => p.user_id !== userId).map(player => {
          const board = gameState.boards[player.user_id];
          const handCount = gameState.handCounts[player.user_id] || 0;
          const isCurrentTurn = getCurrentPlayerId(gameState) === player.user_id;

          return (
            <div
              key={player.user_id}
              className={`flex-none rounded-xl border-2 p-3 min-w-[200px] ${isCurrentTurn ? 'border-primary bg-primary/5' : 'border-border bg-card'}`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-sm text-foreground">{player.display_name}</span>
                <div className="flex items-center gap-2">
                  <span className="flex items-center gap-0.5 text-xs text-muted-foreground">
                    <Hand className="w-3 h-3" /> {handCount}
                  </span>
                  <span className="flex items-center gap-0.5 text-xs text-muted-foreground">
                    <DollarSign className="w-3 h-3" /> {board ? getBankTotal(board) : 0}M
                  </span>
                </div>
              </div>
              {/* Mini property display */}
              {board && (
                <div className="flex flex-wrap gap-1">
                  {(Object.keys(board.properties) as PropertyColor[]).map(color => {
                    const props = board.properties[color];
                    if (props.length === 0) return null;
                    const setSize = PROPERTY_SETS[color].size;
                    const isComplete = props.length >= setSize;
                    return (
                      <div
                        key={color}
                        className={`${COLOR_CONFIG[color].bg} rounded px-1.5 py-0.5 text-[9px] font-bold ${COLOR_CONFIG[color].text} ${isComplete ? 'animate-set-complete ring-1 ring-game-gold' : ''}`}
                      >
                        {props.length}/{setSize}
                      </div>
                    );
                  })}
                </div>
              )}
              {/* Card backs for hidden hand */}
              <div className="flex gap-0.5 mt-2">
                {Array.from({ length: Math.min(handCount, 7) }).map((_, i) => (
                  <CardBack key={i} small className="scale-[0.5] -mx-2" />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Center area - Board & Deck */}
      <div className="flex-1 flex items-center justify-center gap-8 px-4 overflow-auto">
        {/* My properties */}
        <div className="flex flex-col gap-2 max-w-[400px]">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Your Properties</h3>
          <div className="flex flex-wrap gap-2">
            {(Object.keys(gameState.boards[userId]?.properties || {}) as PropertyColor[]).map(color => {
              const props = (gameState.boards[userId]?.properties[color] || []);
              if (props.length === 0) return null;
              const setSize = PROPERTY_SETS[color].size;
              const isComplete = props.length >= setSize;
              return (
                <div key={color} className={`rounded-lg p-2 border ${isComplete ? 'border-game-gold shadow-md animate-set-complete' : 'border-border'}`}>
                  <div className="flex gap-1 mb-1">
                    {props.map(card => (
                      <GameCardComponent key={card.uid} card={card} small />
                    ))}
                  </div>
                  {isComplete && <Badge className="text-[8px] bg-game-gold text-game-gold-foreground">COMPLETE</Badge>}
                </div>
              );
            })}
          </div>
          {/* Bank */}
          <div className="mt-2">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
              Bank: {getBankTotal(gameState.boards[userId] || { bank: [], properties: {} as any, hasHouse: {} as any, hasHotel: {} as any })}M
            </h3>
            <div className="flex gap-1 flex-wrap">
              {(gameState.boards[userId]?.bank || []).map(card => (
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
            <Button onClick={handleDraw} className="gap-1 text-sm">
              Draw Cards
            </Button>
          )}
          <div className="text-center">
            <div className="w-20 h-28 rounded-xl border-2 border-dashed border-border flex items-center justify-center">
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
            <p className="text-4xl font-display font-bold text-foreground">
              {gameState.boards[userId] ? countCompleteSets(gameState.boards[userId]) : 0}
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
        <div className="flex-none px-4 py-2 border-t bg-card flex items-center justify-center gap-3 animate-card-draw">
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
            Play as Money ({selectedCardData.value}M)
          </Button>
        </div>
      )}

      {/* My hand */}
      <div className="flex-none border-t bg-card/80 backdrop-blur-sm px-4 py-3">
        <div className="flex items-center gap-2 mb-2">
          <Hand className="w-4 h-4 text-muted-foreground" />
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Your Hand ({myHand.length})
          </span>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 justify-center">
          {myHand.map(card => (
            <div key={card.uid} className="flex-none animate-card-draw">
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
