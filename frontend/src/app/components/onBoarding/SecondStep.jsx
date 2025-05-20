"use client";

import React, { useEffect, useState } from "react";
import { useWalletSelector } from "@near-wallet-selector/react-hook";
import { motion } from "motion/react";

export default function SecondStep({
  onNext,
  registerStorage,
  setRegisterStorage,
}) {
  const { signedAccountId, callFunction, signIn, signOut } =
    useWalletSelector();
  const [loading, setLoading] = useState(false);

  async function handleRegisterStorage() {
    try {
      setLoading(true);

      // Need to call storage_deposit with account_id and deposit amount
      // The deposit amount should be 0.00125 NEAR (1250000000000000000000 yoctoNEAR)
      const depositAmount = "1250000000000000000000"; // 0.00125 NEAR in yoctoNEAR
      const gas = "100000000000000"; // 100 Tgas

      const result = await callFunction({
        contractId: process.env.NEXT_PUBLIC_CONTRACT_NAME || "finowl.testnet",
        method: "storage_deposit",
        args: {
          account_id: signedAccountId,
        },
        gas,
        deposit: depositAmount,
      });

      console.log("Storage registration result:", result);
      setRegisterStorage(true);
      alert(
        "Storage registration successful! Now please register your account to complete setup."
      );
      localStorage.setItem(
        `finow_user_status_${signedAccountId}`,
        JSON.stringify({
          isConnected: true,
          registerStorage: true,
        })
      );
    } catch (error) {
      console.error("Error registering storage:", error);
      alert(`Storage registration failed: ${error.message}`);
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
        Register Storage
      </motion.h2>
      {!registerStorage ? (
        <motion.p
          initial={{ y: -10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-white mb-6"
        >
          Every NEAR account needs a modest storage balance to keep data on the
          blockchain.
        </motion.p>
      ) : (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="text-green-400 mb-4"
        >
          Storage deposit successful!
        </motion.p>
      )}

      {!registerStorage ? (
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="bg-[#BA98D5] text-[#231C28] font-semibold py-2 px-6 rounded-lg shadow-md"
          onClick={handleRegisterStorage}
          disabled={loading}
        >
          {loading ? "Registering..." : "Register"}
        </motion.button>
      ) : (
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="bg-[#BA98D5] text-[#231C28] font-semibold py-2 px-6 rounded-lg shadow-md"
          onClick={onNext}
        >
          Next
        </motion.button>
      )}
    </>
  );
}
