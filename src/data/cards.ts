// Monopoly Deal - Full 106 Card Deck Definition

export type CardType = 'property' | 'wild_property' | 'action' | 'money' | 'rent';

export type PropertyColor =
  | 'brown' | 'light-blue' | 'magenta' | 'orange'
  | 'red' | 'yellow' | 'green' | 'dark-blue'
  | 'railroad' | 'utility';

export interface RentTable {
  [propertyCount: number]: number;
}

export interface CardDefinition {
  id: string;
  type: CardType;
  name: string;
  value: number; // money value if played as money
  color?: PropertyColor;
  colors?: PropertyColor[]; // for wild/rent cards
  description?: string;
  rentTable?: RentTable;
  setSize?: number; // how many cards needed to complete set
  count: number; // how many copies in the deck
}

// Property set sizes and rent tables
export const PROPERTY_SETS: Record<PropertyColor, { size: number; rent: RentTable }> = {
  'brown':      { size: 2, rent: { 1: 1, 2: 2 } },
  'light-blue': { size: 3, rent: { 1: 1, 2: 2, 3: 3 } },
  'magenta':    { size: 3, rent: { 1: 1, 2: 2, 3: 4 } },
  'orange':     { size: 3, rent: { 1: 1, 2: 3, 3: 5 } },
  'red':        { size: 3, rent: { 1: 2, 2: 3, 3: 6 } },
  'yellow':     { size: 3, rent: { 1: 2, 2: 4, 3: 6 } },
  'green':      { size: 3, rent: { 1: 2, 2: 4, 3: 7 } },
  'dark-blue':  { size: 2, rent: { 1: 3, 2: 8 } },
  'railroad':   { size: 4, rent: { 1: 1, 2: 2, 3: 3, 4: 4 } },
  'utility':    { size: 2, rent: { 1: 1, 2: 2 } },
};

// Color display config
export const COLOR_CONFIG: Record<PropertyColor, { bg: string; text: string; label: string }> = {
  'brown':      { bg: 'bg-amber-800', text: 'text-white', label: 'Brown' },
  'light-blue': { bg: 'bg-sky-300', text: 'text-sky-900', label: 'Light Blue' },
  'magenta':    { bg: 'bg-fuchsia-600', text: 'text-white', label: 'Pink' },
  'orange':     { bg: 'bg-orange-500', text: 'text-white', label: 'Orange' },
  'red':        { bg: 'bg-red-600', text: 'text-white', label: 'Red' },
  'yellow':     { bg: 'bg-yellow-400', text: 'text-yellow-900', label: 'Yellow' },
  'green':      { bg: 'bg-green-600', text: 'text-white', label: 'Green' },
  'dark-blue':  { bg: 'bg-blue-800', text: 'text-white', label: 'Dark Blue' },
  'railroad':   { bg: 'bg-zinc-800', text: 'text-white', label: 'Railroad' },
  'utility':    { bg: 'bg-emerald-500', text: 'text-white', label: 'Utility' },
};

