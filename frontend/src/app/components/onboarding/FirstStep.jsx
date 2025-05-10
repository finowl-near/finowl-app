"use client";

import React, { useEffect, useState } from "react";
import { useWalletSelector } from "@near-wallet-selector/react-hook";

export default function FirstStep() {
  const { signedAccountId, signIn, signOut } = useWalletSelector();

  return (
    <div>
      <p>Welcome to finowl {signedAccountId}</p>
      {!signedAccountId && (
        <button
          onClick={() => signIn()}
          className="text-white bg-[#1F1923] border border-[var(--primary-color)] truncate max-w-[150px] font-bold p-2 rounded-xl"
        >
          Connect Wallet
        </button>
      )}
    </div>
  );
}
