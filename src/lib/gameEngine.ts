import {
  type GameCard,
  type PropertyColor,
  buildDeck,
  shuffleDeck,
  PROPERTY_SETS,
  COMPLETE_SETS_TO_WIN,
  CARDS_PER_TURN,
  INITIAL_HAND_SIZE,
  DRAW_PER_TURN,
  MAX_HAND_SIZE,
} from '@/data/cards';

// ═══════════════════════════════════════════
// GAME STATE TYPES
// ═══════════════════════════════════════════

export interface PlayerBoard {
  properties: Record<PropertyColor, GameCard[]>;
  bank: GameCard[];
  hasHouse: Record<PropertyColor, boolean>;
  hasHotel: Record<PropertyColor, boolean>;
}

export interface PublicGameState {
  roomId: string;
  deck: GameCard[];
  discardPile: GameCard[];
  boards: Record<string, PlayerBoard>;
  currentPlayerIndex: number;
  playerOrder: string[];
  cardsPlayedThisTurn: number;
  phase: GamePhase;
  pendingAction: PendingAction | null;
  winner: string | null;
  handCounts: Record<string, number>;
}

export type GamePhase =
  | 'waiting'
  | 'drawing'
  | 'playing'
  | 'discard'
  | 'responding'
  | 'paying'
  | 'finished';

export interface PendingAction {
  type: string;
  sourcePlayerId: string;
  targetPlayerIds: string[];
  amountOwed?: number;
  respondedPlayers: string[];
  cardPlayed: GameCard;
  doubleRent?: boolean;
  targetColor?: PropertyColor;
  targetCardUid?: string;
  sourceCardUid?: string;
}

// ═══════════════════════════════════════════
// INITIALIZATION
// ═══════════════════════════════════════════

export function createEmptyBoard(): PlayerBoard {
  return {
    properties: {
      'brown': [], 'light-blue': [], 'magenta': [], 'orange': [],
      'red': [], 'yellow': [], 'green': [], 'dark-blue': [],
      'railroad': [], 'utility': [],
    },
    bank: [],
    hasHouse: {} as Record<PropertyColor, boolean>,
    hasHotel: {} as Record<PropertyColor, boolean>,
  };
}

export function initializeGame(playerIds: string[]): {
  gameState: PublicGameState;
  hands: Record<string, GameCard[]>;
} {
  const deck = shuffleDeck(buildDeck());
  const hands: Record<string, GameCard[]> = {};
  const boards: Record<string, PlayerBoard> = {};
  const handCounts: Record<string, number> = {};

  let deckIndex = 0;
  for (const pid of playerIds) {
    hands[pid] = deck.slice(deckIndex, deckIndex + INITIAL_HAND_SIZE);
    deckIndex += INITIAL_HAND_SIZE;
    boards[pid] = createEmptyBoard();
    handCounts[pid] = INITIAL_HAND_SIZE;
  }

  return {
    gameState: {
      roomId: '',
      deck: deck.slice(deckIndex),
      discardPile: [],
      boards,
      currentPlayerIndex: 0,
      playerOrder: playerIds,
      cardsPlayedThisTurn: 0,
      phase: 'drawing',
      pendingAction: null,
      winner: null,
      handCounts,
    },
    hands,
  };
}

// ═══════════════════════════════════════════
// TURN ACTIONS
// ═══════════════════════════════════════════

export function getCurrentPlayerId(state: PublicGameState): string {
  return state.playerOrder[state.currentPlayerIndex];
}

export function drawCards(
  state: PublicGameState,
  hand: GameCard[]
): { state: PublicGameState; hand: GameCard[]; drawnCards: GameCard[] } {
  const drawCount = hand.length === 0 ? 5 : DRAW_PER_TURN;
  const drawn = state.deck.slice(0, drawCount);
  const newDeck = state.deck.slice(drawCount);

  if (newDeck.length === 0 && state.discardPile.length > 0) {
    const reshuffled = shuffleDeck([...state.discardPile]);
    return {
      state: {
        ...state,
        deck: reshuffled,
        discardPile: [],
        phase: 'playing',
        handCounts: { ...state.handCounts, [getCurrentPlayerId(state)]: hand.length + drawn.length },
      },
      hand: [...hand, ...drawn],
      drawnCards: drawn,
    };
  }

  return {
    state: {
      ...state,
      deck: newDeck,
      phase: 'playing',
      handCounts: { ...state.handCounts, [getCurrentPlayerId(state)]: hand.length + drawn.length },
    },
    hand: [...hand, ...drawn],
    drawnCards: drawn,
  };
}

