import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Users, Crown, Copy, Play, Loader2 } from 'lucide-react';
import { initializeGame } from '@/lib/gameEngine';

interface Player {
  id: string;
  user_id: string;
  display_name: string;
  player_order: number;
  is_connected: boolean;
}

interface Room {
  id: string;
  room_code: string;
  host_id: string;
  status: string;
  max_players: number;
}

export default function Lobby() {
  const { roomCode } = useParams<{ roomCode: string }>();
  const navigate = useNavigate();
  const [room, setRoom] = useState<Room | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [userId, setUserId] = useState<string>('');
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate('/'); return; }
      setUserId(user.id);

      const { data: roomData } = await supabase
        .from('game_rooms')
        .select('*')
        .eq('room_code', roomCode)
        .single();

      if (!roomData) { navigate('/'); return; }
      setRoom(roomData);

      if (roomData.status === 'playing') {
        navigate(`/game/${roomCode}`);
        return;
      }

      const { data: playersData } = await supabase
        .from('game_players')
        .select('*')
        .eq('room_id', roomData.id)
        .order('player_order');

      setPlayers(playersData || []);
    };
    init();
  }, [roomCode, navigate]);

  // Subscribe to player changes
  useEffect(() => {
    if (!room) return;

    const channel = supabase
      .channel(`lobby-${room.id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'game_players',
        filter: `room_id=eq.${room.id}`,
      }, () => {
        // Refetch players
        supabase.from('game_players')
          .select('*')
          .eq('room_id', room.id)
          .order('player_order')
          .then(({ data }) => setPlayers(data || []));
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'game_rooms',
        filter: `id=eq.${room.id}`,
      }, (payload) => {
        const updated = payload.new as Room;
        setRoom(updated);
        if (updated.status === 'playing') {
          navigate(`/game/${roomCode}`);
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [room, roomCode, navigate]);

  const copyCode = () => {
    navigator.clipboard.writeText(roomCode || '');
    toast.success('Room code copied!');
  };

  const startGame = async () => {
    if (!room || players.length < 2) {
      toast.error('Need at least 2 players');
      return;
    }
    setStarting(true);
    try {
      const playerIds = players.map(p => p.user_id);
      const { gameState, hands } = initializeGame(playerIds);
      gameState.roomId = room.id;

      // Save game state
      const { error: stateError } = await supabase.from('game_states').insert({
        room_id: room.id,
        current_state: gameState,
      });
      if (stateError) throw stateError;

      // Save each player's hand
      for (const [playerId, hand] of Object.entries(hands)) {
        const { error: handError } = await supabase.from('player_hands').insert({
          room_id: room.id,
          user_id: playerId,
          hand,
        });
        if (handError) throw handError;
      }

      // Update room status
      await supabase.from('game_rooms').update({ status: 'playing' }).eq('id', room.id);
    } catch (e: any) {
      toast.error(e.message || 'Failed to start game');
      setStarting(false);
    }
  };

  const isHost = room?.host_id === userId;

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl border-2">
        <CardHeader className="text-center">
          <CardTitle className="font-display text-2xl">Waiting Room</CardTitle>
          <div className="flex items-center justify-center gap-2 mt-2">
            <Badge variant="secondary" className="text-lg font-mono tracking-[0.3em] px-4 py-1">
              {roomCode}
            </Badge>
            <Button variant="ghost" size="icon" onClick={copyCode}>
              <Copy className="w-4 h-4" />
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mt-1">Share this code with friends</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
            <span className="flex items-center gap-1"><Users className="w-4 h-4" /> Players</span>
            <span>{players.length} / {room?.max_players || 5}</span>
          </div>

          <div className="space-y-2">
            {players.map((player) => (
              <div
                key={player.id}
                className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border"
              >
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                    {player.display_name[0].toUpperCase()}
                  </div>
                  <span className="font-medium text-foreground">{player.display_name}</span>
                </div>
                <div className="flex items-center gap-1">
                  {player.user_id === room?.host_id && (
                    <Badge variant="default" className="text-[10px] gap-1">
                      <Crown className="w-3 h-3" /> Host
                    </Badge>
                  )}
                  <div className={`w-2 h-2 rounded-full ${player.is_connected ? 'bg-green-500' : 'bg-red-500'}`} />
                </div>
              </div>
            ))}

            {Array.from({ length: (room?.max_players || 5) - players.length }).map((_, i) => (
              <div key={i} className="flex items-center justify-center p-3 rounded-lg border border-dashed border-border text-muted-foreground text-sm">
                Waiting for player...
              </div>
            ))}
          </div>

          {isHost && (
            <Button
              onClick={startGame}
              disabled={starting || players.length < 2}
              className="w-full h-12 text-base font-semibold gap-2"
            >
              {starting ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Starting...</>
              ) : (
                <><Play className="w-4 h-4" /> Start Game ({players.length} players)</>
              )}
            </Button>
          )}

          {!isHost && (
            <div className="text-center text-sm text-muted-foreground py-2">
              Waiting for the host to start the game...
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
