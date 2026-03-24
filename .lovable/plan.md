

# Plan: Redesign Cards to Match PDF & Implement Action Card Response System

## Problem Summary
1. **Card designs don't match the PDF** — The current card components use generic colored bands/circles. The real cards have specific layouts: property cards show "PROPERTIES OWNED" with stacked card icons and large M-values; money cards are fully colored with large centered denomination in a circle with "MONOPOLY" text; action cards have full-color backgrounds with centered circles containing the action name and an illustration area; rent cards show a split-color circle with a money stack icon.

2. **No action card response mechanism** — When a player plays Rent, Debt Collector, Birthday, Deal Breaker, Sly Deal, or Forced Deal, the targeted players have no UI to respond (pay, choose what to pay with, or play "Just Say No"). The game engine has `PendingAction` and `phase: 'responding'` types but the Game.tsx UI never renders a response panel.

---

## Part 1: Redesign All Card Components

### PropertyCard (matches Boardwalk, Connecticut, Illinois, etc.)
- **Top section**: Solid color band with property name in bold white text, bordered by a dark outline
- **Value circle**: White circle with dark border at top-left, containing "M{value}" in bold
- **Body**: Light cream/off-white background with dark border inset
- **Left column "PROPERTIES OWNED"**: Shows stacked card icons (1 card, 2 cards, 3 cards fanned out with sparkle lines on the last = COMPLETE SET), each icon colored to match the property color with the count number inside
- **Right column "RENT"**: Large bold "M{rent}" values next to each row
- **Bottom**: "COMPLETE SET" text under the last card icon row

### MoneyCard (matches M1, M2, M3, M4, M5, M10)
Each denomination has a unique full-card color:
- M1: pale olive/cream, M2: pink/rose, M3: light blue, M4: green/lime, M5: purple/lavender, M10: orange/peach
- **Layout**: Full card colored background with darker border
- **Top-left**: White circle with "M{value}"
- **Center**: Large dark circle outline containing "M{value}" in huge bold text with "MONOPOLY" text below
- **Bottom-left corner**: Large faded denomination number + "M" symbol

### ActionCard (matches Deal Breaker, Debt Collector, Sly Deal, etc.)
Each action type has a specific background color:
- Deal Breaker: purple/lavender, Debt Collector: light blue, Sly Deal: light blue, Forced Deal: light blue, Just Say No: lime green, Pass Go: white/cream, House: sky blue, Hotel: lime green, Double The Rent: white/cream, It's Your Birthday: pink
- **Layout**: Full-color card background
- **Top**: White "M{value}" circle + "ACTION" in bold italic white on dark banner
- **Center**: Dark circle outline with action name in bold inside, with themed illustration area (we'll use emoji/icon representations since we can't use the actual illustrations)
- **Bottom**: Description text in black

### RentCard (matches the circular split-color design)
- **Top**: "M{value}" circle + "ACTION" dark banner
- **Center**: Large circle with thick dark border, split into two halves colored for the two property colors, with "RENT" text at top and a money stack icon in center
- **Bottom of circle**: "CHOOSE {COLOR1} OR {COLOR2}" text
- **Below circle**: Description text

### WildPropertyCard (matches the split-panel design)
- **Two-color wild**: Card split vertically — top half shows Color 1 header with "WILD PROPERTY / CHOOSE ONE COLOR", left panel shows Color 1 rent table, right panel shows Color 2 rent table (upside down), with colored arrows between them
- **Rainbow wild**: Dark/rainbow top with "WILD PROPERTY" in rainbow text, "USE THIS CARD AS PART OF ANY SET", with color dots showing all available colors

---

## Part 2: Action Card Response System

### New UI Components
Create `src/components/game/ActionResponsePanel.tsx` — A modal/overlay that appears for targeted players when an action is played against them.

### Flow for each action type:

**Rent / It's Your Birthday / Debt Collector (payment actions):**
1. Active player plays the card → `pendingAction` is set in game state with `phase: 'responding'`
2. Targeted players see a response panel showing:
   - What action was played and by whom
   - Amount owed (e.g., "You owe M5")
   - Option 1: "Pay" button → opens payment picker (select bank cards and/or properties to pay with, total must >= amount owed)
   - Option 2: "Play Just Say No" button (only if they have one in hand) → cancels the action against them
3. When all targets respond, phase returns to 'playing'

**Deal Breaker (steal complete set):**
1. Active player selects a target player AND a complete set to steal → stored in `pendingAction`
2. Target sees: "{Player} wants to steal your {Color} set!"
   - Option: "Accept" or "Play Just Say No"

**Sly Deal (steal single property from incomplete set):**
1. Active player selects target player and a specific property (not from complete set)
2. Target sees the steal request with Accept / Just Say No options

**Forced Deal (swap properties):**
1. Active player selects their property to give + target's property to take
2. Target sees the swap proposal with Accept / Just Say No options

**Just Say No counter-chain:**
- When a target plays Just Say No, the original attacker can counter with their own Just Say No
- This creates a back-and-forth until one side doesn't have a Just Say No

### Game.tsx Changes
- Add target player selection UI (click opponent panel to select target)
- Add property selection UI for Deal Breaker, Sly Deal, Forced Deal
- Add color selection for Rent cards
- Render `ActionResponsePanel` when `gameState.phase === 'responding'` and current user is in `pendingAction.targetPlayerIds`
- Add payment selection modal for paying rent/debt

### Game Engine Updates
- Add `respondToAction()` function that handles:
  - Accepting payment (selecting cards from bank/properties)
  - Playing Just Say No
  - Counter Just Say No
- Add `targetColor` and `targetCardUid` fields to `PendingAction` for property-stealing actions
- Update `persistState` to broadcast to all players via realtime

### Database Migration
- Enable realtime on `game_states` and `player_hands` tables:
  ```sql
  ALTER PUBLICATION supabase_realtime ADD TABLE public.game_states;
  ALTER PUBLICATION supabase_realtime ADD TABLE public.player_hands;
  ```

---

## Files to Create/Edit
- **Edit**: `src/components/game/cards/PropertyCard.tsx` — Complete redesign matching PDF
- **Edit**: `src/components/game/cards/MoneyCard.tsx` — Complete redesign matching PDF  
- **Edit**: `src/components/game/cards/ActionCard.tsx` — Complete redesign matching PDF
- **Edit**: `src/components/game/cards/RentCard.tsx` — Complete redesign matching PDF
- **Edit**: `src/components/game/cards/WildPropertyCard.tsx` — Complete redesign matching PDF
- **Create**: `src/components/game/ActionResponsePanel.tsx` — Response UI for targeted players
- **Create**: `src/components/game/PaymentModal.tsx` — Card selection for paying debts
- **Create**: `src/components/game/TargetSelector.tsx` — Player/property targeting UI
- **Edit**: `src/lib/gameEngine.ts` — Add `respondToAction()`, enhance `PendingAction`
- **Edit**: `src/pages/Game.tsx` — Integrate response panel, target selection, payment flow
- **Migration**: Enable realtime publication on game tables

