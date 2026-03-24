

# Fix: 6 Game Issues — Draw Animation, Action Messaging, Activity Feed, Exit Game, Property Card Options, Card Details

## 1. Real card draw animation (deck-to-hand flight)
**Current**: Dealing animation shows card backs fading in place. No visual of cards flying from deck.

**Fix in `src/pages/Game.tsx`**:
- Add `flyingCards` state: array of `{ id, startX, startY, endX, endY }` 
- When `handleDraw` is called, calculate deck position (center area) and hand position (bottom)
- Render animated card backs that fly from deck to hand using CSS `transform` with `transition`
- Use `useRef` on the deck element to get its bounding rect
- All players see the draw via realtime — when another player's `handCounts` increases, show a brief "cards flying from deck toward that player's panel" animation in the opponent area
- Replace the current static dealing animation with the same flight animation on initial deal

## 2. Detailed action card info for all players
**Current**: When Forced Deal/Sly Deal/Deal Breaker is played, opponents only see a generic "Action Against You!" message. No details about which card/property is targeted.

**Fix in `src/components/game/ActionResponsePanel.tsx`**:
- For `sly_deal`: Show "X wants to steal [card name] from you!" — look up `pendingAction.targetCardUid` in the target's board to get the card name
- For `forced_deal`: Show "X wants to swap their [source card] for your [target card]!" — look up both `targetCardUid` and `sourceCardUid`
- For `deal_breaker`: Show "X wants to steal your complete [color] set!" using `pendingAction.targetColor`

**Fix in `src/pages/Game.tsx`**:
- After `handleConfirmTarget` resolves (action completes), broadcast a result message via toast to the acting player: "You stole Mediterranean Avenue from Player 2!"
- After `handleAccept` resolves, show the target: "Player 1 stole your Mediterranean Avenue"

## 3. Activity feed / move notifications for all players
**Current**: No notifications when other players play cards.

**Fix**: Use Supabase Broadcast channel to send move notifications.
- In `src/pages/Game.tsx`, add a `game-moves` broadcast channel
- After each play action (property, money, action card), broadcast: `{ player: displayName, action: 'played Mediterranean Avenue as property' }` or `{ player: displayName, action: 'added M5 to bank' }`
- All clients listen on this channel and show a brief toast notification
- Add a small activity log area or use toast notifications with short auto-dismiss (2s)

## 4. Exit game button + last player auto-win
**Fix in `src/pages/Game.tsx`**:
- Add "Exit Game" button in the top bar (with confirmation dialog)
- On exit: remove player from `game_players`, return their hand cards to the deck (merge with `gameState.deck`), remove their board cards to deck, remove from `playerOrder`
- Broadcast exit message: "Player X left the game"
- After removal, check if only 1 player remains → auto-set them as winner, show win screen
- If the exiting player was the current turn player, advance to next player

**Fix in `src/lib/gameEngine.ts`**:
- Add `removePlayer(state, playerId, playerHand)` function that returns cards to deck, removes from playerOrder, adjusts currentPlayerIndex

## 5. Property card should NOT show "Play as Money" option
**Current**: Line 990-993 shows only "Play as Property" for property cards — this is already correct. But checking the preview dialog code confirms property cards only have one button. Issue might be that the user is seeing it on wild_property cards which DO correctly show both options.

**Verification**: The code at line 990-993 already restricts pure property cards to only "Play as Property". No change needed here. Will double-check and confirm in implementation.

## 6. Property pile cards clickable with full details
**Current**: Player's own property cards render with `small` prop (line 872), showing minimal info. No click handler to preview.

**Fix in `src/pages/Game.tsx`**:
- Add `onClick={() => setPreviewCard(card)}` to each property card in "Your Properties" section (line 871)
- This opens the existing preview dialog showing enlarged card with full details (read-only since it's already played)
- For opponent expanded view: already has `onClick={() => setPreviewCard(card)}` (line 807) — this works
- Consider removing `small` prop from player's own properties OR keeping `small` but making them clickable for the preview popup

---

## Files to Edit

| File | Changes |
|------|---------|
| `src/pages/Game.tsx` | Draw flight animation, broadcast moves channel, exit game button + handler, property card click handlers, action result messages |
| `src/lib/gameEngine.ts` | Add `removePlayer()` function |
| `src/components/game/ActionResponsePanel.tsx` | Show specific card/property names in steal action descriptions |

