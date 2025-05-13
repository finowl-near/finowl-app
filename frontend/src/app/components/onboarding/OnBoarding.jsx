"use client";

import React, { useEffect, useState } from "react";
import FirstStep from "./FirstStep";
import { motion } from "motion/react";
import SecondStep from "./SecondStep";
import { useWalletSelector } from "@near-wallet-selector/react-hook";
import ThirdStep from "./ThirdStep";
import FourthStep from "./FourthStep";

export default function OnBoarding() {
    const { signedAccountId, signIn, signOut } = useWalletSelector();
  const [step, setStep] = useState(1);
  const [registerStorage, setRegisterStorage] = useState(false);
  const [registerUser, setRegisterUser] = useState(false);
  const [tokensClaim, setTokensClaim] = useState(false);

  function handleNext() {
    console.log("next step");
    setStep((prev) => Math.min(prev + 1, 4));
  }

  useEffect(() => {
    
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="bg-transparent border-4 border-[#BA98D5] rounded-2xl shadow-xl max-w-md w-full p-8 flex flex-col items-center text-center"
      >
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
      </motion.div>
    </div>
  );
}
