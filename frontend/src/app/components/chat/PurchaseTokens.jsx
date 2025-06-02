"use client";

import React, { useState } from "react";
import Modal from "../Modal";
import { motion } from "motion/react";
import { useWalletSelector } from "@near-wallet-selector/react-hook";
import { utils } from "near-api-js";
import { Toaster, toast } from "sonner";
import { CONTRACT_ID } from "@/app/Wallets/near";

export default function PurchaseTokens({
  isModalOpen,
  setModalOpen,
  refreshBalance,
}) {
  const [purchaseAmount, setPurchaseAmount] = useState("0.05");
  const [loading, setLoading] = useState(false);
  const { signedAccountId, callFunction } = useWalletSelector();
  async function handlePurchaseTokens() {
    setLoading(true);
    try {
      const depositInYocto = utils.format.parseNearAmount(purchaseAmount);
      const result = await callFunction({
        contractId: process.env.NEXT_PUBLIC_CONTRACT_NAME || CONTRACT_ID,
        method: "call_js_func", // Call the dispatcher function
        args: {
          function_name: "buy_tokens_for_near",
          attached_deposit: depositInYocto, // Pass the attached deposit inside args
        },
        gas: "50000000000000", // 50 Tgas
        deposit: depositInYocto, // Also attach it properly for real transfer
      });
      if (!result) {
        throw new Error("Cannot purchase");
      }
      /// TODO: need notification
      refreshBalance();
      setLoading(false);
      setModalOpen(false);
      toast.success("Succesfully purchased 10,000 tokens")
    } catch (error) {
      toast.error(`Error: ${error}`);
      // alert(`${error} in purchase tokens`);
    }
  }
  return (
    <>
      <Modal
        isOpen={isModalOpen}
        onClose={() => setModalOpen(false)}
        title="Purchase Tokens"
      >
        <p className="text-white mb-2 font-semibold">
          Currently You can purchase 0.05 near Which is 10,000 tokens
        </p>
        <input
          type="number"
          step="0.01"
          min="0"
          placeholder="0.05"
          disabled={true}
          className="w-full cursor-not-allowed bg-[#1F1923] text-white placeholder-white/40 border border-[#BA98D5] rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#BA98D5] transition"
        />
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="bg-[#BA98D5] mt-4 w-full text-[#231C28] font-semibold py-2 px-6 rounded-lg shadow-md"
          onClick={handlePurchaseTokens}
        >
          {loading ? "Buying..." : "Buy"}
        </motion.button>
      </Modal>
    </>
  );
}
