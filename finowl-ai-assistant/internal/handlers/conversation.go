package handlers

import (
	"encoding/base64"
	"encoding/json"
	"fmt"
	"log"
	"math/big"
	"net/http"
	"os"

	near "github.com/aurora-is-near/near-api-go"
	"github.com/aurora-is-near/near-api-go/utils"
)

type CreateConversationRequest struct {
	ConversationID string `json:"conversation_id"`
}

func CreateConversationHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Only POST allowed", http.StatusMethodNotAllowed)
		return
	}

	var req CreateConversationRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil || req.ConversationID == "" {
		http.Error(w, "Invalid JSON or missing conversation_id", http.StatusBadRequest)
		return
	}

	userID := os.Getenv("NEAR_USER_ACCOUNT_ID")
	userPK := os.Getenv("NEAR_USER_PRIVATE_KEY")
	ownerID := os.Getenv("NEAR_OWNER_ACCOUNT_ID")
	ownerPK := os.Getenv("NEAR_OWNER_PRIVATE_KEY")
	contractID := os.Getenv("NEAR_CONTRACT_ID")
	rpc := os.Getenv("NEAR_RPC_URL")

	userKey, _ := utils.Ed25519PrivateKeyFromString(userPK)
	ownerKey, _ := utils.Ed25519PrivateKeyFromString(ownerPK)

	conn := near.NewConnection(rpc)
	userAccount := near.LoadAccountWithPrivateKey(conn, userID, userKey)
	ownerAccount := near.LoadAccountWithPrivateKey(conn, ownerID, ownerKey)

	userBalance, err := GetUserBalance(userAccount, contractID, userID)
	if err != nil {
		http.Error(w, "Could not check user balance: "+err.Error(), http.StatusInternalServerError)
		return
	}

	minTokens := big.NewInt(1_000_000)
	if userBalance.Cmp(minTokens) < 0 {
		log.Printf("⚠️ Low balance (%s), funding user...\n", userBalance.String())
		transferArgs := map[string]interface{}{
			"receiver_id": userID,
			"amount":      "1000000",
		}
		transferJSON, _ := json.Marshal(transferArgs)
		gas := uint64(100_000_000_000_000)
		oneYocto := big.NewInt(1)

		_, err := ownerAccount.FunctionCall(contractID, "ft_transfer", transferJSON, gas, *oneYocto)
		if err != nil {
			http.Error(w, fmt.Sprintf("Auto-funding failed: %v", err), http.StatusInternalServerError)
			return
		}
		log.Println("✅ Auto-funded user successfully")
	}

	args := map[string]interface{}{
		"function_name":   "start_ai_conversation",
		"conversation_id": req.ConversationID,
	}
	argsJSON, _ := json.Marshal(args)
	gas := uint64(100_000_000_000_000)
	zero := big.NewInt(0)

	result, err := userAccount.FunctionCall(contractID, "call_js_func", argsJSON, gas, *zero)
	if err != nil {
		http.Error(w, fmt.Sprintf("Transaction failed: %v", err), http.StatusInternalServerError)
		return
	}

	status, ok := result["status"].(map[string]interface{})
	if !ok {
		http.Error(w, "Invalid contract result (missing status)", http.StatusInternalServerError)
		return
	}

	if encoded, ok := status["SuccessValue"].(string); ok && encoded != "" {
		decodedBytes, err := base64.StdEncoding.DecodeString(encoded)
		if err != nil {
			http.Error(w, "Base64 decode failed", http.StatusInternalServerError)
			return
		}
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]interface{}{
			"success":         true,
			"conversation_id": string(decodedBytes),
		})
		return
	}

	if failureRaw, ok := status["Failure"]; ok {
		errMsg := ExtractContractError(failureRaw)
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]interface{}{
			"success": false,
			"error":   errMsg,
		})
		return
	}

	w.WriteHeader(http.StatusInternalServerError)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": false,
		"error":   "Unexpected result format",
	})
}
