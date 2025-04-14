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
      token_purchases: [],
      storage_enabled: true // Default to storing conversations
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

/**
 * Creates a new conversation for the user.
 * 
 * @returns {string} The new conversation ID
 */
export function start_new_conversation() {
  const account_id = env.signer_account_id();
  let input = {};
  
  try {
    input = JSON.parse(env.input());
  } catch (e) {
    input = {};
  }
  
  const title = input.title || "New Conversation";
  
  // Generate unique conversation ID
  const conversation_id = `${account_id}_${Date.now()}`;
  
  // Create conversation metadata
  const conversation_metadata = {
    id: conversation_id,
    owner: account_id,
    title: title,
    created_at: Date.now(),
    last_active: Date.now(),
    message_count: 0,
    tokens_used: "0"
  };
  
  // Store conversation metadata
  env.set_data(
    `conversation_${conversation_id}_metadata`,
    JSON.stringify(conversation_metadata)
  );
  
  // Initialize empty message history
  env.set_data(
    `conversation_${conversation_id}_messages`,
    JSON.stringify([])
  );
  
  // Add to user's conversation list
  update_user_conversations(conversation_id);
  
  // Return the conversation ID and metadata
  env.value_return(JSON.stringify({ 
    conversation_id: conversation_id,
    metadata: conversation_metadata
  }));
}

/**
 * Updates a user's conversation list with a new conversation.
 * 
 * @param {string} conversation_id - The ID of the conversation to add
 */
function update_user_conversations(conversation_id) {
  const account_id = env.signer_account_id();
  const user_convos_key = `user_${account_id}_conversations`;
  
  // Get existing conversations
  let conversations = [];
  const existing_data = env.get_data(user_convos_key);
  
  if (existing_data) {
    conversations = JSON.parse(existing_data);
  }
  
  // Add new conversation to the list if not already there
  if (!conversations.includes(conversation_id)) {
    conversations.push(conversation_id);
  }
  
  // Update storage
  env.set_data(user_convos_key, JSON.stringify(conversations));
}

/**
 * Lists all conversations for the current user.
 * 
 * @returns {string} JSON array of conversation metadata
 */
export function list_user_conversations() {
  const account_id = env.signer_account_id();
  const user_convos_key = `user_${account_id}_conversations`;
  
  // Get conversation IDs
  const conversations_data = env.get_data(user_convos_key);
  if (!conversations_data) {
    env.value_return(JSON.stringify([]));
    return;
  }
  
  const conversation_ids = JSON.parse(conversations_data);
  const conversations = [];
  
  // Retrieve metadata for each conversation
  for (const id of conversation_ids) {
    const metadata = env.get_data(`conversation_${id}_metadata`);
    if (metadata) {
      conversations.push(JSON.parse(metadata));
    }
  }
  
  // Sort by last active, newest first
  conversations.sort((a, b) => b.last_active - a.last_active);
  
  env.value_return(JSON.stringify(conversations));
}

/**
 * Gets metadata for a specific conversation.
 * 
 * @returns {string} Conversation metadata as a JSON string
 */
export function get_conversation_metadata() {
  const { conversation_id } = JSON.parse(env.input());
  const account_id = env.signer_account_id();
  
  if (!conversation_id) {
    env.panic("Must provide conversation_id");
    return;
  }
  
  // Get conversation metadata
  const metadata_key = `conversation_${conversation_id}_metadata`;
  const metadata = env.get_data(metadata_key);
  
  if (!metadata) {
    env.panic(`Conversation not found: ${conversation_id}`);
    return;
  }
  
  // Parse metadata to check ownership
  const metadata_obj = JSON.parse(metadata);
  
  // Verify ownership
  if (metadata_obj.owner !== account_id) {
    env.panic("Not authorized to view this conversation");
    return;
  }
  
  env.value_return(metadata);
}

/**
 * Retrieves the message history for a conversation.
 * 
 * @returns {string} JSON array of messages in the conversation
 */
