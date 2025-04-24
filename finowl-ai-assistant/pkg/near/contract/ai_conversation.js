/**
 * FinOwl AI Assistant v2
 * -------------------------------------------
 * UX-Optimized JavaScript Logic for On-Chain AI Conversations.
 *
 * Features:
 * - One transaction to start, one to top-up, one to refund.
 * - View functions handle fetching messages, history, and metadata.
 * - Token-based access to AI assistant with conversation tracking.
 * - Seamless token grants (free and backend-verified paid).
 */

export function check_user_status() {
  const account_id = env.signer_account_id();
  const key = `user_${account_id}_metadata`;
  const existing = env.get_data(key);
  if (existing) {
    env.value_return(JSON.stringify({ status: "existing_user" }));
  } else {
    const profile = {
      account_id,
      created_at: Date.now(),
      storage_enabled: true,
      token_grants: [],
    };
    env.set_data(key, JSON.stringify(profile));
    env.set_data(`user_${account_id}_conversations`, JSON.stringify([]));

    // ✅ Track in user_list
    const userListKey = "user_list";
    const currentList = JSON.parse(env.get_data(userListKey) || "[]");

    if (!currentList.includes(account_id)) {
      currentList.push(account_id);
      env.set_data(userListKey, JSON.stringify(currentList));
    }

    env.value_return(JSON.stringify({ status: "new_user", profile_created: true }));
  }
}

export function list_all_users() {
  const list = env.get_data("user_list");
  env.value_return(list || JSON.stringify([]));
}

/**
 * Grant 100 free tokens to a new user (only once).
 */
export function grant_free_tokens() {
  const account_id = env.signer_account_id();
  const profile_key = `user_${account_id}_metadata`;
  const profile = JSON.parse(env.get_data(profile_key) || "{}");

  if (profile.token_grants?.some(g => g.type === "welcome")) {
    env.panic("User already received welcome tokens");
    return;
  }

  const amount = 100_000_000n; // 100 tokens
  env.ft_transfer_internal(env.current_account_id(), account_id, amount.toString());

  profile.token_grants = profile.token_grants || [];
  profile.token_grants.push({ type: "welcome", amount: amount.toString(), ts: Date.now() });
  env.set_data(profile_key, JSON.stringify(profile));

  env.value_return(JSON.stringify({ granted: amount.toString() }));
}

/**
 * Backend-triggered token grant when user paid in NEAR.
 */
export function grant_paid_tokens() {
  const { timestamp } = JSON.parse(env.input());
  const account_id = env.signer_account_id();
  const profile_key = `user_${account_id}_metadata`;
  const profile = JSON.parse(env.get_data(profile_key) || "{}");

  const amount = 1_000_000_000n; // 1,000 tokens
  env.ft_transfer_internal(env.current_account_id(), account_id, amount.toString());

  profile.token_grants = profile.token_grants || [];
  profile.token_grants.push({ type: "purchase", amount: amount.toString(), ts: timestamp });
  env.set_data(profile_key, JSON.stringify(profile));

  env.value_return(JSON.stringify({ granted: amount.toString(), source: "purchase" }));
}


/**
 * Starts a new conversation with reserved tokens from the user.
 */
export function start_ai_conversation() {
  const { conversation_id, reserve_amount, timestamp } = JSON.parse(env.input());
  const account_id = env.signer_account_id();

  if (!conversation_id || !reserve_amount || !timestamp) {
    env.panic("Must provide conversation_id, reserve_amount, and timestamp");
    return;
  }

  const metadata = {
    id: conversation_id,
    owner: account_id,
    created_at: timestamp,
    last_active: timestamp,
    tokens_reserved: reserve_amount,
    tokens_used: "0",
    message_count: 0,
  };

  env.set_data(`conversation_${conversation_id}_metadata`, JSON.stringify(metadata));
  env.set_data(`conversation_${conversation_id}_messages`, JSON.stringify([]));
  env.ft_transfer_internal(account_id, env.current_account_id(), reserve_amount);

  const list_key = `user_${account_id}_conversations`;
  const list = JSON.parse(env.get_data(list_key) || "[]");
  if (!list.includes(conversation_id)) list.push(conversation_id);
  env.set_data(list_key, JSON.stringify(list));

  env.value_return(conversation_id);
}

