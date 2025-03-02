"use client";

import React, { Fragment, useState } from "react";
import TableHead from "./TableHead";
import TableBody from "./TableBody";
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/solid";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import getTableData from "../api/getTableData";
import useTableData from "../hooks/useTableData";
import getTrendingMindshareScore from "../api/getTrendingMindshareScore";
import getOnchainActivity from "../api/getOnchainActivity";
import { useRouter, useSearchParams } from "next/navigation";
import getSummary from "../api/getSummary";

function parseInfluencers(data) {
  const result = new Map();

  data.tickers.forEach((ticker) => {
    const tierCountMap = new Map([
      [1, 0],
      [2, 0],
      [3, 0],
    ]);

    Object.values(ticker.mention_details.influencers).forEach((influencer) => {
      const tier = influencer.tier;
      const count = (tierCountMap.get(tier) || 0) + 1;
      tierCountMap.set(tier, Math.min(count, 99));
    });

    result.set(ticker.ticker_symbol, tierCountMap);
  });

  return result;
}

function extractCategories(content) {
  const categories = [
      "Featured Tickers and Projects",
      "Key Insights from Influencers",
      "Market Sentiment and Directions"
  ];

  const regex = new RegExp(`(?<=# )(${categories.join("|")})\\n([\\s\\S]*?)(?=(\\n# |$))`, "g");
  
  const result = {};
  
  let match;
  while ((match = regex.exec(content)) !== null) {
      result[match[1]] = match[2].trim();
  }

  return result;
}


export default function Table() {
  const router = useRouter();

  const searchParams = useSearchParams();
  const page = parseInt(searchParams.get("page"));

  const tableData = useTableData((state) => state.tableData);
  const setTableData = useTableData((state) => state.setTableData);
  const setTrendingMindshareScore = useTableData(
    (state) => state.setTrendingMindshareScore
  );
  const setTopInfluencers = useTableData((state) => state.setTopInfluencers);
  const setOnchainActivity = useTableData((state) => state.setOnchainActivity);
  const setAllInfluencers = useTableData((state) => state.setAllInfluencers);
  const setFeed = useTableData((state) => state.setFeed);
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ["tableData", page],
    queryFn: async () => {
      console.log("before fetching", page)
      const data = await getTableData(page);
      const trendingData = await getTrendingMindshareScore();
      const onChainData = await getOnchainActivity();
      const feedData = await getSummary();
      const section = extractCategories(feedData.summary.content);
      console.log("summary content", feedData);
      console.log("summary data", section);
      console.log("data", data);
      setTableData(data);
      setTrendingMindshareScore(trendingData);
      const topInfluencers = parseInfluencers(trendingData);
      const allInfluencers = parseInfluencers(data);
      setTopInfluencers(topInfluencers);
      setOnchainActivity(onChainData);
      setAllInfluencers(allInfluencers);
      setFeed(section, feedData.summary.timestamp);
      return data;
    },
  });

  function handleNextPage() {
    const newPage = page + 1;
    if (newPage < tableData.total_page_cnt) {
      const newParams = new URLSearchParams(searchParams.toString());
      newParams.set("page", newPage.toString());
      router.push(`?${newParams.toString()}`, { scroll: false });
    }
  }

  function handlePreviousPage() {
    const newPage = Math.max(0, page - 1);
    const newParams = new URLSearchParams(searchParams.toString());
    newParams.set("page", newPage.toString());
    router.push(`?${newParams.toString()}`, { scroll: false });
  }

  console.log("total page", tableData.total_page_cnt);
  return (
    <div>
      <div className="relative overflow-hidden">
        <div className="absolute top-2 right-1/2 translate-x-1/2 w-1/2 h-10 bg-[#D8E864] -z-10 rounded-[50px_50px_100px_100px] blur-2xl opacity-50"></div>
        <div className="w-full h-[700px] max-h-[700px] rounded-[20px] border border-[#292929] max-w-[1400px] overflow-auto">
          <table className={`w-full custom-table`}>
            <TableHead />
            {query.isLoading ? (
              <tbody className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                <tr className="loader"></tr>
              </tbody>
            ) : (
              <TableBody />
            )}
          </table>
        </div>
      </div>
      <div className="p-4 flex justify-center gap-10">
        <div className="flex cursor-pointer" onClick={handlePreviousPage}>
          <ChevronLeftIcon className="w-4" color="#D8E864" />
          <p className="text-[#D0D0D0]">Previous</p>
        </div>
        <div className="flex gap-5">
          {Array(tableData.total_page_cnt)
            .fill(0)
            .map((_, idx) => {
              return (
                <Fragment key={idx}>
                  <p
                    className={` ${
                      page === idx
                        ? "text-black bg-[#D8E864]"
                        : "text-[#D0D0D0]"
                    } font-semibold px-2 rounded-sm cursor-pointer`}
                    onClick={() => {
                      const newParams = new URLSearchParams(
                        searchParams.toString()
                      );
                      newParams.set("page", idx.toString());
                      router.push(`?${newParams.toString()}`, {
                        scroll: false,
                      });
                    }}
                  >
                    {idx + 1}
                  </p>
                  {/* <p className="text-[#D0D0D0] font-semibold">2</p>
                <p className="text-[#D0D0D0] font-semibold">3</p>
                <p className="text-[#D0D0D0] font-semibold">4</p> */}
                </Fragment>
              );
            })}
        </div>
        <div className="flex cursor-pointer" onClick={handleNextPage}>
          <p className="text-[#D0D0D0]">Next</p>
          <ChevronRightIcon className="w-4" color="#D8E864" />
        </div>
      </div>
    </div>
  );
}
