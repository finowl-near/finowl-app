import Chat from '@/app/components/chat/Chat'
import React from 'react'

export const metadata = {
  title: "FinOwl AI Chat Assistant - Talk, Trade, and Execute On-Chain",
  description:
    "Ask FinOwl's AI about crypto trends, top tokens, or execute swaps with natural commands. Get instant market insights and trade on-chain using NEAR Intents.",
  keywords:
    "FinOwl AI, crypto assistant, NEAR intents, on-chain trading, AI crypto bot, top tokens, crypto chat, sentiment analysis, automated swap",
  robots: "index, follow",
  openGraph: {
    title: "FinOwl AI Chat - Smarter Crypto, One Message Away",
    description:
      "Chat with FinOwl's AI to get insights, market trends, and trade directly on-chain using NEAR. No clicks. Just smart execution.",
    url: "https://finowl.finance/chat",
    type: "website",
    // images: [
    //   {
    //     url: "https://finowl.finance/og-chat.png",
    //     width: 1200,
    //     height: 630,
    //     alt: "FinOwl AI Chat",
    //   },
    // ],
  },
  twitter: {
    card: "summary_large_image",
    title: "FinOwl AI Chat - Talk to Crypto, Trade Instantly",
    description:
      "Ask market questions, get real-time answers, and execute trades with AI-powered chat. Try FinOwl's beta now.",
    // images: ["https://finowl.finance/og-chat.png"],
  },
};


export default function chatPage() {
  return (
    <>
        <Chat/>
    </>
  )
}