export function get_conversation_history() {
  const { conversation_id } = JSON.parse(env.input());
  const account_id = env.signer_account_id();
  
  if (!conversation_id) {
    env.panic("Must provide conversation_id");
    return;
  }
  
  // Verify conversation exists and user owns it
  const metadata_key = `conversation_${conversation_id}_metadata`;
  const metadata_json = env.get_data(metadata_key);
  
  if (!metadata_json) {
    env.panic("Conversation not found");
    return;
  }
  
  const metadata = JSON.parse(metadata_json);
  if (metadata.owner !== account_id) {
    env.panic("Not authorized to view this conversation");
    return;
  }
  
  // Get messages
  const messages_key = `conversation_${conversation_id}_messages`;
  const messages_json = env.get_data(messages_key);
  
  if (!messages_json) {
    env.value_return(JSON.stringify([]));
    return;
  }
  
  env.value_return(messages_json);
}

/**
 * Deletes a conversation and its messages.
 * 
 * @returns {string} Result of the delete operation
 */
export function delete_conversation() {
  const { conversation_id } = JSON.parse(env.input());
  const account_id = env.signer_account_id();
  
  if (!conversation_id) {
    env.panic("Must provide conversation_id");
    return;
  }
  
  // Verify conversation exists and user owns it
  const metadata_key = `conversation_${conversation_id}_metadata`;
  const metadata_json = env.get_data(metadata_key);
  
  if (!metadata_json) {
    env.panic("Conversation not found");
    return;
  }
  
  const metadata = JSON.parse(metadata_json);
  if (metadata.owner !== account_id) {
    env.panic("Not authorized to delete this conversation");
    return;
  }
  
  // Delete conversation data
  env.clear_data(metadata_key);
  env.clear_data(`conversation_${conversation_id}_messages`);
  
  // Remove from user's conversation list
  const user_convos_key = `user_${account_id}_conversations`;
  const conversations_json = env.get_data(user_convos_key);
  
  if (conversations_json) {
    const conversations = JSON.parse(conversations_json);
    const updated_conversations = conversations.filter(id => id !== conversation_id);
    env.set_data(user_convos_key, JSON.stringify(updated_conversations));
  }
  
  env.value_return(JSON.stringify({ 
    success: true, 
    conversation_id: conversation_id
  }));
}

/**
 * Stores a new message in a conversation.
 * 
 * @returns {string} Result of the message storage operation
 */
export function store_message() {
  const input = JSON.parse(env.input());
  const { conversation_id, role, content } = input;
  const account_id = env.signer_account_id();
  
  // Verify inputs
  if (!conversation_id || !role || !content) {
    env.panic("Must provide conversation_id, role, and content");
    return;
  }
  
  // Verify role is valid
  if (role !== "user" && role !== "assistant" && role !== "system") {
    env.panic("Role must be 'user', 'assistant', or 'system'");
    return;
  }
  
  // Verify conversation exists and user owns it
  const metadata_key = `conversation_${conversation_id}_metadata`;
  const metadata_json = env.get_data(metadata_key);
  
  if (!metadata_json) {
    env.panic("Conversation not found");
    return;
  }
  
  const metadata = JSON.parse(metadata_json);
  if (metadata.owner !== account_id) {
    env.panic("Not authorized to add messages to this conversation");
    return;
  }
  
  // Check if storage is enabled for this user
  const user_key = `user_${account_id}_metadata`;
  const user_data_json = env.get_data(user_key);
  let storage_enabled = true; // Default to true if user data not found
  
  if (user_data_json) {
    const user_data = JSON.parse(user_data_json);
    storage_enabled = user_data.storage_enabled !== false; // Default to true if not specified
  }
  
  // Calculate token count (simple approximation)
  const token_count = calculateTokens(content);
  
  // Create new message
  const message = {
    id: `${conversation_id}_msg_${metadata.message_count}`,
    role: role,
    content: content,
    timestamp: Date.now(),
    tokens: token_count
  };
  
  // Only store message content if storage is enabled
  if (storage_enabled) {
    // Get existing messages
    const messages_key = `conversation_${conversation_id}_messages`;
    let messages = [];
    const existing_messages = env.get_data(messages_key);
    
    if (existing_messages) {
      messages = JSON.parse(existing_messages);
    }
    
    // Add message to list
    messages.push(message);
    
    // Update conversation storage
    env.set_data(messages_key, JSON.stringify(messages));
  }
  
  // Always update conversation metadata
  metadata.message_count++;
  metadata.last_active = Date.now();
  metadata.tokens_used = (BigInt(metadata.tokens_used) + BigInt(token_count)).toString();
  env.set_data(metadata_key, JSON.stringify(metadata));
  
  env.value_return(JSON.stringify({ 
    success: true,
    message_id: message.id,
    tokens: token_count,
    stored: storage_enabled
  }));
}

