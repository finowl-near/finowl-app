import React from "react";

export default function TableHead() {
  return (
    <thead className="sticky z-10 backdrop-blur-md top-0">
      <tr className="">
        <th className="text-white font-semibold text-center border-t border-b border-[#292929] p-4">
          Name
        </th>
        <th className="text-white font-semibold text-center border-t border-b border-[#292929] text-nowrap p-4">
          Mindshare Score
        </th>
        <th className="text-white font-semibold text-center border-t border-b border-[#292929] p-4">
          Price
        </th>
        <th className="text-white font-semibold text-center border-t border-b border-[#292929] p-4">
          MarketCap
        </th>
        <th className="text-white font-semibold text-center border-t border-b border-[#292929] p-4">
          Tier
        </th>
        <th className="text-white font-semibold text-center border-t border-b border-[#292929] text-nowrap p-4">
          Top Influencers
        </th>
        <th className="text-white font-semibold text-center border-t border-b border-[#292929] p-4">
          Description
        </th>
      </tr>
    </thead>
  );
}
