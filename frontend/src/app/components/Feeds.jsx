"use client";

import Image from "next/image";
import React, { useRef, useState } from "react";
import calenderIcon from "@/app/assets/svg/calenderIcon.svg";
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/solid";
import moment from "moment";
import getSummary from "../api/getSummary";
import useTableData from "../hooks/useTableData";
import { useRouter, useSearchParams } from "next/navigation";
import { extractCategories } from "./Table";
import ReactMarkdown from "react-markdown";
import CalendarIcon from "./Icons/CalendarIcon";
import Collapse from "./Collapse";
import { EyeIcon, InboxIcon } from "@heroicons/react/24/solid";
import useFilter from "../hooks/useFilter";

export default function Feeds() {
  const feed = useTableData((state) => state.feed);
  const feedData = useTableData((state) => state.feedData);
  const setFeed = useTableData((state) => state.setFeed);
  const feedId = useTableData((state) => state.feedId);
  const filter = useFilter((state) => state.filter);
  const inputRef = useRef(null);

  const feedList = [
    {
      title: "Featured Tickers & Projects",
      feed: feed && feed["featuredTickersAndProjects"],
    },
    {
      title: "Key Insights from Influencers",
      feed: feed && feed["keyInsightsFromInfluencers"],
    },
    {
      title: "Market Sentiment & Direction",
      feed: feed && feed["marketSentimentAndDirections"],
    },
  ];
  const [choose, setChoose] = useState(0);

  function handleShowFeed(idx) {
    setChoose(idx);
  }

  async function handleNextFeed() {
    if (feedId < feedData.total) {
      const newFeedId = feedId + 1;
      const newFeedData = await getSummary(filter, newFeedId);
      const section = extractCategories(newFeedData.summary.content);
      setFeed(section, newFeedData, newFeedId);
    }
  }

  async function handlePreviousFeed() {
    if (feedId > 1) {
      const newFeedId = feedId - 1;
      const newFeedData = await getSummary(filter, newFeedId);
      const section = extractCategories(newFeedData.summary.content);
      setFeed(section, newFeedData, newFeedId);
    }
  }
  return (
    <>
      <div className="text-white hidden md:block border border-[#292929] rounded-[15px]">
        <div className="grid grid-cols-3">
          <p
            className={` text-center font-medium p-2 rounded-tl-[15px] cursor-pointer ${
              choose === 0
                ? "text-white bg-gradient-to-b from-[#BA98D5] to-[#643989]"
                : "text-[#B0B0D4]/70 bg-[#BA98D5]/25"
            } `}
            onClick={() => handleShowFeed(0)}
          >
            {feedList[0].title}
          </p>
          <p
            className={`text-center font-medium p-2 cursor-pointer ${
              choose === 1
                ? "text-white bg-gradient-to-b from-[#BA98D5] to-[#643989]"
                : "text-[#B0B0D4]/70 bg-[#BA98D5]/25"
            }`}
            onClick={() => handleShowFeed(1)}
          >
            {feedList[1].title}
          </p>
          <p
            className={`text-center font-medium p-2 cursor-pointer rounded-tr-[15px] ${
              choose === 2
                ? "text-white bg-gradient-to-b from-[#BA98D5] to-[#643989]"
                : "text-[#B0B0D4]/70 bg-[#BA98D5]/25"
            }`}
            onClick={() => handleShowFeed(2)}
          >
            {feedList[2].title}
          </p>
        </div>
        {!feedList[choose].feed ? (
          <div className="flex flex-col items-center justify-center text-center h-64 w-full">
            <InboxIcon className="w-16 h-16 text-[var(--primary-color)] mb-2" />
            <p className="text-[#D5D5D5] font-semibold">No data</p>
          </div>
        ) : (
          <div className="text-white p-5">
            <ReactMarkdown>{feedList[choose].feed}</ReactMarkdown>
          </div>
        )}
      </div>
      <div className="block md:hidden">
        <Collapse
          feedList={feedList}
          choose={choose}
          handleShowFeed={handleShowFeed}
        />
      </div>
      <div className="p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 md:gap-10">
        {/* Update Text */}
        <div className="text-[#D0D0D0] text-sm sm:text-base">
          Updated Every <span className="text-[#BA98D5]">4 hours</span>
        </div>

        {/* Controls Section */}
        <div className="flex flex-wrap md:flex-nowrap justify-start md:justify-between items-center gap-4 md:gap-6 w-full md:w-auto">
          {/* Previous Button */}
          <div
            className="flex items-center gap-1 cursor-pointer"
            onClick={() => {
              if (feedList[choose].feed) {
                handlePreviousFeed();
              }
            }}
          >
            <ChevronLeftIcon className="w-4" color="var(--primary-color)" />
            <p className="text-[#D0D0D0] text-sm sm:text-base">Previous</p>
          </div>

          {/* Date Display & Picker */}
          <div className="flex items-center gap-3">
            <p className="text-black font-semibold text-xs sm:text-sm px-2 py-px rounded-md bg-[var(--primary-color)]">
              {feedData
                ? moment(feedData.summary.timestamp).format("MMMM Do, hA")
                : moment(new Date()).format("MMMM Do, hA")}
            </p>
            <input
              ref={inputRef}
              className="invisible absolute w-0 h-0"
              type="date"
              id="feeddate"
              onChange={(e) => {
              }}
            />
            <button
              className="border border-[#292929] p-1 rounded-md"
              onClick={() => inputRef.current?.showPicker()}
            >
              <CalendarIcon />
            </button>
          </div>

          {/* Next Button */}
          <div
            className="flex items-center gap-1 cursor-pointer"
            onClick={() => {
              if (feedList[choose].feed) {
                handleNextFeed();
              }
            }}
          >
            <p className="text-[#D0D0D0] text-sm sm:text-base">Next</p>
            <ChevronRightIcon className="w-4" color="var(--primary-color)" />
          </div>
        </div>
      </div>
    </>
  );
}
