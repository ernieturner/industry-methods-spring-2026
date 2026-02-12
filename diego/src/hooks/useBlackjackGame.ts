// src/hooks/useBlackjackGame.ts
import { useState, useEffect, useCallback } from 'react';
import type { Card, Hand } from '../utils';
import {
  createDeck,
  shuffleDeck,
  calculateHandScore,
  estimateBustProbabilityOnHit,
  estimateWinProbabilityOnStand,
  estimateEVOnHit,
  estimateEVOnStand,
  estimateDoubleDownProbabilitiesAndEV,
  __forceRuntimeExport,
} from '../utils';

interface GameState {
  deck: Card[];
  playerHand: Hand;
  dealerHand: Hand;
  playerScore: number;
  dealerScore: number;
  gameOver: boolean;
  message: string;
  playerTurn: boolean;
  canDoubleDown: boolean;
  canSplit: boolean;
  numDecks: number;
  runningCount: number;

  playerChips: number;
  currentBet: number;

  hitProbability: number;
  standProbability: number;
  doubleDownProbability: number;
  hitEV: number;
  standEV: number;
  doubleDownEV: number;
}

const initialGameState: GameState = {
  deck: [],
  playerHand: { cards: [], score: 0, isSoft: false },
  dealerHand: { cards: [], score: 0, isSoft: false },
  playerScore: 0,
  dealerScore: 0,
  gameOver: true,
  message: 'Place your bet!',
  playerTurn: false,
  canDoubleDown: false,
  canSplit: false,
  numDecks: 6,
  runningCount: 0,

  playerChips: 1000,
  currentBet: 0,

  hitProbability: 0,
  standProbability: 0,
  doubleDownProbability: 0,
  hitEV: 0,
  standEV: 0,
  doubleDownEV: 0,
};

const getCardCountValue = (card: Card): number => {
  if (['10', 'Jack', 'Queen', 'King', 'Ace'].includes(card.rank)) {
    return -1;
  }
  if (['2', '3', '4', '5', '6'].includes(card.rank)) {
    return 1;
  }
  return 0;
};

const MIN_BET = 10;
const MAX_BET = 500;

