"use client";

import React, { useEffect, useRef, useState } from "react";
import { TbLayoutSidebarLeftCollapse } from "react-icons/tb";
import { TbLayoutSidebarRightExpand } from "react-icons/tb";
import { IoIosArrowBack } from "react-icons/io";

import coinOwl from "@/app/assets/svg/coinOwl.svg";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { FaBars, FaPlus } from "react-icons/fa";
import Chat from "@/app/components/Chat";
import LogoIcon from "@/app/components/Icons/LogoIcon";
import { FiMoreHorizontal, FiSend } from "react-icons/fi";
import { urbanist } from "@/app/fonts";

export default function OnboardingPage() {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [shouldCollapse, setShouldCollapse] = useState(false);
  const chatEndRef = useRef(null);
  const textareaRef = useRef(null);

  const handleSend = () => {
    if (message.trim() === "") return;

    const newMessages = [...messages, { sender: "user", text: message }];
    setMessages(newMessages);
    setMessage("");

    // Simulate bot typing
    setMessages((prev) => [...prev, { sender: "loading", text: "..." }]);

    setTimeout(() => {
      setMessages((prev) => {
        // Replace loading with actual message
        const updated = [...prev];
        updated.pop(); // remove the loading message
        updated.push({
          sender: "bot",
          text: `You said: "${message}" 🤖`,
        });
        return updated;
      });
    }, 1000); // delay for typing simulation

    // reset height
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  // Scroll to the bottom on new message
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);
  const [collapsed, setCollapsed] = useState(false);
  const toggle = () => setCollapsed((prev) => !prev);

  // you can wire up these wallet buttons exactly as before
  const label = "Connect Wallet";
  const action = () => {
    /* signIn or signOut */
  };

  return (
    <div className="h-screen flex overflow-hidden">
      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{ width: collapsed ? 0 : 260 }}
        transition={{ type: "tween", duration: 0.3 }}
        className="h-full bg-[#2D2633] flex-shrink-0 overflow-hidden fixed lg:static"
      >
        <div className="p-4 h-14 flex items-center space-x-2">
          <button
            onClick={toggle}
            className="rounded-lg hover:bg-[#BA98D5]/20 transition-colors text-white"
            aria-label="Toggle sidebar"
          >
            <FaBars className="w-6 h-6" />
          </button>
          <span className="">
            <LogoIcon />
          </span>
        </div>
        {/* any extra sidebar content */}
        <motion.div
          initial={false}
          animate={{ opacity: collapsed ? 0 : 1 }}
          transition={{ duration: 0.2 }}
          className="py-2 pl-2 h-[calc(100%_-_3.5rem)] flex flex-col"
        >
          <div className="flex pr-2 items-center justify-between mb-1">
            <button
              className={`flex items-center gap-2 px-2 py-2 font-semibold text-white rounded-lg hover:bg-[#BA98D5]/20 transition-colors ${urbanist.className}`}
              aria-label="Go back"
              // onClick={() => {
              //   router.back();
              // }}
            >
              <IoIosArrowBack className="w-5 h-5" />
              <span className="text-sm">Back</span>
            </button>
            <button
              // onClick={() => setModalOpen(true)}
              className={`${urbanist.className} font-semibold px-4 py-2 rounded-lg text-white bg-[radial-gradient(closest-side_at_50%_50%,#BA98D5_0%,#643989_100%)] hover:opacity-90 transition-all`}
            >
              + New
            </button>
          </div>
          <div className="flex-1 overflow-y-auto">
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
          </div>
        </motion.div>
      </motion.aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col w-[calc(100%_-_260px)]">
        {/* Header */}
        <div className="p-4 h-14 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <button
              onClick={toggle}
              className={`rounded-lg hover:bg-[#BA98D5]/20 transition-colors text-white ${
                !collapsed && "hidden"
              }`}
              aria-label="Toggle sidebar"
            >
              <FaBars className="w-6 h-6" />
            </button>
            <span className={`${!collapsed && "hidden"}`}>
              <LogoIcon />
            </span>
          </div>
          <div className="flex gap-3">
            <button
              onClick={action}
              className="flex gap-2 items-center text-white bg-[#1F1923] border border-[#643989] truncate max-w-[150px] font-bold p-2 rounded-xl"
              title={label}
            >
              <Image
                src={coinOwl}
                alt="coin Owl"
                width={24}
                height={24}
                className="w-6 h-6"
              />
              <span
                className={`text-md truncate max-w-10 font-semibold ${urbanist.className}`}
              >
                100
              </span>
              <div className="flex justify-center items-center p-2 rounded-lg bg-[radial-gradient(closest-side_at_50%_50%,#BA98D5_0%,#643989_100%)]">
                <FaPlus className="w-4 h-4" color="#3D2C4B" />
              </div>
            </button>
            <button
              onClick={action}
              className="text-white bg-[#1F1923] border border-[#BA98D5] truncate max-w-[150px] font-bold p-2 rounded-xl"
              title={label}
            >
              {label}
            </button>
          </div>
        </div>

        {/* Chat / Body */}
        <div className="flex-1 flex flex-col h-full overflow-hidden">
          {/* Messages list */}
          <div className="flex-1 flex flex-col overflow-y-auto m-4 lg:mx-[10%] space-y-3">
            {messages.map((msg, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className={`max-w-[75%] break-words px-4 py-2 rounded-xl text-white ${
                  msg.sender === "user"
                    ? "bg-[radial-gradient(closest-side_at_50%_50%,#BA98D5_0%,#643989_100%)] self-end"
                    : msg.sender === "bot"
                    ? "bg-[#28212F] self-start"
                    : "bg-[#1F1923] self-start animate-pulse"
                }`}
              >
                {msg.sender === "loading" ? (
                  <span className="text-white/40">AI is typing...</span>
                ) : (
                  msg.text
                )}
              </motion.div>
            ))}
            <div ref={chatEndRef} />
          </div>

          {/* Input bar */}
          <div className="w-full px-4 pb-4">
            <div className="flex items-end w-full lg:w-[80%] mx-auto bg-[#28212F] border border-[#3D2C4B] rounded-[20px] p-2 px-4 shadow-inner">
              <textarea
                ref={textareaRef}
                rows={1}
                placeholder="Ask Anything..."
                value={message}
                onChange={(e) => {
                  setMessage(e.target.value);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                onInput={(e) => {
                  // auto-grow
                  const ta = e.currentTarget;
                  ta.style.height = "auto";
                  ta.style.height = ta.scrollHeight + "px";
                }}
                className="flex-grow bg-transparent text-white placeholder-white/20 outline-none resize-none overflow-y-auto max-h-32 py-1"
              />
              <button
                onClick={handleSend}
                className="ml-2 bg-[#BA98D5] p-2 rounded-md hover:bg-[#d6b4ff] transition-colors"
              >
                <FiSend className="text-[#1C1A22] text-lg" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
