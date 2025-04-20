import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";

const Tooltip = ({ children, text, above }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const tooltipRef = useRef(null);
  const childRef = useRef(null);

  useEffect(() => {
    if (isVisible && childRef.current) {
      const rect = childRef.current.getBoundingClientRect();
      let val = 8;
      if (above) val = 30;
      setPosition({
        top: rect.top - val, // Position above the text
        left: rect.left + rect.width / 2, // Center tooltip
      });
    }
  }, [isVisible, above]);

  return (
    <>
      <span
        className="relative group"
        ref={childRef}
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
      >
        {children}
      </span>

      {isVisible &&
        createPortal(
          <div
            ref={tooltipRef}
            className="fixed text-white overflow-hidden text-sm rounded-[10px] p-4 bg-[#010101] border border-[#292929] shadow-lg transition-opacity duration-200"
            style={{
              top: position.top,
              left: position.left,
              transform: "translate(-50%, -100%)",
              zIndex: 50, // Ensures tooltip appears on top
            }}
          >
            <div className="absolute top-2 right-0 w-32 h-8 bg-[var(--primary-color)] -z-10 rounded-[0px_0px_10px_10px] blur-xl opacity-65"></div>
            {text}
          </div>,
          document.body
        )}
    </>
  );
};

export default Tooltip;
