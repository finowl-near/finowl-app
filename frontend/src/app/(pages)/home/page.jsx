import Landing from "@/app/components/Landing";
import LandingCopy from "@/app/components/LangingCopy";
import Head from "next/head";
import React from "react";

export default function page() {
  return (
    <>
      <Head>
        <title>
          Welcome to FinOwl | Your AI Copilot for Smarter Crypto Moves
        </title>
        <meta
          name="description"
          content="Meet FinOwl — the AI platform that helps you track trending crypto tokens, analyze markets, and trade smarter using real-time signals."
        />
        <meta
          name="keywords"
          content="AI crypto assistant, FinOwl features, crypto analysis, token explorer, NEAR protocol, market insights, crypto dashboard"
        />
        <meta name="robots" content="index, follow" />

        <meta
          property="og:title"
          content="Introducing FinOwl — Your AI Copilot for Crypto"
        />
        <meta
          property="og:description"
          content="Discover FinOwl's new features: token trends, influencer insights, and on-chain execution."
        />
        <meta property="og:url" content="https://finowl.finance/home" />
      </Head>
      <LandingCopy />
      {/* <Landing /> */}
    </>
  );
}
