import React from "react";
import SortingIcon from "./Icons/SortingIcon";

export default function TableHead() {
  return (
    <thead className="sticky z-30 backdrop-blur-md top-0">
      <tr className="">
        <th className="text-white font-semibold text-center border-t border-b border-[#292929] p-4">
          Name
        </th>
        <th className="text-white font-semibold text-center border-t border-b border-[#292929] text-nowrap p-4">
          <div className="flex items-center gap-2 cursor-pointer">
            Mindshare Score
            <SortingIcon />
          </div>
        </th>
        <th className="text-white font-semibold text-center border-t border-b border-[#292929] text-nowrap p-4">
          Onchain Score
        </th>
        <th className="text-white font-semibold text-center border-t border-b border-[#292929] p-4">
          <div className="flex items-center gap-2 cursor-pointer">
            Time
            <SortingIcon />
          </div>
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
