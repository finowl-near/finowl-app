import Header from "@/app/components/Header";
import Modal from "@/app/components/Modal";
import OnBoarding from "@/app/components/onboarding/OnBoarding"
import React from "react";

export const metadata = {
  title: "Get Started with FinOwl - Claim Tokens & Start Trading Smarter",
  description:
    "Claim your free FinOwl tokens, connect your wallet, and unlock AI-powered crypto insights. The fastest way to start investing smarter on-chain.",
  keywords:
    "FinOwl, crypto onboarding, claim tokens, AI crypto assistant, NEAR wallet, trading insights, Web3 chatbot",
  robots: "index, follow",
  openGraph: {
    title: "Get Started with FinOwl - AI-Powered Crypto Onboarding",
    description:
      "Claim free usage tokens, connect your wallet, and start using FinOwl AI to analyze, trade, and explore the market faster.",
    url: "https://finowl.finance/onboarding",
    type: "website",
    // images: [
    //   {
    //     url: "https://finowl.finance/finowl.png",
    //     width: 1200,
    //     height: 630,
    //     alt: "FinOwl Onboarding",
    //   },
    // ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Start Using FinOwl - Claim Free Tokens Now",
    description:
      "Get onboarded to FinOwl: claim tokens, sign once, and access your crypto AI copilot instantly.",
    // images: ["https://finowl.finance/finowl.png"],
  },
};

export default function OnBoardingpage() {
  // const [isOnboarding, setIsOnboarding] = useState(true);
  return (
    <>
      {/* <Header /> */}
      {/* <Modal
        isOpen={isOnboarding}
        onClose={() => setIsOnboarding(false)}
        title={"onBoarding..."}
      > */}
        <OnBoarding />
      {/* </Modal> */}
    </>
  );
}