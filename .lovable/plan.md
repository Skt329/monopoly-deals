

# Fix: Card Preview, Just Say No, End Turn with Plays Left, and Payment Logic

## 4 Issues

### 1. Card click should show enlarged popup
Currently clicking a card in hand selects it for playing. Users need to read card details but cards are too small. Add a card preview dialog that shows an enlarged version when clicking, with action buttons inside the dialog.

### 2. Just Say No should only be playable as response or money
Currently "Just Say No" shows "Play Action" + "Play as Money" in the action bar (line 797-805). The "Play Action" button should be removed — JSN can only be played reactively (via ActionResponsePanel) or banked as money.

### 3. End Turn should not force discard if plays remain
Currently `handleEndTurn` (line 450-460) checks `needsDiscard` and immediately enters discard mode. But if `cardsPlayedThisTurn < 3`, the player still has plays available and may want to use them to reduce hand size. Only force discard when all 3 plays are exhausted.

### 4. Payment: if total assets < debt, auto-pay everything; if more, let user choose
Currently `ActionResponsePanel` disables the Pay button if `totalSelected < amountOwed` AND the player has assets (line 133). Per Monopoly Deal rules, if you can't afford the full amount, you pay everything you have. If you have more than enough, you choose what to pay.

---

## Changes

### `src/pages/Game.tsx`

**Card preview dialog:**
- Add `previewCard` state (`GameCard | null`)
- On card click: if tapping same card that's already selected, open preview dialog. First tap selects, second tap previews. OR: single tap opens preview with action buttons inside.
- Better UX: single click opens a Dialog with the enlarged card + action buttons. The dialog replaces the bottom action bar.
- Import `Dialog` from ui components

**Just Say No restriction:**
- In the action bar section (line 797), add condition: if `selectedCardData.name === 'Just Say No'`, only show "Play as Money" button, not "Play Action"

**End Turn with plays remaining:**
- In `handleEndTurn` (line 450-460): if `myHand.length > MAX_HAND_SIZE` AND `cardsPlayedThisTurn < 3`, show a toast warning "You have plays remaining! Use them to reduce your hand, or discard." with a force-discard option
- Add a separate "Force End Turn" flow: show a confirmation that says "You still have X plays left. End turn anyway?" — if confirmed AND hand > 7, then enter discard mode

**Payment logic in `ActionResponsePanel`:**
- Calculate `totalAssets` (all bank + all property values)
- If `totalAssets <= amountOwed`: show "Pay All (M{totalAssets})" button that auto-selects everything — no manual selection needed
- If `totalAssets > amountOwed`: show current selection UI, require `totalSelected >= amountOwed`

### `src/components/game/ActionResponsePanel.tsx`

- Add `totalAssets` calculation
- If `totalAssets <= amountOwed`: render a single "Pay Everything" button that calls `onPay` with all bank card uids and all property cards
- If `totalAssets > amountOwed`: keep current selection UI but enable pay button only when `totalSelected >= amountOwed`

### Files
- **Edit**: `src/pages/Game.tsx` — card preview dialog, JSN restriction, end turn logic
- **Edit**: `src/components/game/ActionResponsePanel.tsx` — smart payment logic

