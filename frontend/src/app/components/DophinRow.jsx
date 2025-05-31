"use client";

import React, { useMemo } from "react";
import dophin from "@/app/assets/svg/dophin.svg";
import whale from "@/app/assets/svg/whale.svg";
import Image from "next/image";
import TradersVolume from "./TradersVolume";
import Tooltip from "./Tooltip";

export default function DophinRow() {
  const dolphinValue = useMemo(() => Math.floor(Math.random() * 9) + 1, []);
  const whaleValue = useMemo(() => Math.floor(Math.random() * 9) + 1, []);
  return (
    <Tooltip
      above={true}
      text={
        <TradersVolume dolphinValue={dolphinValue} whaleValue={whaleValue} />
      }
    >
      <div className="relative h-full flex items-center justify-center">
        <Image
          className="w-12 absolute left-1 z-10 "
          src={dophin}
          width={undefined}
          height={undefined}
          alt="dophin icon "
        />
        <Image
          className="w-12 absolute right-[23px] mask"
          src={whale}
          width={undefined}
          height={undefined}
          alt="dophin icon "
        />
        <span className="absolute top-2 right-[55%] z-10 h-5 w-5 p-1 flex items-center justify-center rounded-full border-2 border-black bg-[#B0DEF6] text-black font-semibold">
          {dolphinValue}
        </span>
        <span className="absolute top-2 right-5 h-5 w-5 p-1 border-2 border-black flex items-center  justify-center rounded-full bg-[#356FF9] text-black font-semibold">
          {whaleValue}
        </span>
      </div>
    </Tooltip>
  );
}
