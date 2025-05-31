import React, { useEffect, useState } from "react";
import useTableData from "../hooks/useTableData";
import { parseInfluencers } from "./Table";


export default function TopInfluencers({
  tickerSymbol,
  influencersData,
}) {
  //   const topInfluencers = useTableData((state) => state.topInfluencers);
  if (!influencersData) return null;
  const parsedInfluensers = parseInfluencers(influencersData)
  // const tierCount = countInfluencersByTier(influencers);
  const tickerMap = parsedInfluensers.get(tickerSymbol);
  const tickerArray = [...tickerMap];
  console.log("debug", tickerSymbol, tickerArray);

  return (
    <div className="flex items-center justify-center">
      {/* {tickerArray.map((val, idx) => {
        return ( */}
      <>
        <div className="w-6 h-6 flex  left-0 z-20 justify-center items-center rounded-full bg-[#FF6347]/30 border border-[#FF6B34]">
          <p className="text-[#FF6B34] font-semibold text-sm ">
            {tickerArray[0][1]}
            {/* {tierCount.influencer_tier_1} */}
          </p>
        </div>
        <div className="w-6 h-6 mask-sm flex  left-5 z-10 justify-center items-center rounded-full bg-[#1E90FF]/30 border border-[#00BFFF]">
          <p className="text-[#00BFFF] font-semibold text-sm ">
            {tickerArray[1][1]}
            {/* {tierCount.influencer_tier_2} */}

          </p>
        </div>
        <div className="w-6 h-6 mask-sm flex  left-10 justify-center items-center rounded-full bg-[#32CD32]/30 border border-[#60FF60]">
          <p className="text-[#60FF60] font-semibold text-sm ">
            {tickerArray[2][1]}
            {/* {tierCount.influencer_tier_3} */}
          </p>
        </div>
      </>
      {/* );
      })} */}
    </div>
  );
}
