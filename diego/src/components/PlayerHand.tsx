import React from 'react';
import './Hand.css'; // Will create a shared CSS for hands

interface PlayerHandProps {
  children?: React.ReactNode;
}

const PlayerHand: React.FC<PlayerHandProps> = ({ children }) => {
  return (
    <div className="hand player-hand">
      {children}
    </div>
  );
};

export default PlayerHand;