export function playCardAsProperty(
  state: PublicGameState,
  hand: GameCard[],
  cardUid: string,
  color: PropertyColor
): { state: PublicGameState; hand: GameCard[] } | null {
  const playerId = getCurrentPlayerId(state);
  const cardIndex = hand.findIndex(c => c.uid === cardUid);
  if (cardIndex === -1 || state.cardsPlayedThisTurn >= CARDS_PER_TURN) return null;

  const card = hand[cardIndex];
  if (card.type !== 'property' && card.type !== 'wild_property') return null;

  const newHand = hand.filter((_, i) => i !== cardIndex);
  const newBoard = { ...state.boards[playerId] };
  const playedCard = card.type === 'wild_property' ? { ...card, chosenColor: color } : card;
  const targetColor = card.type === 'wild_property' ? color : card.color!;

  newBoard.properties = {
    ...newBoard.properties,
    [targetColor]: [...newBoard.properties[targetColor], playedCard],
  };

  const newState: PublicGameState = {
    ...state,
    boards: { ...state.boards, [playerId]: newBoard },
    cardsPlayedThisTurn: state.cardsPlayedThisTurn + 1,
    handCounts: { ...state.handCounts, [playerId]: newHand.length },
  };

  const completeSets = countCompleteSets(newBoard);
  if (completeSets >= COMPLETE_SETS_TO_WIN) {
    newState.winner = playerId;
    newState.phase = 'finished';
  }

  return { state: newState, hand: newHand };
}

export function playCardAsMoney(
  state: PublicGameState,
  hand: GameCard[],
  cardUid: string
): { state: PublicGameState; hand: GameCard[] } | null {
  const playerId = getCurrentPlayerId(state);
  const cardIndex = hand.findIndex(c => c.uid === cardUid);
  if (cardIndex === -1 || state.cardsPlayedThisTurn >= CARDS_PER_TURN) return null;

  const card = hand[cardIndex];
  const newHand = hand.filter((_, i) => i !== cardIndex);
  const newBoard = { ...state.boards[playerId] };
  newBoard.bank = [...newBoard.bank, card];

  return {
    state: {
      ...state,
      boards: { ...state.boards, [playerId]: newBoard },
      cardsPlayedThisTurn: state.cardsPlayedThisTurn + 1,
      handCounts: { ...state.handCounts, [playerId]: newHand.length },
    },
    hand: newHand,
  };
}

