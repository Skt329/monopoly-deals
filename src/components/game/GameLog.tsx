import { type LogEntry } from '@/lib/gameEngine';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useEffect, useRef } from 'react';

interface GameLogProps {
  entries: LogEntry[];
  currentUserId: string;
}

const ACTION_ICONS: Record<string, string> = {
  draw: '🃏',
  property: '🏠',
  money: '💵',
  rent: '💰',
  sly_deal: '🕵️',
  forced_deal: '🔄',
  deal_breaker: '💥',
  birthday: '🎂',
  debt_collector: '🏦',
  house: '🏠',
  hotel: '🏨',
  pass_go: '🎉',
  just_say_no: '🛡️',
  pay: '💳',
  accept: '✅',
  exit: '🚪',
  end_turn: '➡️',
  discard: '🗑️',
};

export function GameLog({ entries, currentUserId }: GameLogProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [entries.length]);

  if (!entries || entries.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground text-xs italic">
        No moves yet
      </div>
    );
  }

  return (
    <ScrollArea className="h-full" ref={scrollRef}>
      <div className="space-y-1 p-2">
        {entries.slice(-30).map((entry, i) => {
          const icon = ACTION_ICONS[entry.action] || '▶';
          const isMe = entry.playerId === currentUserId;
          return (
            <div
              key={i}
              className="animate-log-slide flex items-start gap-1.5 text-[10px] leading-tight"
            >
              <span className="flex-none mt-0.5">{icon}</span>
              <span className="text-foreground/80">
                <span className={`font-semibold ${isMe ? 'text-primary' : 'text-foreground'}`}>
                  {isMe ? 'You' : entry.playerName}
                </span>{' '}
                <span className="text-muted-foreground">{entry.detail}</span>
              </span>
            </div>
          );
        })}
      </div>
    </ScrollArea>
  );
}
