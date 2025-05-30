"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "motion/react";

import SideBar from "./SideBar";
import ChatHeader from "./ChatHeader";
import ChatMessages from "./ChatMessages";
import { urbanist } from "@/app/fonts";
import { useWalletSelector } from "@near-wallet-selector/react-hook";
import useConversationId from "@/app/hooks/useConversationId";
import { useUserConversations } from "@/app/hooks/useUserConversations";
import { useUserBlance } from "@/app/hooks/useUserBalance";
import { toast, Toaster } from "sonner";
import { CONTRACT_ID } from "@/app/Wallets/near";

export default function Chat() {
  const { signedAccountId, callFunction, viewFunction } = useWalletSelector();
  const { convId, setConvId } = useConversationId();
  const [collapsed, setCollapsed] = useState(false);
  const [conversationHistory, setConversationHistory] = useState([]);
  const { conversations, loading, refresh } = useUserConversations();
  const { balance, loadingBalance, refreshBalance } = useUserBlance();

  async function handleStartConversation() {
    try {
      if (balance <= 0) {
        toast.error("Yout balance is empty buy some");
        return;
      }
      const timestamp = Math.floor(Date.now() / 1000);
      const generatedConversationId = `${signedAccountId}_${timestamp}`;
      const reserveAmount = "1000000000";

      const result = await callFunction({
        contractId: CONTRACT_ID,
        method: "call_js_func",
        args: {
          function_name: "start_ai_conversation",
          conversation_id: generatedConversationId,
          reserve_amount: reserveAmount,
          timestamp: timestamp,
        },
      });
      if (!result) {
        throw new Error("Error while starting new converstion");
      }
      console.log("Conversation started successfully:", result);
      console.log("New conversation ID:", generatedConversationId);
      setConvId(generatedConversationId, 1000);
      refresh();
      refreshBalance();
      // setConversationHistory((prev) => [...prev, ])
      toast.success("New converstaion created you can start chating");
    } catch (error) {
      toast.error(`Error: ${error}`);
      // alert(`${error} in handleStart conversation`);
    }
  }

  function toggle() {
    setCollapsed((prev) => !prev);
  }

  return (
    <>
      <Toaster theme="dark" richColors position="top-right" />
      <div className="h-screen flex overflow-hidden">
        <SideBar
          toggle={toggle}
          collapsed={collapsed}
          setConversationHistory={setConversationHistory}
          handleStartConversation={handleStartConversation}
          conversations={conversations}
          loading={loading}
          refresh={refresh}
          refreshBalance={refreshBalance}
          balance={balance}
        />

        {/* Main content */}
        <div className="flex-1 flex flex-col w-[calc(100%_-_260px)]">
          <ChatHeader
            toggle={toggle}
            collapsed={collapsed}
            balance={balance}
            loadingBalance={loadingBalance}
            refreshBalance={refreshBalance}
          />
          {conversationHistory.length === 0 && !convId ? (
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="flex-1 flex flex-col items-center justify-center p-8"
            >
              <p
                className={`${urbanist.className} font-semibold text-center mb-6 text-[20px] lg:text-[30px] text-white`}
              >
                Welcome to
                <span className="text-[#BA98D5]"> Finowl AI!</span>
              </p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleStartConversation}
                className={`${urbanist.className} font-semibold px-6 py-3 rounded-lg bg-[radial-gradient(closest-side_at_50%_50%,#BA98D5_0%,#643989_100%)] text-white hover:opacity-90 transition`}
              >
                Start New Conversation
              </motion.button>
            </motion.div>
          ) : (
            <ChatMessages
              conversationHistory={conversationHistory}
              refresh={refresh}
            />
          )}
        </div>
      </div>
    </>
  );
}
