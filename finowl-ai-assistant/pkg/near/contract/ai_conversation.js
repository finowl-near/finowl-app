/**
 * Finowl AI Conversation Smart Contract
 * 
 * This contract handles AI conversation creation, token management, and refunds.
 * It allows users to create conversations by transferring tokens to the contract,
 * view conversation data, and receive refunds for unused tokens.
 */

/**
 * Starts a new AI conversation by transferring tokens from the user to the contract.
 * 
 * @returns {string} The conversation ID if successful
 * @throws Will throw an error if the conversation ID is missing or if the conversation already exists
 */
export function start_ai_conversation() {
  // Amount of tokens required to start a conversation
  const amount = 1_000_000n;
  
  // Parse input to get conversation ID
  const { conversation_id } = JSON.parse(env.input());
  if (!conversation_id) {
    env.panic(`Must provide conversation_id`);
    return;
  }
  
  // Check if conversation already exists
  const existing_conversation = env.get_data(conversation_id);
  if (existing_conversation) {
    env.panic(`Conversation already exists`);
    return;
  }
  
  // Store conversation data with sender and amount
  env.set_data(
    conversation_id,
    JSON.stringify({
      receiver_id: env.signer_account_id(),
      amount: amount.toString(),
      created_at: Date.now(),
      status: "active",
    }),
  );
  
  // Transfer tokens from user to contract
  env.ft_transfer_internal(
    env.signer_account_id(),
    env.current_account_id(),
    amount.toString(),
  );
  
  // Return the conversation ID
  env.value_return(conversation_id);
}

/**
 * Retrieves data for an existing conversation.
 * 
 * @returns {string} The conversation data as a JSON string
 */
export function view_ai_conversation() {
  const { conversation_id } = JSON.parse(env.input());
  const data = env.get_data(conversation_id);
  
  if (!data) {
    env.panic(`Conversation not found: ${conversation_id}`);
    return;
  }
  
  env.value_return(data);
}

/**
 * Refunds unused tokens from a conversation back to the user.
 * Requires a signed message to authorize the refund.
 * 
 * @throws Will throw an error if the signature is invalid
 */
export function refund_unspent() {
  const { refund_message, signature } = JSON.parse(env.input());
  const public_key = new Uint8Array(REPLACE_REFUND_SIGNATURE_PUBLIC_KEY);

  // Verify signature
  const signature_is_valid = env.ed25519_verify(
    new Uint8Array(signature),
    new Uint8Array(env.sha256_utf8(refund_message)),
    public_key,
  );

  if (signature_is_valid) {
    // Parse the refund message
    const { receiver_id, refund_amount, conversation_id } =
      JSON.parse(refund_message);

    // Get conversation data and check available amount
    const conversation_data = JSON.parse(env.get_data(conversation_id));

    if (!conversation_data) {
      env.panic(`Conversation not found: ${conversation_id}`);
      return;
    }

    // Ensure sufficient funds for refund
    if (BigInt(conversation_data.amount) >= BigInt(refund_amount)) {
      // Update conversation data to reflect refund
      const remaining_amount = (BigInt(conversation_data.amount) - BigInt(refund_amount)).toString();
      
      if (BigInt(remaining_amount) <= 0) {
        // Clear conversation if fully refunded
        env.clear_data(conversation_id);
      } else {
        // Update conversation with remaining amount
        conversation_data.amount = remaining_amount;
        conversation_data.last_refund = Date.now();
        env.set_data(conversation_id, JSON.stringify(conversation_data));
      }
      
      // Transfer refund to receiver
      env.ft_transfer_internal(
        env.current_account_id(),
        receiver_id,
        refund_amount,
      );
      
      // Log the refund
      env.log(`Refunded ${refund_amount} to ${receiver_id} for conversation ${conversation_id}`);
    } else {
      env.panic(`Insufficient funds for refund. Available: ${conversation_data.amount}, Requested: ${refund_amount}`);
    }
  } else {
    env.panic("Invalid signature");
  }
}

/**
 * Allows users to purchase tokens using NEAR.
 * Exactly 0.5 NEAR must be attached to receive 3 tokens.
 * 
 * @throws Will throw an error if the attached deposit is not exactly 0.5 NEAR
 */
export function buy_tokens_for_near() {
  const required_near = 500_000_000_000_000_000_000_000n;
  const tokens_to_transfer = 3_000_000n;
  
  if (env.attached_deposit() === required_near.toString()) {
    env.ft_transfer_internal(
      env.current_account_id(),
      env.predecessor_account_id(),
      tokens_to_transfer.toString(),
    );
    env.log(`Sold ${tokens_to_transfer} tokens to ${env.predecessor_account_id()} for ${required_near} yoctoNEAR`);
  } else {
    env.panic(`Must attach exactly 0.5 NEAR to get ${tokens_to_transfer} tokens`);
  }
} 