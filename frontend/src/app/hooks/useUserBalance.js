import { useWalletSelector } from "@near-wallet-selector/react-hook";
import { useCallback, useEffect, useState } from "react";

export function useUserBlance() {
  const [balance, setBalance] = useState(0);
  const [loadingBalance, setLoadingBalance] = useState(true);
  const { signedAccountId, viewFunction } = useWalletSelector();
  const refreshBalance = useCallback(async () => {
    try {
      const result = await viewFunction({
        contractId: process.env.NEXT_PUBLIC_CONTRACT_NAME || "finowl.testnet",
        method: "view_js_func",
        args: {
          function_name: "get_user_token_balance",
          account_id: signedAccountId,
        },
      });
      if (!result) {
        throw new Error("Cannot view user balence");
      }
      console.log("balence result", result);
      const computedBalence =
        typeof result === "string"
          ? parseInt(result) / 1000000
          : result.balance
          ? parseInt(result.balance) / 1000000
          : 0;
      setBalance(computedBalence);
    } catch (error) {
      alert(`${error} in tokenBalence`);
    } finally {
      setTimeout(() => setLoadingBalance(false), 200);
    }
  }, [signedAccountId, viewFunction]);

  useEffect(() => {
    if (signedAccountId) {
      refreshBalance();
    }
  }, [refreshBalance]);
  return { balance, loadingBalance, refreshBalance };
}
