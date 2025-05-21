"use client";

import React, { useEffect, useRef, useState } from "react";

import SideBar from "./SideBar";
import ChatHeader from "./ChatHeader";
import ChatMessages from "./ChatMessages";

export default function Chat() {
  const [collapsed, setCollapsed] = useState(false);
  function toggle() {
    setCollapsed((prev) => !prev);
  }
  return (
    <div className="h-screen flex overflow-hidden">
      <SideBar toggle={toggle} collapsed={collapsed} />

      {/* Main content */}
      <div className="flex-1 flex flex-col w-[calc(100%_-_260px)]">
        <ChatHeader toggle={toggle} collapsed={collapsed} />

        <ChatMessages />
      </div>
    </div>
  );
}
