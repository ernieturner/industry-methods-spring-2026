import React from 'react';
import './Table.css';

interface TableProps {
  children?: React.ReactNode;
}

const Table: React.FC<TableProps> = ({ children }) => {
  return (
    <div className="blackjack-table">
      {children}
    </div>
  );
};

export default Table;
