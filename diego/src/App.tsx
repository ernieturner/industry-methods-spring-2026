import React, { useState } from 'react';
import Table from './components/Table';
import DealerHand from './components/DealerHand';
import PlayerHand from './components/PlayerHand';
import Controls from './components/Controls';
import ProbabilitiesDisplay from './components/ProbabilitiesDisplay';
import Card from './components/Card';
import useBlackjackGame from './hooks/useBlackjackGame';
import './index.css';

function App() {
  const {
    gameState,
    startGame,
    playerHit,
    playerStand,
    playerDoubleDown,
    numDecks,
    setNumDecks,
    placeBet,
    resetShoe,
    minBet,
    maxBet,
  } = useBlackjackGame();

  const {
    playerHand,
    dealerHand,
    playerScore,
    dealerScore,
    gameOver,
    playerTurn,
    canDoubleDown,
    hitProbability,
    standProbability,
    doubleDownProbability,
    hitEV,
    standEV,
    doubleDownEV,
    runningCount,
    playerChips,
    currentBet,
    deck, // Destructure deck to get its length
  } = gameState;

  const [betInput, setBetInput] = useState<number>(minBet);

  const handleNumDecksChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setNumDecks(Number(event.target.value));
  };

  const handleBetInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number(event.target.value);
    if (!isNaN(value)) {
      setBetInput(value);
    }
  };

  const handlePlaceBet = () => {
    if (betInput >= minBet && betInput <= maxBet && betInput <= playerChips) {
      placeBet(betInput);
    } else if (betInput < minBet) {
      alert(`Minimum bet is $${minBet}`);
    } else if (betInput > maxBet) {
      alert(`Maximum bet is $${maxBet}`);
    } else {
      alert('Not enough chips!');
    }
  };

  const isBettingPhase = gameState.gameOver && currentBet === 0;

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      backgroundColor: '#333'
    }}>
      <Table>
        <div className="main-game-area">
          <div className="table-top-info">
            <div>Chips: ${playerChips}</div>
            <div>Bet: ${currentBet}</div>
            <div className="running-count-display">
              Running Count: {runningCount}
            </div>
          </div>

          <DealerHand>
            <div className="hand-info">
              Dealer's Hand ({gameOver ? dealerScore : '?'}):
            </div>
            <div className="cards-container">
              {dealerHand.cards.map((card, index) => (
                <Card key={index} card={card} hide={!gameOver && index === 1} />
              ))}
            </div>
          </DealerHand>

          <div className="main-controls-area">
            {isBettingPhase ? (
              <div className="betting-controls-left">
                <label htmlFor="bet-input" style={{ color: 'white' }}>Bet:</label>
                <input
                  id="bet-input"
                  type="number"
                  value={betInput}
                  onChange={handleBetInputChange}
                  min={minBet}
                  max={Math.min(maxBet, playerChips)}
                  step="10"
                />
                <button onClick={handlePlaceBet}>Place Bet</button>
              </div>
            ) : (
              <Controls
                onHit={playerHit}
                onStand={playerStand}
                onDoubleDown={playerDoubleDown}
                canDoubleDown={canDoubleDown && playerTurn && playerChips >= currentBet}
                gameInProgress={!gameOver}
              />
            )}
            <div className="deck-and-reset-controls">
              <label htmlFor="num-decks-select" style={{ color: 'white' }}>Decks:</label>
              <select
                id="num-decks-select"
                value={numDecks}
                onChange={handleNumDecksChange}
                disabled={!isBettingPhase}
              >
                <option value={1}>1</option>
                <option value={2}>2</option>
                <option value={4}>4</option>
                <option value={6}>6</option>
                <option value={8}>8</option>
              </select>
              <button onClick={resetShoe}>Reset Shoe</button>
              <div style={{color: 'white', fontWeight: 'bold'}}>Cards Left: {deck.length}</div> {/* Added cards left count */}
            </div>
          </div> {/* End of main-controls-area */}

          <PlayerHand>
            <div className="hand-info">
              Player's Hand ({playerScore}):
            </div>
            <div className="cards-container">
              {playerHand.cards.map((card, index) => (
                <Card key={index} card={card} />
              ))}
            </div>
          </PlayerHand>
          {/* Removed new game button */}
        </div> {/* End of main-game-area */}

        <ProbabilitiesDisplay
          hitProbability={hitProbability}
          standProbability={standProbability}
          doubleDownProbability={doubleDownProbability}
          hitEV={hitEV}
          standEV={standEV}
          doubleDownEV={doubleDownEV}
        />
      </Table>
    </div>
  );
}

export default App;
