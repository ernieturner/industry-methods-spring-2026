// src/utils/probabilityCalculator.ts
import type { Card, Hand, Rank } from '../utils';
import { calculateHandScore } from '../utils';
// Note: createDeck and shuffleDeck are not directly imported here,
// as the simulation will build its own small decks from `remainingDeck`
// or operate on the provided deck directly.

// --- Helper Functions for Probability Simulation ---

/**
 * Calculates Expected Monetary Value (EV) for an action based on win/push/loss probabilities.
 * @param probabilities Object with win, push, loss probabilities (decimal).
 * @param currentBet The current bet placed by the player.
 * @param multiplier For double down, this is 2, for others typically 1.
 * @returns Monetary EV.
 */
const calculateMonetaryEV = (probabilities: { win: number; push: number; loss: number }, currentBet: number, multiplier: number = 1): number => {
  // Payout for Win: currentBet (player gets bet back + 1x bet amount)
  // Payout for Push: 0 (player gets bet back)
  // Payout for Loss: -currentBet (player loses bet)
  const ev = (probabilities.win * currentBet * multiplier) + (probabilities.push * 0) + (probabilities.loss * -currentBet * multiplier);
  return ev;
};

/**
 * Simulates dealer's play from a given hand (upcard and hidden card) and remaining deck.
 * Returns win, push, and loss probabilities from the player's perspective if player stands.
 * This is a simplified Monte Carlo simulation.
 * @param playerHand The player's current hand.
 * @param dealerUpCard The dealer's known face-up card.
 * @param remainingDeck The current deck (cards not yet seen).
 * @param simulations Number of mini-simulations
 * @returns An object with win, push, and loss probabilities as decimals (0-1).
 */
const simulateDealerOutcomes = (playerHand: Hand, dealerUpCard: Card, remainingDeck: Card[], simulations = 2000): { win: number; push: number; loss: number } => {
  if (playerHand.score > 21) return { win: 0, push: 0, loss: 1 }; // Player already busted

  let totalWins = 0;
  let totalPushes = 0;
  let totalLosses = 0;

  // Filter out playerHand cards and dealerUpCard from the deck for simulation
  const availableSimDeck = remainingDeck.filter(card => 
    !playerHand.cards.some(pc => pc.suit === card.suit && pc.rank === card.rank) &&
    !(dealerUpCard.suit === card.suit && dealerUpCard.rank === card.rank)
  );

  if (availableSimDeck.length < 2) { // Need at least 2 cards for dealer's hidden card + possible hit
      return { win: 0, push: 0, loss: 1 }; // Not enough cards to simulate meaningfully
  }

  // To avoid shuffling the entire deck for every simulation, we can just pick random cards
  // but ensure we don't pick cards that are already known (player hand, dealer upcard).
  // A true shuffle is more robust but also slower. This is a trade-off for client-side performance.

  for (let i = 0; i < simulations; i++) {
    const simDeckForThisRun = [...availableSimDeck]; // Copy for this simulation run
    let simDealerCards = [dealerUpCard]; // Dealer's known cards
    
    // Randomly pick a hidden card for the dealer
    const hiddenCardIndex = Math.floor(Math.random() * simDeckForThisRun.length);
    const dealerHiddenCard = simDeckForThisRun.splice(hiddenCardIndex, 1)[0];
    if (!dealerHiddenCard) continue; // Should not happen if deck has enough cards

    simDealerCards.push(dealerHiddenCard);
    let simDealerHand = calculateHandScore(simDealerCards);

    // Dealer hits on 16 or less, stands on 17 or more
    while (simDealerHand.score < 17 && simDeckForThisRun.length > 0) {
      const drawnCardIndex = Math.floor(Math.random() * simDeckForThisRun.length);
      const drawnCard = simDeckForThisRun.splice(drawnCardIndex, 1)[0];
      if (!drawnCard) break; // Should not happen
      simDealerCards.push(drawnCard);
      simDealerHand = calculateHandScore(simDealerCards);
    }

    // Compare player's hand to simulated dealer's hand
    if (simDealerHand.score > 21) {
      totalWins++; // Dealer busts, player wins
    } else if (playerHand.score > simDealerHand.score) {
      totalWins++;
    } else if (playerHand.score < simDealerHand.score) {
      totalLosses++;
    } else {
      totalPushes++;
    }
  }

  const totalOutcomes = totalWins + totalPushes + totalLosses;
  if (totalOutcomes === 0) return { win: 0, push: 0, loss: 0 }; // Avoid division by zero

  return {
    win: totalWins / totalOutcomes,
    push: totalPushes / totalOutcomes,
    loss: totalLosses / totalOutcomes,
  };
};

/**
 * Estimates the probability of busting (going over 21) if the player hits.
 * @param playerHand The player's current hand.
 * @param deck The current deck (remaining cards).
 * @returns Bust probability as a percentage.
 */
export const estimateBustProbabilityOnHit = (playerHand: Hand, deck: Card[]): number => {
  if (playerHand.score >= 21) return 100;

  let bustCount = 0;
  let totalPossibleCards = 0;

  if (deck.length === 0) return 0;

  for (const card of deck) {
    const newHand = calculateHandScore([...playerHand.cards, card]);
    if (newHand.score > 21) {
      bustCount++;
    }
    totalPossibleCards++;
  }

  return (bustCount / totalPossibleCards) * 100;
};