// ═══════════════════════════════════════════
// PROPERTY CARDS (28 total)
// ═══════════════════════════════════════════
export const PROPERTY_CARDS: CardDefinition[] = [
  // Brown (2)
  { id: 'prop-baltic', type: 'property', name: 'Baltic Avenue', value: 1, color: 'brown', count: 1 },
  { id: 'prop-mediterranean', type: 'property', name: 'Mediterranean Avenue', value: 1, color: 'brown', count: 1 },
  // Light Blue (3)
  { id: 'prop-connecticut', type: 'property', name: 'Connecticut Avenue', value: 1, color: 'light-blue', count: 1 },
  { id: 'prop-oriental', type: 'property', name: 'Oriental Avenue', value: 1, color: 'light-blue', count: 1 },
  { id: 'prop-vermont', type: 'property', name: 'Vermont Avenue', value: 1, color: 'light-blue', count: 1 },
  // Magenta/Pink (3)
  { id: 'prop-stcharles', type: 'property', name: 'St. Charles Place', value: 2, color: 'magenta', count: 1 },
  { id: 'prop-states', type: 'property', name: 'States Avenue', value: 2, color: 'magenta', count: 1 },
  { id: 'prop-virginia', type: 'property', name: 'Virginia Avenue', value: 2, color: 'magenta', count: 1 },
  // Orange (3)
  { id: 'prop-stjames', type: 'property', name: 'St. James Place', value: 2, color: 'orange', count: 1 },
  { id: 'prop-tennessee', type: 'property', name: 'Tennessee Avenue', value: 2, color: 'orange', count: 1 },
  { id: 'prop-newyork', type: 'property', name: 'New York Avenue', value: 2, color: 'orange', count: 1 },
  // Red (3)
  { id: 'prop-kentucky', type: 'property', name: 'Kentucky Avenue', value: 3, color: 'red', count: 1 },
  { id: 'prop-indiana', type: 'property', name: 'Indiana Avenue', value: 3, color: 'red', count: 1 },
  { id: 'prop-illinois', type: 'property', name: 'Illinois Avenue', value: 3, color: 'red', count: 1 },
  // Yellow (3)
  { id: 'prop-atlantic', type: 'property', name: 'Atlantic Avenue', value: 3, color: 'yellow', count: 1 },
  { id: 'prop-ventnor', type: 'property', name: 'Ventnor Avenue', value: 3, color: 'yellow', count: 1 },
  { id: 'prop-marvin', type: 'property', name: 'Marvin Gardens', value: 3, color: 'yellow', count: 1 },
  // Green (3)
  { id: 'prop-pacific', type: 'property', name: 'Pacific Avenue', value: 4, color: 'green', count: 1 },
  { id: 'prop-northcarolina', type: 'property', name: 'North Carolina Avenue', value: 4, color: 'green', count: 1 },
  { id: 'prop-pennsylvania', type: 'property', name: 'Pennsylvania Avenue', value: 4, color: 'green', count: 1 },
  // Dark Blue (2)
  { id: 'prop-parkplace', type: 'property', name: 'Park Place', value: 4, color: 'dark-blue', count: 1 },
  { id: 'prop-boardwalk', type: 'property', name: 'Boardwalk', value: 4, color: 'dark-blue', count: 1 },
  // Railroad (4)
  { id: 'prop-reading-rr', type: 'property', name: 'Reading Railroad', value: 2, color: 'railroad', count: 1 },
  { id: 'prop-pennsylvania-rr', type: 'property', name: 'Pennsylvania Railroad', value: 2, color: 'railroad', count: 1 },
  { id: 'prop-bo-rr', type: 'property', name: 'B&O Railroad', value: 2, color: 'railroad', count: 1 },
  { id: 'prop-shortline', type: 'property', name: 'Short Line', value: 2, color: 'railroad', count: 1 },
  // Utility (2)
  { id: 'prop-electric', type: 'property', name: 'Electric Company', value: 2, color: 'utility', count: 1 },
  { id: 'prop-water', type: 'property', name: 'Water Works', value: 2, color: 'utility', count: 1 },
];

// ═══════════════════════════════════════════
// WILD PROPERTY CARDS (11 total)
// ═══════════════════════════════════════════
export const WILD_PROPERTY_CARDS: CardDefinition[] = [
  { id: 'wild-brown-lightblue', type: 'wild_property', name: 'Wild Property', value: 1, colors: ['brown', 'light-blue'], count: 1 },
  { id: 'wild-magenta-orange', type: 'wild_property', name: 'Wild Property', value: 2, colors: ['magenta', 'orange'], count: 1 },
  { id: 'wild-lightblue-railroad', type: 'wild_property', name: 'Wild Property', value: 4, colors: ['light-blue', 'railroad'], count: 1 },
  { id: 'wild-red-yellow', type: 'wild_property', name: 'Wild Property', value: 3, colors: ['red', 'yellow'], count: 2 },
  { id: 'wild-green-railroad', type: 'wild_property', name: 'Wild Property', value: 4, colors: ['green', 'railroad'], count: 1 },
  { id: 'wild-green-darkblue', type: 'wild_property', name: 'Wild Property', value: 4, colors: ['green', 'dark-blue'], count: 1 },
  { id: 'wild-utility-railroad', type: 'wild_property', name: 'Wild Property', value: 2, colors: ['utility', 'railroad'], count: 1 },
  { id: 'wild-railroad-darkblue', type: 'wild_property', name: 'Wild Property', value: 4, colors: ['railroad', 'dark-blue'], count: 1 },
  { id: 'wild-rainbow', type: 'wild_property', name: 'Wild Property', value: 0, colors: ['brown', 'light-blue', 'magenta', 'orange', 'red', 'yellow', 'green', 'dark-blue', 'railroad', 'utility'], count: 2 },
];

