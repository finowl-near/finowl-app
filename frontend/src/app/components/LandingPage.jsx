"use client";

import React, { useEffect, useCallback, useState } from "react";
import { usePathname, useRouter } from "next/navigation"; // Import useRouter
import Header from "./Header";
import TrendingMindshareScore from "./TrendingMindshareScore";
import TrendingOnchainActivity from "./TrendingOnchainActivity";
import PopularPost from "./PopularPost";
import NewPost from "./NewPost";
import TableSearch from "./TableSearch";
import Table from "./Table";
import useSwitchTabs from "../hooks/useSwitchTabs";
// import Feeds0 from "./Feeds0";
import { useSearchParams } from "next/navigation";
import Feeds from "./Feeds";
// import Chat from "./Chat";
import OnBoarding from "./onboarding/OnBoarding";
import Modal from "./Modal";
import RecentMomentum from "./RecentMomentum";
import RevivedInterest from "./RevivedInterest";

export default function LandingPage() {
  const switchTabs = useSwitchTabs((state) => state.switchTabs);
  const router = useRouter();
  const searchParams = useSearchParams();

  // Memoize the function to update query params
  const setInitialPageParam = useCallback(() => {
    if (!searchParams.get("page")) {
      const newParams = new URLSearchParams(searchParams.toString());
      newParams.set("page", "0");
      router.replace(`?${newParams.toString()}`, { scroll: false });
    }
  }, [searchParams, router]);

  useEffect(() => {
    setInitialPageParam();
  }, [setInitialPageParam]);

  return (
    <>
      <div
        className={`grid grid-cols-[repeat(auto-fill,minmax(350px,1fr))] sm:grid-cols-[repeat(auto-fill,minmax(450px,1fr))] ${
          switchTabs === "chat" && "hidden"
        }`}
      >
        <TrendingMindshareScore />
        {/*///Recent Momentum*/}
        <RecentMomentum />
        {/*///Revived Interest*/}
        <RevivedInterest />
      </div>
      <div className="m-4">
        <TableSearch />
      </div>
      {switchTabs === "mindshare" ? (
        <div className="m-4">
          <Table />
        </div>
      ) : switchTabs === "feed" ? (
        <div className="m-4">
          {/* <Modal /> */}
          {/* <Feeds0 /> */}
          <Feeds />
        </div>
      ) : (
        <></>
      )}
    </>
  );
}
