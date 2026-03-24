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
  properties: Record<PropertyColor, GameCard[]>; // played properties grouped by color
  bank: GameCard[]; // money cards in bank
  hasHouse: Record<PropertyColor, boolean>;
  hasHotel: Record<PropertyColor, boolean>;
}

export interface PublicGameState {
  roomId: string;
  deck: GameCard[]; // only host should see full deck; clients see count
  discardPile: GameCard[];
  boards: Record<string, PlayerBoard>; // keyed by playerId
  currentPlayerIndex: number;
  playerOrder: string[]; // player IDs in turn order
  cardsPlayedThisTurn: number;
  phase: GamePhase;
  pendingAction: PendingAction | null;
  winner: string | null;
  handCounts: Record<string, number>; // for opponent hand count display
}

export type GamePhase =
  | 'waiting'
  | 'drawing'
  | 'playing'
  | 'discard'
  | 'responding' // waiting for target to respond to action
  | 'paying'     // target choosing payment
  | 'finished';

export interface PendingAction {
  type: string;
  sourcePlayerId: string;
  targetPlayerIds: string[];
  amountOwed?: number;
  respondedPlayers: string[];
  cardPlayed: GameCard;
  doubleRent?: boolean;
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

  // If deck is empty, shuffle discard pile
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

  // Check win condition
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
  targetColor?: PropertyColor
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
      // Draw 2 extra cards
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
        },
      };
      return { state: newState, hand: newHand };
    }

    case 'Sly Deal': {
      if (!targetPlayerId) return null;
      newState = {
        ...newState,
        phase: 'responding',
        pendingAction: {
          type: 'sly_deal',
          sourcePlayerId: playerId,
          targetPlayerIds: [targetPlayerId],
          respondedPlayers: [],
          cardPlayed: card,
        },
      };
      return { state: newState, hand: newHand };
    }

    case 'Forced Deal': {
      if (!targetPlayerId) return null;
      newState = {
        ...newState,
        phase: 'responding',
        pendingAction: {
          type: 'forced_deal',
          sourcePlayerId: playerId,
          targetPlayerIds: [targetPlayerId],
          respondedPlayers: [],
          cardPlayed: card,
        },
      };
      return { state: newState, hand: newHand };
    }

    case 'Rent':
    case 'Wild Rent': {
      if (!targetColor) return null;
      const rentAmount = calculateRent(state.boards[playerId], targetColor);
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
      // This should be played with a rent card — handled in UI
      return { state: newState, hand: newHand };
    }

    default:
      return { state: newState, hand: newHand };
  }
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
    // Done discarding — end the turn and move to next player
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

  // Still need to discard more
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

  // Remove bank cards
  for (const uid of cardUids) {
    const idx = newPayerBoard.bank.findIndex(c => c.uid === uid);
    if (idx !== -1) {
      payments.push(newPayerBoard.bank[idx]);
      newPayerBoard.bank = newPayerBoard.bank.filter((_, i) => i !== idx);
    }
  }

  // Remove property cards
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

  // Add to collector's bank
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