const useBlackjackGame = () => {
  const [gameState, setGameState] = useState<GameState>(initialGameState);
  const [numDecksState, setNumDecksInternal] = useState(initialGameState.numDecks);

  // Moved resetShoe definition to ensure it's initialized before any calls
  const resetShoe = useCallback(() => {
    const newDeck = shuffleDeck(createDeck(numDecksState));
    setGameState(prev => ({
      ...initialGameState, // Start with initialGameState to reset game specifics
      numDecks: numDecksState, // Preserve numDecksState
      playerChips: prev.playerChips, // Explicitly preserve playerChips
      currentBet: 0, // Explicitly reset currentBet to 0 to re-enter betting phase
      deck: newDeck, // Set the new deck here
      runningCount: 0, // Reset running count
      message: 'Shoe reset. Place your bet!',
    }));
  }, [numDecksState]);


  const calculateAndSetProbabilities = useCallback((currentDeck: Card[], currentPlayerHand: Hand) => {
    // Ensure dealer has at least one card (upcard) to calculate probabilities
    if (currentPlayerHand.score === 0 || currentPlayerHand.score > 21 || gameState.dealerHand.cards.length < 1) {
      setGameState(prev => ({
        ...prev,
        hitProbability: 0,
        standProbability: 0,
        doubleDownProbability: 0,
        hitEV: 0,
        standEV: 0,
        doubleDownEV: 0,
      }));
      return;
    }

    const dealerUpCard = gameState.dealerHand.cards[0];
    const availableDeckForCalc = currentDeck.filter(card =>
      // Filter out player's current hand cards and dealer's visible card from the deck for simulation
      !currentPlayerHand.cards.some(pc => pc.suit === card.suit && pc.rank === card.rank) &&
      !gameState.dealerHand.cards.some(dc => dc.suit === card.suit && dc.rank === card.rank)
    );

    const hitProb = estimateBustProbabilityOnHit(currentPlayerHand, availableDeckForCalc);
    const standProb = estimateWinProbabilityOnStand(currentPlayerHand, dealerUpCard, availableDeckForCalc);
    const hitEv = estimateEVOnHit(currentPlayerHand, dealerUpCard, availableDeckForCalc, gameState.currentBet);
    const standEv = estimateEVOnStand(currentPlayerHand, dealerUpCard, availableDeckForCalc, gameState.currentBet);
    const { winProbability: ddProb, ev: ddEv } = estimateDoubleDownProbabilitiesAndEV(currentPlayerHand, dealerUpCard, availableDeckForCalc, gameState.currentBet);

    setGameState(prev => ({
      ...prev,
      hitProbability: ddProb, // Changed to match double down probability as per request
      standProbability: standProb,
      doubleDownProbability: ddProb,
      hitEV: hitEv,
      standEV: standEv,
      doubleDownEV: ddEv,
    }));
  }, [gameState.currentBet, gameState.dealerHand.cards, gameState.dealerHand]);


  const startGame = useCallback(() => {
    if (gameState.currentBet === 0) {
      setGameState(prev => ({ ...prev, message: 'Please place a bet first!' }));
      return;
    }
    if (gameState.playerChips < gameState.currentBet) {
      setGameState(prev => ({ ...prev, message: 'Not enough chips to cover your bet! Place a smaller bet.' }));
      return;
    }
    // Check if deck is sufficiently large for a new hand, otherwise trigger reshuffle
    if (gameState.deck.length < (numDecksState * 52 * 0.25)) { // Reshuffle when 75% of cards are used
        setGameState(prev => ({ ...prev, message: 'Shuffling the shoe... Please place your bet!' }));
        resetShoe(); // Calls resetShoe to create a new deck
        return;
    }

    let currentRunningCount = gameState.runningCount; // Start with existing running count
    let currentDeck = [...gameState.deck]; // Work with a mutable copy of the current deck

    const playerInitialCards: Card[] = [];
    const dealerInitialCards: Card[] = [];
    
    // Deal two cards to player and two to dealer
    const card1 = currentDeck.pop()!; playerInitialCards.push(card1); currentRunningCount += getCardCountValue(card1);
    const card2 = currentDeck.pop()!; dealerInitialCards.push(card2); currentRunningCount += getCardCountValue(card2);
    const card3 = currentDeck.pop()!; playerInitialCards.push(card3); currentRunningCount += getCardCountValue(card3);
    const card4 = currentDeck.pop()!; dealerInitialCards.push(card4); currentRunningCount += getCardCountValue(card4);

    const initialPlayerHand = calculateHandScore(playerInitialCards);
    const initialDealerHand = calculateHandScore(dealerInitialCards);

    let message = 'Hit or Stand?';
    let gameOver = false;
    let playerTurn = true;
    let updatedChipsAfterBet = gameState.playerChips; // Chips already deducted by bet in placeBet

    if (initialPlayerHand.score === 21) {
      updatedChipsAfterBet += gameState.currentBet * 2.5; // Blackjack pays 3:2
      message = `Blackjack! You win $${gameState.currentBet * 1.5}!`;
      gameOver = true;
      playerTurn = false;
    }

    // Single setGameState call for a consistent state update, addressing duplicate key warnings
    setGameState(prev => {
        const nextState: GameState = {
            ...initialGameState, // Start with a completely fresh, default game state structure
            numDecks: numDecksState, // Preserve the selected number of decks
            playerChips: prev.playerChips, // Explicitly carry over player's chips
            currentBet: prev.currentBet, // Explicitly carry over the current bet for the new hand
            deck: currentDeck, // Use the dynamically created currentDeck
            playerHand: initialPlayerHand,
            dealerHand: initialDealerHand,
            playerScore: initialPlayerHand.score,
            dealerScore: initialDealerHand.score,
            gameOver: gameOver,
            message: message,
            playerTurn: playerTurn,
            canDoubleDown: initialPlayerHand.cards.length === 2 && prev.playerChips >= prev.currentBet * 2,
            canSplit: initialPlayerHand.cards.length === 2 && initialPlayerHand.cards[0].rank === initialPlayerHand.cards[1].rank && prev.playerChips >= prev.currentBet * 2, // will be removed in next step
            runningCount: currentRunningCount,
        };

        // Calculate and set probabilities if game is not over and playerTurn
        if (!gameOver && playerTurn && nextState.dealerHand.cards.length > 0) { // Ensure dealer has upcard before calculating
            const dealerUpCard = nextState.dealerHand.cards[0];
            const availableDeckForCalc = currentDeck.filter(card =>
                !playerInitialCards.some(pc => pc.suit === card.suit && pc.rank === card.rank) &&
                !dealerInitialCards.some(dc => dc.suit === card.suit && dc.rank === card.rank)
            );

            const hitProb = estimateBustProbabilityOnHit(nextState.playerHand, availableDeckForCalc);
            const standProb = estimateWinProbabilityOnStand(nextState.playerHand, dealerUpCard, availableDeckForCalc);
            const hitEv = estimateEVOnHit(nextState.playerHand, dealerUpCard, availableDeckForCalc, nextState.currentBet);
            const standEv = estimateEVOnStand(nextState.playerHand, dealerUpCard, availableDeckForCalc, nextState.currentBet);
            const { winProbability: ddProb, ev: ddEv } = estimateDoubleDownProbabilitiesAndEV(nextState.playerHand, dealerUpCard, availableDeckForCalc, nextState.currentBet);

            nextState.hitProbability = ddProb; // Assign ddProb to hitProbability as per request
            nextState.standProbability = standProb;
            nextState.doubleDownProbability = ddProb;
            nextState.hitEV = hitEv;
            nextState.standEV = standEv;
            nextState.doubleDownEV = ddEv;
        }

        return nextState;
    });
  }, [numDecksState, calculateAndSetProbabilities, gameState.currentBet, gameState.playerChips, gameState.deck, gameState.runningCount, resetShoe]);


  const placeBet = useCallback((betAmount: number) => {
    setGameState(prev => {
      if (prev.playerChips < betAmount) {
        alert("Not enough chips to place that bet!");
        return prev;
      }
      if (betAmount < MIN_BET || betAmount > MAX_BET) {
        alert(`Bet must be between $${MIN_BET} and $${MAX_BET}.`);
        return prev;
      }
      return {
        ...prev,
        currentBet: betAmount,
        message: `Bet $${betAmount}. Dealing...`,
        gameOver: false, // Set to false to allow startGame useEffect to fire
        playerHand: { cards: [], score: 0, isSoft: false }, // Clear hands on bet
        dealerHand: { cards: [], score: 0, isSoft: false },
        playerChips: prev.playerChips - betAmount, // Deduct bet immediately
      };
    });
  }, []);

  useEffect(() => {
    // This useEffect auto-deals after a bet is placed and previous hand is cleared
    // Ensure playerHand and dealerHand are actually empty before calling startGame,
    // which prevents premature calls when only currentBet changes.
    if (gameState.currentBet > 0 && gameState.gameOver === false && gameState.playerHand.cards.length === 0 && gameState.dealerHand.cards.length === 0) {
      startGame();
    }
  }, [gameState.currentBet, gameState.gameOver, gameState.playerHand.cards.length, gameState.dealerHand.cards.length, startGame]);


  const setNumDecks = useCallback((newNumDecks: number) => {
    setNumDecksInternal(newNumDecks);
    setGameState(prev => ({
      ...prev, // Preserve playerChips and currentBet
      numDecks: newNumDecks,
      message: 'Number of decks changed. Place your bet!',
    }));
    resetShoe(); // Call resetShoe after setting new numDecks
  }, [resetShoe]);


  useEffect(() => {
    if (!gameState.gameOver && gameState.playerTurn) {
      calculateAndSetProbabilities(gameState.deck, gameState.playerHand);
    } else if (gameState.gameOver && gameState.currentBet === 0) {
       setGameState(prev => ({
        ...prev,
        hitProbability: 0,
        standProbability: 0,
        doubleDownProbability: 0,
        hitEV: 0,
        standEV: 0,
        doubleDownEV: 0,
      }));
    }
  }, [gameState.playerHand, gameState.deck, gameState.gameOver, gameState.playerTurn, calculateAndSetProbabilities, gameState.currentBet, gameState.dealerHand]);


  const playerHit = useCallback(() => {
    setGameState((prev) => {
      if (prev.gameOver || !prev.playerTurn) return prev;

      const newDeck = [...prev.deck];
      const newCard = newDeck.pop()!;
      const newPlayerCards = [...prev.playerHand.cards, newCard];
      const newPlayerHand = calculateHandScore(newPlayerCards);
      const newRunningCount = prev.runningCount + getCardCountValue(newCard);

      let message = prev.message;
      let gameOver = prev.gameOver;
      let playerTurn = prev.playerTurn;
      let finalPlayerChips = prev.playerChips;

      if (newPlayerHand.score > 21) {
        message = 'Player busts! You lose.';
        gameOver = true;
        playerTurn = false;
      } else if (newPlayerHand.score === 21) {
        message = '21! Waiting for dealer...';
        playerTurn = false;
      }

      return {
        ...prev,
        deck: newDeck,
        playerHand: newPlayerHand,
        playerScore: newPlayerHand.score,
        gameOver: gameOver,
        message: message,
        playerTurn: playerTurn,
        canDoubleDown: false,
        canSplit: false,
        runningCount: newRunningCount,
        playerChips: finalPlayerChips,
      };
    });
  }, []);

  const playerStand = useCallback(() => {
    setGameState((prev) => {
      if (prev.gameOver || !prev.playerTurn) return prev;

      return {
        ...prev,
        message: "Player stands. Dealer's turn.",
        playerTurn: false,
        canDoubleDown: false,
        canSplit: false,
      };
    });
  }, []);

  const playerDoubleDown = useCallback(() => {
    setGameState((prev) => {
      if (prev.gameOver || !prev.playerTurn || !prev.canDoubleDown) return prev;

      const newDeck = [...prev.deck];
      const newCard = newDeck.pop()!;
      const newPlayerCards = [...prev.playerHand.cards, newCard];
      const newPlayerHand = calculateHandScore(newPlayerCards);
      const newRunningCount = prev.runningCount + getCardCountValue(newCard);

      let message = prev.message;
      let gameOver = false; // Changed from true to false
      let playerTurn = false;
      let finalPlayerChips = prev.playerChips - prev.currentBet;

      if (newPlayerHand.score > 21) {
        message = 'Player busts on double down! You lose.';
        gameOver = true; // Set gameOver to true only if player busts on double down
      } else {
          message = "Player doubled down. Dealer's turn.";
      }

      return {
        ...prev,
        deck: newDeck,
        playerHand: newPlayerHand,
        playerScore: newPlayerHand.score,
        gameOver: gameOver,
        message: message,
        playerTurn: playerTurn,
        canDoubleDown: false,
        canSplit: false,
        runningCount: newRunningCount,
        playerChips: finalPlayerChips,
      };
    });
  }, []);

  const playerSplit = useCallback(() => {
    setGameState((prev) => {
      if (prev.gameOver || !prev.playerTurn || !prev.canSplit) return prev;
      console.log('Split action initiated (not fully implemented)');
      return {
        ...prev,
        message: 'Split not fully implemented yet.',
        canSplit: false,
      };
    });
  }, []);


  useEffect(() => {
    if (!gameState.playerTurn && !gameState.gameOver && gameState.playerScore <= 21 && gameState.currentBet > 0) {
      let currentDeck = [...gameState.deck];
      let currentDealerCards = [...gameState.dealerHand.cards];
      let currentDealerHand = calculateHandScore(currentDealerCards);
      let currentRunningCount = gameState.runningCount;
      let finalPlayerChips = gameState.playerChips;

      const playDealerTurn = () => {
        if (currentDealerHand.score < 17) {
          if (currentDeck.length === 0) {
            setGameState(prev => ({ ...prev, message: 'Deck ran out!', gameOver: true }));
            return;
          }
          const newCard = currentDeck.pop()!;
          currentDealerCards.push(newCard);
          currentDealerHand = calculateHandScore(currentDealerCards);
          currentRunningCount += getCardCountValue(newCard);
          setGameState(prev => ({
            ...prev,
            deck: currentDeck,
            dealerHand: currentDealerHand,
            dealerScore: currentDealerHand.score,
            runningCount: currentRunningCount,
          }));
          setTimeout(playDealerTurn, 1000);
        } else {
          let finalMessage = '';
          let finalGameOver = true;

          if (currentDealerHand.score > 21) {
            finalMessage = 'Dealer busts! You win!';
            finalPlayerChips += gameState.currentBet * 2;
          } else if (gameState.playerScore > currentDealerHand.score) {
            finalMessage = 'You win!';
            finalPlayerChips += gameState.currentBet * 2;
          } else if (gameState.playerScore < currentDealerHand.score) {
            finalMessage = 'Dealer wins! You lose.';
          } else {
            finalMessage = 'Push!';
            finalPlayerChips += gameState.currentBet;
          }

          setGameState(prev => ({
            ...prev,
            message: finalMessage,
            gameOver: finalGameOver,
            dealerScore: currentDealerHand.score,
            playerChips: finalPlayerChips,
            currentBet: 0,
          }));
        }
      };

      const dealerDelay = gameState.playerHand.score === 21 ? 1500 : 500;
      setTimeout(playDealerTurn, dealerDelay);
    } else if (gameState.gameOver && gameState.currentBet > 0 && gameState.playerScore > 21) {
        setGameState(prev => ({ ...prev, currentBet: 0 }));
    }
  }, [gameState.playerTurn, gameState.gameOver, gameState.playerScore, gameState.deck, gameState.dealerHand, calculateAndSetProbabilities, gameState.currentBet, gameState.playerChips]);


  return {
    gameState,
    startGame,
    playerHit,
    playerStand,
    playerDoubleDown,
    playerSplit,
    numDecks: numDecksState,
    setNumDecks,
    placeBet,
    resetShoe,
    minBet: MIN_BET,
    maxBet: MAX_BET,
  };
};

export default useBlackjackGame;
