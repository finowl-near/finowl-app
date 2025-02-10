import React from "react";
import CoinLogo from "../assets/svg/coinLogo.svg";
import Image from "next/image";
import { StarIcon } from "@heroicons/react/24/outline";
import prIcon from "@/app/assets/svg/ProfileIcon.svg";
import { EyeIcon, InboxIcon } from "@heroicons/react/24/solid";
import useTableData from "../hooks/useTableData";
import DophinIcon from "./Icons/DophinIcon";
import Tooltip from "./Tooltip";
import TradersVolume from "./TradersVolume";
import dophin from "@/app/assets/svg/dophin.svg";
import whale from "@/app/assets/svg/whale.svg";

const UnderRadar = (
  <div className="flex justify-center">
    <div className="flex items-center bg-[#32CD32]/30 px-2 py-px border border-[#60FF60] rounded-full w-[fit-content]">
      <span className="block mr-2 w-2 h-2 rounded-full bg-[#60FF60]"></span>
      <p className="text-[#60FF60] whitespace-nowrap">Under Radar</p>
    </div>
  </div>
);

const HightAlpha = (
  <div className="flex justify-center">
    <div className="flex items-center bg-[#FF6347]/30 px-2 py-px border border-[#FF6B34] rounded-full w-[fit-content]">
      <span className="block mr-2 w-2 h-2 rounded-full bg-[#FF6B34]"></span>
      <p className="text-[#FF6B34] whitespace-nowrap">High Alpha</p>
    </div>
  </div>
);

const Alpha = (
  <div className="flex justify-center">
    <div className="flex items-center bg-[#1E90FF]/30 px-2 py-px border border-[#00BFFF] rounded-full w-[fit-content]">
      <span className="block mr-2 w-2 h-2 rounded-full bg-[#00BFFF]"></span>
      <p className="text-[#00BFFF] whitespace-nowrap">Alpha</p>
    </div>
  </div>
);

export default function TableBody() {
  const tableData = useTableData((state) => state.tableData);
  console.log("body", tableData);
  /// TODO dont forget to do spinner
  if (tableData.length === 0) {
    return (
      <tbody className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
        <tr>
          <td>
            <InboxIcon className="w-20" color="#D8E864" />
          </td>
        </tr>
        <tr>
          <td className="text-center font-semibold text-[#D5D5D5]">No data</td>
        </tr>
      </tbody>
    );
  }
  return (
    <tbody>
      {tableData.map((info, idx) => {
        const content = Object.values(info.mention_details.influencers)[0]
          .content;
        const linkToTweet = Object.values(info.mention_details.influencers)[0]
          .tweet_link;
        const tier =
          info.category === "Trenches"
            ? UnderRadar
            : info.category === "Alpha"
            ? Alpha
            : HightAlpha;
        return (
          <tr key={idx} className="">
            <td className=" py-4 px-3">
              <div className="flex">
                <StarIcon className="w-6 mr-4" color="white" />
                <div className="flex gap-4">
                  <span className="text-[#D8E864] text-base font-bold">
                    {idx + 1}
                  </span>
                  <div className="flex items-center">
                    {/* <Image
                      src={CoinLogo}
                      alt="Coin Logo"
                      width={20}
                      height={20}
                    /> */}
                    <span className="text-[#D0D0D0] text-base font-bold ml-2">
                      {info.ticker_symbol}
                    </span>
                  </div>
                </div>
              </div>
            </td>
            <td align="center" className="py-4 px-3">
              <p className="text-[#D8E864] font-medium text-center">
                {Math.floor(info.mindshare_score)}
              </p>
            </td>
            <td align="center" className="py-4 px-3">
              <Tooltip above={true} text={<TradersVolume />}>
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
                    5
                  </span>
                  <span className="absolute top-2 right-5 h-5 w-5 p-1 border-2 border-black flex items-center  justify-center rounded-full bg-[#356FF9] text-black font-semibold">
                    5
                  </span>
                </div>
              </Tooltip>
            </td>
            <td align="center" className="py-4 px-3">
              <p className="text-[#E02828] font-medium text-center">-0.2%</p>
            </td>
            <td align="center" className="py-4 px-3">
              <p className="text-[#D0D0D0] font-medium text-center">9min ago</p>
            </td>
            <td className="p-4">{tier}</td>
            <td align="center" className="py-4 px-3">
              <div className="flex items-center justify-center relative">
                <div className="w-10 h-10 flex absolute left-0 z-20 justify-center items-center rounded-full bg-[#FF6347]/30 border border-[#FF6B34]">
                  <p className="text-[#FF6B34] font-semibold text-lg ">5</p>
                </div>
                <div className="w-10 h-10 mask flex absolute left-8 z-10 justify-center items-center rounded-full bg-[#1E90FF]/30 border border-[#00BFFF]">
                  <p className="text-[#00BFFF] font-semibold text-lg ">3</p>
                </div>
                <div className="w-10 h-10 mask flex absolute left-16 justify-center items-center rounded-full bg-[#32CD32]/30 border border-[#60FF60]">
                  <p className="text-[#60FF60] font-semibold text-lg ">1</p>
                </div>
              </div>
            </td>
            <td className="py-4 px-3">
              <div className="flex items-center w-[25rem] justify-between">
                {/* <Tooltip above={false} text={content}> */}
                <p title={content} className="text-white line-clamp-2">
                  {content}
                </p>
                {/* </Tooltip> */}
                <a href={linkToTweet} target="_blank" rel="noopener noreferrer">
                  <button className="text-[#141414] font-bold flex items-center px-2 py-px ml-5 rounded-md bg-[#D8E864]">
                    <EyeIcon className="w-4 mr-1" color="#141414" />
                    View
                  </button>
                </a>
              </div>
            </td>
          </tr>
        );
      })}
    </tbody>
  );
}
