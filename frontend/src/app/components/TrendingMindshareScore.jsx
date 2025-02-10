import React from "react";
import FireIcon from "./Icons/FireIcon";
import { ChevronRightIcon } from "@heroicons/react/24/solid";
import Image from "next/image";
import CoinLogo from "../assets/svg/coinLogo.svg";
import ArrowUpIcon from "./Icons/ArrowUpIcon";
import BigFireIcon from "./Icons/BigFireIcon";

export default function TrendingMindshareScore() {
  return (
    <>
      <div className=" relative m-4 border border-[#292929] rounded-[10px] overflow-hidden">
        <div className="absolute top-2 right-0 w-32 h-8 bg-[#D8E864] -z-10 rounded-[0px_0px_10px_10px] blur-2xl opacity-65"></div>
        <div className="flex items-center p-4 cursor-pointer justify-between">
          <div className="flex items-center">
            <FireIcon />
            <p className="text-xl font-bold text-white ml-2">
              Trending Mindshare Score
            </p>
          </div>
          <ChevronRightIcon className="w-5" color="#D8E864" />
        </div>
        <div className="px-4 relative">
          <div className="absolute right-0 bottom-0">
            <BigFireIcon />
          </div>
          <div>
            <table className="w-full">
              <thead>
                <tr>
                  <th className="text-[#CECECE]">Name</th>
                  <th className="text-[#CECECE]">Mindshare Score</th>
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
                        <td className="text-[#D8E864] font-bold text-center py-3">
                          5.5
                        </td>
                        <td className="py-3">
                          <div className="flex items-center justify-center">
                            <div className="w-6 h-6 flex  left-0 z-20 justify-center items-center rounded-full bg-[#FF6347]/30 border border-[#FF6B34]">
                              <p className="text-[#FF6B34] font-semibold text-sm ">
                                5
                              </p>
                            </div>
                            <div className="w-6 h-6 mask-sm flex  left-5 z-10 justify-center items-center rounded-full bg-[#1E90FF]/30 border border-[#00BFFF]">
                              <p className="text-[#00BFFF] font-semibold text-sm ">
                                3
                              </p>
                            </div>
                            <div className="w-6 h-6 mask-sm flex  left-10 justify-center items-center rounded-full bg-[#32CD32]/30 border border-[#60FF60]">
                              <p className="text-[#60FF60] font-semibold text-sm ">
                                1
                              </p>
                            </div>
                          </div>
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
      </div>
    </>
  );
}
