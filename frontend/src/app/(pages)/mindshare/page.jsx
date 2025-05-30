import Header from "@/app/components/Header";
import LandingPage from "@/app/components/LandingPage";
import React from "react";
import { FaEnvelope, FaTwitter } from "react-icons/fa";

export default function page() {
  return (
    <>
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
              <FaTwitter className="w-4 h-4" color="#FFFFFF" />
            </a>
          </div>
        </div>
      </footer>
    </>
  );
}
