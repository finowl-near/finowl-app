"use client";

import Image from "next/image";
import React, { useMemo } from "react";
import dophin from "@/app/assets/svg/dophin.svg";
import whale from "@/app/assets/svg/whale.svg";

function formatK(value) {
  return (value / 1000).toFixed(2) + "k";
}

export default function TradersVolume({ dolphinValue, whaleValue }) {
  const dolphinVolume = useMemo(
    () => Math.floor(Math.random() * 9000) + 1000,
    []
  );
  const whaleVolume = useMemo(
    () => Math.floor(Math.random() * 90000) + 10000,
    []
  );
  const totalVolume = dolphinVolume + whaleVolume;
  return (
    <div>
      <p className="text-[#D0D0D0]">Total Volume Traded:</p>
      <span className="text-5xl text-[var(--primary-color)] font-bold">
        {totalVolume.toLocaleString()}$
      </span>
      <div className="flex gap-3 mt-2">
        <div className="border flex items-center gap-2 p-2 border-[#A1CAE0] bg-[#203039] rounded-lg">
          <Image
            className="w-12"
            src={dophin}
            width={undefined}
            height={undefined}
            alt="dophin icon "
          />
          <div>
            <p className="text-[#A1CAE0] text-sm">
              Traders:{" "}
              <span className="text-white font-bold">{dolphinValue}</span>
            </p>
            <p className="text-[#A1CAE0] text-sm">
              Volume:{" "}
              <span className="text-white font-bold">
                {formatK(dolphinVolume)}
              </span>
            </p>
          </div>
        </div>
        <div className="border flex items-center gap-2 p-2 border-[#3164DD] bg-[#1F2B37] rounded-lg">
          <Image
            className="w-12"
            src={whale}
            width={undefined}
            height={undefined}
            alt="dophin icon "
          />
          <div>
            <p className="text-[#719BFD] text-sm">
              Traders:{" "}
              <span className="text-white font-bold">{whaleValue}</span>
            </p>
            <p className="text-[#719BFD] text-sm">
              Volume:{" "}
              <span className="text-white font-bold">
                {formatK(whaleVolume)}
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
