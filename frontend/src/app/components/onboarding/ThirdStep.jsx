"use client";

import React, { useEffect, useState } from "react";
import { useWalletSelector } from "@near-wallet-selector/react-hook";
import { motion } from "motion/react";

export default function ThirdStep({ onNext, registerUser, setRegisterUser }) {

  const { signedAccountId, callFunction, signIn, signOut } = useWalletSelector();
  const [loading, setLoading] = useState(false);

  async function handleRegisterUser() {
    try {
      setLoading(true);
      const result = await callFunction({
        contractId: process.env.NEXT_PUBLIC_CONTRACT_NAME || "finowl.testnet",
        method: "call_js_func",
        args: {
          function_name: "register_user",
        },
      });

      console.log("User registration result:", result);
      setRegisterUser(true);
      alert(
        "Account registration successful! Your account is now fully set up to use Finowl."
      );
      localStorage.setItem(
        `finow_user_status_${signedAccountId}`,
        JSON.stringify({
          isConnected: true,
          registerStorage: true,
          registerUser: true,
        })
      );
    } catch (error) {
      console.error("Error registering user:", error);
      alert(`Registration failed: ${error.message}`);
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
        Register Your Account
      </motion.h2>
      <motion.p
        initial={{ y: -10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="text-white mb-6"
      >
        Now that storage is set up, you need to register your account on-chain.
        This step tells Finowl's contract to recognize your NEAR address and
        unlock the rest of the features—no extra deposit required.
      </motion.p>

      {!registerUser ? (
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="bg-[#BA98D5] text-[#231C28] font-semibold py-2 px-6 rounded-lg shadow-md"
          onClick={handleRegisterUser}
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
