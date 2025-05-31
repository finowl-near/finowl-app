"use client";

import React from "react";
import FireIcon from "./Icons/FireIcon";
import { ChevronRightIcon } from "@heroicons/react/24/solid";
import BigFireIcon from "./Icons/BigFireIcon";
import useTableData from "../hooks/useTableData";
import TopInfluencers from "./TopInfluencers";

export default function TrendingMindshareScore() {
  const trendingData = useTableData((state) => state.trendingData);
  const topInfluencers = useTableData((state) => state.topInfluencers);

  const renderSkeletonRow = (key) => (
    <tr key={key}>
      <td className="px-3 py-3">
        <div className="flex gap-4 items-center">
          <div className="w-5 h-5 bg-[#42354c] rounded animate-pulse" />
          <div className="w-16 h-5 bg-[#42354c] rounded animate-pulse" />
        </div>
      </td>
      <td className="py-3 text-center">
        <div className="w-16 h-5 mx-auto bg-[#42354c] rounded animate-pulse" />
      </td>
      <td className="py-3">
        <div className="w-28 h-5 bg-[#42354c] rounded animate-pulse" />
      </td>
    </tr>
  );

  return (
    <div className="relative m-1 sm:m-4 border border-[#292929] rounded-[10px] overflow-hidden">
      <div className="absolute top-2 right-0 w-32 h-8 bg-[var(--primary-color)] -z-10 rounded-[0px_0px_10px_10px] blur-2xl opacity-65"></div>
      <div className="flex items-center p-4 cursor-pointer justify-between">
        <div className="flex items-center">
          <FireIcon />
          <p className="text-xl font-bold text-white ml-2">Fresh Mentions</p>
        </div>
        <ChevronRightIcon className="w-5" color="var(--primary-color)" />
      </div>
      <div className="px-4 relative">
        <div className="absolute right-0 bottom-0">
          <BigFireIcon />
        </div>
        <div>
          <table className="w-full">
            <thead>
              <tr>
                <th className="text-[#CECECE] text-left pl-5">Name</th>
                <th className="text-[#CECECE]">Mindshare Score</th>
                <th className="text-[#CECECE]">Top Influencers</th>
              </tr>
            </thead>
            <tbody>
              {!trendingData
                ? Array.from({ length: 5 }).map((_, i) => renderSkeletonRow(i))
                : trendingData.tickers.slice(0, 5).map((ticker, idx) => (
                    <tr key={ticker.ticker_symbol + idx}>
                      <td className="text-[var(--primary-color)] font-bold text-center px-3 py-3">
                        <div className="flex gap-4">
                          <span className="text-[var(--primary-color)] text-base font-bold">
                            {idx + 1}
                          </span>
                          <div>
                            <span className="text-[#D0D0D0] text-base font-bold">
                              {ticker.ticker_symbol}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="text-[var(--primary-color)] font-bold text-center py-3">
                        {ticker.mindshare_score}
                      </td>
                      <td className="py-3">
                        <TopInfluencers
                          tickerSymbol={ticker.ticker_symbol}
                          influencersData={trendingData}
                        />
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
