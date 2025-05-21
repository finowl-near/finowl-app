"use client";
import React, { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import { FiSend } from "react-icons/fi";

export default function ChatMessages() {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
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
  return (
    <>
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
    </>
  );
}