/**
 * Estimates win probability for standing, based on simulating dealer's play.
 * @param playerHand The player's current hand.
 * @param dealerUpCard The dealer's known face-up card.
 * @param remainingDeck The current deck (cards not yet seen).
 * @returns Win probability as a percentage.
 */
export const estimateWinProbabilityOnStand = (playerHand: Hand, dealerUpCard: Card, remainingDeck: Card[]): number => {
  const outcomes = simulateDealerOutcomes(playerHand, dealerUpCard, remainingDeck);
  return outcomes.win * 100;
};


/**
 * Estimates Expected Monetary Value (EV) for hitting.
 * This performs a limited lookahead by simulating the next card and then standing.
 * @param playerHand The player's current hand.
 * @param dealerUpCard The dealer's known face-up card.
 * @param deck The current deck (cards not yet seen).
 * @param currentBet The current bet placed by the player.
 * @returns Monetary EV.
 */
export const estimateEVOnHit = (playerHand: Hand, dealerUpCard: Card, deck: Card[], currentBet: number): number => {
  if (playerHand.score >= 21) return -currentBet; // Already busted or 21, hitting is bad

  let totalExpectedValue = 0;
  let possibleOutcomesCount = 0;

  if (deck.length === 0) return 0; // Cannot hit if deck is empty

  // Filter out known cards from the deck for simulation of next draw
  const availableNextCards = deck.filter(c => 
    !playerHand.cards.some(pc => pc.suit === c.suit && pc.rank === c.rank) &&
    !(dealerUpCard.suit === c.suit && dealerUpCard.rank === c.rank)
  );


  for (const nextCard of availableNextCards) {
    const newPlayerHand = calculateHandScore([...playerHand.cards, nextCard]);
    possibleOutcomesCount++;

    const deckAfterNextDraw = deck.filter(c => !(c.suit === nextCard.suit && c.rank === nextCard.rank));

    if (newPlayerHand.score > 21) {
      totalExpectedValue += -currentBet; // Player busts, loses bet
    } else if (newPlayerHand.score === 21) {
      // Player hits 21, assume they stand, simulate dealer
      const outcomes = simulateDealerOutcomes(newPlayerHand, dealerUpCard, deckAfterNextDraw);
      totalExpectedValue += calculateMonetaryEV(outcomes, currentBet);
    } else {
      // Player gets a new hand, assume they stand (simplified strategy)
      const outcomes = simulateDealerOutcomes(newPlayerHand, dealerUpCard, deckAfterNextDraw);
      totalExpectedValue += calculateMonetaryEV(outcomes, currentBet);
    }
  }

  return possibleOutcomesCount > 0 ? totalExpectedValue / possibleOutcomesCount : 0;
};

/**
 * Estimates Expected Monetary Value (EV) for standing.
 * @param playerHand The player's current hand.
 * @param dealerUpCard The dealer's known face-up card.
 * @param deck The current deck (cards not yet seen).
 * @param currentBet The current bet placed by the player.
 * @returns Monetary EV.
 */
export const estimateEVOnStand = (playerHand: Hand, dealerUpCard: Card, deck: Card[], currentBet: number): number => {
  const outcomes = simulateDealerOutcomes(playerHand, dealerUpCard, deck);
  return calculateMonetaryEV(outcomes, currentBet);
};


/**
 * Estimates Expected Monetary Value (EV) and Win Probability for Double Down.
 * @param playerHand The player's current hand.
 * @param dealerUpCard The dealer's known face-up card.
 * @param deck The current deck (cards not yet seen).
 * @param currentBet The current bet placed by the player.
 * @returns Object containing winProbability (percentage) and monetary EV.
 */
export const estimateDoubleDownProbabilitiesAndEV = (playerHand: Hand, dealerUpCard: Card, deck: Card[], currentBet: number): { winProbability: number; ev: number } => {
  if (playerHand.cards.length !== 2) return { winProbability: 0, ev: -currentBet }; // Can only double down on first two cards

  let totalExpectedValue = 0;
  let totalWins = 0; // For win probability
  let totalOutcomes = 0;

  if (deck.length === 0) return { winProbability: 0, ev: 0 }; // Cannot double down if deck empty

  // Filter out known cards from the deck for simulation of next draw
  const availableNextCards = deck.filter(c => 
    !playerHand.cards.some(pc => pc.suit === c.suit && pc.rank === c.rank) &&
    !(dealerUpCard.suit === c.suit && dealerUpCard.rank === c.rank)
  );

  for (const nextCard of availableNextCards) {
    const newPlayerHand = calculateHandScore([...playerHand.cards, nextCard]);
    totalOutcomes++;

    const deckAfterNextDraw = deck.filter(c => !(c.suit === nextCard.suit && c.rank === nextCard.rank));

    if (newPlayerHand.score > 21) {
      totalExpectedValue += -currentBet * 2; // Player busts, loses double bet
    } else {
      // Player gets a new hand and must stand, compare to dealer
      const outcomes = simulateDealerOutcomes(newPlayerHand, dealerUpCard, deckAfterNextDraw);
      totalExpectedValue += calculateMonetaryEV(outcomes, currentBet, 2); // Double the bet for EV calculation
      totalWins += outcomes.win; // Add win probability (decimal)
    }
  }

  return {
    winProbability: totalOutcomes > 0 ? (totalWins / totalOutcomes) * 100 : 0,
    ev: totalOutcomes > 0 ? totalExpectedValue / totalOutcomes : 0,
  };
};
