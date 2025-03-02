import Image from "next/image";
import React, { useRef, useState } from "react";
import feed1 from "@/app/assets/svg/Feed1.svg";
import feed2 from "@/app/assets/svg/Feed2.svg";
import feed3 from "@/app/assets/svg/Feed3.svg";
import calenderIcon from "@/app/assets/svg/calenderIcon.svg";
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/solid";
import Modal from "./Modal";
import useModal from "../hooks/useModal";
import useTableData from "../hooks/useTableData";
import ReactMarkdown from "react-markdown";
import moment from "moment";
import getSummary from "../api/getSummary";
import { useRouter, useSearchParams } from "next/navigation";
import { extractCategories } from "./Table";

export default function Feeds() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const feedId = parseInt(searchParams.get("feedId"));
  const setModalOpen = useModal((state) => state.setModalOpen);
  const feed = useTableData((state) => state.feed);
  const feedData = useTableData((state) => state.feedData);
  const setFeed = useTableData((state) => state.setFeed);
  console.log("inside feed", feed, feedData);
  const inputRef = useRef(null);

  async function handleNextFeed() {
    if (feedId < feedData.total) {
      const newFeedId = feedId + 1;
      const newFeedData = await getSummary(newFeedId);
      const section = extractCategories(newFeedData.summary.content);
      setFeed(section, feedData);
      const newParams = new URLSearchParams(searchParams.toString());
      newParams.set("feedId", newFeedId.toString());
      router.replace(`?${newParams.toString()}`, { scroll: false });
    }
    console.log("handle next", feedId);
  }

  async function handlePreviousFeed() {
    if (feedId > 1) {
      const newFeedId = feedId - 1;
      const newFeedData = await getSummary(newFeedId);
      const section = extractCategories(newFeedData.summary.content);
      setFeed(section, feedData);
      const newParams = new URLSearchParams(searchParams.toString());
      newParams.set("feedId", newFeedId.toString());
      router.replace(`?${newParams.toString()}`, { scroll: false });
    }
    console.log("handle prev", feedId);
  }

  return (
    <>
      <div className="relative overflow-hidden rounded-[20px] p-[10px] border border-[#292929]">
        <div className="flex justify-end">
          <button
            className="text-[#D0D0D0] py-2"
            onClick={() => setModalOpen(true)}
          >
            Expand <span className="text-[#D8E864]">{">"}</span>
          </button>
        </div>
        <div className="rounded-[10px] relative mb-4">
          <Image
            className="rounded-[10px] absolute -z-10"
            src={feed1}
            width={undefined}
            height={undefined}
            alt="feed 1 icon"
          />
          <div className="flex items-start justify-between">
            <h1 className="pt-3 ml-28 font-medium text-[16px] md:text-[20px] lg:text-[40px] text-[#D5D5D5]">
              Featured Tickers &<br /> Projects
            </h1>
            <div className="px-10 py-6 w-[63%] group bg-[#0F0F0F]/40 rounded-[10px] border border-[#384000]">
              <div className="text-white text-sm md:text-base lg:text-xl overflow-hidden max-h-20  transition-all duration-500 ease-in-out group-hover:max-h-[1500px]">
                {/* { feed["Featured Tickers and Projects"] } */}
                <ReactMarkdown

                // rehypePlugins={[rehypeRaw]}
                // remarkPlugins={[remarkGfm]}
                >
                  {feed["featuredTickersAndProjects"]}
                </ReactMarkdown>
              </div>
            </div>
          </div>
        </div>
        <div className="rounded-[10px] relative mb-4">
          <Image
            className="rounded-[10px] absolute -z-10"
            src={feed2}
            width={undefined}
            height={undefined}
            alt="feed 2 icon"
          />
          <div className="flex items-start justify-between">
            <h1 className="pt-3 ml-28 text-[16px] md:text-[20px] lg:text-[40px] font-medium text-[#D5D5D5]">
              Key Insights from
              <br /> Influencers
            </h1>
            <div className="px-10 py-6 w-[63%] group bg-[#0F0F0F]/40 rounded-[10px] border border-[#384000]">
              <div className="text-white text-xl overflow-hidden max-h-20  transition-all duration-500 ease-in-out group-hover:max-h-[1500px]">
                <ReactMarkdown
                // rehypePlugins={[rehypeRaw]}
                // remarkPlugins={[remarkGfm]}
                >
                  {feed["keyInsightsFromInfluencers"]}
                </ReactMarkdown>
              </div>
            </div>
          </div>
        </div>
        <div className="rounded-[10px] relative">
          <Image
            className="rounded-[10px] absolute -z-10"
            src={feed3}
            width={undefined}
            height={undefined}
            alt="feed 3 icon"
          />
          <div className="flex items-start justify-between">
            <h1 className=" pt-3 ml-28 text-[16px] md:text-[20px] lg:text-[40px] font-medium text-[#D5D5D5]">
              Market Sentiment &<br /> Direction
            </h1>
            <div className="px-10 py-6 w-[63%] group bg-[#0F0F0F]/40 rounded-[10px] border border-[#384000]">
              <div className="text-white text-xl overflow-hidden max-h-20  transition-all duration-500 ease-in-out group-hover:max-h-[1500px]">
                <ReactMarkdown
                // rehypePlugins={[rehypeRaw]}
                // remarkPlugins={[remarkGfm]}
                >
                  {feed["marketSentimentAndDirections"]}
                </ReactMarkdown>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="p-4 flex justify-center gap-10">
        <div
          className="flex items-center cursor-pointer"
          onClick={handlePreviousFeed}
        >
          <ChevronLeftIcon className="w-4" color="#D8E864" />
          <p className="text-[#D0D0D0]">Previous</p>
        </div>
        <div className="flex items-center gap-5">
          <p className="text-black font-semibold px-2 py-px rounded-md bg-[#D8E864]">
            {moment(feedData.summary.timestamp).format("MMMM Do")}
          </p>
          <input
            ref={inputRef}
            className="invisible absolute w-0 h-0"
            type="date"
            id="feeddate"
            onChange={(e) => {
              /// TODO: need to capture date and display it
              console.log(e.target.value);
            }}
          />
          <button
            className="border border-[#292929] p-1 rounded-md"
            onClick={() => inputRef.current?.showPicker()}
          >
            <Image
              className=""
              src={calenderIcon}
              width={undefined}
              height={undefined}
              alt="calender icon"
            />
          </button>
        </div>
        <div
          className="flex items-center cursor-pointer"
          onClick={handleNextFeed}
        >
          <p className="text-[#D0D0D0]">Next</p>
          <ChevronRightIcon className="w-4" color="#D8E864" />
        </div>
      </div>
    </>
  );
}
