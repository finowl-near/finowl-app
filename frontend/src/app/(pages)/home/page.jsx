import Landing from "@/app/components/Landing";
import LandingCopy from "@/app/components/LangingCopy";
import Head from "next/head";
import React from "react";

export const metadata = {
  title: "Welcome to FinOwl | Your AI Copilot for Smarter Crypto Moves",
  description:
    "Meet FinOwl — the AI platform that helps you track trending crypto tokens, analyze markets, and trade smarter using real-time signals.",
  keywords: [
    "AI crypto assistant",
    "FinOwl features",
    "crypto analysis",
    "token explorer",
    "NEAR protocol",
    "market insights",
    "crypto dashboard",
  ],
  robots: "index, follow",
  openGraph: {
    title: "Introducing FinOwl — Your AI Copilot for Crypto",
    description:
      "Discover FinOwl's new features: token trends, influencer insights, and on-chain execution.",
    url: "https://finowl.finance/home",
  },
};

export default function page() {
  return (
    <>
      <LandingCopy />
      {/* <Landing /> */}
    </>
  );
}
