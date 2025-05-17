// Get network preference from localStorage or default to mainnet
const getPreferredNetwork = () => {
  if (typeof window === 'undefined') return 'mainnet'; // Default for server-side rendering
  
  const storedNetwork = localStorage.getItem('preferred_network');
  return (storedNetwork === 'testnet') ? 'testnet' : 'mainnet';
};

// Network configuration - use localStorage or fallback to mainnet
export const NETWORK = getPreferredNetwork();
export const CONTRACT_NAME = NETWORK === 'mainnet' ? 'finowl.near' : 'finowl.testnet';
export const isTestnet = NETWORK === 'testnet';
export const isMainnet = NETWORK === 'mainnet';

// Network-specific settings
export const networkConfig = {
  testnet: {
    name: 'testnet',
    contractName: 'finowl.testnet',
    explorerUrl: 'https://explorer.testnet.near.org',
    rpcUrl: 'https://rpc.testnet.near.org',
    walletUrl: 'https://wallet.testnet.near.org',
  },
  mainnet: {
    name: 'mainnet',
    contractName: 'finowl.near',
    explorerUrl: 'https://explorer.near.org',
    rpcUrl: 'https://rpc.mainnet.near.org',
    walletUrl: 'https://wallet.near.org',
  },
};

// Get current network config
export const getCurrentNetwork = () => networkConfig[NETWORK];

// Validate network configuration
export const validateNetworkConfig = () => {
  if (!NETWORK || !networkConfig[NETWORK]) {
    console.error(`Invalid network configuration: ${NETWORK}`);
    return false;
  }
  return true;
}; 