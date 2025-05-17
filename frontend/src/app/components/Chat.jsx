"use client";

import React, { useEffect, useRef, useState } from "react";
import { urbanist } from "../fonts";
import { FiSend } from "react-icons/fi";
import { TbLayoutSidebarLeftCollapse } from "react-icons/tb";
import { TbLayoutSidebarRightExpand } from "react-icons/tb";
import { IoIosArrowBack } from "react-icons/io";

import coinOwl from "@/app/assets/svg/coinOwl.svg";

import SimpleTooltip from "./SimpleTooltip";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import Modal from "./Modal";

export default function Chat() {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [shouldCollapse, setShouldCollapse] = useState(false);
  const chatEndRef = useRef(null);

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
  };

  // Scroll to the bottom on new message
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);
  return (
    <article className="relative bg-[#0F0F0F]/40 mx-4 rounded-[15px] h-[100dvh] lg:h-[100vh] overflow-hidden grid grid-cols-5">
      {/* <FirstMessage /> */}

      {/* Scrollable Chat Messages Area */}
      <AnimatePresence
        mode="wait"
        onExitComplete={() => setShouldCollapse(true)}
      >
        {!isCollapsed && (
          <SideBarConversations
            isCollapsed={isCollapsed}
            setIsCollapsed={setIsCollapsed}
          />
        )}
      </AnimatePresence>
      <div
        className={`${
          shouldCollapse ? "col-span-5" : "lg:col-span-4"
        }  flex flex-col w-[100%] col-span-5 overflow-hidden`}
      >
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

        {/* Chat Input */}
        <div className="w-full px-4 pb-4">
          <div className="flex items-center w-full lg:w-[70%] mx-auto bg-[#28212F] border border-[#3D2C4B] rounded-[20px] p-2 px-4 shadow-inner">
            <input
              type="text"
              placeholder="Ask Anything..."
              className="flex-grow bg-transparent text-white placeholder-white/20 outline-none"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
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
      {isCollapsed && (
        <button
          onClick={() => {
            setIsCollapsed(false);
            setShouldCollapse(false);
          }}
          className="absolute left-0 top-0 z-10 p-2 rounded-lg"
          aria-label="Open sidebar"
        >
          <TbLayoutSidebarRightExpand
            className="w-10 h-10 rounded-lg p-1 hover:bg-[#BA98D5]/20 transition-colors"
            color="var(--primary-color)"
          />
        </button>
      )}
    </article>
  );
}

function FirstMessage() {
  return (
    <>
      <div className="h-full flex justify-center items-center">
        <div className="w-full h-full p-4 flex flex-col justify-center items-center">
          <div>
            <p
              className={`${urbanist.className} font-semibold text-center mb-2 text-[20px] lg:text-[30px] text-white`}
            >
              <span className={`text-[#BA98D5]`}>Hey! </span>
              How Can I help you
              <span className={`text-[#BA98D5]`}> Today?</span>
            </p>
          </div>
          <div className="flex justify-center items-center w-full lg:w-[50%] bg-[#28212F] border border-[#3D2C4B] rounded-[20px] p-2 px-4 shadow-inner">
            <input
              type="text"
              placeholder="Ask Anything..."
              className="flex-grow bg-transparent text-white placeholder-white/20  outline-none"
            />
            <button className="ml-2 bg-[#BA98D5] p-2 rounded-md hover:bg-[#d6b4ff] transition-colors">
              <FiSend className="text-[#1C1A22] text-lg" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

function SideBarConversations({ isCollapsed, setIsCollapsed }) {
  const [isModalOpen, setModalOpen] = useState(false);
  const router = useRouter();
  return (
    <motion.div
      initial={{ x: 0, opacity: 1 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: -200, opacity: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className={`bg-[#2D2633] fixed h-[100dvh] lg:static lg:col-span-1 p-2 rounded-[15px] flex flex-col overflow-hidden`}
    >
      <div className="flex items-center justify-between">
        <button
          className={`flex items-center gap-2 px-2 py-2 font-semibold text-white rounded-lg hover:bg-[#BA98D5]/20 transition-colors ${urbanist.className}`}
          aria-label="Go back"
          onClick={() => {
            router.back();
          }}
        >
          <IoIosArrowBack className="w-5 h-5" />
          <span className="text-sm">Back</span>
        </button>
        <SimpleTooltip text={"Close sidebar"} position="left">
          <TbLayoutSidebarLeftCollapse
            onClick={() => setIsCollapsed(true)}
            className="w-10 h-10 rounded-lg p-1 hover:bg-[#BA98D5]/20 transition-colors"
            color="var(--primary-color)"
          />
        </SimpleTooltip>
      </div>
      <div className="flex items-center justify-center my-2">
        <button
          onClick={() => setModalOpen(true)}
          className={`${urbanist.className} font-semibold px-4 py-2 rounded-lg text-white bg-[radial-gradient(closest-side_at_50%_50%,#BA98D5_0%,#643989_100%)] hover:opacity-90 transition-all`}
        >
          + New Conversation
        </button>
        <Modal
          isOpen={isModalOpen}
          onClose={() => setModalOpen(false)}
          title="Hello Modal!"
        >
          <p>This is a reusable modal using your color theme.</p>
        </Modal>
      </div>

      <div className="flex-1 overflow-y-auto">
        {Array(13)
          .fill(0)
          .map(() => {
            return (
              <div
                key={Math.random()}
                className="hover:bg-[#BA98D5]/10 p-1 transition-colors rounded-lg flex items-center justify-between"
              >
                <button className="w-full text-left text-white truncate max-w-[180px] py-2 rounded-lg ">
                  {"dkfnsdkfnsdklfdljdlkvnkdlnvlskndvkldnvzz"}
                </button>

                <div className="bg-[#1F1923] p-1 rounded-lg text-white flex gap-1 items-center justify-center">
                  <Image
                    className="w-4"
                    src={coinOwl}
                    width={undefined}
                    height={undefined}
                    alt="coin Owl"
                  />
                  <span
                    className={`text-xs truncate max-w-5 font-semibold ${urbanist.className}`}
                  >
                    100
                  </span>
                </div>
              </div>
            );
          })}
      </div>
    </motion.div>
  );
}
