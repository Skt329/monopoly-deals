

# Fix: Pass Go Card Mechanics & Turn Counter UI

## Problems
1. **No plays counter visible** — Players can't see how many of their 3 plays they've used (the counter exists but is small and easy to miss).
2. **Pass Go breaks the game** — Pass Go counts as 1 of 3 plays AND draws 2 cards. If those drawn cards include another Pass Go, playing it draws more. The hand can grow well beyond 7, but the current discard check only happens at end-of-turn. The player has no UI to discard excess cards, causing collapse.

## Root Cause
- `playActionCard` for Pass Go increments `cardsPlayedThisTurn` (line 237) — this is correct per rules (Pass Go IS one of your 3 plays).
- But the discard-to-7 phase only triggers in `handleEndTurn` (line 322-327) as a blocking check. There's no discard UI — it just shows an error toast.
- The `discardCards` function exists in the engine but is never called from Game.tsx.

## Fix Plan

### 1. Add prominent plays counter to the game UI
- Show a large "1/3", "2/3", "3/3" plays counter badge near the action bar
- Disable card interactions when 3 plays are used (already done via engine check, but add visual feedback)
- Show "End Turn" button more prominently when plays are exhausted

### 2. Fix discard phase after end turn
- When player clicks "End Turn" and hand > 7, set local phase to `'discard'` instead of just showing a toast
- Show a discard overlay/panel where the player selects cards to discard (click cards to mark them)
- Show count: "Discard X cards (you have Y, max 7)"
- Confirm button calls `discardCards()` engine function, then proceeds with `endTurn()`

### 3. Pass Go edge cases
- Pass Go correctly uses 1 of 3 plays — no change needed there
- The key fix is the discard mechanism: after all plays, if hand > 7, force discard before ending turn
- Chain scenario (Pass Go → draw Pass Go → play it → draw more) works naturally since each Pass Go costs 1 play, so max 3 Pass Go's = 6 extra cards drawn in a turn

## Files to Edit

**`src/pages/Game.tsx`:**
- Add `discardMode` state and discard selection UI
- Update `handleEndTurn` to enter discard mode when hand > 7
- Add discard confirmation handler that calls `discardCards()` then `endTurn()`
- Make the plays counter more prominent (larger badge, color changes at 2/3 and 3/3)
- Auto-show "End Turn" when at 3 plays

**`src/lib/gameEngine.ts`:**
- Fix `discardCards` — the phase after discard should go to next player's `'drawing'` (currently it incorrectly stays as `'drawing'` for the same player if hand <= 7, instead of calling `endTurn`)

