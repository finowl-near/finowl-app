import React, { useRef } from "react";
import feed1 from "@/app/assets/svg/Feed1.svg";
import feed2 from "@/app/assets/svg/Feed2.svg";
import feed3 from "@/app/assets/svg/Feed3.svg";
import Image from "next/image";
import calenderIcon from "@/app/assets/svg/calenderIcon.svg";

import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/solid";
import useModal from "../hooks/useModal";

export default function Modal() {
  const { isOpen, setModalOpen } = useModal();
  const inputRef1 = useRef(null);
  if (!isOpen) return null;
  return (
    <div className="h-screen mx-auto max-w-[1600px] fixed top-0 overflow-auto z-50 p-10 bg-black/10 backdrop-blur-xl">
      <div className="flex justify-between">
        <div className="">
          <button
            className="text-[#D0D0D0] py-2"
            onClick={() => setModalOpen(false)}
          >
            <span className="text-[#D8E864]">{"<"}</span>Back
          </button>
        </div>
        <div className="">
          <p className="text-[#D0D0D0] py-2 font-semibold">
            Feb 4th <span className="text-[#D8E864]">Feed</span>
          </p>
        </div>
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
            <p className="text-white text-sm md:text-base lg:text-xl ">
              Kyle Chassé predicting an upcoming "supply shock" in the market
              Multiple influencers suggesting potential upside for MICRO token
              General optimism about Bitcoin as a hedge against global economic
              concerns Kyle Chassé predicting an upcoming "supply shock" in the
              market Multiple influencers suggesting potential upside for MICRO
              token General optimism about Bitcoin as a hedge against global
              economic concerns Kyle Chassé predicting an upcoming "supply
              shock" in the market Multiple influencers suggesting potential
              upside for MICRO token General optimism about Bitcoin as a hedge
              against global economic concerns Kyle Chassé predicting an
              upcoming "supply shock" in the market Multiple influencers
              suggesting potential upside for MICRO token General optimism about
              Bitcoin as a hedge against global economic concerns
            </p>
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
            <p className="text-white text-xl ">
              Kyle Chassé predicting an upcoming "supply shock" in the market
              Multiple influencers suggesting potential upside for MICRO token
              General optimism about Bitcoin as a hedge against global economic
              concerns Kyle Chassé predicting an upcoming "supply shock" in the
              market Multiple influencers suggesting potential upside for MICRO
              token General optimism about Bitcoin as a hedge against global
              economic concerns Kyle Chassé predicting an upcoming "supply
              shock" in the market Multiple influencers suggesting potential
              upside for MICRO token General optimism about Bitcoin as a hedge
              against global economic concerns Kyle Chassé predicting an
              upcoming "supply shock" in the market Multiple influencers
              suggesting potential upside for MICRO token General optimism about
              Bitcoin as a hedge against global economic concerns Kyle Chassé
              predicting an upcoming "supply shock" in the market Multiple
              influencers suggesting potential upside for MICRO token General
              optimism about Bitcoin as a hedge against global economic concerns
            </p>
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
            <p className="text-white text-xl">
              Kyle Chassé predicting an upcoming "supply shock" in the market
              Multiple influencers suggesting potential upside for MICRO token
              General optimism about Bitcoin as a hedge against global economic
              concerns Kyle Chassé predicting an upcoming "supply shock" in the
              market Multiple influencers suggesting potential upside for MICRO
              token General optimism about Bitcoin as a hedge against global
              economic concerns Kyle Chassé predicting an upcoming "supply
              shock" in the market Multiple influencers suggesting potential
              upside for MICRO token General optimism about Bitcoin as a hedge
              against global economic concerns Kyle Chassé predicting an
              upcoming "supply shock" in the market Multiple influencers
              suggesting potential upside for MICRO token General optimism about
              Bitcoin as a hedge against global economic concerns
            </p>
          </div>
        </div>
      </div>
      <div className="p-4 flex justify-center gap-10">
        <div className="flex items-center cursor-pointer">
          <ChevronLeftIcon className="w-4" color="#D8E864" />
          <p className="text-[#D0D0D0]">Previous day</p>
        </div>
        <div className="flex items-center gap-5">
          <p className="text-black font-semibold px-2 py-px rounded-md bg-[#D8E864]">
            Jan 17
          </p>
          <input
            ref={inputRef1}
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
            onClick={() => inputRef1.current?.showPicker()}
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
        <div className="flex items-center cursor-pointer">
          <p className="text-[#D0D0D0]">Next day</p>
          <ChevronRightIcon className="w-4" color="#D8E864" />
        </div>
      </div>
    </div>
  );
}