export function playActionCard(
  state: PublicGameState,
  hand: GameCard[],
  cardUid: string,
  targetPlayerId?: string,
  targetColor?: PropertyColor,
  targetCardUid?: string,
  sourceCardUid?: string,
  doubleRent?: boolean
): { state: PublicGameState; hand: GameCard[] } | null {
  const playerId = getCurrentPlayerId(state);
  const cardIndex = hand.findIndex(c => c.uid === cardUid);
  if (cardIndex === -1 || state.cardsPlayedThisTurn >= CARDS_PER_TURN) return null;

  const card = hand[cardIndex];
  if (card.type !== 'action' && card.type !== 'rent') return null;

  const newHand = hand.filter((_, i) => i !== cardIndex);
  let newState: PublicGameState = {
    ...state,
    discardPile: [...state.discardPile, card],
    cardsPlayedThisTurn: state.cardsPlayedThisTurn + 1,
    handCounts: { ...state.handCounts, [playerId]: newHand.length },
  };

  switch (card.name) {
    case 'Pass Go': {
      const drawn = newState.deck.slice(0, 2);
      newState = {
        ...newState,
        deck: newState.deck.slice(2),
        handCounts: { ...newState.handCounts, [playerId]: newHand.length + drawn.length },
      };
      return { state: newState, hand: [...newHand, ...drawn] };
    }

    case 'Debt Collector': {
      if (!targetPlayerId) return null;
      newState = {
        ...newState,
        phase: 'responding',
        pendingAction: {
          type: 'debt_collector',
          sourcePlayerId: playerId,
          targetPlayerIds: [targetPlayerId],
          amountOwed: 5,
          respondedPlayers: [],
          cardPlayed: card,
        },
      };
      return { state: newState, hand: newHand };
    }

    case "It's Your Birthday": {
      const targets = state.playerOrder.filter(id => id !== playerId);
      newState = {
        ...newState,
        phase: 'responding',
        pendingAction: {
          type: 'birthday',
          sourcePlayerId: playerId,
          targetPlayerIds: targets,
          amountOwed: 2,
          respondedPlayers: [],
          cardPlayed: card,
        },
      };
      return { state: newState, hand: newHand };
    }

    case 'Deal Breaker': {
      if (!targetPlayerId || !targetColor) return null;
      newState = {
        ...newState,
        phase: 'responding',
        pendingAction: {
          type: 'deal_breaker',
          sourcePlayerId: playerId,
          targetPlayerIds: [targetPlayerId],
          respondedPlayers: [],
          cardPlayed: card,
          targetColor,
        },
      };
      return { state: newState, hand: newHand };
    }

    case 'Sly Deal': {
      if (!targetPlayerId || !targetCardUid) return null;
      newState = {
        ...newState,
        phase: 'responding',
        pendingAction: {
          type: 'sly_deal',
          sourcePlayerId: playerId,
          targetPlayerIds: [targetPlayerId],
          respondedPlayers: [],
          cardPlayed: card,
          targetCardUid,
        },
      };
      return { state: newState, hand: newHand };
    }

    case 'Forced Deal': {
      if (!targetPlayerId || !targetCardUid || !sourceCardUid) return null;
      newState = {
        ...newState,
        phase: 'responding',
        pendingAction: {
          type: 'forced_deal',
          sourcePlayerId: playerId,
          targetPlayerIds: [targetPlayerId],
          respondedPlayers: [],
          cardPlayed: card,
          targetCardUid,
          sourceCardUid,
        },
      };
      return { state: newState, hand: newHand };
    }

    case 'Rent':
    case 'Wild Rent': {
      if (!targetColor) return null;
      let rentAmount = calculateRent(state.boards[playerId], targetColor);
      if (doubleRent) rentAmount *= 2;
      const targets = card.name === 'Wild Rent' && targetPlayerId
        ? [targetPlayerId]
        : state.playerOrder.filter(id => id !== playerId);

      newState = {
        ...newState,
        phase: 'responding',
        pendingAction: {
          type: 'rent',
          sourcePlayerId: playerId,
          targetPlayerIds: targets,
          amountOwed: rentAmount,
          respondedPlayers: [],
          cardPlayed: card,
          doubleRent,
          targetColor,
        },
      };
      return { state: newState, hand: newHand };
    }

    case 'House': {
      if (!targetColor) return null;
      const board = state.boards[playerId];
      const setSize = PROPERTY_SETS[targetColor].size;
      if (board.properties[targetColor].length < setSize) return null;

      const newBoard = { ...board, hasHouse: { ...board.hasHouse, [targetColor]: true } };
      newState = { ...newState, boards: { ...newState.boards, [playerId]: newBoard } };
      return { state: newState, hand: newHand };
    }

    case 'Hotel': {
      if (!targetColor) return null;
      const board = state.boards[playerId];
      if (!board.hasHouse[targetColor]) return null;

      const newBoard = { ...board, hasHotel: { ...board.hasHotel, [targetColor]: true } };
      newState = { ...newState, boards: { ...newState.boards, [playerId]: newBoard } };
      return { state: newState, hand: newHand };
    }

    case 'Double The Rent': {
      // Handled as combo in Game.tsx - just discard
      return { state: newState, hand: newHand };
    }

    default:
      return { state: newState, hand: newHand };
  }
}

// ═══════════════════════════════════════════
// STEAL / TRANSFER RESOLUTION
// ═══════════════════════════════════════════

/** Find which color group a card belongs to on a board */
function findCardColor(board: PlayerBoard, cardUid: string): PropertyColor | null {
  for (const color of Object.keys(board.properties) as PropertyColor[]) {
    if (board.properties[color].some(c => c.uid === cardUid)) return color;
  }
  return null;
}

