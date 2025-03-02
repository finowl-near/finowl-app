"use client";

import { MagnifyingGlassIcon } from "@heroicons/react/24/solid";
import { StarIcon } from "@heroicons/react/24/solid";
import React, { useState } from "react";
import FunnelIcon from "./Icons/FunnelIcon";
import useSwitchTabs from "../hooks/useSwitchTabs";
import wifiIcon from "@/app/assets/svg/wifiIcon.svg";
import Image from "next/image";

export default function TableSearch() {
  const { switchTabs, setSwitchTabs } = useSwitchTabs();
  return (
    <div className="flex justify-between items-center">
      <div className="flex gap-5">
        <div
          className={`${
            !switchTabs &&
            "rounded-md p-px bg-gradient-to-r from-transparent from-30% to-[#D8E864] w-[fit-content] transition-all ease-out duration-500 "
          } `}
        >
          <button
            onClick={() => setSwitchTabs(false)}
            className={`${
              switchTabs
                ? "text-[#9D9D9D] "
                : "bg-black rounded-md px-2 py-px text-white "
            } font-normal text-lg flex items-center`}
          >
            Mindshare
          </button>
        </div>
        <div
          className={`${
            switchTabs &&
            "rounded-md p-px bg-gradient-to-r from-transparent from-30% to-[#D8E864] w-[fit-content] transition-all ease-out duration-500"
          } `}
        >
          <button
            className={`${
              switchTabs
                ? "bg-black rounded-md px-2 py-px text-white "
                : "text-[#9D9D9D] "
            } font-normal text-lg flex items-center`}
            onClick={() => setSwitchTabs(true)}
          >
            <Image
              className="mr-2"
              src={wifiIcon}
              width={undefined}
              height={undefined}
              alt="wifi icon"
            />
            Feed
          </button>
        </div>
      </div>
      <div className="flex w-[25%] justify-end items-center gap-5">
        <div className="relative overflow-hidden flex-grow">
          <MagnifyingGlassIcon
            className="w-10 p-2 absolute top-0"
            color="#D8E864"
          />
          <div className="absolute top-2 right-5 w-32 h-4 bg-[#D8E864] -z-10 rounded-[20px_20px_100px_100px] blur-xl opacity-65"></div>
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
