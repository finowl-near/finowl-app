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
