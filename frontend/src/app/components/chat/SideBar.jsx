"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import LogoIcon from "@/app/components/Icons/LogoIcon";
import { FaBars } from "react-icons/fa";
import { urbanist } from "@/app/fonts";
import { IoIosArrowBack } from "react-icons/io";
import { FiMoreHorizontal } from "react-icons/fi";
import { useRouter } from "next/navigation";
import { useWalletSelector } from "@near-wallet-selector/react-hook";
// import Dropdown from "./DropDown";
import useConversationId from "@/app/hooks/useConversationId";
import { useUserConversations } from "@/app/hooks/useUserConversations";
import { Dropdown } from "antd";
import MyDropdown from "./MyDropdown";
import { Tooltip } from "antd";

export default function SideBar({
  collapsed,
  toggle,
  setConversationHistory,
  handleStartConversation,
  conversations,
  loading,
  refresh,
  refreshBalance,
  balance,
}) {
  const { convId, setConvId } = useConversationId();
  const { signedAccountId, viewFunction, callFunction, modal, signIn } =
    useWalletSelector();
  const buttonRefs = useRef({});
  const historyCache = useRef({});
  const router = useRouter();

  const handleGetConversationHistory = async (conversationId) => {
    //   setLoading(true);
    if (historyCache.current[conversationId]) {
      console.log("cached");
      setConversationHistory(historyCache.current[conversationId]);
      return;
    }
    try {
      const result = await viewFunction({
        contractId: "finowl.testnet",
        method: "view_js_func",
        args: {
          function_name: "get_conversation_history",
          conversation_id: conversationId,
        },
      });
      console.log("Conversation history (view method):", result);
      historyCache.current[conversationId] = result;
      setConversationHistory(result);
    } catch (viewError) {
      console.log("View method failed, trying call method:", viewError);

      const result = await callFunction({
        contractId: "finowl.testnet",
        method: "view_js_func",
        args: {
          function_name: "get_conversation_history",
          conversation_id: conversationId,
        },
      });
      console.log("Conversation history (call method):", result);
      historyCache.current[conversationId] = result;
      setConversationHistory(result);
    }
  };

  useEffect(() => {
    if (!loading && convId && conversations.find((c) => c.id === convId)) {
      const btn = buttonRefs.current[convId];
      if (btn) btn.click();
    }
  }, [loading, conversations, convId]);

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 0 : 260 }}
      transition={{ type: "tween", duration: 0.3 }}
      className="h-full bg-[#2D2633] flex-shrink-0  fixed lg:static"
    >
      {/* header */}
      <div className="p-4 h-14 flex items-center space-x-2">
        <Tooltip title="close sidebar" color="#1C1A22">
          <button
            onClick={toggle}
            className="rounded-lg hover:bg-[#BA98D5]/20 transition-colors text-white"
            aria-label="Toggle sidebar"
          >
            <FaBars className="w-6 h-6" />
          </button>
        </Tooltip>
        <LogoIcon />
      </div>

      <motion.div
        initial={false}
        animate={{ opacity: collapsed ? 0 : 1 }}
        transition={{ duration: 0.2 }}
        className="py-2 pl-2 h-[calc(100%_-_3.5rem)] flex flex-col"
      >
        {/* controls */}
        <div className="flex pr-2 items-center justify-between mb-1">
          <button
            className={`flex items-center gap-2 px-2 py-2 font-semibold text-white rounded-lg hover:bg-[#BA98D5]/20 transition-colors ${urbanist.className}`}
            aria-label="Go back"
            onClick={() => router.back()}
          >
            <IoIosArrowBack className="w-5 h-5" />
            <span className="text-sm">Back</span>
          </button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              handleStartConversation();
            }}
            className={`${urbanist.className} font-semibold px-4 py-2 rounded-lg text-white bg-[radial-gradient(closest-side_at_50%_50%,#BA98D5_0%,#643989_100%)] hover:opacity-90 transition-all`}
          >
            + New
          </motion.button>
        </div>

        {/* body */}
        <div className="flex-1 overflow-y-auto relative">
          {loading ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <div
                className="w-10 h-10 border-4 border-[#BA98D5] border-t-white rounded-full animate-spin"
                aria-label="Loading..."
              />
            </div>
          ) : (
            <div className="mr-2">
              <p
                className={`${urbanist.className} text-white my-1 font-semibold`}
              >
                Conversations
              </p>
              {conversations.map((conv, i) => (
                <div
                  key={conv.id}
                  className={`hover:bg-[#BA98D5]/10 p-1 my-1 transition-colors rounded-lg flex items-center justify-between ${
                    convId === conv.id && "bg-[#BA98D5]/10"
                  }`}
                >
                  <button
                    ref={(el) => (buttonRefs.current[conv.id] = el)}
                    title={conv.id}
                    className="w-full text-left text-white truncate max-w-[220px] py-2 rounded-lg"
                    onClick={async () => {
                      handleGetConversationHistory(conv.id);
                      setConvId(conv.id, conv.tokensRemaining);
                    }}
                  >
                    {conv.id}
                  </button>
                  <MyDropdown
                    tokensLeft={conv.tokensRemaining.toFixed(2)}
                    convId={conv.id}
                    refresh={refresh}
                    refreshBalance={refreshBalance}
                    balance={balance}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </motion.aside>
  );
}
