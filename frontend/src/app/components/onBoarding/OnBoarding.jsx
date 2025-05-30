"use client";

import React, { useEffect, useState } from "react";
import FirstStep from "./FirstStep";
import { motion } from "motion/react";
import SecondStep from "./SecondStep";
import { useWalletSelector } from "@near-wallet-selector/react-hook";
import ThirdStep from "./ThirdStep";
import FourthStep from "./FourthStep";
import { useRouter } from "next/navigation";
import FinalStep from "./FinalStep";
import { toast, Toaster } from "sonner";
import { CONTRACT_ID } from "@/app/Wallets/near";

export default function OnBoarding() {
  const router = useRouter();
  const { signedAccountId, viewFunction, signIn, signOut } =
    useWalletSelector();
  const [step, setStep] = useState(1);
  const [registerStorage, setRegisterStorage] = useState(false);
  const [registerUser, setRegisterUser] = useState(false);
  const [tokensClaim, setTokensClaim] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState(true);

  function handleNext() {
    console.log("next step");
    setStep((prev) => Math.min(prev + 1, 5));
  }

  useEffect(() => {
    if (!signedAccountId) {
      setStep(1);
      setLoadingStatus(false);
      return;
    }
    (async function checkUserStatus() {
      setLoadingStatus(true);
      document.cookie = `nearAccount=${signedAccountId}; Path=/; Secure; SameSite=Lax;`;
      try {
        /// register storage
        const result = await viewFunction({
          contractId: process.env.NEXT_PUBLIC_CONTRACT_NAME || CONTRACT_ID,
          method: "storage_balance_of",
          args: {
            account_id: signedAccountId,
          },
        });
        console.log("result after", result);
        if (!result) {
          setStep(2);
          return;
        }

        /// register user
        const result1 = await viewFunction({
          contractId: process.env.NEXT_PUBLIC_CONTRACT_NAME || CONTRACT_ID,
          method: "view_js_func",
          args: {
            function_name: "is_user_registered",
            account_id: signedAccountId,
          },
        });
        console.log("result after2", result1);
        if (!result1.registered) {
          setStep(3);
          return;
        }

        /// claim tokens
        const result2 = await viewFunction({
          contractId: process.env.NEXT_PUBLIC_CONTRACT_NAME || CONTRACT_ID,
          method: "view_js_func",
          args: {
            function_name: "has_received_welcome_tokens",
            account_id: signedAccountId,
          },
        });
        console.log("result after3", result2);
        if (!result2.received) {
          setStep(4);
          return;
        }
        setStep(5);
      } catch (error) {
        toast.error(`Error: ${error}`);
        console.log("error in useEffect", error);
      } finally {
        setLoadingStatus(false);
      }
    })();
    // checkUserStatus();
  }, [signedAccountId]);

  return (
    <>
    <Toaster theme="dark" richColors position="top-right"/>
      <div className="flex min-h-screen items-center justify-center p-4">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="bg-transparent border-4 border-[#BA98D5] rounded-2xl shadow-xl max-w-md w-full p-8 flex flex-col items-center text-center"
        >
          {loadingStatus ? (
            <div className="flex flex-col items-center">
              <div
                className="h-16 w-16 border-4 border-t-white rounded-full animate-spin border-[#BA98D5]"
                aria-label="Loading..."
              />
              <p className="text-white mt-4">Checking your status…</p>
            </div>
          ) : (
            <>
              {step === 1 && <FirstStep onNext={handleNext} />}
              {step === 2 && (
                <SecondStep
                  onNext={handleNext}
                  registerStorage={registerStorage}
                  setRegisterStorage={setRegisterStorage}
                />
              )}
              {step === 3 && (
                <ThirdStep
                  onNext={handleNext}
                  registerUser={registerUser}
                  setRegisterUser={setRegisterUser}
                />
              )}
              {step === 4 && (
                <FourthStep
                  onNext={handleNext}
                  tokensClaim={tokensClaim}
                  setTokensClaim={setTokensClaim}
                />
              )}
              {step === 5 && <FinalStep />}
            </>
          )}
        </motion.div>
      </div>
    </>
  );
}
