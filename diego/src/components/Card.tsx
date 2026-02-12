import React from 'react';
import type { Card as CardType } from '../utils';

interface CardProps {
  card: CardType;
  hide?: boolean;
}

const getSuitSymbol = (suit: string): string => {
  switch (suit) {
    case 'Hearts': return '♥';
    case 'Diamonds': return '♦';
    case 'Clubs': return '♣';
    case 'Spades': return '♠';
    default: return '';
  }
};

const Card: React.FC<CardProps> = ({ card, hide }) => {
  const suitSymbol = getSuitSymbol(card.suit);
  const isRedSuit = card.suit === 'Hearts' || card.suit === 'Diamonds';
  const cardColor = isRedSuit ? '#d40000' : '#000';
  const backgroundColor = hide ? '#216a3a' : '#fff'; // Darker green when hidden, white when visible
  const textColor = hide ? '#fff' : cardColor; // White text when hidden, suit color when visible

  const cardStyle: React.CSSProperties = {
    border: '1px solid #999',
    borderRadius: '8px',
    padding: '5px',
    margin: '4px',
    backgroundColor: backgroundColor,
    color: textColor,
    width: '65px',
    height: '95px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: '1em',
    fontWeight: 'bold',
    boxShadow: '2px 2px 5px rgba(0,0,0,0.3)',
    position: 'relative',
    userSelect: 'none', // Prevent text selection
  };

  const rankStyle: React.CSSProperties = {
    fontSize: '1.4em',
    lineHeight: 1,
  };

  const suitStyle: React.CSSProperties = {
    fontSize: '1em',
    lineHeight: 1,
  };

  return (
    <div style={cardStyle}>
      {hide ? (
        <span style={{ fontSize: '2em', color: 'gray' }}>?</span>
      ) : (
        <>
          <div style={{ ...rankStyle, alignSelf: 'flex-start' }}>{card.rank === '10' ? 'T' : card.rank.charAt(0)}</div>
          <div style={suitStyle}>{suitSymbol}</div>
          <div style={{ ...rankStyle, alignSelf: 'flex-end', transform: 'rotate(180deg)' }}>{card.rank === '10' ? 'T' : card.rank.charAt(0)}</div>
        </>
      )}
    </div>
  );
};

export default Card;
