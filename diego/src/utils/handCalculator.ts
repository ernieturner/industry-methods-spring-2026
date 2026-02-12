// src/utils/handCalculator.ts
import type { Card, Hand } from '../utils';

export const calculateHandScore = (cards: Card[]): Hand => {
  let score = 0;
  let numAces = 0;
  let isSoft = false;

  for (const card of cards) {
    if (card.rank === 'Ace') {
      numAces++;
      score += 11; // Initially count Ace as 11
    } else {
      score += card.value;
    }
  }

  // Adjust for Aces if score exceeds 21
  while (score > 21 && numAces > 0) {
    score -= 10; // Change Ace from 11 to 1
    numAces--;
    isSoft = false; // No longer soft if an Ace was busted down
  }

  if (numAces > 0 && score <= 21) {
    // If there's still an Ace counted as 11 without busting
    isSoft = true;
  }

  return { cards, score, isSoft };
};
