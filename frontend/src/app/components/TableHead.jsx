import React from "react";
import SortingIcon from "./Icons/SortingIcon";
import { Tooltip } from "antd";
import useSortTable from "../hooks/useSortTable";
import { FaArrowDown, FaArrowUp } from "react-icons/fa";

export default function TableHead() {
  const { sort, sortDir, setSort, setSortDir } = useSortTable();
  return (
    <thead className="sticky z-30 backdrop-blur-md top-0">
      <tr className="">
        <th className="text-white font-semibold text-center border-t border-b border-[#292929] p-4">
          Name
        </th>
        <Tooltip
          title={`Sort by mindshare (${sortDir === "desc" ? "asc" : "desc"})`}
          color="#1C1A22"
        >
          <th
            onClick={() => {
              if (sort !== "mindshare") {
                setSort("mindshare");
              }
              setSortDir(sortDir === "desc" ? "asc" : "desc");
            }}
            className="text-white font-semibold text-center border-t border-b border-[#292929] text-nowrap p-4"
          >
            <div className="flex items-center justify-center gap-2 cursor-pointer">
              Mindshare Score
              {sortDir === "asc" ? (
                <FaArrowUp className="text-[var(--primary-color)] text-xs" />
              ) : (
                <FaArrowDown className="text-[var(--primary-color)] text-xs" />
              )}
            </div>
          </th>
        </Tooltip>
        <th className="text-white font-semibold text-center border-t border-b border-[#292929] text-nowrap p-4">
          Onchain Score
        </th>
        <Tooltip
          title={`Sort by last_mentioned (${
            sortDir === "desc" ? "asc" : "desc"
          })`}
          color="#1C1A22"
        >
          <th
            onClick={() => {
              if (sort !== "last_mentioned") {
                setSort("last_mentioned");
              }
              setSortDir(sortDir === "desc" ? "asc" : "desc");
            }}
            className="text-white font-semibold text-center border-t border-b border-[#292929] p-4"
          >
            <div className="flex items-center justify-center gap-2 cursor-pointer">
              Time
              {sortDir === "asc" ? (
                <FaArrowUp className="text-[var(--primary-color)] text-xs" />
              ) : (
                <FaArrowDown className="text-[var(--primary-color)] text-xs" />
              )}
            </div>
          </th>
        </Tooltip>
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
