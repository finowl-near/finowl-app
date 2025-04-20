import React, { useEffect, useState } from "react";
import LogoIcon from "./Icons/LogoIcon";

// import { useWalletSelector } from "@near-wallet-selector/react-hook";

export default function Header() {
  const [action, setAction] = useState(() => {});
  const [label, setLabel] = useState("Loading...");
  // const { signedAccountId, signIn, signOut } = useWalletSelector();

  // useEffect(() => {
  //   if (signedAccountId) {
  //     setAction(() => signOut);
  //     setLabel(`Logout ${signedAccountId}`);
  //   } else {
  //     setAction(() => signIn);
  //     setLabel("Connect Wallet");
  //   }
  // }, [signedAccountId, signIn, signOut]);
  return (
    <>
      <div className="p-4 ">
        <div className="flex items-center justify-between">
          <LogoIcon />
          <button
            onClick={action}
            className="text-[#2f2f2f] bg-[var(--primary-color)] truncate max-w-[150px] font-bold p-2 rounded-xl"
            title={label}
          >
            {label}
          </button>
        </div>
      </div>
    </>
  );
}