/**
 * Stores a message in a conversation and deducts reserved tokens.
 */
export function store_message() {
  const { conversation_id, role, content, timestamp } = JSON.parse(env.input());
  const account_id = env.signer_account_id();
  const metadata_key = `conversation_${conversation_id}_metadata`;
  const messages_key = `conversation_${conversation_id}_messages`;

  const metadata_raw = env.get_data(metadata_key);
  if (!metadata_raw) env.panic("Conversation metadata not found");
  const metadata = JSON.parse(metadata_raw);
  if (metadata.owner !== account_id) env.panic("Not authorized to post to this conversation");

  const token_count = calculateTokens(content);
  const used = parseInt(metadata.tokens_used || "0", 10);
  const reserved = parseInt(metadata.tokens_reserved || "0", 10);
  if ((used + token_count) > reserved) env.panic("Out of tokens. Please top-up.");

  const messages = JSON.parse(env.get_data(messages_key) || "[]");
  const message_id = `${conversation_id}_msg_${metadata.message_count || 0}`;

  const message = {
    id: message_id,
    role,
    content,
    timestamp: Number(timestamp), // ← Use passed timestamp
    tokens: token_count
  };

  messages.push(message);
  metadata.tokens_used = (used + token_count).toString();
  metadata.message_count += 1;
  metadata.last_active = Number(timestamp); // ← Use passed timestamp

  env.set_data(messages_key, JSON.stringify(messages));
  env.set_data(metadata_key, JSON.stringify(metadata));

  env.value_return(JSON.stringify({
    success: true,
    stored: true,
    message_id,
    tokens: token_count
  }));
}

/**
 * Add more tokens to an existing conversation.
 */
export function add_tokens_to_conversation() {
  const { conversation_id, amount } = JSON.parse(env.input());
  const account_id = env.signer_account_id();
  const metadata_key = `conversation_${conversation_id}_metadata`;

  const metadata = JSON.parse(env.get_data(metadata_key) || "{}");
  if (!metadata || metadata.owner !== account_id) env.panic("Not authorized or conversation not found");

  const current = BigInt(metadata.tokens_reserved || "0");
  const added = BigInt(amount);
  metadata.tokens_reserved = (current + added).toString();

  env.ft_transfer_internal(account_id, env.current_account_id(), amount);
  env.set_data(metadata_key, JSON.stringify(metadata));

  env.value_return(JSON.stringify({ added: amount, total_reserved: metadata.tokens_reserved }));
}

/**
 * Refund unused reserved tokens back to the user.
 */
export function refund_reserved_tokens() {
  const { conversation_id } = JSON.parse(env.input());
  const account_id = env.signer_account_id();
  const metadata_key = `conversation_${conversation_id}_metadata`;

  const metadata = JSON.parse(env.get_data(metadata_key) || "{}");
  if (!metadata || metadata.owner !== account_id) env.panic("Not authorized or conversation not found");

  const reserved = BigInt(metadata.tokens_reserved || "0");
  const used = BigInt(metadata.tokens_used || "0");
  const refund = reserved > used ? reserved - used : 0n;

  if (refund > 0n) env.ft_transfer_internal(env.current_account_id(), account_id, refund.toString());

  metadata.tokens_reserved = "0";
  metadata.tokens_used = "0";
  env.set_data(metadata_key, JSON.stringify(metadata));

  env.value_return(JSON.stringify({ refunded: refund.toString() }));
}

/**
 * Contract-only: deduct tokens from a conversation (e.g. AI backend usage).
 */
export function deduct_tokens_from_conversation() {
  const { conversation_id, amount, timestamp } = JSON.parse(env.input());
  const caller = env.predecessor_account_id();
  if (caller !== env.current_account_id()) env.panic("Only the contract can deduct tokens");

  const metadata_key = `conversation_${conversation_id}_metadata`;
  const metadata_raw = env.get_data(metadata_key);
  if (!metadata_raw) env.panic("Conversation not found");

  const metadata = JSON.parse(metadata_raw);
  const used = parseInt(metadata.tokens_used || "0", 10);
  const reserved = parseInt(metadata.tokens_reserved || "0", 10);
  const deduct = parseInt(amount, 10);
  if ((used + deduct) > reserved) env.panic("Insufficient reserved tokens to deduct");

  metadata.tokens_used = (used + deduct).toString();
  metadata.last_active = timestamp;
  env.set_data(metadata_key, JSON.stringify(metadata));

  env.value_return(JSON.stringify({
    success: true,
    conversation_id,
    new_used: metadata.tokens_used,
    remaining: (reserved - used - deduct).toString()
  }));
}
/**
 * Estimate token usage based on content length.
 */
