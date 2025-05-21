"use client";

import { MagnifyingGlassIcon } from "@heroicons/react/24/solid";
import { StarIcon } from "@heroicons/react/24/solid";
import React, { useState } from "react";
import FunnelIcon from "./Icons/FunnelIcon";
import useSwitchTabs from "../hooks/useSwitchTabs";
import wifiIcon from "@/app/assets/svg/wifiIcon.svg";
import Image from "next/image";
import ChatListIcon from "./Icons/ChatListIcon";
import WifiIcon from "./Icons/WifiIcon";
import Link from "next/link";

export default function TableSearch() {
  const { switchTabs, setSwitchTabs } = useSwitchTabs();
  return (
    <div className="flex flex-col gap-2 md:flex-row  md:justify-between md:items-center">
      <div className="flex gap-5">
        <div
          className={`${
            switchTabs === "mindshare" &&
            "bg-gradient-to-r from-transparent from-30% to-[var(--primary-color)] w-[fit-content] transition-all duration-300 ease-in-out"
          } rounded-md p-px `}
        >
          <button
            onClick={() => setSwitchTabs("mindshare")}
            className={`${
              switchTabs !== "mindshare"
                ? "text-[#9D9D9D] "
                : "bg-black/80 rounded-md  text-white "
            } font-normal px-2 py-px text-lg flex items-center`}
          >
            Mindshare
          </button>
        </div>
        <div
          className={`${
            switchTabs === "feed" &&
            " bg-gradient-to-r from-transparent from-30% to-[var(--primary-color)] w-[fit-content]"
          } rounded-md p-px transition-all duration-300 ease-in-out`}
        >
          <button
            className={`${
              switchTabs === "feed"
                ? "bg-black/80 rounded-md  text-white "
                : "text-[#9D9D9D] "
            } font-normal px-2 py-px text-lg flex items-center`}
            onClick={() => setSwitchTabs("feed")}
          >
            <WifiIcon />
            Feed
          </button>
        </div>
        <Link href={'/chat'}>
          <div
            className={`${
              switchTabs === "chat" &&
              " bg-gradient-to-r from-transparent from-30% to-[var(--primary-color)] w-[fit-content]"
            } rounded-md p-px transition-all duration-300 ease-in-out`}
          >
            <button
              className={`${
                switchTabs === "chat"
                  ? "bg-black/80 rounded-md  text-white"
                  : "text-[#9D9D9D]"
              } font-normal px-2 py-px text-lg flex items-center`}
            >
              <ChatListIcon />
              Chat
            </button>
          </div>
        </Link>
      </div>
      <div
        className={`flex justify-end items-center gap-5 ${
          switchTabs !== "mindshare" && "hidden"
        }`}
      >
        <div className="relative overflow-hidden flex-grow">
          <MagnifyingGlassIcon
            className="w-10 p-2 absolute top-0"
            color="var(--primary-color)"
          />
          <div className="absolute top-2 right-5 w-32 h-4 bg-[var(--primary-color)] -z-10 rounded-[20px_20px_100px_100px] blur-xl opacity-65"></div>
          <input
            className="bg-transparent outline-none w-full rounded-full pl-8 pr-2 py-2 border border-[#292929] text-white"
            placeholder="Search icon"
          />
        </div>
        <div>
          <button className="p-2 border border-[#292929] rounded-md">
            <FunnelIcon />
          </button>
        </div>
      </div>
    </div>
  );
}
