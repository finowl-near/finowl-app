import React from "react";
import Header from "./Header";
import TrendingCoins from "./TrendingCoins";
import NewCoins from "./NewCoins";
import TotalMarketCap from "./TotalMarketCap";
import BestPreformingCoin from "./BestPreformingCoin";
import PopularPost from "./PopularPost";
import NewPost from "./NewPost";

export default function LandingPage() {
  return (
    <>
      <Header />
      <div className="grid grid-cols-[repeat(auto-fill,360px)]">
        <TrendingCoins />
        <NewCoins />
        <div className="">
          <TotalMarketCap />
          <BestPreformingCoin />
        </div>
        <div className="">
          <PopularPost />
          <NewPost />
        </div>
      </div>
    </>
  );
}
