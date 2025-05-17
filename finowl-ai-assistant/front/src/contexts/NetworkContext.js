import React, { createContext, useState, useContext, useEffect } from 'react';

// Create the context
const NetworkContext = createContext();

// Custom hook to use the network context
export const useNetwork = () => {
  const context = useContext(NetworkContext);
  if (!context) {
    throw new Error('useNetwork must be used within a NetworkProvider');
  }
  return context;
};

// Provider component
export const NetworkProvider = ({ children }) => {
  // Default to mainnet
  const [network, setNetwork] = useState('mainnet');
  
  // Toggle between mainnet and testnet
  const toggleNetwork = () => {
    const newNetwork = network === 'mainnet' ? 'testnet' : 'mainnet';
    setNetwork(newNetwork);
    
    // Save to localStorage for persistence
    localStorage.setItem('preferred_network', newNetwork);
    
    // Reload the page to apply network changes
    window.location.reload();
  };
  
  // Load preferred network from localStorage on initial load
  useEffect(() => {
    const storedNetwork = localStorage.getItem('preferred_network');
    if (storedNetwork && (storedNetwork === 'mainnet' || storedNetwork === 'testnet')) {
      setNetwork(storedNetwork);
    }
  }, []);
  
  const value = {
    network,
    isMainnet: network === 'mainnet',
    isTestnet: network === 'testnet',
    toggleNetwork,
    contractName: network === 'mainnet' ? 'finowl.near' : 'finowl.testnet',
  };
  
  return (
    <NetworkContext.Provider value={value}>
      {children}
    </NetworkContext.Provider>
  );
}; 