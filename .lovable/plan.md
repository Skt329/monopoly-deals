

# Complete Game UI Redesign + 6 Fixes

## Problems to Fix

1. **Card draw animation** — Current dealing animation is basic fade-in of CardBacks. Need a real deck-to-player animation visible to all players with cards flying from the deck position.
2. **Action card info broadcasting** — No game log or notification system. When someone plays Forced Deal/Sly Deal/Deal Breaker, opponents don't see details of what's being stolen/exchanged. Need a game activity feed visible to all players.
3. **Move notifications** — No messages when any player plays a property or money card. Need turn-by-turn activity log.
4. **Exit game button** — No way to leave mid-game. Need exit button + auto-end if only 1 player remains + return cards to deck.
5. **Property card play options** — Property cards (type `'property'`) currently only show "Play as Property" (line 990-993) which is correct. But need to verify no regression.
6. **Property pile card details** — Player's own property cards use `small` prop (line 872) showing only abbreviated names. Need clickable full-detail cards. Same for opponent cards in expanded view.

## Full UI Redesign

The current layout is cramped with tiny text, poor visual hierarchy, and wasted space. Redesign from scratch with a game-table aesthetic.

### New Layout Structure
```text
┌─────────────────────────────────────────────┐
│ Top Bar: Game title, room code, turn info,  │
│          plays counter, exit button         │
├─────────────────────────────────────────────┤
│  Opponents (horizontal scroll)              │
│  [Player cards as compact panels, click     │
│   to expand into a side sheet/dialog]       │
├─────────────────────────────────────────────┤
│                                             │
│  Main Play Area (green felt background)     │
│  ┌────────┐  ┌──────────────────────────┐   │
│  │ Deck   │  │ Your Properties          │   │
│  │ Discard│  │ (grouped by color,       │   │
│  │ Sets/3 │  │  full-size clickable)    │   │
│  │ End Trn│  │                          │   │
│  └────────┘  │ Bank (stacked w/ total)  │   │
│              └──────────────────────────┘   │
│                                             │
│  Game Activity Log (scrollable sidebar)     │
│                                             │
├─────────────────────────────────────────────┤
│ Your Hand (cards in a fan/row, click to     │
│ preview enlarged card with action buttons)  │
└─────────────────────────────────────────────┘
```

### Design Decisions
- **Green felt table** background for the play area (`bg-emerald-900/95`)
- **Gold accents** for complete sets
- **Game activity log** as a collapsible right sidebar showing all moves
- Cards in hand slightly overlap (fan effect) to save space
- Property groups render cards at a medium size (not tiny `small`, not full 150% preview)

---

## Implementation Plan

### Files to Edit

#### `src/pages/Game.tsx` — Complete rewrite of render section
- **Game activity log**: Add `gameLog` state (`{player: string, action: string, detail: string, timestamp: number}[]`). Append entries when actions are played. Persist log in game state or broadcast via realtime.
- **Card draw animation**: Replace the dealing screen with an in-game animation. When `handleDraw` fires, show cards flying from the deck area to the hand area using CSS keyframes (`@keyframes flyToHand`). All players see a notification "[Player] drew 2 cards" in the log.
- **Exit button**: Add "Exit Game" button in top bar. On click, confirm dialog. On confirm: remove player from `game_players`, return their hand cards to the deck in `game_state`, broadcast "[Player] left the game". If only 1 player remains, set `winner` to that player.
- **Property card display**: Remove `small` prop from player's own property cards (line 872). Use a medium size. Make each card clickable to open the preview dialog.
- **Opponent expansion**: Change from inline expansion to a `Sheet` (slide-in panel) showing full opponent board details. Cards clickable for preview (read-only).
- **Move notifications**: After every play action (property, money, action card), append to `gameLog` and broadcast via game state. Show as toast AND in the log sidebar.
- **Action detail messages**: When Sly Deal/Forced Deal/Deal Breaker is played, the pending action already stores `targetCardUid`/`sourceCardUid`/`targetColor`. Show detailed messages in the response panel: "Player X wants to steal [Card Name] from you" / "Player X wants to swap [Their Card] for [Your Card]".
- **New layout**: Complete JSX restructure with the green felt table design, better spacing, responsive grid.

#### `src/lib/gameEngine.ts`
- Add `gameLog` array to `PublicGameState` type
- Add helper `addLogEntry(state, entry)` to append log entries
- Add `removePlayer(state, playerId)` function that returns cards to deck and removes player from order

#### `src/index.css`
- Add `@keyframes flyToHand` animation for card drawing
- Add green felt background pattern
- Add card fan overlap styles

#### `src/components/game/ActionResponsePanel.tsx`
- Enhance messages to show specific card/property names being stolen/exchanged (use `targetCardUid` to look up card name from target's board)

### Key Technical Details

**Game Log Broadcasting**: Store `gameLog` entries in `PublicGameState` so all players see them via realtime sync. Each entry: `{ playerId, playerName, action, detail, timestamp }`.

**Card Draw Animation**: Use CSS `transform` with `position: fixed` to animate a CardBack from the deck's DOM position to the hand area. Use `getBoundingClientRect()` on the deck element and hand element to calculate start/end positions. Show for 600ms then add cards to hand state.

**Exit Game Flow**:
1. Player clicks Exit → confirmation dialog
2. On confirm: call `removePlayer()` engine function
3. Persist updated state, delete player's hand row
4. If `playerOrder.length === 1`, auto-set winner
5. All other players see "[Name] left the game" in log

**Activity Log Entry Examples**:
- "Alice played Baltic Avenue as property"
- "Bob added M5 to bank"
- "Charlie charged M6 rent on Red properties"
- "Alice used Sly Deal to steal Connecticut Ave from Bob"
- "Dave left the game"
- "Eve drew 2 cards"

