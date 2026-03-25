import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Users, Zap, PlayCircle } from 'lucide-react';
import { DeveloperInfo } from '@/components/DeveloperInfo';

import { ActionCard } from '@/components/game/cards/ActionCard';
import { PropertyCard } from '@/components/game/cards/PropertyCard';
import { RentCard } from '@/components/game/cards/RentCard';
import { ACTION_CARDS, PROPERTY_CARDS, RENT_CARDS, GameCard } from '@/data/cards';

const centerCards = [
  { component: PropertyCard, data: { ...PROPERTY_CARDS[21], uid: 'c1', definitionId: PROPERTY_CARDS[21].id } as GameCard },
  { component: ActionCard, data: { ...ACTION_CARDS[0], uid: 'c2', definitionId: ACTION_CARDS[0].id } as GameCard },
  { component: RentCard, data: { ...RENT_CARDS[5], uid: 'c3', definitionId: RENT_CARDS[5].id } as GameCard },
];

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
    <div className="min-[100dvh] relative flex flex-col items-center justify-center overflow-x-hidden overflow-y-auto bg-gradient-to-br from-[#022c22] via-[#064e3b] to-[#022c22] px-4 py-12 pb-28">
      {/* Pattern Overlay */}
      <div className="absolute inset-0 z-0 bg-monopoly-pattern opacity-[0.03] mix-blend-overlay pointer-events-none" />
      
      {/* Dynamic Background Glows */}
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none mix-blend-screen animate-pulse-glow" />
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-teal-500/10 rounded-full blur-[100px] pointer-events-none mix-blend-screen" />

      {/* Main Content Area */}
      <div className="relative z-10 w-full max-w-lg mx-auto flex flex-col items-center justify-center min-h-[100dvh]">
        
        {/* Title */}
        <div className="mb-8 md:mb-12 text-center drop-shadow-[0_10px_10px_rgba(0,0,0,0.5)] animate-in fade-in slide-in-from-top-4 duration-700">
          <h1 className="text-5xl sm:text-[3.5rem] md:text-[4rem] font-display font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-300 tracking-tighter leading-none">
            MONOPOLY
            <span className="block text-4xl sm:text-5xl md:text-[4rem] text-transparent bg-clip-text bg-gradient-to-b from-[#4ade80] to-[#16a34a] mt-[-4px] md:mt-[-8px] filter drop-shadow-[0_0_15px_rgba(34,197,94,0.4)]">DEAL</span>
          </h1>
        </div>

        {/* Decorative Fan of Cards with Outer Glow - Scaled down for mobile */}
        <div className="relative flex justify-center items-end -space-x-12 sm:-space-x-8 md:-space-x-12 mb-6 md:mb-10 transform scale-[0.65] sm:scale-75 md:scale-100 origin-bottom animate-in zoom-in duration-700 delay-150 fill-mode-both">
          {/* Outer Halo Glow */}
          <div className="absolute inset-0 bg-emerald-500/20 rounded-full blur-[40px] md:blur-[60px] transform scale-150 z-0" />
          
          {/* Floating Accents */}
          <div className="absolute -left-12 top-4 w-4 h-4 rounded-full bg-emerald-400/40 blur-[2px] animate-float hidden md:block" />
          <div className="absolute -right-8 top-12 w-6 h-6 rounded-full bg-teal-400/30 blur-[3px] animate-float-delayed hidden md:block" />
          <div className="absolute left-1/2 -top-8 w-3 h-3 rounded-full bg-white/40 blur-[1px] animate-float-long hidden md:block" />

          {centerCards.map((centerCard, index) => {
            const CardComponent = centerCard.component;
            let transformClass = "";
            let bounceClass = "";
            if (index === 0) {
              transformClass = "transform -rotate-12 translate-y-6 translate-x-4 shadow-[0_15px_30px_rgba(0,0,0,0.6)] transition-all hover:-translate-y-2 hover:-rotate-[14deg] hover:scale-105 duration-300 relative z-10";
              bounceClass = "animate-bounce-card-1";
            }
            if (index === 1) {
              transformClass = "transform relative z-20 shadow-[0_25px_50px_rgba(0,0,0,0.8)] transition-all hover:-translate-y-6 hover:scale-110 duration-300 scale-105 ring-1 ring-white/10 rounded-xl";
              bounceClass = "animate-bounce-card-2";
            }
            if (index === 2) {
              transformClass = "transform rotate-12 translate-y-6 -translate-x-4 shadow-[0_15px_30px_rgba(0,0,0,0.6)] transition-all hover:-translate-y-2 hover:rotate-[14deg] hover:scale-105 duration-300 relative z-10";
              bounceClass = "animate-bounce-card-3";
            }

            return (
              <div key={centerCard.data.uid} className={transformClass}>
                <div className={bounceClass}>
                  <CardComponent card={centerCard.data as any} />
                </div>
              </div>
            );
          })}
        </div>

        {/* Action Panel - Deep Glassmorphism */}
        <Card className="w-full bg-[#062016]/60 backdrop-blur-2xl rounded-[2rem] shadow-[0_30px_60px_rgba(0,0,0,0.6)] border border-white/10 overflow-hidden animate-in fade-in slide-in-from-bottom-8 duration-700 delay-300 fill-mode-both ring-1 ring-white/5">
          <CardContent className="p-8 space-y-7 relative">
            {/* Subtle inner top highlight */}
            <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

            <div className="space-y-3">
              <label className="text-xs font-bold text-emerald-400/80 uppercase tracking-widest pl-1">Player Profile</label>
              <Input
                placeholder="Enter display name"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                maxLength={20}
                className="text-center text-xl h-14 bg-black/30 border-white/10 focus-visible:ring-emerald-500/50 focus-visible:border-emerald-500/50 text-white placeholder:text-white/20 rounded-2xl shadow-inner font-semibold transition-all"
              />
            </div>

            <Button
              onClick={createRoom}
              disabled={loading}
              className="w-full h-14 text-lg font-bold rounded-2xl bg-gradient-to-b from-emerald-500 to-emerald-700 hover:from-emerald-400 hover:to-emerald-600 text-white shadow-[0_8px_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_30px_rgba(16,185,129,0.5)] border border-emerald-400/20 hover:-translate-y-1 transition-all duration-300"
            >
              <PlayCircle className="w-6 h-6 mr-2 drop-shadow-md" />
              START NEW GAME
            </Button>

            <div className="relative flex items-center py-2">
              <div className="flex-grow border-t border-white/10"></div>
              <span className="flex-shrink-0 mx-4 text-white/30 text-xs font-bold uppercase tracking-widest">Or Join Existing</span>
              <div className="flex-grow border-t border-white/10"></div>
            </div>

            <div className="flex gap-3 relative z-20">
              <Input
                placeholder="ROOM CODE"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                maxLength={4}
                className="flex-1 text-center text-xl tracking-[0.3em] font-mono font-bold h-14 bg-black/30 border-white/10 focus-visible:ring-emerald-500/50 focus-visible:border-emerald-500/50 text-white placeholder:tracking-normal placeholder:font-sans placeholder:text-white/20 rounded-2xl shadow-inner uppercase transition-all"
              />
              <Button
                onClick={joinRoom}
                disabled={loading}
                className="h-14 px-8 text-lg font-bold rounded-2xl bg-white/10 hover:bg-white/20 text-white border border-white/10 backdrop-blur-md transition-all duration-300 hover:-translate-y-1 shadow-lg hover:shadow-white/10"
              >
                <Users className="w-5 h-5 mr-2" />
                JOIN
              </Button>
            </div>
            
          </CardContent>
        </Card>

      </div>

      <DeveloperInfo />
    </div>
  );
}
