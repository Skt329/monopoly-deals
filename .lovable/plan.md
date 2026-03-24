

# Fix: Card Play Options & Discard After 3 Plays

## Problems

1. **Wrong play options shown** — Line 774 always shows "Play as Money" for every card type, including money and property cards. A money card should only show "Play" (to bank). A property card should only show "Play as Property". Only action/rent/wild cards need multiple options.

2. **Can't end turn with >7 cards after 3 plays** — When a player has used all 3 plays but has >7 cards (from Pass Go draws), `handleEndTurn` enters discard mode correctly. But the issue is: if `cardsPlayedThisTurn >= 3`, the player may not realize they need to click "End Turn" to trigger discard mode. The End Turn button exists but the flow is confusing — and there may be an edge case where the discard count check `discardSelected.length < myHand.length - MAX_HAND_SIZE` prevents confirming if the player selects too many or too few cards.

## Fix

### 1. Clean up action bar (lines 731-777)

Change the logic so each card type shows only relevant buttons:

- **`type === 'money'`**: Show only "Play to Bank" button (no "Play as Property" option)
- **`type === 'property'`**: Show only "Play as Property" button (no "Play as Money" option)  
- **`type === 'wild_property'`**: Show "Play as Property" with color picker + "Play as Money"  (wild properties CAN be played as money per Monopoly Deal rules)
- **`type === 'action'`**: Show "Play Action" + "Play as Money" (actions CAN be banked per rules)
- **`type === 'rent'`**: Show "Play Action" + "Play as Money" (rents CAN be banked per rules)

### 2. Auto-trigger discard when 3 plays used and hand > 7

After playing the 3rd card, if hand > MAX_HAND_SIZE, automatically enter discard mode without requiring the player to click "End Turn" first. This prevents the stuck state.

In the play handlers (`handlePlayAsMoney`, `handlePlayAsProperty`, `handlePlayAction`, etc.), after persisting state, check:
- If `cardsPlayedThisTurn` just reached 3 AND new hand size > MAX_HAND_SIZE → set `discardMode = true`
- If `cardsPlayedThisTurn` just reached 3 AND new hand size <= MAX_HAND_SIZE → auto end turn

Also show a clearer message: "You've used all 3 plays. Discard down to 7 cards to end your turn."

## Files to Edit

**`src/pages/Game.tsx`**:
- Refactor action bar (lines 731-777): conditional buttons per card type
- After each play action that increments `cardsPlayedThisTurn` to 3, auto-enter discard mode or auto-end turn

