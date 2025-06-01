import { useWalletSelector } from "@near-wallet-selector/react-hook";
import { useCallback, useEffect, useState } from "react";
import useConversationId from "./useConversationId";
import { CONTRACT_ID } from "../Wallets/near";
import { toast } from "sonner";

export function useUserConversations() {
  const { signedAccountId, viewFunction, callFunction } = useWalletSelector();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchUserConversations = useCallback(async () => {
    try {
      // if (!signedAccountId) {
      //   alert("Please connect your wallet first");
      // //   if (signIn) {
      // //     signIn();
      // //   }
      //   return;
      // }

      setLoading(true);

      // if (!validateNetworkConfig()) {
      //   throw new Error("Invalid network configuration");
      // }

      // Try to get conversations using view method first
      try {
        const result = await viewFunction({
          contractId: CONTRACT_ID,
          method: "view_js_func",
          args: {
            function_name: "get_user_conversations",
            account_id: signedAccountId,
          },
        });
        console.log("Conversations list (view method):", result);

        // Fetch metadata for each conversation
        const conversationsWithMetadata = await Promise.all(
          result.map(async (convId) => {
            try {
              const metadata = await viewFunction({
                contractId: CONTRACT_ID,
                method: "view_js_func",
                args: {
                  function_name: "get_conversation_metadata",
                  conversation_id: convId,
                },
              });

              // Calculate remaining tokens
              const tokensReserved = BigInt(metadata.tokens_reserved || "0");
              const tokensUsed = BigInt(metadata.tokens_used || "0");
              const tokensRemaining =
                tokensReserved > tokensUsed
                  ? tokensReserved - tokensUsed
                  : BigInt(0);

              // Convert to display format (divide by 1_000_000)
              const displayRemaining = Number(tokensRemaining) / 1_000_000;
              return {
                id: convId,
                metadata,
                tokensRemaining: displayRemaining,
              };
            } catch (error) {
              console.error(
                `Error fetching metadata for conversation ${convId}:`,
                error
              );
              return {
                id: convId,
                metadata: null,
                tokensRemaining: 0,
              };
            }
          })
        );
        console.log("converssations??? view", conversationsWithMetadata);
        setConversations(conversationsWithMetadata);
      } catch (viewError) {
        console.log("View method failed, trying call method:", viewError);

        const result = await callFunction({
          contractId: CONTRACT_ID,
          method: "call_js_func",
          args: {
            function_name: "get_user_conversations",
            account_id: signedAccountId,
          },
        });
        console.log("Conversations list (call method):", result);

        // Fetch metadata for each conversation
        const conversationsWithMetadata = await Promise.all(
          result.map(async (convId) => {
            try {
              const metadata = await callFunction({
                contractId: CONTRACT_ID,
                method: "call_js_func",
                args: {
                  function_name: "get_conversation_metadata",
                  conversation_id: convId,
                },
              });

              // Calculate remaining tokens
              const tokensReserved = BigInt(metadata.tokens_reserved || "0");
              const tokensUsed = BigInt(metadata.tokens_used || "0");
              const tokensRemaining =
                tokensReserved > tokensUsed
                  ? tokensReserved - tokensUsed
                  : BigInt(0);

              // Convert to display format (divide by 1_000_000)
              const displayRemaining = Number(tokensRemaining) / 1_000_000;
              return {
                id: convId,
                metadata,
                tokensRemaining: displayRemaining,
              };
            } catch (error) {
              toast.error(`Error fetching metadata for conversation ${convId}:`);
              return {
                id: convId,
                metadata: null,
                tokensRemaining: 0,
              };
            }
          })
        );
        console.log("converssations??? call", conversationsWithMetadata);
        setConversations(conversationsWithMetadata);
      }
    } catch (error) {
      toast.error(`Error fetching conversations: ${error}`);
    } finally {
      setTimeout(() => setLoading(false), 200); // Slight delay to avoid UI flash
    }
  }, [signedAccountId, callFunction, viewFunction]);

  useEffect(() => {
    fetchUserConversations();
  }, [fetchUserConversations]);
  return { conversations, loading, refresh: fetchUserConversations };
}