/** Remove a single property card from a board, returns the card or null */
function removePropertyCard(board: PlayerBoard, cardUid: string): { board: PlayerBoard; card: GameCard | null; color: PropertyColor | null } {
  const color = findCardColor(board, cardUid);
  if (!color) return { board, card: null, color: null };
  const card = board.properties[color].find(c => c.uid === cardUid) || null;
  return {
    board: {
      ...board,
      properties: {
        ...board.properties,
        [color]: board.properties[color].filter(c => c.uid !== cardUid),
      },
    },
    card,
    color,
  };
}

/** Add a property card to a board under the given color */
function addPropertyCard(board: PlayerBoard, card: GameCard, color: PropertyColor): PlayerBoard {
  return {
    ...board,
    properties: {
      ...board.properties,
      [color]: [...board.properties[color], card],
    },
  };
}

export function resolveStealAction(
  state: PublicGameState,
  pending: PendingAction,
  targetId: string
): PublicGameState {
  const sourceId = pending.sourcePlayerId;
  let sourceBoard = { ...state.boards[sourceId] };
  let targetBoard = { ...state.boards[targetId] };

  switch (pending.type) {
    case 'sly_deal': {
      if (!pending.targetCardUid) break;
      const removed = removePropertyCard(targetBoard, pending.targetCardUid);
      if (!removed.card || !removed.color) break;
      targetBoard = removed.board;
      const destColor = removed.card.chosenColor || removed.card.color || removed.color;
      sourceBoard = addPropertyCard(sourceBoard, removed.card, destColor);
      break;
    }

    case 'forced_deal': {
      if (!pending.targetCardUid || !pending.sourceCardUid) break;
      // Remove target's card
      const removedTarget = removePropertyCard(targetBoard, pending.targetCardUid);
      if (!removedTarget.card || !removedTarget.color) break;
      targetBoard = removedTarget.board;
      // Remove source's card
      const removedSource = removePropertyCard(sourceBoard, pending.sourceCardUid);
      if (!removedSource.card || !removedSource.color) break;
      sourceBoard = removedSource.board;
      // Swap
      const targetDestColor = removedTarget.card.chosenColor || removedTarget.card.color || removedTarget.color;
      const sourceDestColor = removedSource.card.chosenColor || removedSource.card.color || removedSource.color;
      sourceBoard = addPropertyCard(sourceBoard, removedTarget.card, targetDestColor);
      targetBoard = addPropertyCard(targetBoard, removedSource.card, sourceDestColor);
      break;
    }

    case 'deal_breaker': {
      if (!pending.targetColor) break;
      const color = pending.targetColor;
      const stolenCards = [...targetBoard.properties[color]];
      if (stolenCards.length === 0) break;
      targetBoard = {
        ...targetBoard,
        properties: { ...targetBoard.properties, [color]: [] },
        hasHouse: { ...targetBoard.hasHouse, [color]: false },
        hasHotel: { ...targetBoard.hasHotel, [color]: false },
      };
      sourceBoard = {
        ...sourceBoard,
        properties: {
          ...sourceBoard.properties,
          [color]: [...sourceBoard.properties[color], ...stolenCards],
        },
        hasHouse: { ...sourceBoard.hasHouse, [color]: targetBoard.hasHouse[color] || false },
        hasHotel: { ...sourceBoard.hasHotel, [color]: targetBoard.hasHotel[color] || false },
      };
      break;
    }
  }

  return {
    ...state,
    boards: {
      ...state.boards,
      [sourceId]: sourceBoard,
      [targetId]: targetBoard,
    },
  };
}

// ═══════════════════════════════════════════
// UTILITY FUNCTIONS
// ═══════════════════════════════════════════

export function calculateRent(board: PlayerBoard, color: PropertyColor): number {
  const propCount = board.properties[color].length;
  if (propCount === 0) return 0;

  const rentTable = PROPERTY_SETS[color].rent;
  let rent = rentTable[propCount] || 0;

  if (board.hasHouse[color]) rent += 3;
  if (board.hasHotel[color]) rent += 4;

  return rent;
}

export function countCompleteSets(board: PlayerBoard): number {
  let count = 0;
  for (const color of Object.keys(board.properties) as PropertyColor[]) {
    const setSize = PROPERTY_SETS[color].size;
    if (board.properties[color].length >= setSize) {
      count++;
    }
  }
  return count;
}

