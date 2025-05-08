"use client";

import React from "react";

export default function SimpleTooltip({ children, text, position = "top" }) {
  return (
    <div className="relative group inline-block cursor-pointer">
      {children}
      <span
        className={`absolute whitespace-nowrap bg-black text-white text-xs rounded px-2 py-1 hidden group-hover:block transition-opacity duration-200 z-10
          ${position === "top" && "bottom-full left-1/2 -translate-x-1/2 mb-2"}
          ${position === "bottom" && "top-full left-1/2 -translate-x-1/2 mt-2"}
          ${position === "left" && "right-full top-1/2 -translate-y-1/2 mr-2"}
          ${position === "right" && "left-full top-1/2 -translate-y-1/2 ml-2"}
        `}
      >
        {text}
      </span>
    </div>
  );
}