/**
 * Sets the conversation storage preference for a user.
 * If disabled, messages will not be stored but metadata will still be tracked.
 * 
 * @returns {string} Result of the update operation
 */
export function set_storage_preference() {
  const { enabled } = JSON.parse(env.input());
  const account_id = env.signer_account_id();
  const user_key = `user_${account_id}_metadata`;
  
  // Get user profile
  const user_data_json = env.get_data(user_key);
  
  if (!user_data_json) {
    env.panic("User profile not found");
    return;
  }
  
  // Update storage preference
  const user_data = JSON.parse(user_data_json);
  user_data.storage_enabled = enabled === true;
  
  // Save updated profile
  env.set_data(user_key, JSON.stringify(user_data));
  
  env.value_return(JSON.stringify({ 
    success: true, 
    storage_enabled: user_data.storage_enabled 
  }));
}

/**
 * Updates the title of a conversation.
 * 
 * @returns {string} Result of the update operation
 */
export function update_conversation_title() {
  const { conversation_id, title } = JSON.parse(env.input());
  const account_id = env.signer_account_id();
  
  if (!conversation_id || !title) {
    env.panic("Must provide conversation_id and title");
    return;
  }
  
  // Verify conversation exists and user owns it
  const metadata_key = `conversation_${conversation_id}_metadata`;
  const metadata_json = env.get_data(metadata_key);
  
  if (!metadata_json) {
    env.panic("Conversation not found");
    return;
  }
  
  const metadata = JSON.parse(metadata_json);
  if (metadata.owner !== account_id) {
    env.panic("Not authorized to update this conversation");
    return;
  }
  
  // Update title
  metadata.title = title;
  env.set_data(metadata_key, JSON.stringify(metadata));
  
  env.value_return(JSON.stringify({ 
    success: true, 
    conversation_id: conversation_id,
    title: title
  }));
}

/**
 * Clears the message history for a conversation but keeps the metadata.
 * 
 * @returns {string} Result of the clear operation
 */
export function clear_conversation_history() {
  const { conversation_id } = JSON.parse(env.input());
  const account_id = env.signer_account_id();
  
  if (!conversation_id) {
    env.panic("Must provide conversation_id");
    return;
  }
  
  // Verify conversation exists and user owns it
  const metadata_key = `conversation_${conversation_id}_metadata`;
  const metadata_json = env.get_data(metadata_key);
  
  if (!metadata_json) {
    env.panic("Conversation not found");
    return;
  }
  
  const metadata = JSON.parse(metadata_json);
  if (metadata.owner !== account_id) {
    env.panic("Not authorized to clear this conversation");
    return;
  }
  
  // Clear messages but keep message count in metadata
  const messages_key = `conversation_${conversation_id}_messages`;
  env.set_data(messages_key, JSON.stringify([]));
  
  // Update metadata to reflect clearing
  metadata.last_active = Date.now();
  env.set_data(metadata_key, JSON.stringify(metadata));
  
  env.value_return(JSON.stringify({ 
    success: true, 
    conversation_id: conversation_id
  }));
}

/**
 * Helper function to estimate token count in a message.
 * This is a simple approximation - in production you'd want a more accurate tokenizer.
 * 
 * @param {string} text - The message text
 * @returns {number} Estimated token count
 */
function calculateTokens(text) {
  // Simple approximation: ~4 chars per token on average
  return Math.max(1, Math.ceil(text.length / 4));
}

