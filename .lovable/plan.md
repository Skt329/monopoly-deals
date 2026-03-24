

# Fix: Forced Deal, Rent Calculation, Property Rearranging, and UI Layout

## 4 Issues

### 1. Forced Deal not showing property selection
**Root cause**: In `TargetSelector.tsx` line 165, the Forced Deal section shows `stealableProps` (target's properties) and `myOfferableProps` (your properties). However, the Forced Deal card should only be playable if the current player HAS properties. Currently there's no gate check in `handlePlayAction`. Also the TargetSelector already has the UI for both selections — need to verify it's actually rendering. The issue is likely that `getStealableProperties` checks `boards[userId]` but the user's properties might be stored under a different key, OR `myOfferableProps` is empty because the player has no properties in non-complete sets.

**Fix**: 
- In `Game.tsx` `handlePlayAction`: when card is "Forced Deal", check that the player has at least 1 property on their board before opening the target selector. Show error toast if not.
- Same for "Sly Deal" — check opponents have stealable properties.

### 2. Rent cards showing 0M
**Root cause**: `calculateRent()` (line 516-527) looks up `rentTable[propCount]` — this works correctly. The issue is in the Rent card flow: when the user selects a color in `TargetSelector`, `handleConfirmTarget` calls `playActionCard` with `selectedColor`. But the rent is calculated using `state.boards[playerId]` which should have the properties. 

The real bug: the rent table uses 1-indexed keys (`{1: 1, 2: 2, 3: 3}`), and `propCount` is correct. BUT — if `propCount` exceeds the table keys (e.g., 4 properties in a 3-size set), `rentTable[4]` is `undefined`, returning 0. Also, wild properties placed on a color count toward that color's property count, so this should work. Need to clamp propCount to max table key.

**Fix**: In `calculateRent`, clamp `propCount` to the max key in the rent table: `const clampedCount = Math.min(propCount, PROPERTY_SETS[color].size)`. This ensures extra wilds don't break the lookup.

### 3. Property rearranging (wild card reassignment)
**Root cause**: No mechanism exists to move a wild property card from one color group to another on your own board.

**Fix**: Add a "Rearrange" button on played wild property cards. When clicked, show a color picker to reassign it. This doesn't cost a play — it's a free action per Monopoly Deal rules. Add `rearrangeWildProperty()` to `gameEngine.ts` and a UI trigger in `Game.tsx`.

### 4. UI/UX: bank cards should stack, layout needs improvement
**Root cause**: Bank cards are shown individually spread out, taking too much space. The overall layout is cramped.

**Fix**:
- **Stack bank cards**: Show a single pile with a count badge and total value. Only expand when paying rent (already done in ActionResponsePanel).
- **Better layout**: Give more space to the center area, reduce opponent panel sizes, use a cleaner grid layout.

---

## Files to Edit

### `src/lib/gameEngine.ts`
- Fix `calculateRent`: clamp `propCount` to `PROPERTY_SETS[color].size` so excess wilds don't return 0
- Add `rearrangeWildProperty(state, playerId, cardUid, newColor)` function — moves a wild/property card from its current color to a new valid color on the same player's board (free action, no play cost)

### `src/components/game/TargetSelector.tsx`
- No changes needed — Forced Deal UI already exists with both selection steps

### `src/pages/Game.tsx`
- **Forced Deal gate**: Before opening target selector, check player has properties. Show error if not.
- **Sly Deal gate**: Check opponents have stealable properties before opening selector.
- **Property rearranging UI**: On each wild property card in "Your Properties", show a small rearrange icon. Clicking opens a color picker to move it to another valid color group. Calls `rearrangeWildProperty()` and persists.
- **Stacked bank UI**: Replace individual bank card display with a stacked pile showing count + total. Show a tooltip or small overlay with individual cards on hover.
- **Layout improvements**: Increase center area flex, reduce opponent panel min-width, better spacing.

