import React from 'react';
import './Controls.css';

interface ControlsProps {
  onHit: () => void;
  onStand: () => void;
  onDoubleDown: () => void;
  canDoubleDown: boolean;
  gameInProgress: boolean;
}

const Controls: React.FC<ControlsProps> = ({
  onHit,
  onStand,
  onDoubleDown,
  canDoubleDown,
  gameInProgress,
}) => {
  return (
    <div className="controls">
      {gameInProgress && ( // Only render action buttons if game is in progress
        <div className="action-buttons-group">
          <button onClick={onHit}>Hit</button>
          <button onClick={onStand}>Stand</button>
          <button onClick={onDoubleDown} disabled={!canDoubleDown}>Double Down</button>
        </div>
      )}
    </div>
  );
};

export default Controls;