export function getBankTotal(board: PlayerBoard): number {
  return board.bank.reduce((sum, card) => sum + card.value, 0);
}

export function endTurn(state: PublicGameState): PublicGameState {
  const nextIndex = (state.currentPlayerIndex + 1) % state.playerOrder.length;
  return {
    ...state,
    currentPlayerIndex: nextIndex,
    cardsPlayedThisTurn: 0,
    phase: 'drawing',
    pendingAction: null,
  };
}

export function discardCards(
  state: PublicGameState,
  hand: GameCard[],
  cardUids: string[]
): { state: PublicGameState; hand: GameCard[] } {
  const playerId = getCurrentPlayerId(state);
  const discarded = hand.filter(c => cardUids.includes(c.uid));
  const newHand = hand.filter(c => !cardUids.includes(c.uid));

  if (newHand.length <= MAX_HAND_SIZE) {
    const nextIndex = (state.currentPlayerIndex + 1) % state.playerOrder.length;
    return {
      state: {
        ...state,
        discardPile: [...state.discardPile, ...discarded],
        handCounts: { ...state.handCounts, [playerId]: newHand.length },
        currentPlayerIndex: nextIndex,
        cardsPlayedThisTurn: 0,
        phase: 'drawing',
        pendingAction: null,
      },
      hand: newHand,
    };
  }

  return {
    state: {
      ...state,
      discardPile: [...state.discardPile, ...discarded],
      handCounts: { ...state.handCounts, [playerId]: newHand.length },
      phase: 'discard',
    },
    hand: newHand,
  };
}

export function needsDiscard(hand: GameCard[]): boolean {
  return hand.length > MAX_HAND_SIZE;
}

export function payWithCards(
  state: PublicGameState,
  payerBoard: PlayerBoard,
  collectorId: string,
  cardUids: string[],
  propertyCards: { uid: string; color: PropertyColor }[]
): { state: PublicGameState } {
  let newPayerBoard = { ...payerBoard };
  const payments: GameCard[] = [];

  for (const uid of cardUids) {
    const idx = newPayerBoard.bank.findIndex(c => c.uid === uid);
    if (idx !== -1) {
      payments.push(newPayerBoard.bank[idx]);
      newPayerBoard.bank = newPayerBoard.bank.filter((_, i) => i !== idx);
    }
  }

  for (const { uid, color } of propertyCards) {
    const idx = newPayerBoard.properties[color].findIndex(c => c.uid === uid);
    if (idx !== -1) {
      payments.push(newPayerBoard.properties[color][idx]);
      newPayerBoard.properties = {
        ...newPayerBoard.properties,
        [color]: newPayerBoard.properties[color].filter((_, i) => i !== idx),
      };
    }
  }

  const collectorBoard = { ...state.boards[collectorId] };
  collectorBoard.bank = [...collectorBoard.bank, ...payments];

  const payerId = Object.keys(state.boards).find(
    id => state.boards[id] === payerBoard
  )!;

  return {
    state: {
      ...state,
      boards: {
        ...state.boards,
        [payerId]: newPayerBoard,
        [collectorId]: collectorBoard,
      },
    },
  };
}

/** Check if a color set is complete for a given board */
export function isSetComplete(board: PlayerBoard, color: PropertyColor): boolean {
  return board.properties[color].length >= PROPERTY_SETS[color].size;
}

/** Get all non-complete-set property cards from a board (for Sly Deal targeting) */
export function getStealableProperties(board: PlayerBoard): { card: GameCard; color: PropertyColor }[] {
  const result: { card: GameCard; color: PropertyColor }[] = [];
  for (const color of Object.keys(board.properties) as PropertyColor[]) {
    if (!isSetComplete(board, color)) {
      for (const card of board.properties[color]) {
        result.push({ card, color });
      }
    }
  }
  return result;
}

/** Get complete set colors from a board (for Deal Breaker targeting) */
export function getCompleteSetColors(board: PlayerBoard): PropertyColor[] {
  return (Object.keys(board.properties) as PropertyColor[]).filter(
    color => isSetComplete(board, color)
  );
}
