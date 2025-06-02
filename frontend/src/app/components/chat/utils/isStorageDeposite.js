import { providers } from "near-api-js";
import { toast } from "sonner";

export async function isStorageDeposited(accountId, contractId) {
  const provider = new providers.JsonRpcProvider({
    url: "https://rpc.mainnet.near.org",
  });

  const args = Buffer.from(JSON.stringify({ account_id: accountId })).toString(
    "base64"
  );

  try {
    const result = await provider.query({
      request_type: "call_function",
      account_id: contractId,
      method_name: "storage_balance_of",
      args_base64: args,
      finality: "optimistic",
    });
    if (!result) {
      throw new Error("Cannot get result");
    }
    const decoded = Buffer.from(result.result).toString();
    const balance = JSON.parse(decoded);

    return balance && balance.total !== undefined;
  } catch (e) {
    console.warn("⚠️ Failed to check storage deposit:", e);
    return false;
  }
}

export async function addPublicKeyIfNotExists(
  accountId,
  publicKey,
  viewFunction,
  callFunction
) {
  try {
    //   setLoading(true);

    // First check if key exists
    const keyExists = await hasPublicKey(
      accountId,
      publicKey,
      viewFunction,
      callFunction
    );

    if (keyExists) {
      toast.info("This public key is already registered.");
      return;
    }

    // If key doesn't exist, proceed with adding it
    const gas = "100000000000000"; // 100 Tgas
    const depositAmount = "1250000000000000000000"; // 0.00125 NEAR

    const result = await callFunction({
      contractId: "intents.near",
      method: "add_public_key",
      args: {
        public_key: publicKey,
      },
      gas,
      deposit: "1",
    });
    toast.success(
      "Public key registered. You may receive rewards or NEAR shortly."
    );
  } catch (error) {
    toast.error("❌ Failed to add public key:", error);
    toast.error(`Something went wrong while adding your key.${error}`);
  } finally {
    //   setLoading(false);
  }
}

export async function hasPublicKey(accountId, publicKey, viewFunction) {
  try {
    const result = await viewFunction({
      contractId: "intents.near",
      method: "has_public_key",
      args: {
        account_id: accountId,
        public_key: publicKey,
      },
    });

    return result; // This will be a boolean: true if key exists, false if not
  } catch (error) {
    console.error("❌ Failed to check public key:", error);
    throw error; // Re-throw to handle in the calling function
  }
}
