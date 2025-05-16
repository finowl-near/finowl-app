"use client";

import Header from "@/app/components/Header";
import Modal from "@/app/components/Modal";
import OnBoarding from "@/app/components/onboarding/OnBoarding";
import React, { useState } from "react";

export default function page() {
  // const [isOnboarding, setIsOnboarding] = useState(true);
  return (
    <>
      {/* <Header /> */}
      {/* <Modal
        isOpen={isOnboarding}
        onClose={() => setIsOnboarding(false)}
        title={"onBoarding..."}
      > */}
        <OnBoarding />
      {/* </Modal> */}
    </>
  );
}
