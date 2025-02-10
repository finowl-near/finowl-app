import React from "react";
import Header from "./Header";
import TrendingMindshareScore from "./TrendingMindshareScore";
import TrendingOnchainActivity from "./TrendingOnchainActivity";
import PopularPost from "./PopularPost";
import NewPost from "./NewPost";
import TableSearch from "./TableSearch";
import Table from "./Table";
import useSwitchTabs from "../hooks/useSwitchTabs";
import Feeds from "./Feeds";
import Modal from "./Modal";

export default function LandingPage() {
  const switchTabs = useSwitchTabs((state) => state.switchTabs);
  return (
    <>
      <Header />
      <div className="grid grid-cols-[repeat(auto-fill,minmax(450px,1fr))]">
        <TrendingMindshareScore />
        <TrendingOnchainActivity />
        <div className="m-4 flex flex-col flex-wrap justify-between col-span-full br-col-span-1">
          <PopularPost />
          <NewPost />
        </div>
      </div>
      <div className="m-4">
        <TableSearch />
      </div>
      {switchTabs ? (
        <div className="m-4">
          <Modal />
          <Feeds />
        </div>
      ) : (
        <div className="m-4">
          <Table />
        </div>
      )}
    </>
  );
}
