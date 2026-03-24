

# Fix: Broadcasts, Action Card Visuals, Wild Property Options, Rent Info, and Layout

## 5 Issues

### 1. Broadcasting notifications are tiny toasts in bottom-right corner
**Current**: Line 218 uses `toast.info()` — small text-only toast in corner.
**Fix**: Replace with a center-screen overlay notification that includes card visuals. Create a `GameNotification` component that renders in the center of the screen (z-55, pointer-events-none) with the played card rendered via `GameCardComponent`, player name, and action description. Auto-dismiss after 3s. Store notifications in state as `{ playerName, action, card?: GameCard, timestamp }`.

### 2. Sly Deal / Forced Deal / Deal Breaker response panel lacks card visuals
**Current**: `ActionResponsePanel` (lines 83-123) shows text-only descriptions like "wants to steal your 'Mediterranean Avenue'".
**Fix**: In `ActionResponsePanel`, after the text description, render the actual cards involved using `GameCardComponent`:
- **Sly Deal**: Show the targeted property card
- **Forced Deal**: Show both cards side-by-side with a swap arrow between them
- **Deal Breaker**: Show all cards in the targeted complete set

### 3. Wild property cards (dual-color) shouldn't show "Play as Money" — WRONG
**Clarification**: Actually per Monopoly Deal rules, wild property cards CAN be played as money (they have a value). The user says they should NOT have this option. But looking at the issue again — the user says "Property cards — already correctly restricted... but not for wild property cards like dual color". The user wants dual-color wild property cards to ONLY show "Play as Property" (no money option).
**Fix**: In `Game.tsx` line 1126-1150, for `wild_property` type, remove the "Play as Money" button. Keep only the color picker for "Play as Property".

### 4. Rent collection — player should see how much rent they're collecting
**Current**: When playing rent, the celebration shows "Collecting Rent!" but no amount. The `handleConfirmTarget` doesn't show the calculated rent amount.
**Fix**: After `playActionCard` returns for rent, read `result.state.pendingAction?.amountOwed` and show it in the celebration and toast: "Collecting M{amount} Rent!" Also show it in the broadcast.

### 5. Layout is not flexible — sections overlap/hide when hand opens
**Current**: The layout uses `h-screen flex flex-col overflow-hidden` (line 744). The hand area at the bottom pushes up and can hide the center content (deck, properties, discard).
**Fix**: 
- Give the center area `flex-1 min-h-0 overflow-auto` so it scrolls independently
- Cap the hand area height with `max-h-[35vh]` and make it scrollable
- Make opponent area collapsible/scrollable with `max-h-[20vh]`
- Ensure deck/discard pile always remains visible by putting it in a sticky or fixed position within the center area

---

## Files to Edit

### `src/pages/Game.tsx`
- **Center-screen notifications**: Add `gameNotifications` state array. Replace `toast.info` in broadcast listener (line 218) with a center overlay showing card visual + message. Render a notification overlay component at z-55.
- **Rent amount in celebrations**: In `handleConfirmTarget` (line 539), for Rent actions read `result.state.pendingAction?.amountOwed` and include in celebration message and broadcast.
- **Wild property play options**: Remove "Play as Money" button for `wild_property` type (lines 1147-1149).
- **Layout fixes**: 
  - Opponent area: add `max-h-[18vh] overflow-y-auto`
  - Center area: ensure `min-h-0 overflow-auto`
  - Hand area: add `max-h-[35vh] overflow-y-auto`
- **Broadcast with card data**: In `broadcastMove`, add optional card parameter. Send card data in payload so receiving clients can render the card visual.

### `src/components/game/ActionResponsePanel.tsx`
- After the text description block (line 124), add a visual card display section:
  - For `sly_deal`: find and render the `targetCardUid` card from `myBoard`
  - For `forced_deal`: render both target card and source card (from attacker's board) with a swap arrow
  - For `deal_breaker`: render all cards from the `targetColor` set on `myBoard`
  - For `rent`: show the rent amount prominently with a money icon

