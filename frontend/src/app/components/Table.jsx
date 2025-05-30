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
import getRecentMomentum from "../api/getRecentMomentum";
import getRevivedInterest from "../api/getRevivedInterest";

export function parseInfluencers(data) {
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

  const categories = [
    { key: "featuredTickersAndProjects", tag: "FEATURED TICKERS AND PROJECTS" },
    { key: "keyInsightsFromInfluencers", tag: "KEY INSIGHTS FROM INFLUENCERS" },
    {
      key: "marketSentimentAndDirections",
      tag: "MARKET SENTIMENT AND DIRECTIONS",
    },
  ];

  for (const category of categories) {
    const tagPattern = new RegExp(
      `<!-- BEGIN ${category.tag} -->[\\s\\r\\n]*((?:.*\\n)*?)[\\s\\r\\n]*<!-- END ${category.tag} -->`,
      "i"
    );

    const match = markdown.match(tagPattern);
    if (match && match[1]) {
      let content = match[1].trim();

      // Remove leading heading line if it matches the tag (e.g. "## FEATURED TICKERS AND PROJECTS")
      const lines = content.split("\n");
      if (lines[0].toUpperCase().includes(category.tag)) {
        lines.shift();
      }

      sections[category.key] = lines.join("\n").trim();
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
  const setRecentMomentum = useTableData((state) => state.setRecentMomentum);
  const setRevivedInterest = useTableData((state) => state.setRevivedInterest);
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
      const recentMomentum = await getRecentMomentum();
      const revivedInterest = await getRevivedInterest();
      const onChainData = await getOnchainActivity();

      const feedData = await getSummary();
      const section = extractCategories(feedData.summary.content);
      setFeed(section, feedData, feedData.total);

      console.log("summary content", feedData);
      console.log("summary data", section);
      console.log("data", data);
      setTableData(data);
      setTrendingMindshareScore(trendingData);
      setRecentMomentum(recentMomentum);
      setRevivedInterest(revivedInterest);
      const allInfluencers = parseInfluencers(data);
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
        <div className="absolute top-2 right-1/2 translate-x-1/2 w-1/2 h-10 bg-[var(--primary-color)] -z-10 rounded-[50px_50px_100px_100px] blur-2xl opacity-50"></div>
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
      <div className="p-4 flex flex-col sm:flex-row justify-center items-center gap-4 sm:gap-10">
        <div
          className="flex items-center cursor-pointer"
          onClick={handlePreviousPage}
        >
          <ChevronLeftIcon className="w-4" color="var(--primary-color)" />
          <p className="text-[#D0D0D0] ml-1">Previous</p>
        </div>

        <Pagination
          tableData={tableData}
          page={page}
          searchParams={searchParams}
          router={router}
        />

        <div
          className="flex items-center cursor-pointer"
          onClick={handleNextPage}
        >
          <p className="text-[#D0D0D0] mr-1">Next</p>
          <ChevronRightIcon className="w-4" color="var(--primary-color)" />
        </div>
      </div>
    </div>
  );
}
