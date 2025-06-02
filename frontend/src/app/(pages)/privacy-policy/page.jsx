import React from "react";
import Head from "next/head";
import { urbanist } from "@/app/fonts";
import Header from "@/app/components/Header";

export const metadata = {
  title: "Privacy Policy | FinOwl",
  description:
    "Learn how FinOwl collects, uses, and protects your data. Your privacy is important to us.",
  robots: "index, follow",
  openGraph: {
    title: "FinOwl Privacy Policy",
    description:
      "Privacy policy for FinOwl, the AI-powered crypto investment assistant built on NEAR Protocol.",
    url: "https://finowl.finance/privacy-policy", // optional but good practice
  },
};

export default function PrivacyPage() {
  return (
    <>
      <Header/>
      <div className="relative min-h-screen bg-[#151515] text-white px-6 py-12 overflow-hidden">
        {/* Decorative blur circles */}
        <div className="absolute top-[-100px] left-[-100px] w-[300px] h-[300px] bg-[#BA98D5] rounded-full opacity-30 blur-[120px] pointer-events-none z-0" />
        <div className="absolute bottom-[20%] right-[-80px] w-[250px] h-[250px] bg-[#BA98D5] rounded-full opacity-20 blur-[100px] pointer-events-none z-0" />
        <div className="absolute top-[40%] left-[50%] transform -translate-x-1/2 w-[180px] h-[180px] bg-[#BA98D5] rounded-full opacity-10 blur-[90px] pointer-events-none z-0" />

        <article className="relative z-10 max-w-3xl mx-auto">
          <header className="mb-8">
            <h1
              className={`text-3xl sm:text-4xl font-bold mb-2 ${urbanist.className}`}
            >
              Privacy Policy | FinOwl
            </h1>
            <p className="text-[#BA98D5] text-sm sm:text-base">
              Last updated: May 30, 2025
            </p>
          </header>

          <section className="mb-10">
            <p className="leading-relaxed text-sm sm:text-base">
              Welcome to the official{" "}
              <strong className="text-[#BA98D5]">
                Privacy Policy of FinOwl
              </strong>{" "}
              — your AI financial assistant for smarter cryptocurrency
              investing, powered by the NEAR Protocol. This page outlines how we
              collect, use, and safeguard your data while using our platform and
              tools, including our AI assistant, trading integrations, and NEAR
              wallet features.
            </p>
          </section>

          {[
            {
              title: "1. Information We Collect",
              list: [
                "NEAR Wallet Address: When you connect your NEAR wallet, we collect your public address to enable blockchain transactions.",
                "Usage Data: We gather anonymized analytics to improve features like our AI assistant and on-chain tools.",
                "AI Conversations: Your chat interactions with FinOwl may be stored for AI optimization and accuracy improvements.",
                "Cookies: Non-essential cookies may be used for user sessions and traffic insights.",
              ],
            },
            {
              title: "2. How Your Information Is Used",
              intro: "We use collected data to:",
              list: [
                "Enable smart contract operations via NEAR Intents",
                "Improve our AI chatbot responses and financial signals",
                "Understand how users interact with FinOwl and optimize UX",
                "Ensure platform safety and fraud prevention",
              ],
            },
            {
              title: "3. Data Sharing & Third Parties",
              text: "FinOwl does not sell or rent your data. We only share information with trusted infrastructure providers like OpenAI, DeepSeek, and NEAR RPC nodes to enable platform features.",
            },
            {
              title: "4. Data Retention",
              text: "We store anonymized user data and AI interactions only as long as necessary to support and improve FinOwl's performance. You may contact us anytime to request deletion of stored information.",
            },
            {
              title: "5. Security",
              text: "We implement modern encryption, access control, and backend security measures to prevent unauthorized access, alteration, or data misuse.",
            },
            {
              title: "6. Your Rights",
              list: [
                "Request deletion or access to stored personal data",
                "Opt-out of cookie tracking (if implemented)",
                "Disconnect your NEAR wallet at any time",
              ],
            },
            {
              title: "7. Updates to This Policy",
              text: "FinOwl may revise this Privacy Policy as the platform evolves. All updates will be reflected on this page with a new effective date. We recommend checking back periodically for changes.",
            },
            {
              title: "8. Contact",
              text: (
                <>
                  For privacy-related inquiries, please email us at:{" "}
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
              {section.intro && (
                <p className="text-sm sm:text-base mb-2">{section.intro}</p>
              )}
              {section.text && (
                <p className="leading-relaxed text-sm sm:text-base">
                  {section.text}
                </p>
              )}
              {section.list && (
                <ul className="list-disc list-inside text-sm sm:text-base text-white/90">
                  {section.list.map((item, i) => (
                    <li key={i} dangerouslySetInnerHTML={{ __html: item }} />
                  ))}
                </ul>
              )}
            </section>
          ))}
        </article>
      </div>
    </>
  );
}
