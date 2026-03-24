import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, Send, X } from 'lucide-react';

interface ChatMessage {
  id: string;
  playerId: string;
  playerName: string;
  text: string;
  timestamp: number;
}

const PLAYER_COLORS = [
  'text-blue-600',
  'text-emerald-600',
  'text-purple-600',
  'text-amber-600',
  'text-rose-600',
];

interface GameChatProps {
  roomId: string;
  userId: string;
  playerName: string;
  players: { user_id: string; display_name: string }[];
  variant?: 'floating' | 'topbar';
  isOpen?: boolean;
  onToggle?: () => void;
}

export function GameChat({ roomId, userId, playerName, players, variant = 'floating', isOpen: controlledOpen, onToggle }: GameChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [internalOpen, setInternalOpen] = useState(false);
  const [input, setInput] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const toggleOpen = onToggle || (() => setInternalOpen(prev => !prev));

  useEffect(() => {
    if (!roomId) return;
    const channel = supabase.channel(`game-chat-${roomId}`);
    channel.on('broadcast', { event: 'chat' }, ({ payload }) => {
      const msg: ChatMessage = {
        id: `${Date.now()}-${Math.random()}`,
        playerId: payload.playerId,
        playerName: payload.playerName,
        text: payload.text,
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev.slice(-99), msg]);
      if (payload.playerId !== userId) {
        setUnreadCount(prev => prev + 1);
      }
    }).subscribe();
    channelRef.current = channel;
    return () => { supabase.removeChannel(channel); };
  }, [roomId, userId]);

  useEffect(() => {
    if (isOpen) {
      setUnreadCount(0);
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [isOpen, messages.length]);

  const sendMessage = useCallback(() => {
    const trimmed = input.trim();
    if (!trimmed || !channelRef.current) return;
    channelRef.current.send({
      type: 'broadcast',
      event: 'chat',
      payload: { playerId: userId, playerName, text: trimmed },
    });
    setMessages(prev => [...prev.slice(-99), {
      id: `${Date.now()}-local`,
      playerId: userId,
      playerName,
      text: trimmed,
      timestamp: Date.now(),
    }]);
    setInput('');
  }, [input, userId, playerName]);

  const getPlayerColor = (pid: string) => {
    const idx = players.findIndex(p => p.user_id === pid);
    return PLAYER_COLORS[idx % PLAYER_COLORS.length];
  };

  // Top bar trigger button (for use in the top bar)
  if (variant === 'topbar' && !isOpen) {
    return (
      <button
        onClick={toggleOpen}
        className="relative flex items-center justify-center w-7 h-7 md:w-8 md:h-8 rounded-full bg-primary/10 hover:bg-primary/20 transition-colors"
      >
        <MessageCircle className="w-4 h-4 text-primary" />
        {unreadCount > 0 && (
          <Badge className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-[8px] px-1 py-0 min-w-[16px] h-[16px] flex items-center justify-center">
            {unreadCount}
          </Badge>
        )}
      </button>
    );
  }

  // Floating trigger button (mobile)
  if (variant === 'floating' && !isOpen) {
    return (
      <button
        onClick={toggleOpen}
        className="fixed bottom-20 right-3 z-50 bg-primary text-primary-foreground rounded-full w-10 h-10 flex items-center justify-center shadow-lg hover:scale-110 transition-transform md:hidden"
      >
        <MessageCircle className="w-5 h-5" />
        {unreadCount > 0 && (
          <Badge className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-[9px] px-1.5 py-0 min-w-[18px] h-[18px] flex items-center justify-center">
            {unreadCount}
          </Badge>
        )}
      </button>
    );
  }

  // Chat panel content (shared between variants)
  const chatContent = (
    <>
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b bg-muted/50">
        <span className="font-bold text-sm text-foreground">💬 Chat</span>
        <button onClick={toggleOpen} className="text-muted-foreground hover:text-foreground">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1.5 min-h-0">
        {messages.length === 0 && (
          <p className="text-xs text-muted-foreground text-center mt-8">No messages yet 👋</p>
        )}
        {messages.map(msg => (
          <div key={msg.id} className={`flex flex-col ${msg.playerId === userId ? 'items-end' : 'items-start'}`}>
            <span className={`text-[10px] font-bold ${getPlayerColor(msg.playerId)}`}>
              {msg.playerId === userId ? 'You' : msg.playerName}
            </span>
            <div className={`rounded-lg px-2.5 py-1 max-w-[85%] text-xs ${
              msg.playerId === userId
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-foreground'
            }`}>
              {msg.text}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="flex gap-1.5 p-2 border-t">
        <Input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && sendMessage()}
          placeholder="Type a message..."
          className="h-8 text-xs"
        />
        <Button size="sm" onClick={sendMessage} disabled={!input.trim()} className="h-8 px-2">
          <Send className="w-3.5 h-3.5" />
        </Button>
      </div>
    </>
  );

  // Desktop sidebar variant
  if (variant === 'topbar') {
    return (
      <div className="hidden md:flex flex-col w-72 border-l bg-card shadow-lg h-full">
        {chatContent}
      </div>
    );
  }

  // Mobile floating bottom sheet
  return (
    <div className="fixed bottom-0 right-0 z-50 w-full h-[50vh] bg-card border-t shadow-2xl flex flex-col md:hidden">
      {chatContent}
    </div>
  );
}
