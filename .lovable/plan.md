

# Monopoly Deal — Full Real-Time Multiplayer Game

## Overview
Build a complete Monopoly Deal card game with designed card components (no scanned images), real-time multiplayer via Supabase, hidden hands, and polished game effects. 2-5 players per game.

## Card Inventory (from PDF)
Based on the scanned document, the full Monopoly Deal deck includes:

**Property Cards (28):** Boardwalk, Park Place (Dark Blue); Baltic Ave, Mediterranean Ave (Brown); Connecticut Ave, Oriental Ave, Vermont Ave (Light Blue); Atlantic Ave, Ventnor Ave, Marvin Gardens (Yellow); Illinois Ave, Indiana Ave, Kentucky Ave (Red); Pacific Ave, North Carolina Ave, Pennsylvania Ave (Green); States Ave, Virginia Ave, St. Charles Place (Magenta); Tennessee Ave, St. James Place, New York Ave (Orange); Pennsylvania RR, Short Line, B&O RR, Reading RR (Railroad); Electric Co, Water Works (Utility)

**Wild Property Cards (11):** 2-color wilds for each pair + rainbow wild (any color)

**Action Cards (~34):** Rent (5 color-pair variants + wild rent), Deal Breaker, Sly Deal, Forced Swap, Just Say No, It's Your Birthday, Debt Collector, Pass Go, Double the Rent, House, Hotel

**Money Cards (~20):** M1, M2, M3, M4, M5, M10

**Total: ~106 cards**

---

## Architecture

```text
┌─────────────────────────────────────────────┐
│  React Frontend (Vite + Tailwind)           │
│  ┌──────────┐ ┌──────────┐ ┌─────────────┐ │
│  │ Lobby    │ │ Game     │ │ Card        │ │
│  │ System   │ │ Board UI │ │ Components  │ │
│  └────┬─────┘ └────┬─────┘ └─────────────┘ │
│       │             │                        │
│  ┌────▼─────────────▼──────────────────────┐ │
│  │  Game Engine (client-side logic)        │ │
│  │  Turn mgmt, validation, effects         │ │
│  └────┬────────────────────────────────────┘ │
└───────┼──────────────────────────────────────┘
        │ Supabase Realtime (Broadcast)
┌───────▼──────────────────────────────────────┐
│  Supabase Backend                            │
│  - game_rooms table (room state, players)    │
│  - game_states table (deck, hands, board)    │
│  - Realtime channels for sync               │
│  - RLS: players can only see own hand        │
└──────────────────────────────────────────────┘
```

---

## Implementation Plan

### Step 1: Card Data & Designed Components
- Create `src/data/cards.ts` — full deck definition with all 106 cards, types, colors, values, rent tables, set sizes
- Create `src/components/game/cards/` — React card components styled with Tailwind to match the PDF designs:
  - `PropertyCard` — colored header with property name, rent table, set counter
  - `ActionCard` — value badge, action name, description text, themed border
  - `MoneyCard` — large denomination display with Monopoly styling
  - `WildPropertyCard` — multi-color gradient header, color picker indicator
  - `CardBack` — "MONOPOLY" branded back for hidden cards

### Step 2: Game Engine
- Create `src/lib/gameEngine.ts` — pure functions for all game logic:
  - Deck shuffle, deal (5 cards each), draw (2 per turn)
  - Play up to 3 cards per turn (property, action, or money to bank)
  - Rent calculation based on owned properties in color set
  - Action resolution (Deal Breaker, Sly Deal, Forced Swap, Just Say No counter)
  - House/Hotel placement rules
  - Win condition: first to 3 complete property sets
  - Hand limit: discard down to 7 at end of turn

### Step 3: Supabase Backend (Lovable Cloud)
- **Tables:**
  - `game_rooms` — id, room_code, host_id, status (waiting/playing/finished), max_players, created_at
  - `game_players` — id, room_id, user_id, display_name, player_order, is_connected
  - `game_states` — id, room_id, current_state (JSONB: deck, discard, board per player, bank per player, current_turn, phase), updated_at
  - `player_hands` — id, room_id, user_id, hand (JSONB array of card IDs) — **RLS: only owner can SELECT their own row**
- **RLS Policies:**
  - `game_rooms`: authenticated users can read; host can update
  - `player_hands`: users can ONLY read their own hand (critical for hidden cards)
  - `game_states`: all players in room can read (public board state)
- **Realtime:** Broadcast channel per room for game actions; Postgres changes for state sync

### Step 4: Lobby & Room System
- Pages: `/` (home), `/lobby/:roomCode` (waiting room), `/game/:roomCode` (game board)
- Create/join room with 4-character code
- Player name input (no auth required — anonymous play with display names)
- Waiting room shows connected players (2-5), host starts game

### Step 5: Game Board UI
- Layout: Current player's hand at bottom (face-up, interactive), other players' areas around the top/sides showing:
  - Card count in hand (face-down card backs)
  - Their played properties (grouped by color set)
  - Their bank (money pile)
- Center area: draw pile, discard pile, current action being played
- Turn indicator, action counter (0-3 plays per turn), end turn button

### Step 6: Game Effects & Polish
- Card play animations (hand → board with spring physics via CSS transitions)
- Rent collection: coin animation from target to collector
- Set completion: glow/pulse effect + celebration toast
- Steal animations for Sly Deal / Deal Breaker
- "Just Say No" — shield/block visual effect
- Win screen with confetti
- Sound effects for card plays, rent, completion

### Step 7: Multiplayer Sync
- Host acts as authority — validates moves, broadcasts state updates
- Optimistic UI with rollback on rejection
- Action queue: when a player plays Rent/Birthday/Debt Collector, other players get prompted to pay or play Just Say No
- Disconnect handling: mark player disconnected, allow rejoin within timeout

---

## Technical Details

**Hidden Hand Implementation:** The `player_hands` table has RLS so each player can only query their own row. The shared `game_states` JSONB contains only public info (board, bank, discard, deck count). Other players' hand sizes are derived from a `hand_counts` field in game_states (just numbers, no card data).

**Turn Flow:**
1. Draw 2 cards (or 5 if hand empty) → added to `player_hands`
2. Play 0-3 cards → each play updates `game_states` + broadcasts via Realtime
3. End turn → if hand > 7, forced discard prompt
4. Next player's turn

**No authentication required** — players join with a display name and get an anonymous Supabase session. The room code + session ID identifies them.

