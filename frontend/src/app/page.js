"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { NearContext } from "./context";
import { Wallet } from "./Wallets/near";
import { CounterContract, NetworkId } from "./config";


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
      <NearContext.Provider value={{ signedAccountId, wallet }}>
        <div>Hello testing statistics</div>
      </NearContext.Provider>
    </>
  );
}
