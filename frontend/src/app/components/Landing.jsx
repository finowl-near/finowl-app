import React from "react";
import LogoIcon from "./Icons/LogoIcon";
import Image from "next/image";
import owlLand from "@/app/assets/svg/owl-land.svg";
import screenLand from "@/app/assets/svg/screen-land.svg";
import { urbanist } from "../fonts";
import feedland from "@/app/assets/svg/feedland.svg";
import handphone from "@/app/assets/svg/handphone.svg";

export default function Landing() {
  return (
    <>
      <div className="m-2 pl-10 rounded-[15px] relative  landing-bg">
        <div className="py-2">
          <LogoIcon />
        </div>
        <Image
          className="w-[35rem] rounded-full absolute mix-blend-hard-light -top-10 -right-2 [clip-path:inset(40px_0px_0px_0px)]"
          src={owlLand}
          width={undefined}
          height={undefined}
          alt="owl land"
        />
        <div className="text-white py-24 ">
          <h1
            className={`${urbanist.className} pb-8 font-semibold text-[60px] leading-none`}
          >
            Spot Tomorrow’s <br />
            Crypto Winners, Today.
          </h1>
          <p
            className={`${urbanist.className} pb-8 font-light text-[30px] leading-none`}
          >
            FinOwl scans the crypto noise 24/7 to surface tokens
            <br /> on the verge of breakout.
          </p>
          <div className="[box-shadow:0.5px_0px_8px_#ffffff4b;] w-[fit-content] rounded-[15px]">
            <button
              className={`px-4 py-3 button-syle text-white text-[20px] ${urbanist.className} font-semibold border border-[#442162] rounded-[15px]`}
            >
              Launch App
            </button>
          </div>
        </div>
      </div>
      {/* big image Section  */}
      <div className="flex justify-center relative h-[950px]">
        <Image
          className=" absolute -top-20"
          src={screenLand}
          width={undefined}
          height={undefined}
          alt="screen land"
        />
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
            <p className={` ${urbanist.className} font-semibold text-[55px] text-white`}>
              Real-Time <span className="text-[#BA98D5]">Signals.</span>
            </p>
            <p className={` ${urbanist.className} font-semibold text-[55px] text-white`}>
              Tweeted for<span className="text-[#BA98D5]">You.</span>
            </p>
          </div>
          <p className={` ${urbanist.className} my-3 leading-none text-[25px] font-light text-white`}>
            We decode what matters so you can focus <br /> on execution, not
            research.
          </p>
          <div className="[box-shadow:0.5px_0px_8px_#ffffff4b;] w-[fit-content] rounded-[15px]">
            <button
              className={`px-4 py-3 button-syle text-white text-[20px] ${urbanist.className} font-semibold border border-[#442162] rounded-[15px]`}
            >
              Launch App
            </button>
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
    </>
  );
}
