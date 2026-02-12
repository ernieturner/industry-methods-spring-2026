// src/utils/blackjackTypes.ts

type Suit = 'Hearts' | 'Diamonds' | 'Clubs' | 'Spades';

type Rank =
  | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10'
  | 'Jack' | 'Queen' | 'King' | 'Ace';

type Card = {
  suit: Suit;
  rank: Rank;
  value: number; // Numeric value of the card for scoring
};

interface Hand {
  cards: Card[];
  score: number;
  isSoft: boolean; // True if the hand contains an Ace counted as 11
}

export { Suit, Rank, Card, Hand };
export const __forceRuntimeExport = true;
