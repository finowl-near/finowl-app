// const contractPerNetwork = {
// 	testnet: "trustybite.testnet",
// };

import { NETWORK_ID } from "./Wallets/near";

// export const NetworkId = "testnet";
// export const CounterContract = contractPerNetwork[NetworkId];

const contractPerNetwork = {
	mainnet: 'hello.near-examples.near',
	testnet: 'hello.near-examples.testnet',
  };
  
  // Chains for EVM Wallets
  const evmWalletChains = {
	mainnet: {
	  chainId: 397,
	  name: 'Near Mainnet',
	  explorer: 'https://eth-explorer.near.org',
	  rpc: 'https://eth-rpc.mainnet.near.org',
	},
	testnet: {
	  chainId: 398,
	  name: 'Near Testnet',
	  explorer: 'https://eth-explorer-testnet.near.org',
	  rpc: 'https://eth-rpc.testnet.near.org',
	},
  };
  
  export const NetworkId = NETWORK_ID;
  export const HelloNearContract = contractPerNetwork[NetworkId];
  export const EVMWalletChain = evmWalletChains[NetworkId];