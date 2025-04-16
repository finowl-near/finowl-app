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


// =============================================
// PART 1: User Onboarding & Token Granting
// =============================================

/**
 * Check if a user has a profile. If not, create one.
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
    env.value_return(JSON.stringify({ status: "new_user", profile_created: true }));
  }
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
  const account_id = env.signer_account_id();
  const profile_key = `user_${account_id}_metadata`;
  const profile = JSON.parse(env.get_data(profile_key) || "{}");

  const amount = 1_000_000_000n; // 1,000 tokens
  env.ft_transfer_internal(env.current_account_id(), account_id, amount.toString());

  profile.token_grants = profile.token_grants || [];
  profile.token_grants.push({ type: "purchase", amount: amount.toString(), ts: Date.now() });
  env.set_data(profile_key, JSON.stringify(profile));

  env.value_return(JSON.stringify({ granted: amount.toString(), source: "purchase" }));
}

/**
 * Starts a new conversation with reserved tokens from the user.
 */
export function start_ai_conversation() {
  const { conversation_id, reserve_amount } = JSON.parse(env.input());
  const account_id = env.signer_account_id();

  if (!conversation_id || !reserve_amount) {
    env.panic("Must provide conversation_id and reserve_amount");
    return;
  }

  const metadata = {
    id: conversation_id,
    owner: account_id,
    created_at: Date.now(),
    last_active: Date.now(),
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
  const { conversation_id, role, content } = JSON.parse(env.input());
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
  const message = { id: message_id, role, content, timestamp: Date.now(), tokens: token_count };

  messages.push(message);
  metadata.tokens_used = (used + token_count).toString();
  metadata.message_count += 1;
  metadata.last_active = Date.now();

  env.set_data(messages_key, JSON.stringify(messages));
  env.set_data(metadata_key, JSON.stringify(metadata));

  env.value_return(JSON.stringify({ success: true, stored: true, message_id, tokens: token_count }));
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
  const { conversation_id, amount } = JSON.parse(env.input());
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
  metadata.last_active = Date.now();
  env.set_data(metadata_key, JSON.stringify(metadata));

  env.value_return(JSON.stringify({ success: true, conversation_id, new_used: metadata.tokens_used, remaining: (reserved - used - deduct).toString() }));
}

/**
 * Estimate token usage based on content length.
 */
function calculateTokens(text) {
  return Math.max(1, Math.ceil(text.length / 4));
}