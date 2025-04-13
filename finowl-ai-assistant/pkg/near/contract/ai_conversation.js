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

/**
 * Checks if a user already exists and creates a profile if they're new.
 * Also checks eligibility for free tokens.
 * 
 * @returns {string} Status message indicating if user is new or existing
 */
export function check_user_status() {
  const account_id = env.signer_account_id();
  const user_key = `user_${account_id}_metadata`;
  
  // Check if user exists
  const user_data = env.get_data(user_key);
  
  if (!user_data) {
    // New user - create profile
    const user_profile = {
      account_id: account_id,
      created_at: Date.now(),
      conversations: [],
      token_grants: [],
      token_purchases: []
    };
    
    env.set_data(user_key, JSON.stringify(user_profile));
    
    // Create conversations list
    env.set_data(`user_${account_id}_conversations`, JSON.stringify([]));
    
    // Check if eligible for free tokens
    const near_balance = env.account_balance();
    if (BigInt(near_balance) >= 1_000_000_000_000_000_000_000_000n) { // 1 NEAR
      grant_free_tokens();
    }
    
    env.value_return(JSON.stringify({ status: "new_user", profile_created: true }));
    return;
  } else {
    // Existing user
    env.value_return(JSON.stringify({ status: "existing_user" }));
    return;
  }
}

/**
 * Grants free tokens to new users with sufficient NEAR balance.
 * 
 * @returns {string} Result of the token grant operation
 */
export function grant_free_tokens() {
  const account_id = env.signer_account_id();
  const free_token_amount = 100_000_000n; // Enough for 100 messages
  
  // Get user profile
  const user_key = `user_${account_id}_metadata`;
  const user_data_json = env.get_data(user_key);
  
  if (!user_data_json) {
    env.panic("User profile not found");
    return;
  }
  
  const user_data = JSON.parse(user_data_json);
  
  // Check if user already received free tokens
  if (user_data.token_grants && user_data.token_grants.some(grant => grant.type === "welcome")) {
    env.value_return(JSON.stringify({ 
      success: false, 
      reason: "User already received welcome tokens" 
    }));
    return;
  }
  
  // Transfer tokens to the user
  env.ft_transfer_internal(
    env.current_account_id(),
    account_id,
    free_token_amount.toString()
  );
  
  // Record the grant
  if (!user_data.token_grants) {
    user_data.token_grants = [];
  }
  
  user_data.token_grants.push({
    type: "welcome",
    amount: free_token_amount.toString(),
    timestamp: Date.now()
  });
  
  // Update user profile
  env.set_data(user_key, JSON.stringify(user_data));
  
  env.value_return(JSON.stringify({ 
    success: true, 
    amount: free_token_amount.toString() 
  }));
} 