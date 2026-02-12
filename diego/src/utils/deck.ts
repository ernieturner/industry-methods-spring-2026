// src/utils/deck.ts
import type { Card, Rank, Suit } from '../utils';

const SUITS: Suit[] = ['Hearts', 'Diamonds', 'Clubs', 'Spades'];
const RANKS: Rank[] = [
  '2', '3', '4', '5', '6', '7', '8', '9', '10',
  'Jack', 'Queen', 'King', 'Ace',
];

const getCardValue = (rank: Rank): number => {
  if (rank === 'Jack' || rank === 'Queen' || rank === 'King') {
    return 10;
  }
  if (rank === 'Ace') {
    return 11; // Ace value can be 1 or 11, handle in hand scoring
  }
  return parseInt(rank, 10);
};

export const createDeck = (numDecks: number = 1): Card[] => {
  const deck: Card[] = [];
  for (let i = 0; i < numDecks; i++) {
    for (const suit of SUITS) {
      for (const rank of RANKS) {
        deck.push({ suit, rank, value: getCardValue(rank) });
      }
    }
  }
  return deck;
};

export const shuffleDeck = (deck: Card[]): Card[] => {
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
};
