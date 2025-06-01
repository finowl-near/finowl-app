import Header from "@/app/components/Header";
import LandingPage from "@/app/components/LandingPage";
import React from "react";
import { FaEnvelope } from "react-icons/fa";
import { BsTwitterX } from "react-icons/bs";
import Head from "next/head";

export default function page() {
  return (
    <>
      <Head>
        <title>Top Trending Crypto Tokens | FinOwl Mindshare</title>
        <meta
          name="description"
          content="View the most talked-about crypto tokens ranked by influencer mentions, volume, and sentiment. Updated in real-time by FinOwl."
        />
        <meta
          name="keywords"
          content="crypto trending tokens, mindshare score, influencer crypto, FinOwl mindshare, token rankings, real-time crypto sentiment"
        />
        <meta name="robots" content="index, follow" />

        <meta
          property="og:title"
          content="FinOwl Mindshare — Trending Tokens Ranked by Attention"
        />
        <meta
          property="og:description"
          content="Track token popularity, sentiment, and social buzz across top influencers. Updated live."
        />
        <meta property="og:url" content="https://finowl.finance/mindshare" />
      </Head>
      <Header />
      <LandingPage />
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
              <BsTwitterX className="w-4 h-4" color="#FFFFFF" />
            </a>
          </div>
        </div>
      </footer>
    </>
  );
}
