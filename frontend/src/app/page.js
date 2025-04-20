"use client";

import Image from "next/image";
import { Suspense, useEffect, useState } from "react";
import LandingPage from "./components/LandingPage";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";


// import '@near-wallet-selector/modal-ui/styles.css';
// import { setupMyNearWallet } from '@near-wallet-selector/my-near-wallet';
// import { setupMeteorWallet } from '@near-wallet-selector/meteor-wallet';
// import { setupMeteorWalletApp } from '@near-wallet-selector/meteor-wallet-app';
// import { setupEthereumWallets } from '@near-wallet-selector/ethereum-wallets';
// import { setupLedger } from '@near-wallet-selector/ledger';
// import { setupNearMobileWallet } from '@near-wallet-selector/near-mobile-wallet';
// import { WalletSelectorProvider } from '@near-wallet-selector/react-hook';
import { HelloNearContract, NetworkId } from '@/app/config';
import Landing from "./components/Landing";

// ethereum wallets
// import { wagmiConfig, web3Modal } from '@/app/Wallets/web3modal';

// const walletSelectorConfig = {
//   network: NetworkId,
//   // createAccessKeyFor: HelloNearContract,
//   modules: [
//     setupEthereumWallets({ wagmiConfig, web3Modal, alwaysOnboardDuringSignIn: true }),
//     setupMeteorWallet(),
//     setupMeteorWalletApp({contractId: HelloNearContract}),
//     setupLedger(),
//     setupNearMobileWallet(),
//     setupMyNearWallet(),
//   ],
// }


const queryClient = new QueryClient();


export default function Home() {


  return (
    <>
      <QueryClientProvider client={queryClient}>
        {/* <WalletSelectorProvider config={walletSelectorConfig}> */}
          <Suspense>
            <LandingPage />
            {/* <Landing/> */}
          </Suspense>
        {/* </WalletSelectorProvider> */}
      </QueryClientProvider>
    </>
  );
}