/**
 * Charges tokens for sending a message.
 * 
 * @returns {string} Result of the token charge operation
 */
export function charge_per_message() {
  const { conversation_id, token_count } = JSON.parse(env.input());
  const account_id = env.signer_account_id();
  
  // Set a default token cost if not provided
  const tokens_to_charge = token_count ? BigInt(token_count) : 1_000_000n;
  
  // Check if user has enough tokens
  const user_balance = BigInt(get_user_token_balance(account_id));
  if (user_balance < tokens_to_charge) {
    env.panic(`Insufficient tokens. Required: ${tokens_to_charge.toString()}, Available: ${user_balance.toString()}`);
    return;
  }
  
  // Get conversation metadata
  const metadata_key = `conversation_${conversation_id}_metadata`;
  const metadata_json = env.get_data(metadata_key);
  
  if (!metadata_json) {
    env.panic(`Conversation not found: ${conversation_id}`);
    return;
  }
  
  const metadata = JSON.parse(metadata_json);
  if (metadata.owner !== account_id) {
    env.panic("Not authorized to charge tokens for this conversation");
    return;
  }
  
  // Transfer tokens to contract
  env.ft_transfer_internal(
    account_id,
    env.current_account_id(),
    tokens_to_charge.toString()
  );
  
  // Update conversation token usage
  metadata.tokens_used = (BigInt(metadata.tokens_used) + tokens_to_charge).toString();
  env.set_data(metadata_key, JSON.stringify(metadata));
  
  // Update last charged timestamp
  metadata.last_charged = Date.now();
  env.set_data(metadata_key, JSON.stringify(metadata));
  
  env.value_return(JSON.stringify({ 
    success: true, 
    amount_charged: tokens_to_charge.toString(),
    new_balance: (user_balance - tokens_to_charge).toString(),
    conversation_id: conversation_id
  }));
}

/**
 * Gets the token balance for the current user or a specified account.
 * 
 * @returns {string} The token balance
 */
export function get_token_balance() {
  let input;
  try {
    input = JSON.parse(env.input());
  } catch (e) {
    input = {};
  }
  
  const account_id = input.account_id || env.signer_account_id();
  const balance = env.ft_balance_of(account_id);
  
  env.value_return(JSON.stringify({
    account_id: account_id,
    balance: balance
  }));
}

/**
 * Helper function to get a user's token balance.
 * For internal use within other functions.
 * 
 * @param {string} account_id - The account to check
 * @returns {string} The user's token balance
 */
function get_user_token_balance(account_id) {
  return env.ft_balance_of(account_id);
}

/**
 * Calculates how many messages a user can send with their current balance.
 * 
 * @returns {string} Number of messages user can afford
 */
export function calculate_message_allowance() {
  const account_id = env.signer_account_id();
  const token_cost_per_message = 1_000_000n;
  const balance = BigInt(get_user_token_balance(account_id));
  
  const message_allowance = balance / token_cost_per_message;
  
  env.value_return(JSON.stringify({ 
    token_balance: balance.toString(),
    messages_remaining: message_allowance.toString(),
    token_cost_per_message: token_cost_per_message.toString()
  }));
}

/**
 * Pre-reserves tokens for an AI conversation.
 * This allows the user to reserve the maximum expected tokens for a conversation.
 * 
 * @returns {string} Reservation details
 */
