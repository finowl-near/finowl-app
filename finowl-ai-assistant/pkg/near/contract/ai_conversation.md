FinOwl AI Assistant v2 - NEAR Smart Contract Guide

This document provides a complete guide for developers and testers to interact with the FinOwl AI Assistant v2 smart contract on NEAR. It includes the end-to-end workflow a user (e.g., Alice) would follow to register, start AI conversations, send messages, manage tokens, and more — along with the required CLI commands.

⸻

🧠 Overview

FinOwl is an AI assistant that uses token-gated access for conversations. Users can:
	•	Register on-chain
	•	Receive free or paid FinOwl tokens
	•	Use tokens to initiate and interact with conversations
	•	View history, refund unused tokens, and manage usage

⸻

🧍 Step-by-Step: Alice’s Journey with FinOwl

🔹 Step 1: Check and Register Alice’s User Profile

near contract call-function as-transaction finowl.testnet call_js_func \
  json-args '{"function_name": "check_user_status"}' \
  prepaid-gas '30 Tgas' attached-deposit '0 NEAR' \
  sign-as alice.testnet network-config testnet sign-with-keychain send



⸻

🎁 Step 2: Grant Free Tokens to Alice (One-Time Welcome Bonus)

near contract call-function as-transaction finowl.testnet call_js_func \
  json-args '{"function_name": "grant_free_tokens"}' \
  prepaid-gas '30 Tgas' attached-deposit '0 NEAR' \
  sign-as alice.testnet network-config testnet sign-with-keychain send



⸻

🛠️ Step 3: Start a New AI Conversation (Reserve Tokens)

near contract call-function as-transaction finowl.testnet call_js_func \
  json-args '{
    "function_name": "start_ai_conversation",
    "conversation_id": "alice_convo_1",
    "reserve_amount": "1000000"
  }' \
  prepaid-gas '50 Tgas' attached-deposit '0 NEAR' \
  sign-as alice.testnet network-config testnet sign-with-keychain send



⸻

💬 Step 4: Send a Message to the AI

near contract call-function as-transaction finowl.testnet call_js_func \
  json-args '{
    "function_name": "store_message",
    "conversation_id": "alice_convo_1",
    "role": "user",
    "content": "Hey FinOwl, give me the best crypto alpha!"
  }' \
  prepaid-gas '50 Tgas' attached-deposit '0 NEAR' \
  sign-as alice.testnet network-config testnet sign-with-keychain send



⸻

➕ Step 5: Add More Tokens to a Conversation

near contract call-function as-transaction finowl.testnet call_js_func \
  json-args '{
    "function_name": "add_tokens_to_conversation",
    "conversation_id": "alice_convo_1",
    "amount": "500000"
  }' \
  prepaid-gas '50 Tgas' attached-deposit '0 NEAR' \
  sign-as alice.testnet network-config testnet sign-with-keychain send



⸻

💸 Step 6: Refund Unused Tokens

near contract call-function as-transaction finowl.testnet call_js_func \
  json-args '{"function_name": "refund_reserved_tokens", "conversation_id": "alice_convo_1"}' \
  prepaid-gas '30 Tgas' attached-deposit '0 NEAR' \
  sign-as alice.testnet network-config testnet sign-with-keychain send



⸻

📊 View & Fetch Helpers (Read-Only Calls)

🧾 View Conversation History

near contract call-function as-read-only finowl.testnet view_js_func \
  json-args '{"function_name": "get_conversation_history", "conversation_id": "alice_convo_1"}' \
  network-config testnet now

🗂️ Get Conversation Metadata

near contract call-function as-read-only finowl.testnet view_js_func \
  json-args '{"function_name": "get_conversation_metadata", "conversation_id": "alice_convo_1"}' \
  network-config testnet now

🧾 List User Conversations

near contract call-function as-read-only finowl.testnet view_js_func \
  json-args '{"function_name": "get_user_conversations", "account_id": "alice.testnet"}' \
  network-config testnet now



⸻

🧪 Backend-Friendly Utility Checks

✅ Check If User Is Registered

near contract call-function as-read-only finowl.testnet view_js_func \
  json-args '{"function_name": "is_user_registered", "account_id": "alice.testnet"}' \
  network-config testnet now

💰 Get Alice’s Token Balance

near contract call-function as-read-only finowl.testnet view_js_func \
  json-args '{"function_name": "get_user_token_balance", "account_id": "alice.testnet"}' \
  network-config testnet now

🎉 Check If Alice Received Welcome Tokens

near contract call-function as-read-only finowl.testnet view_js_func \
  json-args '{"function_name": "has_received_welcome_tokens", "account_id": "alice.testnet"}' \
  network-config testnet now

📊 Check Remaining Tokens in a Conversation

near contract call-function as-read-only finowl.testnet view_js_func \
  json-args '{"function_name": "get_tokens_remaining", "conversation_id": "alice_convo_1"}' \
  network-config testnet now

🔍 Check if a Conversation Exists

near contract call-function as-read-only finowl.testnet view_js_func \
  json-args '{"function_name": "conversation_exists", "conversation_id": "alice_convo_1"}' \
  network-config testnet now



⸻

🪙 Grant Tokens from Backend (After NEAR Payment)

Use this after verifying payment off-chain

near contract call-function as-transaction finowl.testnet call_js_func \
  json-args '{"function_name": "grant_paid_tokens"}' \
  prepaid-gas '40 Tgas' attached-deposit '0 NEAR' \
  sign-as alice.testnet network-config testnet sign-with-keychain send