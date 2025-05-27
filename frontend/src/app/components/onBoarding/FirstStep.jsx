"use client";

import React, { useEffect, useState } from "react";
import { useWalletSelector } from "@near-wallet-selector/react-hook";
import { motion } from "motion/react";

export default function FirstStep({ onNext }) {
  const { signedAccountId, signIn, signOut } = useWalletSelector();

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
        Welcome to Finowl
      </motion.h2>
      {!signedAccountId ? (
        <motion.p
          initial={{ y: -10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-white mb-6"
        >
          Connect your NEAR wallet to get started
        </motion.p>
      ) : (
        <motion.p
          initial={{ y: -10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-white mb-6"
        >
          Your userName is {signedAccountId}
        </motion.p>
      )}

      {!signedAccountId ? (
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="bg-[#BA98D5] text-[#231C28] font-semibold py-2 px-6 rounded-lg shadow-md"
          onClick={() => {
            signIn();
          }}
        >
          Connect Wallet
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
