"use client";

import React from "react";
import { motion } from "motion/react";
import LogoIcon from "@/app/components/Icons/LogoIcon";
import { FaBars } from "react-icons/fa";
import { urbanist } from "@/app/fonts";
import { IoIosArrowBack } from "react-icons/io";
import { FiMoreHorizontal } from "react-icons/fi";
import { useRouter } from "next/navigation";



export default function SideBar({ collapsed, toggle, loading = false }) {
    const router = useRouter();
  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 0 : 260 }}
      transition={{ type: "tween", duration: 0.3 }}
      className="h-full bg-[#2D2633] flex-shrink-0 overflow-hidden fixed lg:static"
    >
      {/* header */}
      <div className="p-4 h-14 flex items-center space-x-2">
        <button
          onClick={toggle}
          className="rounded-lg hover:bg-[#BA98D5]/20 transition-colors text-white"
          aria-label="Toggle sidebar"
        >
          <FaBars className="w-6 h-6" />
        </button>
        <LogoIcon />
      </div>

      <motion.div
        initial={false}
        animate={{ opacity: collapsed ? 0 : 1 }}
        transition={{ duration: 0.2 }}
        className="py-2 pl-2 h-[calc(100%_-_3.5rem)] flex flex-col"
      >
        {/* controls */}
        <div className="flex pr-2 items-center justify-between mb-1">
          <button
            className={`flex items-center gap-2 px-2 py-2 font-semibold text-white rounded-lg hover:bg-[#BA98D5]/20 transition-colors ${urbanist.className}`}
            aria-label="Go back"
            onClick={() => router.back()}
          >
            <IoIosArrowBack className="w-5 h-5" />
            <span className="text-sm">Back</span>
          </button>
          <button
            className={`${urbanist.className} font-semibold px-4 py-2 rounded-lg text-white bg-[radial-gradient(closest-side_at_50%_50%,#BA98D5_0%,#643989_100%)] hover:opacity-90 transition-all`}
          >
            + New
          </button>
        </div>

        {/* body */}
        <div className="flex-1 overflow-y-auto relative">
          {loading ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <div
                className="w-10 h-10 border-4 border-[#BA98D5] border-t-white rounded-full animate-spin"
                aria-label="Loading..."
              />
            </div>
          ) : (
            <div className="mr-2">
              {Array(18)
                .fill(0)
                .map((_, i) => (
                  <div
                    key={i}
                    className="hover:bg-[#BA98D5]/10 p-1 transition-colors rounded-lg flex items-center justify-between"
                  >
                    <button className="w-full text-left text-white truncate max-w-[220px] py-2 rounded-lg">
                      dkfnsdkfnsdklfdljdlkvnkdlnvlskndvkldnvzz
                    </button>
                    <button
                      className="p-1 rounded-full hover:bg-[#BA98D5]/20 transition-colors"
                      aria-label="More options"
                    >
                      <FiMoreHorizontal className="w-5 h-5 text-white" />
                    </button>
                  </div>
                ))}
            </div>
          )}
        </div>
      </motion.div>
    </motion.aside>
  );
}
