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
import TopInfluencers from "./TopInfluencers";
import moment from "moment";
import Link from "next/link";
import useFilter from "../hooks/useFilter";
import DophinRow from "./DophinRow";

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
  const allInfluencers = useTableData((state) => state.allInfluencers);
  const filter = useFilter((state) => state.filter);
  console.log("filter ->", filter);
  /// TODO dont forget to do spinner
  if (tableData.length === 0) {
    return (
      <tbody className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
        <tr>
          <td>
            <InboxIcon className="w-20" color="var(--primary-color)" />
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
      {tableData.tickers.map((info, idx) => {
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
                  <span className="text-[var(--primary-color)] text-base font-bold">
                    {idx + 1}
                  </span>
                  <div className="flex items-center">
                    <Link
                      href={linkToTweet}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <span className="text-[#D0D0D0] text-base font-bold ml-2">
                        {info.ticker_symbol}
                      </span>
                    </Link>
                  </div>
                </div>
              </div>
            </td>
            <td align="center" className="py-4 px-3">
              <p className="text-[var(--primary-color)] font-medium text-center">
                {Math.floor(info.mindshare_score)}
              </p>
            </td>
            <td align="center" className="py-4 px-3">
              <DophinRow/>
            </td>
            <td align="center" className="py-4 px-3">
              <p className="text-[#D0D0D0] font-medium text-center">
                {moment(info.last_mentioned_at).fromNow()}
              </p>
            </td>
            <td className="p-4">{tier}</td>
            <td align="center" className="py-4 px-3">
              <TopInfluencers
                tickerSymbol={info.ticker_symbol}
                influencersData={tableData}
              />
            </td>
            <td className="py-4 px-3">
              <div className="flex items-center w-[25rem] justify-between">
                {/* <Tooltip above={false} text={content}> */}
                <p title={content} className="text-white line-clamp-2">
                  {content}
                </p>
                {/* </Tooltip> */}
                <Link
                  href={linkToTweet}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <button className="text-[#141414] font-bold flex items-center px-2 py-px ml-5 rounded-md bg-[var(--primary-color)]">
                    <EyeIcon className="w-4 mr-1" color="#141414" />
                    View
                  </button>
                </Link>
              </div>
            </td>
          </tr>
        );
      })}
    </tbody>
  );
}
