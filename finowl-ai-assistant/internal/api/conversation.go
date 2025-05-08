package api

import (
	"encoding/base64"
	"encoding/json"
	"finowl-ai-assistant/pkg/near"
	"fmt"
	"net/http"
	"time"
)

// StartConversationHandler creates a new conversation and reserves tokens for it
func (h *Handler) StartConversationHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Only POST allowed", http.StatusMethodNotAllowed)
		return
	}

	// Generate a unique conversation ID using account ID + timestamp
	accountID := h.NearClient.GetUserAccountID()
	timestamp := time.Now().Unix()
	convoID := fmt.Sprintf("%s_%d", accountID, timestamp)
	reserveAmount := "10000000" // 10 FT tokens

	result, err := h.NearClient.StartConversation(convoID, reserveAmount)
	if err != nil {
		http.Error(w, fmt.Sprintf("Transaction failed: %v", err), http.StatusInternalServerError)
		return
	}

	// Check the contract call result
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
			"reserved_tokens": reserveAmount,
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

func (h *Handler) GetUserConversationsHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Only POST allowed", http.StatusMethodNotAllowed)
		return
	}

	req := struct {
		AccountID string `json:"account_id"`
	}{}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil || req.AccountID == "" {
		http.Error(w, "Missing account_id", http.StatusBadRequest)
		return
	}

	conversations, err := h.NearClient.GetUserConversations(req.AccountID)
	if err != nil {
		http.Error(w, "Failed to fetch conversations: "+err.Error(), http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(map[string]interface{}{
		"success":       true,
		"conversations": conversations,
	})
}

func (h *Handler) GetConversationHistoryHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Only POST allowed", http.StatusMethodNotAllowed)
		return
	}

	req := struct {
		ConversationID string `json:"conversation_id"`
	}{}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil || req.ConversationID == "" {
		http.Error(w, "Invalid JSON or missing conversation_id", http.StatusBadRequest)
		return
	}

	messages, err := h.NearClient.GetConversationHistory(req.ConversationID)
	if err != nil {
		http.Error(w, "Failed to fetch history: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success":   true,
		"messages":  messages,
		"msg_count": len(messages),
	})
}

func (h *Handler) GetConversationMetadataHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Only POST allowed", http.StatusMethodNotAllowed)
		return
	}

	var req struct {
		ConversationID string `json:"conversation_id"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil || req.ConversationID == "" {
		http.Error(w, "Invalid request or missing conversation_id", http.StatusBadRequest)
		return
	}

	metadata, err := h.NearClient.GetConversationMetadata(req.ConversationID)
	if err != nil {
		http.Error(w, "Failed to fetch metadata: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success":  true,
		"metadata": metadata,
	})
}
