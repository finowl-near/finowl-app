"use client";

import React, { useEffect, useState } from "react";
import LogoIcon from "./Icons/LogoIcon";
import Image from "next/image";
import coinOwl from "@/app/assets/svg/coinOwl.svg";
import { urbanist } from "../fonts";
import { FaPlus } from "react-icons/fa";


import { useWalletSelector } from "@near-wallet-selector/react-hook";

export default function Header() {
  const [action, setAction] = useState(() => {});
  const [label, setLabel] = useState("Loading...");
  const { signedAccountId, signIn, signOut } = useWalletSelector();

  useEffect(() => {
    if (signedAccountId) {
      setAction(() => signOut);
      setLabel(`Logout ${signedAccountId}`);
    } else {
      setAction(() => signIn);
      setLabel("Connect Wallet");
    }
  }, [signedAccountId, signIn, signOut]);
  return (
    <>
      <div className="p-4 ">
        <div className="flex items-center justify-between">
          <LogoIcon />
          <div className="flex gap-3">
            <button
              onClick={action}
              className="flex gap-2 items-center text-white bg-[#1F1923] border border-[#643989] truncate max-w-[150px] font-bold p-2 rounded-xl"
              title={label}
            >
              <Image
                className="w-8"
                src={coinOwl}
                width={undefined}
                height={undefined}
                alt="coin Owl"
              />
              <span
                className={`text-md truncate max-w-10 font-semibold ${urbanist.className}`}
              >
                100
              </span>
              <div className="flex justify-center items-center p-2 rounded-lg bg-[radial-gradient(closest-side_at_50%_50%,#BA98D5_0%,#643989_100%)]">
                <FaPlus className="w-4 font-bold" color="#3D2C4B" />
              </div>
            </button>
            <button
              onClick={action}
              className="text-white bg-[#1F1923] border border-[var(--primary-color)] truncate max-w-[150px] font-bold p-2 rounded-xl"
              title={label}
            >
              {label}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
