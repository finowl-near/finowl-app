import React from "react";
import LeafIcon from "./Icons/LeafIcon";
import BigLeafIcon from "./Icons/BigLeafIcon";
import { ChevronRightIcon } from "@heroicons/react/24/solid";
import CoinLogo from "../assets/svg/coinLogo.svg";
import ArrowUpIcon from "./Icons/ArrowUpIcon";
import Image from "next/image";
import dophin from "@/app/assets/svg/dophin.svg";
import whale from "@/app/assets/svg/whale.svg";

export default function TrendingOnchainActivity() {
  return (
    <>
      <div className=" relative m-4 border border-[#292929] rounded-[10px] overflow-hidden">
        <div className="absolute top-2 right-0 w-32 h-8 bg-[#D8E864] -z-10 rounded-[0px_0px_10px_10px] blur-2xl opacity-65"></div>
        <div className="flex items-center p-4 cursor-pointer justify-between">
          <div className="flex items-center">
            <LeafIcon />
            <p className="text-xl font-bold text-white ml-2">
              Trending Onchain Activity
            </p>
          </div>
          <ChevronRightIcon className="w-5" color="#D8E864" />
        </div>
        <div className="px-4 relative">
          <div className="absolute right-0 bottom-0">
            <BigLeafIcon />
          </div>
          <table className="w-full">
            <thead>
              <tr>
                <th className="text-[#CECECE]">Name</th>
                <th className="text-[#CECECE]">Onchain Score</th>
                <th className="text-[#CECECE]">Volume</th>
                <th className="text-[#CECECE]">%</th>
              </tr>
            </thead>
            <tbody>
              {Array(5)
                .fill(0)
                .map(() => {
                  return (
                    <tr key={Math.random()}>
                      <td className="text-[#D8E864] flex gap-4 justify-center font-bold text-center py-3">
                        1 <span className="text-[#CECECE]">SUI</span>
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
                        356.15M
                      </td>
                      <td className="py-3 flex justify-center items-center">
                        <div className="flex items-center">
                          <ArrowUpIcon />
                          <span className="text-[#D8E864] font-bold ml-1 text-base">
                            +150%
                          </span>
                        </div>
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
