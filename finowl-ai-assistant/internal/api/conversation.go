package api

import (
	"encoding/base64"
	"encoding/json"
	"fmt"
	"log"
	"math/big"
	"net/http"

	"finowl-ai-assistant/pkg/near"
)

type CreateConversationRequest struct {
	ConversationID string `json:"conversation_id"`
}

func (h *Handler) CreateConversationHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Only POST allowed", http.StatusMethodNotAllowed)
		return
	}

	var req CreateConversationRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil || req.ConversationID == "" {
		http.Error(w, "Invalid JSON or missing conversation_id", http.StatusBadRequest)
		return
	}

	userBalance, err := h.NearClient.GetUserBalance(h.NearClient.GetUserAccountID())
	if err != nil {
		http.Error(w, "Could not check user balance: "+err.Error(), http.StatusInternalServerError)
		return
	}

	minTokens := big.NewInt(1_000_000)
	if userBalance.Cmp(minTokens) < 0 {
		log.Printf("⚠️ Low balance (%s), funding user...\n", userBalance.String())
		err := h.NearClient.FundUser(h.NearClient.GetUserAccountID(), "1000000")
		if err != nil {
			http.Error(w, fmt.Sprintf("Auto-funding failed: %v", err), http.StatusInternalServerError)
			return
		}
		log.Println("✅ Auto-funded user successfully")
	}

	result, err := h.NearClient.CreateConversation(req.ConversationID)
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
		errMsg := near.ExtractContractError(failureRaw)
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
