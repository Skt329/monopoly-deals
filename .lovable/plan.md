

# Implementation Plan: 7 Fixes for Game Mechanics and UI

## 1. Multi-color Rent Card Filtering

**Problem**: Rent/Wild Rent color picker shows ALL colors, even ones the player has no properties for, resulting in 0M rent.

**Fix in `src/components/game/TargetSelector.tsx`**:
- Add `currentPlayerBoard` prop
- For `Rent`/`Wild Rent` color selection, filter `availableColors` to only colors where `currentPlayerBoard.properties[color].length > 0`

**Fix in `src/pages/Game.tsx`**:
- Pass `currentPlayerBoard={myBoard}` to `TargetSelector`
- In `handlePlayAction` for Rent cards: check player has properties in at least one of the card's colors before opening selector

## 2. Opponent Card Details (Expandable)

**Fix in `src/pages/Game.tsx`**:
- Add `expandedOpponent` state (`string | null`)
- Clicking an opponent panel toggles expansion showing full property cards (using `GameCardComponent small`) and bank cards
- Clicking any opponent card opens the existing `previewCard` dialog in read-only mode (no action buttons since it's not your card)

## 3. Property Paid as Rent Goes to Property Pile

**Fix in `src/lib/gameEngine.ts` `payWithCards()`**:
- Currently line 627 puts ALL payments into `collectorBoard.bank`
- Split payments: money/action cards → bank, property/wild_property cards → collector's property pile under their original color (using `addPropertyCard`)

## 4. Full Property Card Rendering + Clickable Opponent Sections

**Fix in `src/pages/Game.tsx`**:
- Player's own properties (line 728): remove `small` prop so cards render at full size with rent tables visible
- Adjust layout: wrap property groups in a scrollable flex container
- Opponent expanded view: show full-size cards when expanded

## 5. Action Celebrations

**Fix in `src/pages/Game.tsx`**:
- Add `celebration` state: `{ type: string; message: string; emoji: string } | null`
- Create a `CelebrationOverlay` component rendered at z-60 with unique animations per action:
  - Pass Go: "🎉 Drew 2 Cards!" fade-in/scale
  - Rent: "💰 Collecting M{amount}!" with pulse
  - Sly Deal: "🕵️ Property Stolen!"
  - Deal Breaker: "💥 Complete Set Stolen!"
  - Birthday: "🎂 Happy Birthday!"
  - Forced Deal: "🔄 Properties Swapped!"
  - House: "🏠 House Added!"
  - Hotel: "🏨 Hotel Added!"
- Auto-dismiss after 2s with `setTimeout`
- Trigger in `handleConfirmTarget`, `handlePlayAction`, `handleAccept`

## 6. House/Hotel Fixes

**Fix in `src/lib/gameEngine.ts`**:
- House/Hotel cases (lines 368-387): do NOT add card to `discardPile` (remove from line 240's blanket discard). Instead add the card to `board.properties[targetColor]` so it's visually attached to the set
- This requires moving the `discardPile` push to be per-case instead of blanket at line 240

**Fix in `src/pages/Game.tsx`**:
- House gate in `handlePlayAction`: require at least one complete set, show error if none
- Hotel gate: require a complete set WITH a house, show error if none

**Fix in `src/components/game/TargetSelector.tsx`**:
- For `House` color selection: filter to only complete sets without a house
- For `Hotel` color selection: filter to only complete sets with a house but no hotel

## 7. Opponent Complete Set Highlighting

**Fix in `src/pages/Game.tsx`**:
- In opponent section, split properties into two groups: complete sets first with gold highlight/glow, then in-progress sets
- Complete sets get `ring-2 ring-yellow-400 bg-yellow-50/80 shadow-lg` styling
- Add "✨ Complete" label

## Files to Edit

| File | Changes |
|------|---------|
| `src/lib/gameEngine.ts` | `payWithCards` routes properties to property pile; `playActionCard` House/Hotel don't go to discard pile, card goes onto set |
| `src/components/game/TargetSelector.tsx` | Add `currentPlayerBoard` prop; filter rent colors to owned properties; filter House/Hotel to valid sets |
| `src/pages/Game.tsx` | Rent gate check; expandable opponents; full-size property cards; celebration overlay; House/Hotel gates; complete set highlighting |

