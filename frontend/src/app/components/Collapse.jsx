"use client";

import { ChevronDownIcon, ChevronUpIcon } from "@heroicons/react/24/solid";
import React, { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import useTableData from "../hooks/useTableData";
import { EyeIcon, InboxIcon } from "@heroicons/react/24/solid";


export default function Collapse({ feedList, choose, handleShowFeed }) {
  const feed = useTableData((state) => state.feed);
  const [collapsed, setCollapsed] = useState(false);

  const contentRef = useRef(null);
  function handleCollapse() {
    setCollapsed((prev) => !prev);
  }

  return (
    <>
      <div className="text-white">
        <div
          className="flex justify-between p-2 rounded-t-[15px] cursor-pointer bg-gradient-to-b from-[#BA98D5] to-[#643989]"
          onClick={handleCollapse}
        >
          <p className="font-medium ">{feedList[choose].title}</p>
          {collapsed ? (
            <ChevronUpIcon className="w-6" color="white" />
          ) : (
            <ChevronDownIcon className="w-6" color="white" />
          )}
        </div>
      </div>
      <div
        ref={contentRef}
        className={`transition-all duration-500 ease-in-out`}
        style={{
          maxHeight: collapsed ? contentRef.current?.scrollHeight : 0,
          overflow: "hidden",
          opacity: collapsed ? 1 : 0,
        }}
      >
        <div className="bg-[#BA98D5]/30 rounded-b-[15px] mb-2">
          <li className="list-none">
            <ul
              className={`p-2 cursor-pointer ${
                choose === 0
                  ? "bg-[var(--primary-color)] text-white"
                  : "bg-[var(--primary-color)]/26 text-[#B0B0D4]"
              } `}
              onClick={() => {
                handleShowFeed(0);
                handleCollapse();
              }}
            >
              {feedList[0].title}
            </ul>
            <ul
              className={`p-2 cursor-pointer ${
                choose === 1
                  ? "bg-[var(--primary-color)] text-white"
                  : "bg-[var(--primary-color)]/26 text-[#B0B0D4]"
              }`}
              onClick={() => {
                handleShowFeed(1);
                handleCollapse();
              }}
            >
              {feedList[1].title}
            </ul>
            <ul
              className={`p-2 cursor-pointer rounded-b-[15px] ${
                choose === 2
                  ? "bg-[var(--primary-color)] text-white"
                  : "bg-[var(--primary-color)]/26 text-[#B0B0D4]"
              }`}
              onClick={() => {
                handleShowFeed(2);
                handleCollapse();
              }}
            >
              {feedList[2].title}
            </ul>
          </li>
        </div>
      </div>
      {
        !feedList[choose].feed ? (
          <div className="flex flex-col items-center justify-center text-center h-64 w-full">
            <InboxIcon className="w-16 h-16 text-[var(--primary-color)] mb-2" />
            <p className="text-[#D5D5D5] font-semibold">No data</p>
          </div>
        ) :(
          <div
            className={`p-2 text-white border border-[#292929] ${
              collapsed ? "rounded-[15px]" : "rounded-b-[15px]"
            } `}
          >
            <ReactMarkdown>{feedList[choose].feed}</ReactMarkdown>
          </div>
        )
      }
    </>
  );
}
