"use client";

import React, { useEffect, useState } from "react";
import { useWalletSelector } from "@near-wallet-selector/react-hook";
import { motion } from "motion/react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CONTRACT_ID } from "@/app/Wallets/near";

export default function FourthStep({ onNext, tokensClaim, setTokensClaim }) {
  const { signedAccountId, callFunction, viewFunction, signIn, signOut } =
    useWalletSelector();
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleClaimTokens() {
    try {
      setLoading(true);

      const gas = "50000000000000"; // 50 TGas
      // Get current timestamp in seconds
      const timestamp = Math.floor(Date.now() / 1000);

      const result = await callFunction({
        contractId: process.env.NEXT_PUBLIC_CONTRACT_NAME || CONTRACT_ID,
        method: "call_js_func",
        args: {
          function_name: "grant_free_tokens",
          timestamp: timestamp,
        },
        gas,
      });

      // Check token balance to confirm tokens were received
      const balance = await getUserTokenBalance(signedAccountId, viewFunction);

      setTokensClaim(true);
      // Close the welcome token popup if it was showing
      //   setShowWelcomeTokenPopup(false);

      // Cache the token claimed status
      toast.success(`Free Tokens successfully claimed!`);
      // alert(
      //   "Free tokens successfully claimed! You can now start using Finowl services.",
      //   balance
      // );
    } catch (error) {
      toast.error(`Error: ${error}`);
      console.error("Error claiming free tokens:", error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <motion.svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-16 w-16 text-[#BA98D5] mb-4"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        initial={{ rotate: 0 }}
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-2m0-4h4"
        />
      </motion.svg>

      <motion.h2
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="text-2xl font-bold text-white mb-2"
      >
        Claim Your Tokens
      </motion.h2>
      {!tokensClaim ? (
        <motion.p
          initial={{ y: -10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-white mb-6"
        >
          You&apos;re almost there! Click “Claim” to receive your welcome tokens
          (1,000 FINOWL) directly into your NEAR wallet. These tokens power our
          AI features—go ahead and grab them now.
        </motion.p>
      ) : (
        <motion.p
          initial={{ y: -10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-green-400 mb-4"
        >
          Tokens Claimed successfully!
        </motion.p>
      )}
      {!tokensClaim ? (
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="bg-[#BA98D5] text-[#231C28] font-semibold py-2 px-6 rounded-lg shadow-md"
          onClick={handleClaimTokens}
          disabled={loading}
        >
          {loading ? "Claiming..." : "Claim"}
        </motion.button>
      ) : (
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="bg-[#BA98D5] text-[#231C28] font-semibold py-2 px-6 rounded-lg shadow-md"
          onClick={() => {
            router.push('/chat');
          }}
        >
          Launch App
        </motion.button>
      )}
    </>
  );
}

const getUserTokenBalance = async (signedAccountId, viewFunction) => {
  try {
    if (!signedAccountId) {
      return null;
    }

    // First try with view_js_func
    try {
      const result = await viewFunction({
        contractId: process.env.NEXT_PUBLIC_CONTRACT_NAME || CONTRACT_ID,
        method: "view_js_func",
        args: {
          function_name: "get_user_token_balance",
          account_id: signedAccountId,
        },
      });

      // The result might be an object with a balance property or just a string
      if (typeof result === "object" && result !== null && result.balance) {
        return result.balance;
      } else if (typeof result === "string") {
        return result;
      } else {
        return "0"; // Default to 0 if we can't parse the result
      }
    } catch (viewError) {

      // Try with get_user as fallback
      const userData = await viewFunction({
        contractId: process.env.NEXT_PUBLIC_CONTRACT_NAME || CONTRACT_ID,
        method: "get_user",
        args: { account_id: signedAccountId },
      });

      if (userData && userData.token_balance) {
        return userData.token_balance;
      }
    }

    return "0"; // Default to 0 if all attempts fail
  } catch (error) {
    console.error("Error getting user token balance:", error);
    return null;
  }
};
