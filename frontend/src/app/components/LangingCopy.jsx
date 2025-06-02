// This component uses the layout and styling you've provided,
// and integrates new sections for AI description and Feeds, using the screenshots provided.

"use client";

import React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { FaEnvelope, FaTwitter } from "react-icons/fa";
import LogoIcon from "./Icons/LogoIcon";
import { urbanist } from "../fonts";

// Placeholder image imports (replace with final ones)
import owlLand from "@/app/assets/svg/owl-land.svg";
import screenLand from "@/app/assets/desktopSc.png";
import aiChat from "@/app/assets/aiChat.png";
import feeds from "@/app/assets/feeds.png";
import askAi from "@/app/assets/askAi.png";
import handphone from "@/app/assets/svg/handphone.svg";

export default function LandingCopy() {
  const router = useRouter();

  return (
    <>
      {/* Hero Section */}
      <div className="m-2 px-4 sm:px-10 py-6 sm:pl-10 rounded-[15px] relative landing-bg overflow-hidden">
        <div className="py-2">
          <LogoIcon />
        </div>
        <Image
          className="w-[28rem] sm:w-[32rem] blur-[5px] lg:blur-[0px] md:w-[42rem] rounded-full absolute mix-blend-hard-light top-4 sm:top-4 -right-2 z-0"
          src={owlLand}
          alt="owl land"
        />
        <div className="text-white py-16 sm:py-24 max-w-3xl relative z-20">
          <h1
            className={`${urbanist.className} pb-8 font-semibold text-[38px] sm:text-[48px] md:text-[60px] leading-tight drop-shadow-[0_2px_8px_rgba(0,0,0,1)]`}
          >
            Spot Tomorrow’s <br className="hidden sm:block" />
            Crypto Winners, Today.
          </h1>
          <p
            className={`${urbanist.className} pb-8 font-light text-[20px] sm:text-[24px] md:text-[30px] leading-relaxed`}
          >
            FinOwl scans the crypto noise 24/7 to surface tokens
            <br className="hidden sm:block" /> on the verge of breakout.
          </p>
          <div className="[box-shadow:0.5px_0px_8px_#ffffff4b;] w-fit rounded-[15px]">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`px-4 py-3 button-syle text-white text-[16px] sm:text-[18px] md:text-[20px] ${urbanist.className} font-semibold border border-[#442162] rounded-[15px]`}
              onClick={() => {
                router.push("/mindshare");
              }}
            >
              Launch App
            </motion.button>
          </div>
        </div>
      </div>
      {/* Dashboard Preview */}
      <div className="relative z-10 flex justify-center px-4 pb-8 ">
        <div className="absolute top-[50%] left-[20%] -translate-x-1/2 w-[500px] h-[500px] rounded-full bg-[#BA98D5]/30 blur-[150px] -z-10 pointer-events-none" />
        <Image
          src={screenLand}
          alt="FinOwl dashboard preview"
          className="w-full h-auto max-w-7xl rounded-2xl border-4 border-[#B0B0D4] shadow-xl"
        />
      </div>
      {/* Feeds Section */}
      <div className="px-6 pt-20 pb-10 text-center relative">
        <div className="absolute top-[20%] left-[20%] -translate-x-1/2 w-[500px] h-[500px] rounded-full bg-[#BA98D5]/30 blur-[150px] -z-10 pointer-events-none" />
        <h2
          className={`text-4xl sm:text-5xl font-bold text-white ${urbanist.className}`}
        >
          FinOwl <span className="text-[#BA98D5]">AI Feeds</span>
        </h2>
      </div>
      <div className="px-6 pb-20 text-white max-w-7xl mx-auto grid gap-12 sm:grid-cols-2 items-center">
        {/* Text Section with "Fresh Alpha" */}
        <div className="flex flex-col justify-center leading-none">
          <p
            className={`text-white text-[40px] sm:text-[48px] md:text-[55px] ${urbanist.className} font-semibold`}
          >
            Fresh <span className="text-[#BA98D5]">Alpha</span>
          </p>
          <p
            className={`text-white text-[40px] sm:text-[48px] md:text-[55px] ${urbanist.className} font-semibold`}
          >
            Every <span className="text-[#BA98D5]">4 Hours</span>
          </p>
          <p
            className={`text-white text-[40px] sm:text-[48px] md:text-[55px] ${urbanist.className} font-semibold`}
          >
            Every <span className="text-[#BA98D5]">Angle</span>
          </p>
          <p
            className={`${urbanist.className} text-white pt-4 font-light text-[18px] sm:text-[20px] md:text-[22px] leading-normal`}
          >
            Macro insights. Token trends. Influencer
            <br className="hidden sm:block" />
            signals. All synthesized for you.
          </p>
        </div>

        {/* Image Preview */}
        <div className="w-full h-auto max-w-[600px] aspect-[16/9] overflow-hidden rounded-xl shadow-lg border border-[#2F2F2F]">
          <Image
            src={feeds}
            alt="AI Feed Screenshot"
            className="w-full h-full object-fill"
          />
        </div>
      </div>
      {/* AI Overview */}
      <div className="px-6 relative py-20 text-white text-center max-w-5xl mx-auto">
        <div className="absolute top-[20%] left-[20%] -translate-x-1/2 w-[500px] h-[500px] rounded-full bg-[#BA98D5]/30 blur-[150px] -z-10 pointer-events-none" />
        <h2 className="text-4xl sm:text-5xl font-bold mb-6">
          Meet <span className="text-[#BA98D5]">FinOwl AI</span>
        </h2>
        <p className="text-lg sm:text-xl text-[#D0D0D0] mb-10">
          Your AI copilot that delivers context-aware insights, market trends,
          influencer breakdowns, and automated trading signals. From macro
          sentiment shifts to token-specific events, FinOwl AI helps you move
          smarter — not harder.
        </p>
        <Image
          src={aiChat}
          alt="FinOwl AI screenshot"
          className="w-full max-w-4xl mx-auto rounded-xl shadow-lg"
        />
      </div>
      {/* Prompt Experience */}
      <div className="px-6 pt-8 pb-10 text-center relative">
        <div className="absolute top-[20%] left-[20%] -translate-x-1/2 w-[500px] h-[500px] rounded-full bg-[#BA98D5]/30 blur-[150px] -z-10 pointer-events-none" />
        <h2
          className={`text-4xl sm:text-5xl font-bold text-white ${urbanist.className}`}
        >
          Prompt <span className="text-[#BA98D5]">Experience</span>
        </h2>
      </div>
      <div className="px-6 pb-20 text-white max-w-7xl mx-auto grid gap-12 sm:grid-cols-2 items-center">
        {/* Text Section */}
        <div className="flex flex-col justify-center leading-none">
          <p
            className={`text-white text-[40px] sm:text-[48px] md:text-[55px] ${urbanist.className} font-semibold`}
          >
            Ask <span className="text-[#BA98D5]">Anything</span>
          </p>
          <p
            className={`text-white text-[40px] sm:text-[48px] md:text-[55px] ${urbanist.className} font-semibold`}
          >
            Get <span className="text-[#BA98D5]">Context</span>
          </p>
          <p
            className={`${urbanist.className} text-white pt-4 font-light text-[18px] sm:text-[20px] md:text-[22px] leading-normal`}
          >
            Ask about trends, tokens, or sentiment. The AI delivers real-time
            clarity — and even helps execute on-chain swaps with simple text
            commands like:
            <br />
            <span className="italic text-[#D0D0D0]">
              “Swap 0.1 USDC for NEAR”
            </span>
          </p>
        </div>

        {/* Image Section */}
        <div className="w-full h-auto max-w-[600px] aspect-[16/9] overflow-hidden rounded-xl shadow-lg border border-[#2F2F2F]">
          <Image
            src={askAi}
            alt="AI Chat Prompt Screenshot"
            className="w-full h-full object-fill"
          />
        </div>
      </div>
      {/* Hand phone */}
      <div className="landing-bg flex flex-col lg:flex-row items-center justify-center gap-16 px-6 py-20 bg-[#120C1A] text-white">
        <div className="max-w-xl text-center lg:text-left">
          <p
            className={` ${urbanist.className} font-semibold text-[40px] sm:text-[50px] md:text-[55px] text-white leading-tight`}
          >
            Real-Time <span className="text-[#BA98D5]">Signals.</span>
          </p>
          <p
            className={` ${urbanist.className} font-semibold text-[40px] sm:text-[50px] md:text-[55px] text-white leading-tight`}
          >
            Tweeted for <span className="text-[#BA98D5]">You.</span>
          </p>
          <p
            className={` ${urbanist.className} my-4 text-[20px] sm:text-[22px] md:text-[24px] font-light text-white`}
          >
            We decode what matters so you can focus on execution, not research.
          </p>
          <div className="mt-6">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`px-6 py-3 button-syle text-white text-[18px] sm:text-[20px] md:text-[22px] ${urbanist.className} font-semibold border border-[#442162] rounded-[15px]`}
              onClick={() => {
                router.push("/mindshare");
              }}
            >
              Launch App
            </motion.button>
          </div>
        </div>
        <div className="w-full max-w-md hidden lg:block">
          <Image
            className="[clip-path:inset(0px_0px_35px_0px)]"
            src={handphone}
            alt="hand phone"
          />
        </div>
      </div>
      {/* Footer */}
      <footer className="mt-auto bg-[#1F1923] text-white py-6">
        <div className="max-w-[90rem] mx-auto px-6 flex flex-col sm:flex-row justify-between items-center text-sm">
          <div>© {new Date().getFullYear()} FinOwl. All rights reserved.</div>
          <div className="space-x-4 mt-2 sm:mt-0 flex items-center">
            <a href="/terms" className="hover:text-[#BA98D5]">
              Terms &amp; Conditions
            </a>
            <a href="/privacy-policy" className="hover:text-[#BA98D5]">
              Privacy Policy
            </a>
            <a
              href="mailto:contact@finowl.finance"
              className="hover:text-[#BA98D5]"
              title="Contact us"
            >
              <FaEnvelope className="w-4 h-4" color="#FFFFFF" />
            </a>
            <a
              href="https://x.com/finowl_finance"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-[#BA98D5]"
            >
              <FaTwitter className="w-4 h-4" color="#FFFFFF" />
            </a>
          </div>
        </div>
      </footer>
    </>
  );
}
