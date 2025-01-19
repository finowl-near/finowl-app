"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { NearContext } from "./context";
import { Wallet } from "./Wallets/near";
import { CounterContract, NetworkId } from "./config";
import LandingPage from "./components/LandingPage";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient();

const wallet = new Wallet({
  createAccessKeyFor: CounterContract,
  networkId: NetworkId,
});

export default function Home() {
  const [signedAccountId, setSignedAccountId] = useState("");

  useEffect(() => {
    console.log("set up Account");
    wallet.startUp(setSignedAccountId);
  }, []);

  return (
    <>
      <QueryClientProvider client={queryClient}>
        <NearContext.Provider value={{ signedAccountId, wallet }}>
          <LandingPage />
        </NearContext.Provider>
      </QueryClientProvider>
    </>
  );
}
