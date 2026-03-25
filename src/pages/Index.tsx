import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Gamepad2, Users, Zap } from 'lucide-react';
import { DeveloperInfo } from '@/components/DeveloperInfo';

function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 4; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

export default function Index() {
  const [playerName, setPlayerName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const ensureAnonymousAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      const { error } = await supabase.auth.signInAnonymously();
      if (error) throw error;
    }
    const { data: { user } } = await supabase.auth.getUser();
    return user!.id;
  };

  const createRoom = async () => {
    if (!playerName.trim()) {
      toast.error('Please enter your name');
      return;
    }
    setLoading(true);
    try {
      const userId = await ensureAnonymousAuth();
      const code = generateRoomCode();

      const { error: roomError } = await supabase.from('game_rooms').insert({
        room_code: code,
        host_id: userId,
        status: 'waiting',
        max_players: 5,
      });
      if (roomError) throw roomError;

      // Get room id
      const { data: room } = await supabase
        .from('game_rooms')
        .select('id')
        .eq('room_code', code)
        .single();

      const { error: playerError } = await supabase.from('game_players').insert({
        room_id: room!.id,
        user_id: userId,
        display_name: playerName.trim(),
        player_order: 0,
        is_connected: true,
      });
      if (playerError) throw playerError;

      navigate(`/lobby/${code}`);
    } catch (e: any) {
      toast.error(e.message || 'Failed to create room');
    } finally {
      setLoading(false);
    }
  };

  const joinRoom = async () => {
    if (!playerName.trim()) {
      toast.error('Please enter your name');
      return;
    }
    if (!roomCode.trim()) {
      toast.error('Please enter a room code');
      return;
    }
    setLoading(true);
    try {
      const userId = await ensureAnonymousAuth();
      const code = roomCode.trim().toUpperCase();

      const { data: room, error: findError } = await supabase
        .from('game_rooms')
        .select('id, status, max_players')
        .eq('room_code', code)
        .single();

      if (findError || !room) {
        toast.error('Room not found');
        return;
      }
      if (room.status !== 'waiting') {
        toast.error('Game already started');
        return;
      }

      // Check player count
      const { count } = await supabase
        .from('game_players')
        .select('*', { count: 'exact', head: true })
        .eq('room_id', room.id);

      if ((count || 0) >= room.max_players) {
        toast.error('Room is full');
        return;
      }

      const { error: playerError } = await supabase.from('game_players').insert({
        room_id: room.id,
        user_id: userId,
        display_name: playerName.trim(),
        player_order: count || 0,
        is_connected: true,
      });
      if (playerError) throw playerError;

      navigate(`/lobby/${code}`);
    } catch (e: any) {
      toast.error(e.message || 'Failed to join room');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Dynamic Background Effects */}
      <div className="absolute inset-0 z-0 bg-grid-white/5 [mask-image:linear-gradient(to_bottom_right,white,transparent)] pointer-events-none" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[128px] opacity-50 pointer-events-none mix-blend-screen" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-[128px] opacity-30 pointer-events-none mix-blend-screen" />

      {/* Hero */}
      <div className="text-center mb-10 z-10 relative">
        <h1 className="text-5xl md:text-7xl font-display font-bold text-foreground tracking-tight mb-3 origin-center animate-in fade-in zoom-in duration-700">
          MONOPOLY <span className="text-primary drop-shadow-[0_0_15px_rgba(var(--primary),0.5)]">DEAL</span>
        </h1>
        <p className="text-muted-foreground text-lg animate-in fade-in slide-in-from-bottom-4 duration-700 delay-150 fill-mode-both">
          The fast-dealing property trading card game
        </p>
      </div>

      {/* Main card */}
      <Card className="w-full max-w-md shadow-2xl border border-white/10 bg-card/80 backdrop-blur-xl z-10 relative animate-in fade-in slide-in-from-bottom-8 duration-700 delay-300 fill-mode-both">
        <CardHeader className="text-center pb-2">
          <CardTitle className="font-display text-xl flex items-center justify-center gap-2">
            <Gamepad2 className="w-5 h-5 text-primary animate-pulse" />
            Play Now
          </CardTitle>
          <CardDescription>2-5 players • Real-time multiplayer</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            placeholder="Your display name"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            maxLength={20}
            className="text-center text-lg h-12 bg-background/50 border-white/10 focus-visible:ring-primary/50 transition-all font-medium"
          />

          <Button
            onClick={createRoom}
            disabled={loading}
            className="w-full h-12 text-base font-semibold gap-2 shadow-[0_0_20px_rgba(var(--primary),0.3)] hover:shadow-[0_0_25px_rgba(var(--primary),0.5)] transition-all duration-300 hover:scale-[1.02]"
          >
            <Zap className="w-4 h-4 fill-primary-foreground/20" />
            Create New Game
          </Button>

          <div className="flex items-center gap-3 py-1 opacity-70">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-border to-border" />
            <span className="text-xs text-muted-foreground uppercase tracking-widest font-semibold">or join</span>
            <div className="flex-1 h-px bg-gradient-to-l from-transparent via-border to-border" />
          </div>

          <div className="flex gap-2 group/join">
            <Input
              placeholder="Room code"
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
              maxLength={4}
              className="text-center text-lg tracking-[0.3em] uppercase font-mono h-12 bg-background/50 border-white/10 focus-visible:ring-primary/30 transition-all font-bold placeholder:tracking-normal placeholder:font-sans"
            />
            <Button
              onClick={joinRoom}
              disabled={loading}
              variant="secondary"
              className="h-12 px-6 font-semibold gap-2 hover:bg-secondary/80 border border-white/5 transition-all duration-300 group-hover/join:shadow-lg"
            >
              <Users className="w-4 h-4" />
              Join
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Features */}
      <div className="mt-8 flex gap-8 text-sm font-medium text-muted-foreground/70 z-10 relative animate-in fade-in duration-1000 delay-500 fill-mode-both">
        <span className="flex items-center gap-1.5 hover:text-primary transition-colors cursor-default"><Zap className="w-4 h-4" /> Real-time</span>
        <span className="flex items-center gap-1.5 hover:text-primary transition-colors cursor-default"><Users className="w-4 h-4" /> 2-5 Players</span>
        <span className="flex items-center gap-1.5 hover:text-primary transition-colors cursor-default"><Gamepad2 className="w-4 h-4" /> Hidden Hands</span>
      </div>
      
      {/* Developer Info Floating Button */}
      <DeveloperInfo />
    </div>
  );
}