export function reserve_tokens() {
  const { amount, conversation_id } = JSON.parse(env.input());
  const account_id = env.signer_account_id();
  
  if (!amount || !conversation_id) {
    env.panic("Must provide amount and conversation_id");
    return;
  }
  
  // Parse the amount to reserve
  const reserve_amount = BigInt(amount);
  
  // Check user balance
  const user_balance = BigInt(get_user_token_balance(account_id));
  if (user_balance < reserve_amount) {
    env.panic(`Insufficient tokens. Required: ${reserve_amount.toString()}, Available: ${user_balance.toString()}`);
    return;
  }
  
  // Get conversation metadata
  const metadata_key = `conversation_${conversation_id}_metadata`;
  const metadata_json = env.get_data(metadata_key);
  
  if (!metadata_json) {
    env.panic(`Conversation not found: ${conversation_id}`);
    return;
  }
  
  const metadata = JSON.parse(metadata_json);
  if (metadata.owner !== account_id) {
    env.panic("Not authorized to reserve tokens for this conversation");
    return;
  }
  
  // Create reservation record
  const reservation_id = `${conversation_id}_reserve_${Date.now()}`;
  const reservation_data = {
    id: reservation_id,
    conversation_id: conversation_id,
    account_id: account_id,
    amount: reserve_amount.toString(),
    timestamp: Date.now(),
    status: "active"
  };
  
  // Store reservation
  env.set_data(`reservation_${reservation_id}`, JSON.stringify(reservation_data));
  
  // Transfer tokens to contract
  env.ft_transfer_internal(
    account_id,
    env.current_account_id(),
    reserve_amount.toString()
  );
  
  // Update conversation metadata with reservation
  if (!metadata.reservations) {
    metadata.reservations = [];
  }
  metadata.reservations.push(reservation_id);
  metadata.tokens_reserved = reserve_amount.toString();
  env.set_data(metadata_key, JSON.stringify(metadata));
  
  env.value_return(JSON.stringify({ 
    success: true, 
    reservation_id: reservation_id,
    amount: reserve_amount.toString(),
    conversation_id: conversation_id
  }));
}

/**
 * Refunds unused tokens from a reservation.
 * 
 * @returns {string} Refund details
 */
export function refund_reserved_tokens() {
  const { reservation_id, amount } = JSON.parse(env.input());
  const account_id = env.signer_account_id();
  
  if (!reservation_id || !amount) {
    env.panic("Must provide reservation_id and amount");
    return;
  }
  
  // Get reservation data
  const reservation_key = `reservation_${reservation_id}`;
  const reservation_json = env.get_data(reservation_key);
  
  if (!reservation_json) {
    env.panic(`Reservation not found: ${reservation_id}`);
    return;
  }
  
  const reservation = JSON.parse(reservation_json);
  
  // Verify ownership
  if (reservation.account_id !== account_id) {
    env.panic("Not authorized to refund this reservation");
    return;
  }
  
  // Check reservation status
  if (reservation.status !== "active") {
    env.panic(`Reservation is not active: ${reservation.status}`);
    return;
  }
  
  // Parse the refund amount
  const refund_amount = BigInt(amount);
  const reserved_amount = BigInt(reservation.amount);
  
  if (refund_amount > reserved_amount) {
    env.panic(`Refund amount exceeds reserved amount. Available: ${reserved_amount.toString()}, Requested: ${refund_amount.toString()}`);
    return;
  }
  
  // Transfer tokens back to user
  env.ft_transfer_internal(
    env.current_account_id(),
    account_id,
    refund_amount.toString()
  );
  
  // Update reservation
  const remaining_amount = reserved_amount - refund_amount;
  
  if (remaining_amount <= 0) {
    // Close reservation
    reservation.status = "closed";
    reservation.closed_at = Date.now();
    reservation.amount = "0";
  } else {
    // Update remaining amount
    reservation.amount = remaining_amount.toString();
    reservation.last_refund = Date.now();
  }
  
  env.set_data(reservation_key, JSON.stringify(reservation));
  
  // Update conversation metadata
  const conversation_id = reservation.conversation_id;
  const metadata_key = `conversation_${conversation_id}_metadata`;
  const metadata_json = env.get_data(metadata_key);
  
  if (metadata_json) {
    const metadata = JSON.parse(metadata_json);
    if (metadata.tokens_reserved) {
      const current_reserved = BigInt(metadata.tokens_reserved);
      metadata.tokens_reserved = (current_reserved - refund_amount).toString();
      env.set_data(metadata_key, JSON.stringify(metadata));
    }
  }
  
  env.value_return(JSON.stringify({ 
    success: true, 
    reservation_id: reservation_id,
    refunded: refund_amount.toString(),
    remaining: remaining_amount.toString(),
    status: reservation.status
  }));
}