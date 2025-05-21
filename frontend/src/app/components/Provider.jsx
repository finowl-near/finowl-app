"use client";

import React, { Suspense } from "react";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import "@near-wallet-selector/modal-ui/styles.css";
import { setupMyNearWallet } from "@near-wallet-selector/my-near-wallet";
import { setupMeteorWallet } from "@near-wallet-selector/meteor-wallet";
import { setupMeteorWalletApp } from "@near-wallet-selector/meteor-wallet-app";
import { setupEthereumWallets } from "@near-wallet-selector/ethereum-wallets";
import { setupLedger } from "@near-wallet-selector/ledger";
import { setupNearMobileWallet } from "@near-wallet-selector/near-mobile-wallet";
import { WalletSelectorProvider } from "@near-wallet-selector/react-hook";
import { HelloNearContract, NetworkId } from "@/app/config";
// ethereum wallets
// import { wagmiConfig, web3Modal } from "@/app/Wallets/web3modal";

const walletSelectorConfig = {
  network: NetworkId,
  // createAccessKeyFor: HelloNearContract,
  modules: [
    setupEthereumWallets({
    //   wagmiConfig,
    //   web3Modal,
      alwaysOnboardDuringSignIn: true,
    }),
    setupMeteorWallet(),
    setupMeteorWalletApp({ contractId: HelloNearContract }),
    setupLedger(),
    setupNearMobileWallet(),
    setupMyNearWallet(),
  ],
};

const queryClient = new QueryClient();

export default function Provider({ children }) {
  console.log("💼 WalletSelectorProvider mounted");
  return (
    <>
      <QueryClientProvider client={queryClient}>
        <WalletSelectorProvider config={walletSelectorConfig}>
          <Suspense>{children}</Suspense>
        </WalletSelectorProvider>
      </QueryClientProvider>
    </>
  );
}
