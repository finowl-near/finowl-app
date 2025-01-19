import React from "react";
import CoinLogo from "../assets/svg/coinLogo.svg";
import Image from "next/image";
import { StarIcon } from "@heroicons/react/24/outline";
import prIcon from "@/app/assets/svg/ProfileIcon.svg";
import { EyeIcon } from "@heroicons/react/24/solid";
import useTableData from "../hooks/useTableData";

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
            <td className=" p-4">
              <div className="flex">
                <StarIcon className="w-6 mr-4" color="white" />
                <div className="flex gap-4">
                  <span className="text-[#D8E864] text-md font-bold">
                    {idx + 1}
                  </span>
                  <div className="flex items-center">
                    <Image
                      src={CoinLogo}
                      alt="Coin Logo"
                      width={20}
                      height={20}
                    />
                    <span className="text-[#D0D0D0] text-md font-bold ml-2">
                      {info.ticker_symbol}
                    </span>
                  </div>
                </div>
              </div>
            </td>
            <td align="center" className="p-4">
              <p className="text-[#D8E864] font-medium text-center">
                {Math.floor(info.mindshare_score)}
              </p>
            </td>
            <td align="center" className="p-4">
              <p className="text-[#D0D0D0] font-medium text-center">$5.27</p>
            </td>
            <td align="center" className="p-4">
              <p className="text-[#D0D0D0] font-medium text-center">$34M</p>
            </td>
            <td className="p-4">{tier}</td>
            <td align="center" className="p-4">
              <div className="flex items-center justify-center relative">
                <Image
                  className="w-9 absolute left-10"
                  src={prIcon}
                  alt="pr icon"
                  width={undefined}
                  height={undefined}
                />
                <Image
                  className="w-9 absolute left-5"
                  src={prIcon}
                  alt="pr icon"
                  width={undefined}
                  height={undefined}
                />
                <Image
                  className="w-9 absolute left-0"
                  src={prIcon}
                  alt="pr icon"
                  width={undefined}
                  height={undefined}
                />
              </div>
            </td>
            <td className="p-4">
              <div className="flex items-center w-[25rem] justify-between">
                <p
                  className="text-white truncate whitespace-nowrap "
                  title={content}
                >
                  {content}
                </p>
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
