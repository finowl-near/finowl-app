"use client";

import React, { useState } from "react";
import { Dropdown } from "antd";
import { FiMoreHorizontal } from "react-icons/fi";
import Modal from "../Modal";
import { motion } from "motion/react";
import { toast, Toaster } from "sonner";
import { useWalletSelector } from "@near-wallet-selector/react-hook";

export default function MyDropdown({
  tokensLeft,
  convId,
  refresh,
  refreshBalance,
  balance,
}) {
  const [isModalOpen, setModalOpen] = useState("");
  const [loading, setLoading] = useState(false);
  const [tokenAmount, setTokenAmount] = useState(0);
  const { callFunction } = useWalletSelector();

  async function handleAddTokenToConversation() {
    setLoading(true);
    try {
      /// TODO: check for max
      if (isNaN(tokenAmount)) {
        toast.error("Not a number");
        setLoading(false);
        return;
      }
      if (tokenAmount <= 0) {
        toast.error("Zero or negative amount provided");
        setLoading(false);
        return;
      }
      if (tokenAmount > balance) {
        toast.error("Exceded max number");
        setLoading(false);
        return;
      }
      const internalAmount = (tokenAmount * 1_000_000).toFixed(0);
      const result = await callFunction({
        contractId: "finowl.testnet",
        method: "call_js_func",
        args: {
          function_name: "add_tokens_to_conversation",
          conversation_id: convId,
          amount: internalAmount,
        },
      });
      if (!result) {
        throw new Error("cannot add tokens");
      }
      console.log("success -> ", result);
      refresh();
      refreshBalance();
      setLoading(false);
      setModalOpen("");
      toast.success("Succesfully added tokens");
    } catch (error) {
      alert(`${error} in handle Add Token To Conversation`);
      setLoading(false);
    }
  }

  async function handleRefundTokens() {
    setLoading(true);
    try {
      if (Number(tokensLeft) <= 0) {
        toast.error("Cannot refund zero tokens");
        setLoading(false);
        return;
      }
      const result = await callFunction({
        contractId: "finowl.testnet",
        method: "call_js_func",
        args: {
          function_name: "refund_reserved_tokens",
          conversation_id: convId,
        },
      });
      if (!result) {
        throw new Error("cannot refund tokens");
      }
      console.log("success -> ", result);
      refresh();
      refreshBalance();
      setLoading(false);
      setModalOpen("");
      toast.success("Succesfully refunded tokens");
    } catch (error) {
      alert(`${error} in handle refund Token`);
      setLoading(false);
    }
  }

  const items = [
    {
      key: "1",
      label: (
        <p className="w-full text-start px-3 py-1 font-semibold">
          Conversation Balance: {tokensLeft}
        </p>
      ),
    },
    {
      key: "2",
      label: (
        <button
          className="w-full text-start px-3 py-1 rounded-md hover:bg-[#3D2C4B]"
          onClick={() => setModalOpen("Add")}
        >
          Add
        </button>
      ),
    },
    {
      key: "3",
      label: (
        <button
          className="w-full text-start px-3 py-1 rounded-md hover:bg-[#3D2C4B]"
          onClick={() => setModalOpen("Refund")}
        >
          Refund
        </button>
      ),
    },
  ];
  return (
    <>
      <Dropdown menu={{ items }} trigger={["click"]}>
        <button
          className="p-1 rounded-full hover:bg-[#BA98D5]/20 transition-colors"
          aria-label="More options"
        >
          <FiMoreHorizontal className="w-5 h-5 text-white" />
        </button>
      </Dropdown>
      <Modal
        isOpen={isModalOpen !== ""}
        onClose={() => setModalOpen("")}
        title={
          isModalOpen === "Add" ? "Add Token To conversation" : "Refund tokens"
        }
      >
        <p className="text-white mb-2 font-semibold">
          {isModalOpen === "Add"
            ? `Choose Amount (max = ${balance})`
            : `Refund remaining tokens back to your wallet (${tokensLeft})`}
        </p>
        {isModalOpen === "Add" && (
          <input
            type="number"
            step="0.01"
            min="0"
            placeholder="0.00"
            className=" w-full bg-[#1F1923] text-white placeholder-white/40 border border-[#BA98D5] rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#BA98D5] transition"
            onChange={(e) => {
              console.log("amount", Number(e.target.value));
              setTokenAmount(Number(e.target.value));
            }}
          />
        )}
        {isModalOpen === "Add" ? (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="bg-[#BA98D5] mt-4 w-full text-[#231C28] font-semibold py-2 px-6 rounded-lg shadow-md"
            onClick={handleAddTokenToConversation}
          >
            {loading ? "Adding..." : "Add"}
          </motion.button>
        ) : (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="bg-[#BA98D5] mt-4 w-full text-[#231C28] font-semibold py-2 px-6 rounded-lg shadow-md"
            onClick={handleRefundTokens}
          >
            {loading ? "loading..." : "Refund"}
          </motion.button>
        )}
      </Modal>
    </>
  );
}
