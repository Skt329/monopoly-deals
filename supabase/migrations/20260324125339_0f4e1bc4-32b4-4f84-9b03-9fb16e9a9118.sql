-- Game rooms table
CREATE TABLE public.game_rooms (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room_code TEXT NOT NULL UNIQUE,
  host_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting', 'playing', 'finished')),
  max_players INTEGER NOT NULL DEFAULT 5 CHECK (max_players BETWEEN 2 AND 5),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.game_rooms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read game rooms" ON public.game_rooms FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can create rooms" ON public.game_rooms FOR INSERT TO authenticated WITH CHECK (auth.uid() = host_id);
CREATE POLICY "Host can update room" ON public.game_rooms FOR UPDATE TO authenticated USING (auth.uid() = host_id);

-- Game players table
CREATE TABLE public.game_players (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID NOT NULL REFERENCES public.game_rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  display_name TEXT NOT NULL,
  player_order INTEGER NOT NULL DEFAULT 0,
  is_connected BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(room_id, user_id)
);

ALTER TABLE public.game_players ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read game players" ON public.game_players FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert themselves" ON public.game_players FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update themselves" ON public.game_players FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- Game states table (public board state)
CREATE TABLE public.game_states (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID NOT NULL REFERENCES public.game_rooms(id) ON DELETE CASCADE UNIQUE,
  current_state JSONB NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.game_states ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Players can read game state" ON public.game_states FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.game_players WHERE game_players.room_id = game_states.room_id AND game_players.user_id = auth.uid())
);
CREATE POLICY "Players can insert game state" ON public.game_states FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM public.game_rooms WHERE game_rooms.id = game_states.room_id AND game_rooms.host_id = auth.uid())
);
CREATE POLICY "Players can update game state" ON public.game_states FOR UPDATE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.game_players WHERE game_players.room_id = game_states.room_id AND game_players.user_id = auth.uid())
);

-- Player hands table (PRIVATE - each user can only see their own hand)
CREATE TABLE public.player_hands (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID NOT NULL REFERENCES public.game_rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  hand JSONB NOT NULL DEFAULT '[]'::jsonb,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(room_id, user_id)
);

ALTER TABLE public.player_hands ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only read their own hand" ON public.player_hands FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Host can insert hands" ON public.player_hands FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM public.game_rooms WHERE game_rooms.id = player_hands.room_id AND game_rooms.host_id = auth.uid())
);
CREATE POLICY "Users can update their own hand" ON public.player_hands FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.game_rooms;
ALTER PUBLICATION supabase_realtime ADD TABLE public.game_players;
ALTER PUBLICATION supabase_realtime ADD TABLE public.game_states;
ALTER PUBLICATION supabase_realtime ADD TABLE public.player_hands;

-- Timestamp trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_game_states_updated_at BEFORE UPDATE ON public.game_states FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_player_hands_updated_at BEFORE UPDATE ON public.player_hands FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();