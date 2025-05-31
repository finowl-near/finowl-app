"use client";

import React, { useEffect, useState } from "react";
import LeafIcon from "./Icons/LeafIcon";
import BigLeafIcon from "./Icons/BigLeafIcon";
import { ChevronRightIcon } from "@heroicons/react/24/solid";
import CoinLogo from "../assets/svg/coinLogo.svg";
import ArrowUpIcon from "./Icons/ArrowUpIcon";
import Image from "next/image";
import dophin from "@/app/assets/svg/dophin.svg";
import whale from "@/app/assets/svg/whale.svg";
import useTableData from "../hooks/useTableData";
import { useWalletSelector } from "@near-wallet-selector/react-hook";

export default function TrendingOnchainActivity() {
  const onChainData = useTableData((state) => state.onChainData);
  console.log("on chain", onChainData);
  const { signedAccountId, signIn, signOut } = useWalletSelector();
  const [blur, setBlur] = useState(true);
  useEffect(() => {
    if (signedAccountId) {
      setBlur(false);
    } else {
      setBlur(true);
    }
  }, [signedAccountId]);
  if (!onChainData) {
    // Skeleton loader
    return (
      <div className="relative m-4 border border-[#292929] rounded-[10px] overflow-hidden animate-pulse">
        <div className="flex items-center p-4 justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-[#42354c] rounded-full" />
            <div className="h-6 w-40 bg-[#42354c] rounded" />
          </div>
          <div className="w-5 h-5 bg-[#42354c] rounded" />
        </div>
        <div className="px-4">
          {[...Array(5)].map((_, idx) => (
            <div key={idx} className="flex justify-between items-center py-3 border-b border-[#333]">
              <div className="flex gap-4">
                <div className="w-4 h-4 bg-[#42354c] rounded" />
                <div className="w-24 h-4 bg-[#42354c] rounded" />
              </div>
              <div className="flex gap-2">
                <div className="w-8 h-8 bg-[#42354c] rounded-full" />
                <div className="w-8 h-8 bg-[#42354c] rounded-full" />
              </div>
              <div className="w-12 h-4 bg-[#42354c] rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }
  return (
    <>
      <div className=" relative m-4 border border-[#292929] rounded-[10px] overflow-hidden">
        <div className="absolute top-2 right-0 w-32 h-8 bg-[var(--primary-color)] -z-10 rounded-[0px_0px_10px_10px] blur-2xl opacity-65"></div>
        <div className="flex items-center p-4 cursor-pointer justify-between">
          <div className="flex items-center">
            <LeafIcon />
            <p className="text-xl font-bold text-white ml-2">
              Trending Onchain Activity
            </p>
          </div>
          <ChevronRightIcon className="w-5" color="var(--primary-color)" />
        </div>
        <div className="px-4 relative">
          <div
            className={`absolute ${
              blur ? "block" : "hidden"
            } top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white`}
          >
            Please connect Wallet
          </div>
          <div className="absolute right-0 bottom-0">
            <BigLeafIcon />
          </div>
          <table className={`w-full ${blur && "blur-md"}`}>
            <thead>
              <tr>
                <th className="text-[#CECECE] text-left pl-5">Name</th>
                <th className="text-[#CECECE]">Onchain Score</th>
                <th className="text-[#CECECE]">Volume</th>
              </tr>
            </thead>
            <tbody>
              {onChainData.tickers.map((ticker, idx) => {
                return (
                  <tr key={Math.random()}>
                    <td className="text-[var(--primary-color)] font-bold text-center py-3">
                      <div className="flex gap-4">
                        <span className="text-[var(--primary-color)] text-base font-bold">
                          {idx + 1}
                        </span>
                        <div className="">
                          <span className="text-[#D0D0D0] text-base font-bold">
                            {ticker.ticker_symbol}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="py-2">
                      <div className="flex items-center justify-center">
                        <div className="relative">
                          <Image
                            className="w-8  z-10 "
                            src={dophin}
                            width={undefined}
                            height={undefined}
                            alt="dophin icon "
                          />
                          <span className="absolute top-4 -right-1 z-10 text-xs h-4 w-4 p-1 flex items-center justify-center rounded-full border-2 border-black bg-[#B0DEF6] text-black font-semibold">
                            5
                          </span>
                        </div>
                        <div className="relative">
                          <Image
                            className="w-8 mask-sm"
                            src={whale}
                            width={undefined}
                            height={undefined}
                            alt="dophin icon "
                          />
                          <span className="absolute top-4 -right-2 h-4 w-4 p-1 text-xs border-2 border-black flex items-center  justify-center rounded-full bg-[#356FF9] text-black font-semibold">
                            5
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 text-[#CECECE] text-center font-bold">
                      {(Math.random() * (5 - 1) + 1).toFixed(2)}M
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
