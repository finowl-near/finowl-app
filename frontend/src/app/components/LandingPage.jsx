import React from "react";
import Header from "./Header";
import TrendingCoins from "./TrendingCoins";
import NewCoins from "./NewCoins";
import TotalMarketCap from "./TotalMarketCap";
import BestPreformingCoin from "./BestPreformingCoin";
import PopularPost from "./PopularPost";
import NewPost from "./NewPost";
import TableSearch from "./TableSearch";
import Table from "./Table";

export default function LandingPage() {
  return (
    <>
      <Header />
      <div className="grid grid-cols-[repeat(auto-fill,minmax(350px,1fr))]">
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
      <div className="m-4">
        <TableSearch />
      </div>
      <div className="m-4">
        <Table />
      </div>
    </>
  );
}
