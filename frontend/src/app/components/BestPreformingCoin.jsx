import React from "react";
import DogCoinIcon from "@/app/assets/svg/dogCoin.svg";
import Image from "next/image";

export default function BestPreformingCoin() {
  return (
    <div className="p-4 h-[fit-content] relative mx-4 border border-[#292929] rounded-[10px] overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-8 bg-[#D8E864] rounded-[0px_0px_10px_10px] blur-2xl opacity-65"></div>
      <p className="text-xl font-bold text-white">Best performing coin</p>
      <div className="flex py-2 items-end">
        <div className="flex">
          <Image
            src={DogCoinIcon}
            alt="Dog coin icon"
            width={undefined}
            height={undefined}
          />
          <div className="ml-2 flex flex-col">
            <span className="text-[#D0D0D0] text-md font-bold">$BONK</span>
            <span className="text-[#D8E864] leading-none text-[2.5rem] font-bold">
              $0.005
            </span>
          </div>
        </div>
        <p className="text-[#D8E864] ml-3 font-bold">+39.71% 7D</p>
      </div>
    </div>
  );
}
