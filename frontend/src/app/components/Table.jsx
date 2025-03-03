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
import Pagination from "./Pagination";

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

export function extractCategories(markdown) {
  const sections = {};

  // Regex to match section headers (both # and ##)
  const headerRegex = /##\s*(.*?)\n([\s\S]*?)(?=\n##|$)/g;

  let match;
  while ((match = headerRegex.exec(markdown)) !== null) {
    const header = match[1].trim();
    const content = match[2].trim();

    // Map headers to standardized keys
    if (header.toLowerCase().includes("featured tickers and projects")) {
      sections.featuredTickersAndProjects = content;
    } else if (header.toLowerCase().includes("key insights from influencers")) {
      sections.keyInsightsFromInfluencers = content;
    } else if (
      header.toLowerCase().includes("market sentiment and directions")
    ) {
      sections.marketSentimentAndDirections = content;
    }
  }

  return sections;
}


export default function Table() {
  const router = useRouter();

  const searchParams = useSearchParams();
  const page = parseInt(searchParams.get("page"));
  const feedId = parseInt(searchParams.get("feedId"));

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
      console.log("before fetching", page, feedId);
      const data = await getTableData(page);
      const trendingData = await getTrendingMindshareScore();
      const onChainData = await getOnchainActivity();

      const feedData = await getSummary();
      const section = extractCategories(feedData.summary.content);
      setFeed(section, feedData, feedData.total);

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
        <Pagination
          tableData={tableData}
          page={page}
          searchParams={searchParams}
          router={router}
        />
        <div className="flex cursor-pointer" onClick={handleNextPage}>
          <p className="text-[#D0D0D0]">Next</p>
          <ChevronRightIcon className="w-4" color="#D8E864" />
        </div>
      </div>
    </div>
  );
}
