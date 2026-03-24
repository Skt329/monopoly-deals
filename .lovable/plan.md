

# Fix: Complete Action Card Mechanics

## What's Broken

| Card | Issue |
|------|-------|
| **Sly Deal** | No property selection UI; accept handler doesn't transfer the property |
| **Forced Deal** | No UI to pick your card to give + their card to take; no swap logic |
| **Deal Breaker** | `targetColor` not stored in PendingAction; no set transfer on accept |
| **Double The Rent** | Does nothing — needs to pair with a rent card as a combo play |

Rent calculation is correct. Just Say No works.

---

## Plan

### 1. Extend `PendingAction` type (gameEngine.ts)
Add fields to store targeting details:
- `targetColor?: PropertyColor` — for Deal Breaker (which complete set to steal)
- `targetCardUid?: string` — for Sly Deal (which specific property to steal)
- `sourceCardUid?: string` — for Forced Deal (attacker's property to give)
- `doubleRent?: boolean` — flag for doubled rent

### 2. Implement property transfer in `handleAccept` (Game.tsx)
When target accepts (no Just Say No):
- **Sly Deal**: Move `targetCardUid` property from target's board to attacker's board (same color group)
- **Forced Deal**: Swap `targetCardUid` (target→attacker) and `sourceCardUid` (attacker→target)
- **Deal Breaker**: Move entire `targetColor` property array from target's board to attacker's board

### 3. Enhance TargetSelector for property-level selection
For Sly Deal and Forced Deal, the TargetSelector needs a second step after picking a player:
- Show the target player's properties (excluding complete sets for Sly Deal per rules)
- Let attacker click a specific property card to select it
- For Forced Deal: also show attacker's own properties to pick which one to give
- For Deal Breaker: show target's complete sets only, pick a color

New props: `onSelectTargetCard`, `onSelectSourceCard`, `selectedTargetCard`, `selectedSourceCard`

### 4. Double The Rent combo mechanism
**Rule**: Double The Rent must be played WITH a rent card in the same turn. It costs 1 of 3 plays and doubles the rent amount.

Implementation:
- In Game.tsx, when player selects "Double The Rent" card, check if they have a rent card in hand
- Show a prompt to select which rent card to pair it with
- Play both cards together (costs 2 plays total — 1 for rent, 1 for Double The Rent)
- Set `doubleRent: true` on the PendingAction, and multiply `amountOwed` by 2
- If no rent card available, show error toast

### 5. Store targeting data in PendingAction
Update `playActionCard` cases:
- **Deal Breaker**: Store `targetColor` in pendingAction
- **Sly Deal**: Add `targetCardUid` parameter, store in pendingAction
- **Forced Deal**: Add `targetCardUid` + `sourceCardUid` parameters, store in pendingAction

---

## Files to Edit

**`src/lib/gameEngine.ts`**:
- Add `targetColor`, `targetCardUid`, `sourceCardUid` to `PendingAction` interface
- Update Deal Breaker case to store `targetColor`
- Add `targetCardUid` and `sourceCardUid` params to `playActionCard`
- Add `resolveStealAction()` function that handles the actual property transfers for all 3 steal-type cards

**`src/components/game/TargetSelector.tsx`**:
- Add property card selection step for Sly Deal (show target's non-complete-set properties)
- Add dual property selection for Forced Deal (pick theirs + pick yours)
- Add complete set selection for Deal Breaker (show target's complete sets only)
- Add rent card pairing for Double The Rent

**`src/pages/Game.tsx`**:
- Update `handleConfirmTarget` to pass `targetCardUid`/`sourceCardUid` to `playActionCard`
- Rewrite `handleAccept` to call `resolveStealAction()` for steal-type cards and actually transfer properties
- Add Double The Rent flow: detect DTR card → show rent card picker → play both as combo
- Update `handlePlayAction` to handle DTR specially

