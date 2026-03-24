

# Redesign Card Components + Chat Repositioning + Hand Size

## Summary
Redesign all 5 card components to match the real Monopoly Deal card photos. Remove the `small` prop distinction — all cards render with full details at every size. Move chat button to top bar. Enlarge hand section.

## Card Design Changes (from PDF reference)

### PropertyCard
- Color header band with bold white property name (larger text)
- Value circle (M + number) overlapping header/body border on the left
- Inner bordered area: two columns — "PROPERTIES OWNED" with stacked card icons (cards have colored tops matching property color, numbered), and "RENT" with large bold M values
- "COMPLETE SET" label under the last row with sparkle effect
- Card icons: rounded rectangles with colored header strip and number inside, stacked with rotation for multi-card rows
- Remove `small` conditional — always render the full rent table. Instead, scale the entire card using CSS `transform: scale()` when a smaller display is needed

### MoneyCard  
- Keep current layout mostly, but always show MONOPOLY text and bottom-right faded denomination
- Add subtle chevron/zigzag background pattern via CSS
- Remove `small` conditional rendering — just use CSS scale

### ActionCard
- Larger value circle and ACTION banner in top area
- Large center circle with card name in bold uppercase (bigger text)
- Description text below the inner bordered area (not inside it)
- Always show emoji and description regardless of size
- Remove `small` conditional

### RentCard
- Same structure but always show color names and description
- Remove `small` conditional

### WildPropertyCard
- Two-color wild: show both rent tables always
- Rainbow: show all color dots always  
- Remove `small` conditional

### Scaling Strategy
Instead of `small` prop hiding content, introduce a `scale` approach:
- Define one canonical card size (e.g., `w-36 h-52`)
- When `small` is true, wrap in a container with `transform: scale(0.55)` and adjust margins
- This preserves ALL details at every size — just smaller

## Chat Repositioning
- **Desktop**: Move chat to top bar area — add a `MessageCircle` icon button beside the turn badge. When clicked, open a sidebar panel on the right (300px wide), pushing content. Use `hidden md:flex` for the sidebar approach.
- **Mobile**: Keep current behavior — floating button opens bottom sheet. But move the button to the top bar instead of bottom-right.
- Update `GameChat` component to accept a `mode` prop: `'sidebar' | 'floating'`

## Hand Section
- Increase `max-h-[25vh]` to `max-h-[30vh]` on mobile, `max-h-[35vh]` stays on desktop  
- Remove `small` from hand cards — render full-detail cards at scaled-down size
- Add slightly more padding

## Files to Edit

| File | Changes |
|------|---------|
| `src/components/game/cards/PropertyCard.tsx` | Remove small conditional, always render rent table, use CSS scale wrapper |
| `src/components/game/cards/MoneyCard.tsx` | Remove small conditional, always show MONOPOLY + bottom denomination |
| `src/components/game/cards/ActionCard.tsx` | Remove small conditional, always show emoji + description |
| `src/components/game/cards/RentCard.tsx` | Remove small conditional, always show color text + description |
| `src/components/game/cards/WildPropertyCard.tsx` | Remove small conditional, always show rent tables/color dots |
| `src/components/game/cards/GameCardComponent.tsx` | Add scale wrapper: when `small` is true, render card at full size inside a `transform: scale(0.55)` container with fixed outer dimensions |
| `src/components/game/GameChat.tsx` | Accept `variant` prop for sidebar vs floating mode |
| `src/pages/Game.tsx` | Move chat button to top bar, enlarge hand area, remove `small` from hand cards (GameCardComponent handles scaling) |

