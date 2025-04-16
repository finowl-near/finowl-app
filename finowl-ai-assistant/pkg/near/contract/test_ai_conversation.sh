#!/bin/bash

ACCOUNT_ID="workflow_tester_03.testnet"
CONTRACT_ID="finowl.testnet"
CONVERSATION_ID="${ACCOUNT_ID}_$(date +%s)"
RESERVE_AMOUNT="10000000"
MESSAGE="Hello, FinOwl!"
GAS="50.0 Tgas"
DEPOSIT="0 NEAR"

function assert_success {
  if [ $? -ne 0 ]; then
    echo "❌ Failed at step: $1"
    exit 1
  fi
}

echo "🧪 1. Registering storage deposit..."
near contract call-function as-transaction $CONTRACT_ID storage_deposit \
  json-args "{\"account_id\": \"$ACCOUNT_ID\"}" \
  prepaid-gas "$GAS" attached-deposit "0.01 NEAR" \
  sign-as $ACCOUNT_ID network-config testnet sign-with-keychain send
assert_success "Storage Deposit"

sleep 3


echo "🧪 2. Testing check_user_status..."
near contract call-function as-transaction $CONTRACT_ID call_js_func \
  json-args "{\"function_name\":\"check_user_status\"}" \
  prepaid-gas "$GAS" attached-deposit "$DEPOSIT" \
  sign-as $ACCOUNT_ID network-config testnet sign-with-keychain send
assert_success "check_user_status"

sleep 3


echo "🧪 3. Granting free tokens..."
near contract call-function as-transaction $CONTRACT_ID call_js_func \
  json-args "{\"function_name\":\"grant_free_tokens\"}" \
  prepaid-gas "$GAS" attached-deposit "$DEPOSIT" \
  sign-as $ACCOUNT_ID network-config testnet sign-with-keychain send
assert_success "grant_free_tokens"

sleep 3

echo "🧪 4. Starting conversation: $CONVERSATION_ID"
near contract call-function as-transaction $CONTRACT_ID call_js_func \
  json-args "{\"function_name\":\"start_ai_conversation\", \"conversation_id\":\"$CONVERSATION_ID\", \"reserve_amount\":\"$RESERVE_AMOUNT\"}" \
  prepaid-gas "$GAS" attached-deposit "$DEPOSIT" \
  sign-as $ACCOUNT_ID network-config testnet sign-with-keychain send
assert_success "start_ai_conversation"

sleep 3

echo "🧪 5. Sending a message..."
near contract call-function as-transaction $CONTRACT_ID call_js_func \
  json-args "{\"function_name\":\"store_message\", \"conversation_id\":\"$CONVERSATION_ID\", \"role\":\"user\", \"content\":\"$MESSAGE\"}" \
  prepaid-gas "$GAS" attached-deposit "$DEPOSIT" \
  sign-as $ACCOUNT_ID network-config testnet sign-with-keychain send
assert_success "store_message"

sleep 3

echo "🧪 6. Fetching conversation history..."
near contract call-function as-read-only $CONTRACT_ID view_js_func \
  json-args "{\"function_name\":\"get_conversation_history\", \"conversation_id\":\"$CONVERSATION_ID\"}" \
  network-config testnet now
assert_success "get_conversation_history"

sleep 3

echo "✅ Finished basic test flow for FinOwl AI Assistant v2"