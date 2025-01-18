import React from "react";
import LeafIcon from "./Icons/LeafIcon";
import BigLeafIcon from "./Icons/BigLeafIcon";
import { ChevronRightIcon } from "@heroicons/react/24/solid";
import CoinLogo from "../assets/svg/coinLogo.svg";
import ArrowUpIcon from "./Icons/ArrowUpIcon";
import Image from "next/image";

export default function NewCoins() {
  return (
    <>
      <div className=" relative m-4 border border-[#292929] rounded-[10px] overflow-hidden">
        <div className="absolute top-2 right-0 w-32 h-8 bg-[#D8E864] -z-10 rounded-[0px_0px_10px_10px] blur-2xl opacity-65"></div>
        <div className="flex items-center p-4 cursor-pointer justify-between">
          <div className="flex items-center">
            <LeafIcon />
            <p className="text-xl font-bold text-white ml-2">Trending Coins</p>
          </div>
          <ChevronRightIcon className="w-5" color="#D8E864" />
        </div>
        <div className="px-4 relative">
          <div className="absolute right-0 bottom-0">
            <BigLeafIcon />
          </div>
          {Array(5)
            .fill(0)
            .map((_, idx) => {
              return (
                <div
                  key={idx}
                  className="flex py-3 items-center  justify-between"
                >
                  <div className="flex gap-2">
                    <span className="text-[#D8E864] text-md font-bold">
                      {idx + 1}
                    </span>
                    <div className="flex items-center">
                      <Image
                        src={CoinLogo}
                        alt="Coin Logo"
                        width={20}
                        height={20}
                      />
                      <span className="text-[#D0D0D0] text-md font-bold ml-2">
                        SUI
                      </span>
                    </div>
                    <span className="text-[#D0D0D0] text-md font-bold">
                      $5.23
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-[#D0D0D0] text-md font-bold">
                      $34M
                    </span>
                    <div className="flex items-center">
                      <ArrowUpIcon />
                      <span className="text-[#D8E864] font-bold ml-1 text-md">
                        +150%
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
        </div>
      </div>
    </>
  );
}
