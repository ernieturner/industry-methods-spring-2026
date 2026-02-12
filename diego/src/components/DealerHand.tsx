import React from 'react';
import './Hand.css'; // Will create a shared CSS for hands

interface DealerHandProps {
  children?: React.ReactNode;
}

const DealerHand: React.FC<DealerHandProps> = ({ children }) => {
  return (
    <div className="hand dealer-hand">
      {children}
    </div>
  );
};

export default DealerHand;
