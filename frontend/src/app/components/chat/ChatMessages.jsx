"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import { FiSave, FiSend } from "react-icons/fi";
import ReactMarkdown from "react-markdown";
import { calculateTokens, calculateTotalTokens } from "./utils/calculateTokens";
import { analyzeMarket } from "./utils/analyzeMarket";
import { deductAiTokens } from "./utils/deductAiTokens";
import useConversationId from "@/app/hooks/useConversationId";
import { urbanist } from "@/app/fonts";
import { Tooltip } from "antd";
import { toast, Toaster } from "sonner";
import { useWalletSelector } from "@near-wallet-selector/react-hook";

export default function ChatMessages({ conversationHistory, refresh }) {
  console.log("inside", conversationHistory);
  const { callFunction } = useWalletSelector();
  const convId = useConversationId((state) => state.convId);
  const tokensLeft = useConversationId((state) => state.tokensLeft);

  const chatEndRef = useRef(null);
  const textareaRef = useRef(null);

  // Initialize messages from conversationHistory
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");

  // loading for save
  const [loading, setLoading] = useState(false);

  // whenever the prop array changes, re‐build our internal messages
  useEffect(() => {
    setMessages(conversationHistory.slice());
  }, [conversationHistory]);
  // Scroll to bottom whenever messages change
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSaveFullConversation() {
    setLoading(true);
    try {
      // TODO: check if messages empty
      console.log("messages", messages);
      if (messages.length === 0) {
        toast.error('cannot save empt conversation');
        setLoading(false);
        return;
      }
      // Get current timestamp
      const timestamp = Math.floor(Date.now() / 1000);
      const totalTokens = calculateTotalTokens(messages);
      console.log(`Total tokens used for conversation: ${totalTokens}`);
      const internalTokens = (totalTokens * 1_000_000).toFixed(0);
      // Prepare metadata
      const metadata = {
        tokens_reserved: "10000000", // 10 tokens reserved in internal units
        tokens_used: internalTokens,
      };
      const result = await callFunction({
        contractId: "finowl.testnet",
        method: "call_js_func",
        args: {
          function_name: "save_full_conversation",
          conversation_id: convId,
          messages: messages,
          metadata: metadata,
          timestamp: timestamp,
        },
      });
      if (!result) {
        throw new Error("Error while saving conversation");
      }
      toast.success('Succesfully saved conversation');
      refresh();
      setLoading(false);
    } catch (error) {
      alert(`${error} in handle save full conversation`);
      setLoading(false);
    }
  }

  async function handleSend() {
    if (!message.trim()) return;
    console.log("crv=>", convId, tokensLeft);
    if (tokensLeft <= 0) {
      toast.error("Your conversation balance is empty add some");
      setMessage("");
      return;
    }
    setMessages((prev) => [...prev, { sender: "user", text: message }]);
    setMessages((prev) => [...prev, { sender: "loading", text: "..." }]);
    setMessage("");
    try {
      // Append user message
      const timestamp = Math.floor(Date.now() / 1000);
      // Create user message object
      const userMessage = {
        role: "user",
        content: message,
        timestamp: timestamp,
      };
      console.log("message???", message);
      const userMessageToken = calculateTokens(message);
      console.log(`User message uses ${userMessageToken} tokens`);
      const aiResponse = await analyzeMarket(message);
      if (!aiResponse) {
        throw new Error("analysing market failed");
      }
      console.log(`aiResponse`, aiResponse);
      const aiMessageTokens = calculateTokens(aiResponse);
      console.log(`AI response uses ${aiMessageTokens} tokens`);
      const deductRes = await deductAiTokens(aiMessageTokens, convId);
      if (!deductRes) {
        throw new Error("deduct failed");
      }
      console.log(`deductRes`, deductRes);
      setMessages((prev) => {
        const withoutLoading = prev.filter((m) => m.sender !== "loading");
        return [...withoutLoading, { sender: "bot", text: aiResponse }];
      });
      refresh();
    } catch (error) {
      alert("error catched in handle send", error);
    }

    // reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  }

  return (
    <>
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Messages list */}
        <div
          className={`flex-1 flex ${
            messages.length === 0 && "justify-center"
          } flex-col overflow-y-auto m-4 lg:mx-[10%] space-y-3`}
        >
          {messages.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8">
              <motion.p
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className={`${urbanist.className} font-semibold text-center mb-2 text-[20px] lg:text-[30px] text-white`}
              >
                <span className={`text-[#BA98D5]`}>Hey! </span>
                How Can I help you
                <span className={`text-[#BA98D5]`}> Today?</span>
              </motion.p>
            </div>
          ) : (
            <>
              {messages.map((msg, i) => (
                <motion.div
                  key={i}
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
                    <ReactMarkdown
                      components={{
                        table: ({ node, ...props }) => (
                          <div className="markdown-table-container">
                            <table {...props} />
                          </div>
                        ),
                        p: ({ node, ...props }) => (
                          <p style={{ whiteSpace: "pre-wrap" }} {...props} />
                        ),
                      }}
                    >
                      {msg.text}
                    </ReactMarkdown>
                  )}
                </motion.div>
              ))}
            </>
          )}
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
              onChange={(e) => setMessage(e.target.value)}
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

            {/* Button Group */}
            <div className="flex space-x-2 ml-2">
              {/* Send Button */}
              <button
                onClick={handleSend}
                className="flex items-center justify-center bg-[#BA98D5] hover:bg-[#A066C1] p-2 rounded-md transition-colors"
                aria-label="Send message"
              >
                <FiSend className="text-[#1C1A22] text-lg" />
              </button>

              {/* Save Button */}
              <Tooltip title="Save Full conversation" color="#1C1A22">
                <button
                  onClick={handleSaveFullConversation}
                  className="flex items-center justify-center bg-[#BA98D5] hover:bg-[#A066C1] p-2 rounded-md transition-colors"
                  aria-label="Save draft"
                >
                  {loading ? (
                    <div
                      className="w-5 h-5 border-2 border-[#3D2C4B] border-t-[#FFFFFF]
                  rounded-full animate-spin"
                      aria-label="Saving…"
                    />
                  ) : (
                    <FiSave className="text-[#1C1A22] text-lg" />
                  )}
                </button>
              </Tooltip>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
