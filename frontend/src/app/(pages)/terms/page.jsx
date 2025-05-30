"use client";

import Header from "@/app/components/Header";
import { urbanist } from "@/app/fonts";
import Head from "next/head";
import React from "react";

export default function TermsPage() {
  return (
    <>
      <Head>
        <title>Terms of Service | FinOwl</title>
        <meta
          name="description"
          content="Review the terms and conditions for using FinOwl, the AI-powered crypto trading and insights platform on NEAR Protocol."
        />
        <meta name="robots" content="index, follow" />
        <meta property="og:title" content="FinOwl Terms of Service" />
        <meta
          property="og:description"
          content="Terms governing the use of FinOwl's AI financial assistant and NEAR blockchain trading features."
        />
      </Head>
      <Header/>
      <div className="relative min-h-screen bg-[#151515] text-white px-6 py-12 overflow-hidden">
        {/* Blurred decorative circles */}
        <div className="absolute top-[-100px] left-[-100px] w-[300px] h-[300px] bg-[#BA98D5] rounded-full opacity-30 blur-[120px] pointer-events-none z-0" />
        <div className="absolute bottom-[20%] right-[-80px] w-[250px] h-[250px] bg-[#BA98D5] rounded-full opacity-20 blur-[100px] pointer-events-none z-0" />
        <div className="absolute top-[40%] left-[50%] transform -translate-x-1/2 w-[180px] h-[180px] bg-[#BA98D5] rounded-full opacity-10 blur-[90px] pointer-events-none z-0" />

        <article className="relative z-10 max-w-3xl mx-auto">
          <header className="mb-8">
            <h1
              className={`text-3xl sm:text-4xl font-bold mb-2 ${urbanist.className}`}
            >
              Terms of Service | FinOwl
            </h1>
            <p className="text-[#BA98D5] text-sm sm:text-base">
              Effective Date: May 30, 2025
            </p>
          </header>

          <section className="mb-10">
            <p className="leading-relaxed text-sm sm:text-base">
              Welcome to <strong className="text-[#BA98D5]">FinOwl</strong> — an
              AI-powered cryptocurrency insights and trading assistant powered
              by the NEAR Protocol. These Terms of Service (“Terms”) govern your
              use of our website, application, AI tools, and all services
              provided through the FinOwl platform. By accessing or using
              FinOwl, you agree to these Terms. If you do not agree, please do
              not use the platform.
            </p>
          </section>

          {[
            {
              title: "1. Eligibility",
              text: "You must be at least 18 years old and legally permitted to use blockchain-based financial tools in your jurisdiction. You are solely responsible for complying with applicable laws and regulations.",
            },
            {
              title: "2. Services Provided",
              text: "FinOwl provides:",
              list: [
                "AI-powered cryptocurrency trend and sentiment analysis",
                "Trading insights, DCA strategies, and portfolio suggestions",
                "On-chain execution using NEAR smart contracts and intents",
              ],
              extra:
                "FinOwl is an information platform only. It does not offer financial, investment, or legal advice.",
            },
            {
              title: "3. No Financial Advice",
              text: "All information provided on FinOwl is for educational and informational purposes only. You are solely responsible for your investment decisions. We recommend consulting a licensed financial advisor before making any investment.",
            },
            {
              title: "4. Wallet Usage & On-Chain Activity",
              text: "By connecting your NEAR wallet, you consent to on-chain interactions such as reserving tokens, executing trades, and staking for access. You are responsible for managing your private keys and ensuring secure transactions. FinOwl does not store or have access to your private keys or wallet funds.",
            },
            {
              title: "5. Platform Access & Availability",
              text: "We aim for high availability, but access to the FinOwl platform may be interrupted due to updates, system issues, or third-party dependencies. We reserve the right to suspend or terminate access for any user who violates these Terms or engages in harmful behavior.",
            },
            {
              title: "6. Intellectual Property",
              text: "All content, code, branding, and AI models used in FinOwl are owned by us or licensed to us. You may not copy, distribute, or reproduce any part of the platform without written permission.",
            },
            {
              title: "7. Limitation of Liability",
              text: "FinOwl is provided “as is” with no guarantees. We are not liable for any direct, indirect, or incidental losses arising from your use of the platform, including financial losses, smart contract errors, or AI inaccuracies.",
            },
            {
              title: "8. Modifications",
              text: "We may update these Terms at any time. Continued use of FinOwl after changes are posted constitutes your acceptance of the updated Terms. The current version will always be available on this page.",
            },
            {
              title: "9. Contact",
              text: (
                <>
                  For any questions regarding these Terms, you can contact us
                  at:{" "}
                  <a
                    href="mailto:contact@finowl.finance"
                    className="text-[#BA98D5] hover:underline"
                  >
                    contact@finowl.finance
                  </a>
                </>
              ),
            },
          ].map((section, index) => (
            <section key={index} className="mb-10">
              <h2 className="text-lg sm:text-xl font-semibold mb-3 text-[#BA98D5]">
                {section.title}
              </h2>
              <p className="leading-relaxed text-sm sm:text-base">
                {section.text}
              </p>
              {section.list && (
                <ul className="list-disc list-inside mt-2 text-sm sm:text-base text-white/90">
                  {section.list.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              )}
              {section.extra && (
                <p className="mt-2 text-sm sm:text-base">{section.extra}</p>
              )}
            </section>
          ))}
        </article>
      </div>
    </>
  );
}
