import React from 'react';
import './ProbabilitiesDisplay.css';

interface ProbabilitiesDisplayProps {
  // These props will be populated with actual data later
  hitProbability: number;
  standProbability: number;
  doubleDownProbability: number;
  hitEV: number;
  standEV: number;
  doubleDownEV: number;
}

const ProbabilitiesDisplay: React.FC<ProbabilitiesDisplayProps> = ({
  hitProbability, // Still receive but won't display
  standProbability, // Still receive but won't display
  doubleDownProbability, // Still receive but won't display
  hitEV,
  standEV,
  doubleDownEV,
}) => {
  return (
    <div className="probabilities-display">
      <h3>Decision Insights</h3>
      <div className="decision-row">
        <span>Hit:</span>
        {/* Removed Win percentage: <span>Win: {hitProbability.toFixed(2)}%</span> */}
        <span>EV: {hitEV.toFixed(2)}</span>
      </div>
      <div className="decision-row">
        <span>Stand:</span>
        {/* Removed Win percentage: <span>Win: {standProbability.toFixed(2)}%</span> */}
        <span>EV: {standEV.toFixed(2)}</span>
      </div>
      <div className="decision-row">
        <span>Double Down:</span>
        {/* Removed Win percentage: <span>Win: {doubleDownProbability.toFixed(2)}%</span> */}
        <span>EV: {doubleDownEV.toFixed(2)}</span>
      </div>
      {/* Add more decisions as needed (e.g., Split) */}
    </div>
  );
};

export default ProbabilitiesDisplay;
