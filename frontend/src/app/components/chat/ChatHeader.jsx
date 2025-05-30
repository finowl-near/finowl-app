"use client";

import { useWalletSelector } from "@near-wallet-selector/react-hook";
import React, { useCallback, useEffect, useState } from "react";
import { FaBars, FaPlus } from "react-icons/fa";
import LogoIcon from "@/app/components/Icons/LogoIcon";
import coinOwl from "@/app/assets/svg/coinOwl.svg";
import { urbanist } from "@/app/fonts";
import Image from "next/image";
import { Tooltip } from "antd";
import PurchaseTokens from "./PurchaseTokens";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { HiBars3CenterLeft } from "react-icons/hi2";

export default function ChatHeader({
  toggle,
  collapsed,
  balance,
  loadingBalence,
  refreshBalance,
}) {
  const router = useRouter();
  const [action, setAction] = useState(() => {});
  const [label, setLabel] = useState("Loading...");
  const [isModalOpen, setModalOpen] = useState(false);
  const { signedAccountId, viewFunction, signIn, signOut } =
    useWalletSelector();

  useEffect(() => {
    if (signedAccountId) {
      setAction(() => signOut);
      setLabel(`${signedAccountId}`);
    } else {
      setAction(() => signIn);
      setLabel("Connect Wallet");
    }
  }, [signedAccountId, signIn, signOut]);
  return (
    <>
      {/* Header */}
      <div className="p-4 h-14 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <Tooltip title="open sidebar" color="#1C1A22">
            <button
              onClick={toggle}
              className={`rounded-lg hover:bg-[#BA98D5]/20 transition-colors text-white ${
                !collapsed && "hidden"
              }`}
              aria-label="Toggle sidebar"
            >
              <HiBars3CenterLeft className="w-6 h-6" />
            </button>
          </Tooltip>
          <Link href={"/home"}>
            <span className={`${!collapsed && "hidden"}`}>
              <LogoIcon />
            </span>
          </Link>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setModalOpen(true)}
            className="flex gap-2 items-center text-white bg-[#1F1923] border border-[#643989] truncate max-w-[150px] font-bold p-2 rounded-xl"
            title={balance}
          >
            <Image
              src={coinOwl}
              alt="coin Owl"
              width={24}
              height={24}
              className="w-6 h-6"
            />
            <span
              className={`text-md truncate max-w-40 font-semibold ${urbanist.className}`}
            >
              {loadingBalence ? "..." : balance}
            </span>
            <div className="flex justify-center items-center p-2 rounded-lg bg-[radial-gradient(closest-side_at_50%_50%,#BA98D5_0%,#643989_100%)]">
              <FaPlus className="w-4 h-4" color="#3D2C4B" />
            </div>
          </button>
          <PurchaseTokens
            isModalOpen={isModalOpen}
            setModalOpen={setModalOpen}
            refreshBalance={refreshBalance}
          />
          <Tooltip title={"Logout " + label} color="#1C1A22">
            <button
              onClick={async () => {
                await action();
                document.cookie = [
                  `nearAccount=`,
                  `Path=/`,
                  `Max-Age=0`,
                  `Secure`,
                  `SameSite=Lax`,
                ].join("; ");
                router.push("/");
              }}
              className="text-white bg-[#1F1923] border border-[#BA98D5] truncate max-w-[150px] font-bold p-2 rounded-xl"
              // title={label}
            >
              {label}
            </button>
          </Tooltip>
        </div>
      </div>
    </>
  );
}
