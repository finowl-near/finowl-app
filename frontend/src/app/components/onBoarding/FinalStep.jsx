// components/CompletionStep.tsx
"use client";

import React, { useEffect } from "react";
import { motion } from "motion/react";
import { useRouter } from "next/navigation";

export default function FinalStep({ redirectTo = "/chat", delayMs = 1500 }) {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      router.push(redirectTo);
  
      // Fallback: force redirect in case router.push fails silently
      const forceRedirect = setTimeout(() => {
        window.location.href = redirectTo;
      }, 3000);
  
      return () => clearTimeout(forceRedirect);
    }, delayMs);
  
    return () => clearTimeout(timer);
  }, [redirectTo, delayMs, router]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col items-center justify-center space-y-4"
    >
      <div
        className="h-16 w-16 rounded-full border-4 border-t-white animate-spin border-[#BA98D5]"
        aria-label="Redirecting spinner"
      />
      <h2 className="text-2xl font-bold text-white">All set!</h2>
      <p className="text-white">Redirecting you to the Chat…</p>
    </motion.div>
  );
}
