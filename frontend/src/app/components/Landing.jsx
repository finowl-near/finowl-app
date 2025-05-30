"use client";

import React from "react";
import LogoIcon from "./Icons/LogoIcon";
import Image from "next/image";
import owlLand from "@/app/assets/svg/owl-land.svg";
import screenLand from "@/app/assets/svg/screen-land.svg";
import { urbanist } from "../fonts";
import feedland from "@/app/assets/svg/feedland.svg";
import handphone from "@/app/assets/svg/handphone.svg";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { FaEnvelope, FaTwitter } from "react-icons/fa";

export default function Landing() {
  const router = useRouter();
  return (
    <>
      <motion.div className="m-2 px-4 sm:px-10 py-6 sm:pl-10 rounded-[15px] relative landing-bg overflow-hidden">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="py-2"
        >
          <LogoIcon />
        </motion.div>

        {/* Background Image */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <Image
            className="w-[28rem] sm:w-[35rem] blur-[5px] md:w-[45rem] rounded-full absolute mix-blend-hard-light top-4 sm:top-4 -right-2 z-0"
            src={owlLand}
            width={undefined}
            height={undefined}
            alt="owl land"
          />
        </motion.div>

        {/* Text Content */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="text-white py-16 sm:py-24 max-w-3xl relative z-20"
        >
          <h1
            className={`${urbanist.className} pb-6 sm:pb-8 font-semibold text-[38px] sm:text-[48px] md:text-[60px] leading-tight`}
          >
            Spot Tomorrow’s <br className="" />
            Crypto Winners, Today.
          </h1>
          <p
            className={`${urbanist.className} pb-6 sm:pb-8 font-light text-[20px] sm:text-[24px] md:text-[30px] leading-relaxed`}
          >
            FinOwl scans the crypto noise 24/7 to surface tokens
            <br className="" /> on the verge of breakout.
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
        </motion.div>
      </motion.div>
      {/* Dashboard Preview */}
      <div className="relative z-10 flex justify-center px-4 pb-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.6 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="rounded-2xl overflow-hidden w-full max-w-7xl shadow-xl"
        >
          <Image
            src={screenLand}
            alt="FinOwl dashboard preview"
            className="w-full h-auto"
            priority
          />
        </motion.div>
      </div>
      {/* Fresh Alpha Section */}
      <div className="mt-[3vw] relative px-10 flex justify-center gap-28 items-center rounded-[15px] ">
        <div className="w-[24rem] h-[24rem] -z-10 bg-[#BA98D5] brightness-50 rounded-[10rem_0_0_10rem] absolute right-0 -top-[12rem] blur-[200px]"></div>
        <div className="">
          <Image
            className="w-[42vw]"
            src={feedland}
            width={undefined}
            height={undefined}
            alt="feed land "
          />
        </div>
        <div className="leading-none">
          <p
            className={`text-white text-[55px] ${urbanist.className} font-semibold`}
          >
            Fresh <span className="text-[#BA98D5]">Alpha</span>
          </p>
          <p
            className={`text-white text-[55px] ${urbanist.className} font-semibold`}
          >
            Every <span className="text-[#BA98D5]">4 Hours</span>
          </p>
          <p
            className={`text-white text-[55px] ${urbanist.className} font-semibold`}
          >
            Every <span className="text-[#BA98D5]">Angle</span>
          </p>
          <p
            className={`${urbanist.className} text-white pt-2 font-light text-[22px] leading-none`}
          >
            Macro insights. Token trends. Influencer
            <br /> signals. All synthesized for you.
          </p>
        </div>
      </div>

      {/* Hand phone */}
      <div className="landing-bg flex items-center justify-center gap-20 p-8">
        <div>
          <div className="leading-none">
            <p
              className={` ${urbanist.className} font-semibold text-[55px] text-white`}
            >
              Real-Time <span className="text-[#BA98D5]">Signals.</span>
            </p>
            <p
              className={` ${urbanist.className} font-semibold text-[55px] text-white`}
            >
              Tweeted for<span className="text-[#BA98D5]">You.</span>
            </p>
          </div>
          <p
            className={` ${urbanist.className} my-3 leading-none text-[25px] font-light text-white`}
          >
            We decode what matters so you can focus <br /> on execution, not
            research.
          </p>
          <div className="[box-shadow:0.5px_0px_8px_#ffffff4b;] w-[fit-content] rounded-[15px]">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`px-4 py-3 button-syle text-white text-[20px] ${urbanist.className} font-semibold border border-[#442162] rounded-[15px]`}
              onClick={() => {
                router.push("/mindshare");
              }}
            >
              Launch App
            </motion.button>
          </div>
        </div>
        <div className="">
          <Image
            className="[clip-path:inset(0px_0px_35px_0px)]"
            src={handphone}
            width={undefined}
            height={600}
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
