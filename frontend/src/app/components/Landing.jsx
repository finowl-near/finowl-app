import React from "react";
import LogoIcon from "./Icons/LogoIcon";
import Image from "next/image";
import owlLand from "@/app/assets/svg/owl-land.svg";
import screenLand from "@/app/assets/svg/screen-land.svg";
import { urbanist } from "../fonts";

export default function Landing() {
  return (
    <>
      <div className="m-2 pl-10 rounded-[15px] relative  landing-bg">
        <div className="py-2">
          <LogoIcon />
        </div>
        <Image
          className="w-[35rem] rounded-full absolute mix-blend-hard-light -top-10 -right-2 [clip-path:inset(40px_35px_0px_0px)]"
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
      <div>
        <Image
          src={screenLand}
          width={undefined}
          height={undefined}
          alt="screen land"
        />
      </div>
    </>
  );
}
