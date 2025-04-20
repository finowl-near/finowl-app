import Image from "next/image";
import React from "react";
import czIcon from "@/app/assets/cz.png";
import StarIcon from "./Icons/StarIcon";
import {
  ArrowPathRoundedSquareIcon,
  CheckBadgeIcon,
} from "@heroicons/react/24/solid";
import { HeartIcon } from "@heroicons/react/24/outline";
import ChatIcon from "./Icons/ChatIcon";
import Link from "next/link";

export default function PopularPost() {
  return (
    <div className="p-4 h-[fit-content] relative border border-[#292929] rounded-[10px] overflow-hidden">
      <Link
        href={"https://x.com/cz_binance/status/1895553423334129716"}
        target="_blank"
        rel="noopeneer norefer"
      >
        <div className="absolute top-2 right-0 w-32 h-8 bg-[var(--primary-color)] -z-10 rounded-[0px_0px_10px_10px] blur-2xl opacity-65"></div>
        <div>
          <div className="flex items-start justify-between">
            <div className="flex">
              <Image
                className="w-9 rounded-full"
                src={czIcon}
                alt="pr icon"
                width={undefined}
                height={undefined}
              />
              <div className="ml-2">
                <div className="flex">
                  <p className="text-white font-bold text-base">CZ 🔶 BNB</p>
                  <CheckBadgeIcon
                    className="w-4"
                    color="var(--primary-color)"
                  />
                </div>
                <p className="text-[#D0D0D0] font-bold text-sm leading-none">
                  @cz_binance
                </p>
              </div>
            </div>
            <div className="flex items-center rounded-[4px] p-1 bg-[#BA98D5]/30 w-[fit-content]">
              <StarIcon />
              <p className="text-[var(--primary-color)] ml-1 text-[12px] font-bold">
                Popular post
              </p>
            </div>
          </div>
          <div>
            <p className="text-white font-[400] text-sm my-2">
              Ramadan Mubarak 🌜
            </p>
          </div>
          <div className="flex gap-5">
            <div className="flex items-center">
              <ChatIcon />
              <p className="text-white text-[12px] ml-1">326</p>
            </div>
            <div className="flex items-center">
              <ArrowPathRoundedSquareIcon
                className="w-4"
                color="var(--primary-color)"
              />
              <p className="text-white text-[12px] ml-1">312</p>
            </div>
            <div className="flex items-center">
              <HeartIcon className="w-4" color="var(--primary-color)" />
              <p className="text-white text-[12px] ml-1">1.4k</p>
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
}