// ═══════════════════════════════════════════
// ACTION CARDS (~34 total)
// ═══════════════════════════════════════════
export const ACTION_CARDS: CardDefinition[] = [
  { id: 'action-dealbreaker', type: 'action', name: 'Deal Breaker', value: 5, description: 'Steal a complete set of properties from any player.', count: 2 },
  { id: 'action-justsayno', type: 'action', name: 'Just Say No', value: 4, description: 'Use to cancel any action card played against you.', count: 3 },
  { id: 'action-slydeal', type: 'action', name: 'Sly Deal', value: 3, description: 'Steal a property from any player (not from a full set).', count: 3 },
  { id: 'action-forcedswap', type: 'action', name: 'Forced Deal', value: 3, description: 'Swap a property with any player.', count: 4 },
  { id: 'action-debtcollector', type: 'action', name: 'Debt Collector', value: 3, description: 'Force any player to pay you 5M.', count: 3 },
  { id: 'action-birthday', type: 'action', name: "It's Your Birthday", value: 2, description: 'Every player pays you 2M.', count: 3 },
  { id: 'action-passgo', type: 'action', name: 'Pass Go', value: 1, description: 'Draw 2 extra cards.', count: 10 },
  { id: 'action-house', type: 'action', name: 'House', value: 3, description: 'Add to a full set. Adds 3M to rent.', count: 3 },
  { id: 'action-hotel', type: 'action', name: 'Hotel', value: 4, description: 'Add to a full set with a House. Adds 4M to rent.', count: 3 },
  { id: 'action-doublerent', type: 'action', name: 'Double The Rent', value: 1, description: 'Play with a rent card to double the rent.', count: 2 },
];

// ═══════════════════════════════════════════
// RENT CARDS (13 total)
// ═══════════════════════════════════════════
export const RENT_CARDS: CardDefinition[] = [
  { id: 'rent-brown-lightblue', type: 'rent', name: 'Rent', value: 1, colors: ['brown', 'light-blue'], count: 2 },
  { id: 'rent-magenta-orange', type: 'rent', name: 'Rent', value: 1, colors: ['magenta', 'orange'], count: 2 },
  { id: 'rent-red-yellow', type: 'rent', name: 'Rent', value: 1, colors: ['red', 'yellow'], count: 2 },
  { id: 'rent-green-darkblue', type: 'rent', name: 'Rent', value: 1, colors: ['green', 'dark-blue'], count: 2 },
  { id: 'rent-railroad-utility', type: 'rent', name: 'Rent', value: 1, colors: ['railroad', 'utility'], count: 2 },
  { id: 'rent-wild', type: 'rent', name: 'Wild Rent', value: 3, colors: ['brown', 'light-blue', 'magenta', 'orange', 'red', 'yellow', 'green', 'dark-blue', 'railroad', 'utility'], description: 'Charge rent for any color property.', count: 3 },
];

// ═══════════════════════════════════════════
// MONEY CARDS (20 total)
// ═══════════════════════════════════════════
export const MONEY_CARDS: CardDefinition[] = [
  { id: 'money-1m', type: 'money', name: '1M', value: 1, count: 6 },
  { id: 'money-2m', type: 'money', name: '2M', value: 2, count: 5 },
  { id: 'money-3m', type: 'money', name: '3M', value: 3, count: 3 },
  { id: 'money-4m', type: 'money', name: '4M', value: 4, count: 3 },
  { id: 'money-5m', type: 'money', name: '5M', value: 5, count: 2 },
  { id: 'money-10m', type: 'money', name: '10M', value: 10, count: 1 },
];

// ═══════════════════════════════════════════
// FULL DECK BUILDER
// ═══════════════════════════════════════════
export const ALL_CARD_DEFINITIONS: CardDefinition[] = [
  ...PROPERTY_CARDS,
  ...WILD_PROPERTY_CARDS,
  ...ACTION_CARDS,
  ...RENT_CARDS,
  ...MONEY_CARDS,
];

export interface GameCard {
  uid: string; // unique instance ID (e.g. "prop-baltic-0")
  definitionId: string;
  type: CardType;
  name: string;
  value: number;
  color?: PropertyColor;
  colors?: PropertyColor[];
  description?: string;
  // For wild properties, the currently chosen color
  chosenColor?: PropertyColor;
}

export function buildDeck(): GameCard[] {
  const deck: GameCard[] = [];
  for (const def of ALL_CARD_DEFINITIONS) {
    for (let i = 0; i < def.count; i++) {
      deck.push({
        uid: `${def.id}-${i}`,
        definitionId: def.id,
        type: def.type,
        name: def.name,
        value: def.value,
        color: def.color,
        colors: def.colors,
        description: def.description,
      });
    }
  }
  return deck;
}

export function shuffleDeck(deck: GameCard[]): GameCard[] {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export const COMPLETE_SETS_TO_WIN = 3;
export const CARDS_PER_TURN = 3;
export const INITIAL_HAND_SIZE = 5;
export const DRAW_PER_TURN = 2;
export const MAX_HAND_SIZE = 7;
export const MIN_PLAYERS = 2;
export const MAX_PLAYERS = 5;
