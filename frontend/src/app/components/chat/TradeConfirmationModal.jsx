"use client";

import React, { useEffect, useRef, useState } from "react";
import Modal from "../Modal";
import { useWalletSelector } from "@near-wallet-selector/react-hook";
import NearTransferService from "@/app/Wallets/services/nearTransferService";
import { toast } from "sonner";
import { calculateTokens } from "./utils/calculateTokens";
import { SwapTrackingService } from "@/app/Wallets/services/swapTrackingService";

export default function TradeConfirmationModal({
  isTradeModalOpen,
  setIsTradeModalOpen,
  tradeModalData,
  message = { message },
  onConfirm,
  onCancel,
  setMessages,
}) {
  const walletSelector = useWalletSelector();
  const [loading, setLoading] = useState(false);
  const trackingControllerRef = useRef(null);
  const [tracking, setTracking] = useState(false);
  const [statusInfo, setStatusInfo] = useState(null);
  const [progress, setProgress] = useState(0);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (trackingControllerRef.current) {
        trackingControllerRef.current.stop();
        trackingControllerRef.current = null;
      }
    };
  }, []);

  const mapStatusToProgress = (status) => {
    switch (status) {
      case "pending":
        return 25;
      case "processing":
        return 60;
      case "complete":
        return 100;
      case "failed":
      case "refunded":
        return 100;
      default:
        return 10;
    }
  };

  async function handleTradeConfirm() {
    setLoading(true);

    // Show the full response with quote details
    const tradeResponseTokens = calculateTokens(tradeModalData.fullResponse);

    const { depositAddress, amountIn } = tradeModalData.quote;
    const { originAsset } = tradeModalData.tradeIntent;

    if (depositAddress && depositAddress !== "N/A" && originAsset === "NEAR") {
      // Handle NEAR transfer with progress tracking
      try {
        const transferResult = await NearTransferService.executeTransfer({
          amountIn,
          depositAddress,
          walletSelector,
        });

        if (transferResult.success) {

          // Add transfer success message to chat
          setMessages((prev) => [...prev, transferResult.chatMessage]);
          // now begin swap‐tracking
          setTracking(true);
          trackingControllerRef.current = SwapTrackingService.startTracking(
            depositAddress,
            (update) => {
              // this callback runs on every poll
              setLoading(true);
              // push update messages into chat
              // update comes with e.g. { status, statusInfo }
              setStatusInfo(update.statusInfo);
              setProgress(mapStatusToProgress(update.status));
              // once complete or failed, we'll leave progress at 100 and stop tracking
              if (update.status === "complete" || update.status === "failed") {
                const chatMessage =
                  SwapTrackingService.createChatMessage(update);
                trackingControllerRef.current?.stop();
                setLoading(false);
                setIsTradeModalOpen(false);
                setMessages((prev) => {
                  const withoutLoading = prev.filter(
                    (m) => m.sender !== "loading"
                  );
                  return [
                    ...withoutLoading,
                    { sender: "bot", text: chatMessage.content },
                  ];
                });
                toast.success("Successfully Swaped");
              }
            },
            {
              pollInterval: 5000,
              maxAttempts: 120,
              timeout: 600000,
            }
          );

          toast.success("Transfer successful, starting progress tracking");
          setLoading(false);
          //   setIsTradeModalOpen(false);
        } else {
          toast.error(`❌ Transfer failed: ${transferResult.error}`);

          // Add transfer error message to chat
          setMessages((prev) => [
            ...prev,
            { sender: "bot", text: transferResult.chatMessage },
          ]);
          setLoading(false);
          setIsTradeModalOpen(false);
        }
      } catch (error) {
        toast.error(`❌ Transfer error: ${error}`);
        setTracking(false);
        // const errorMessage = {
        //   role: "assistant",
        //   content: `## ❌ Transfer Error\\n\\nAn unexpected error occurred: ${error.message}\\n\\n*Please try again or contact support if the problem persists.*`,
        //   timestamp: new Date().toISOString(),
        // };

        // setInMemoryMessages((prev) => [...prev, errorMessage]);
        setLoading(false);
        setIsTradeModalOpen(false);
      }
    } else if (originAsset !== "NEAR") {
      // Handle non-NEAR tokens with manual transfer instructions
      const manualTransferMessage = {
        sender: "bot",
        text: `## 📝 Manual Transfer Required\
            **Token:** ${originAsset} \
            **Amount:** ${amountIn}
            **Deposit Address:** \`${depositAddress}\` \
            **Important:** This trade requires ${originAsset} tokens, which cannot be automatically transferred through this interface.\
            **Manual Steps:**\
            1. Open your ${originAsset} wallet or exchange\
            2. Send exactly **${amountIn}** to the deposit address: \`${depositAddress}\`\
            3. The cross-chain swap will execute automatically\
            4. You'll receive ${tradeModalData.quote.amountOut} ${tradeModalData.tradeIntent.destinationAsset}\
            **⚠️ Warning:** Only send the exact amount specified. Any other amount may be lost.`,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, manualTransferMessage]);
      setLoading(false);
      setIsTradeModalOpen(false);
    } else {
      toast.error("❌ No valid deposit address found in quote");
      setLoading(false);
      setIsTradeModalOpen(false);
    }
  }
  if (!tradeModalData) return null;

  return (
    <Modal
      title="Trade confirmation"
      isOpen={isTradeModalOpen}
      onClose={() => {
        if (!loading) {
          onCancel();
        }
      }}
    >
      {/* Scrollable Body */}
      <div className="space-y-6 max-h-[50vh] overflow-y-auto pr-2">
        {/* Trade Summary */}
        <section>
          <h3 className="font-semibold mb-3 text-white text-base sm:text-lg">
            📋 Trade Summary
          </h3>
          <div className="space-y-2 text-white text-sm sm:text-base">
            <div className="flex justify-between">
              <span className="font-medium">Token to Buy:</span>
              <span>{tradeModalData.tradeIntent.destinationAsset}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Amount to Send:</span>
              <span>
                {tradeModalData.quote.amountIn}{" "}
                {tradeModalData.tradeIntent.originAsset}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Estimated Receive:</span>
              <span>
                {tradeModalData.quote.amountOut}{" "}
                {tradeModalData.tradeIntent.destinationAsset}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">USD Value:</span>
              <span>~${tradeModalData.quote.amountOutUsd}</span>
            </div>
          </div>
        </section>

        {/* Execution Details */}
        <section>
          <h3 className="font-semibold mb-3 text-white text-base sm:text-lg">
            🏦 Execution Details
          </h3>
          <div className="space-y-2 text-white text-sm sm:text-base">
            <div className="flex flex-col sm:flex-row sm:justify-between">
              <span className="font-medium">
                Deposit Address:{" "}
                <span className="break-all mt-1 sm:mt-0">
                  {tradeModalData.quote.depositAddress}
                </span>
              </span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Quote Valid Until:</span>
              <span>{tradeModalData.quote.deadline}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Estimated Time:</span>
              <span>{tradeModalData.quote.timeEstimate}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Slippage:</span>
              <span>{tradeModalData.quote.slippageTolerance}</span>
            </div>
          </div>
        </section>

        {/* AI Explanation */}
        <section>
          <h3 className="font-semibold mb-2 text-white text-base sm:text-lg">
            🤖 AI Analysis
          </h3>
          <p className="text-white text-sm sm:text-base mb-1">
            This trade was detected from your message:{" "}
            <strong>&quot;{tradeModalData.message}&quot;</strong>
          </p>
          <p className="text-white text-sm sm:text-base">
            The system has generated a live quote with real deposit addresses
            and amounts. If you confirm, you&apos;ll receive detailed instructions on
            how to execute this trade.
          </p>
        </section>

        {/* Warning */}
        <div className="flex items-start gap-3 bg-[#3D2C4B]/40 p-4 rounded-lg">
          <div className="text-2xl">⚠️</div>
          <div className="text-white text-sm sm:text-base">
            <strong>Important:</strong> Only send the exact amount (
            {tradeModalData.quote.amountIn}{" "}
            {tradeModalData.tradeIntent.originAsset}) to the deposit address.
            Any other amount or token will be lost.
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="mt-4 flex flex-col sm:flex-row sm:justify-end gap-3">
        <button
          disabled={loading}
          onClick={onCancel}
          className="w-full sm:w-auto px-4 py-2 bg-[#1F1923] text-white rounded-lg hover:bg-gray-800 transition"
        >
          Cancel Trade
        </button>
        <button
          disabled={loading}
          onClick={handleTradeConfirm}
          className="w-full sm:w-auto px-4 py-2 bg-[#BA98D5] text-[#3D2C4B] rounded-lg hover:bg-opacity-90 transition"
        >
          {loading ? (
            <div
              className="w-5 h-5 border-2 border-[#3D2C4B] border-t-[#FFFFFF] rounded-full animate-spin"
              aria-label="Saving…"
            />
          ) : (
            <>{"Confirm"}</>
          )}
        </button>
      </div>
      {tracking && statusInfo && (
        <div className="mt-6">
          <div className="h-2 w-full bg-[#3D2C4B]/30 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#BA98D5] transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="mt-2 text-sm text-white">
            {statusInfo.title}: {statusInfo.message}
          </p>
        </div>
      )}
    </Modal>
  );
}
