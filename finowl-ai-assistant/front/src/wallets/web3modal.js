import { injected, walletConnect } from '@wagmi/connectors';
import { createConfig, http, reconnect } from '@wagmi/core';
import { createWeb3Modal } from '@web3modal/wagmi';

// Get your projectId at https://cloud.reown.com
const projectId = '5bb0fe33763b3bea40b8d69e4269b4ae';

// Define the NEAR mainnet chain 
const mainnetChain = {
  id: 397,
  name: 'NEAR Mainnet',
  network: 'mainnet',
  nativeCurrency: {
    decimals: 24,
    name: 'NEAR',
    symbol: 'NEAR',
  },
  rpcUrls: {
    default: { http: ['https://rpc.mainnet.near.org'] },
    public: { http: ['https://rpc.mainnet.near.org'] },
  },
  blockExplorers: {
    default: { name: 'Explorer', url: 'https://explorer.near.org' },
  },
};

// Define the NEAR testnet chain
const testnetChain = {
  id: 398,
  name: 'NEAR Testnet',
  network: 'testnet',
  nativeCurrency: {
    decimals: 24,
    name: 'NEAR',
    symbol: 'NEAR',
  },
  rpcUrls: {
    default: { http: ['https://rpc.testnet.near.org'] },
    public: { http: ['https://rpc.testnet.near.org'] },
  },
  blockExplorers: {
    default: { name: 'Explorer', url: 'https://explorer.testnet.near.org' },
  },
};

// Get network preference from localStorage or default to mainnet
const getPreferredNetwork = () => {
  if (typeof window === 'undefined') return 'mainnet'; // Default for server-side rendering
  
  const storedNetwork = localStorage.getItem('preferred_network');
  return (storedNetwork === 'testnet') ? 'testnet' : 'mainnet';
};

// Select the appropriate chain based on network preference
const network = getPreferredNetwork();
const chain = network === 'mainnet' ? mainnetChain : testnetChain;

export const wagmiConfig = createConfig({
  chains: [chain],
  transports: { [chain.id]: http() },
  connectors: [
    walletConnect({ projectId, showQrModal: false }),
    injected({ shimDisconnect: true })
  ],
});

// Preserve login state on page reload
reconnect(wagmiConfig);

// Modal for login
export const web3Modal = createWeb3Modal({ wagmiConfig, projectId });