function calculateTokens(text) {
  return Math.max(1, Math.ceil(text.length / 4));
}

/**
 * Returns all messages in a conversation.
 */
export function get_conversation_history() {
  const { conversation_id } = JSON.parse(env.input());
  const messages_key = `conversation_${conversation_id}_messages`;
  const messages_json = env.get_data(messages_key);
  env.value_return(messages_json || JSON.stringify([]));
}

/**
 * Returns all conversation IDs for a user account.
 */
export function get_user_conversations() {
  const { account_id } = JSON.parse(env.input());
  const key = `user_${account_id}_conversations`;
  const list = env.get_data(key);
  env.value_return(list || JSON.stringify([]));
}

/**
 * Fetch conversation metadata by ID.
 */
export function get_conversation_metadata() {
  const { conversation_id } = JSON.parse(env.input());
  const metadata_key = `conversation_${conversation_id}_metadata`;
  const metadata = env.get_data(metadata_key);
  if (!metadata) env.panic("Conversation not found: " + conversation_id);
  env.value_return(metadata);
}

/**
 * Check if a given user is already registered (has a user profile).
 *
 * @param {string} account_id - The NEAR account to check
 * @returns {boolean} Whether the user is registered or not
 */
export function is_user_registered() {
  const { account_id } = JSON.parse(env.input());
  if (!account_id) {
    env.panic("Must provide account_id");
    return;
  }

  const key = `user_${account_id}_metadata`;
  const profile = env.get_data(key);

  env.value_return(JSON.stringify({ registered: !!profile }));
}

/**
 * Get the user's current FinOwl token balance.
 *
 * @param {string} account_id - The user's NEAR account
 * @returns {string} Token balance in smallest denomination (e.g., yocto-tokens)
 */
export function get_user_token_balance() {
  const { account_id } = JSON.parse(env.input());
  if (!account_id) {
    env.panic("Must provide account_id");
    return;
  }

  const balance = env.ft_balance_of(account_id);
  env.value_return(JSON.stringify({ balance }));
}

/**
 * Check if the user has already received their welcome (free) tokens.
 *
 * @param {string} account_id - The user's NEAR account
 * @returns {boolean} Whether welcome tokens were already granted
 */
export function has_received_welcome_tokens() {
  const { account_id } = JSON.parse(env.input());
  const profile_key = `user_${account_id}_metadata`;
  const profile_json = env.get_data(profile_key);

  if (!profile_json) {
    env.value_return(JSON.stringify({ received: false }));
    return;
  }

  const profile = JSON.parse(profile_json);
  const received = profile.token_grants?.some(g => g.type === "welcome") || false;

  env.value_return(JSON.stringify({ received }));
}

/**
 * Get the number of tokens still available (not yet consumed) for a conversation.
 *
 * @param {string} conversation_id - The unique ID of the conversation
 * @returns {string} Remaining tokens for that conversation
 */
export function get_tokens_remaining() {
  const { conversation_id } = JSON.parse(env.input());
  const key = `conversation_${conversation_id}_metadata`;
  const metadata_raw = env.get_data(key);

  if (!metadata_raw) {
    env.value_return(JSON.stringify({ remaining: "0" }));
    return;
  }

  const metadata = JSON.parse(metadata_raw);
  const used = BigInt(metadata.tokens_used || "0");
  const reserved = BigInt(metadata.tokens_reserved || "0");
  const remaining = reserved > used ? reserved - used : 0n;

  env.value_return(JSON.stringify({ remaining: remaining.toString() }));
}

/**
 * Check whether a conversation exists in storage.
 *
 * @param {string} conversation_id - The unique ID of the conversation
 * @returns {boolean} Whether the conversation exists or not
 */
export function conversation_exists() {
  const { conversation_id } = JSON.parse(env.input());
  const exists = !!env.get_data(`conversation_${conversation_id}_metadata`);
  env.value_return(JSON.stringify({ exists }));
}