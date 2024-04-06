import React, { createContext, useState, useContext } from 'react';

const ActiveTabContext = createContext();

export const useActiveTab = () => useContext(ActiveTabContext);

export const ActiveTabProvider = ({ children }) => {
  const [activeTab, setActiveTab] = useState('/');

  return (
    <ActiveTabContext.Provider value={{ activeTab, setActiveTab }}>
      {children}
    </ActiveTabContext.Provider>
  );
};
