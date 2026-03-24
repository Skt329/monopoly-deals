

# Mobile Responsiveness + In-Game Chat

## What Changes

### 1. Mobile-Responsive Game Layout

The current layout uses fixed pixel sizes and vh-based heights that break on small screens (375x812, 390x844, etc.).

**Top bar**: Shrink text, stack room code below title on mobile, keep exit button accessible.

**Opponent area**: On mobile, switch from horizontal scroll to a compact accordion-style list. Reduce `max-h-[20vh]` to `max-h-[15vh]` on mobile. Use smaller badges.

**Center area (properties + deck + sets)**: On mobile, stack vertically instead of side-by-side flex. Properties scroll horizontally. Deck/discard and sets counter go into a compact row above properties.

**Hand area**: On mobile, reduce card sizes, allow horizontal scroll with snap. Cap at `max-h-[25vh]` on mobile (vs 35vh desktop).

**Card preview dialog**: Already `max-w-xs` — works on mobile. Scale down the 150% card to 120% on small screens.

**Breakpoint strategy**: Use Tailwind's `sm:` and `md:` prefixes. Mobile-first approach. Key breakpoint at `md` (768px).

### 2. In-Game Chat

Add a chat panel using the existing Supabase Broadcast channel — no new tables needed. Messages are ephemeral (disappear when game ends).

**UI**: A small chat icon button (fixed bottom-right on mobile, or in the sidebar on desktop) that opens a slide-up panel/drawer. Shows recent messages with player names color-coded. Input field at the bottom.

**Implementation**:
- Use Supabase Broadcast channel `game-chat-{roomId}` for sending/receiving messages
- Store messages in local state only (ephemeral)
- Each message: `{ playerId, playerName, text, timestamp }`
- Show unread count badge on the chat icon when collapsed
- On mobile: use a Drawer (bottom sheet) for the chat
- On desktop: use a collapsible side panel or popover

---

## Files to Edit

### `src/pages/Game.tsx`
- **Layout refactor**: Add responsive Tailwind classes throughout:
  - Opponent area: `flex-col sm:flex-row`, smaller on mobile
  - Center area: `flex-col md:flex-row` for vertical stacking on mobile
  - Hand: `max-h-[25vh] md:max-h-[35vh]`
  - Card sizes: use `small` prop universally, rely on preview dialog for details
- **Chat state**: Add `chatMessages`, `chatOpen`, `chatInput`, `unreadCount` state
- **Chat channel**: Subscribe to `game-chat-{roomId}` broadcast channel alongside existing moves channel
- **Chat UI**: Render a chat button (bottom-right fixed) + Drawer/Popover with message list and input
- **Send message**: Broadcast via channel, add to local state

### `src/index.css`
- Add a utility animation for chat slide-in if needed (existing animations may suffice)

### `src/components/game/cards/PropertyCard.tsx`, `ActionCard.tsx`, `MoneyCard.tsx`, `RentCard.tsx`, `WildPropertyCard.tsx`
- Verify `small` prop renders correctly at constrained widths. May need to add `min-w-0` or `w-full` for flex shrinking on mobile.

