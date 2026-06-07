import React from 'react';

interface SelectionContextType {
  selectedNodeId: string | null;
}

export const SelectionContext = React.createContext<SelectionContextType>({
  selectedNodeId: null,
});

export const useSelection = () => {
  const context = React.useContext(SelectionContext);
  if (!context) {
    throw new Error('useSelection must be used within SelectionContext');
  }
  return context;
};
