"use client";

import React, { useEffect, useState } from "react";
import { FaPlus, FaBars } from "react-icons/fa";
import LogoIcon from "./Icons/LogoIcon";
import Image from "next/image";
import coinOwl from "@/app/assets/svg/coinOwl.svg";
import { urbanist } from "../fonts";
import { useWalletSelector } from "@near-wallet-selector/react-hook";
import { useRouter } from "next/navigation";
import { Tooltip } from "antd";
import Link from "next/link";

export default function Header() {
  const [action, setAction] = useState(() => {});
  const [label, setLabel] = useState("Loading...");
  const { signedAccountId, signIn, signOut } = useWalletSelector();
  const router = useRouter();

  useEffect(() => {
    if (signedAccountId) {
      setAction(() => signOut);
      setLabel(`${signedAccountId}`);
      document.cookie = `nearAccount=${signedAccountId}; Path=/; Secure; SameSite=Lax;`;
    } else {
      setAction(() => signIn);
      setLabel("Connect Wallet");
    }
  }, [signedAccountId, signIn, signOut]);

  return (
    <div className="p-4">
      <div className="flex items-center justify-between">
        <Link href={"/home"}>
          <div className="flex items-center space-x-1">
            {/* Logo */}
            <LogoIcon />
          </div>
        </Link>

        {/* Right actions */}
        <div className="gap-3">
          {/* <button
            onClick={action}
            className="flex gap-2 items-center text-white bg-[#1F1923] border border-[#643989] truncate max-w-[150px] font-bold p-2 rounded-xl"
            title={label}
          >
            <Image
              src={coinOwl}
              alt="coin Owl"
              width={24}
              height={24}
              className="w-6 h-6"
            />
            <span
              className={`text-md truncate max-w-10 font-semibold ${urbanist.className}`}
            >
              100
            </span>
            <div className="flex justify-center items-center p-2 rounded-lg bg-[radial-gradient(closest-side_at_50%_50%,#BA98D5_0%,#643989_100%)]">
              <FaPlus className="w-4 h-4" color="#3D2C4B" />
            </div>
          </button> */}
          {/* <Tooltip title={"Logout " + label} color="#1C1A22">
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
              className="text-white bg-[#1F1923] border border-[#BA98D5] truncate max-w-[200px] font-bold p-2 rounded-xl"
            >
              {label}
            </button>
          </Tooltip> */}
        </div>
      </div>
    </div>
  );
}
