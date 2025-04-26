// internal/api/tokens.go
package api

import (
	"encoding/base64"
	"encoding/json"
	"fmt"
	"net/http"
)

func (h *Handler) GrantPaidTokensHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Only POST allowed", http.StatusMethodNotAllowed)
		return
	}

	// Parse the account ID from request body
	var req struct {
		AccountID string `json:"account_id"`
	}

	// Try to decode the request body
	err := json.NewDecoder(r.Body).Decode(&req)
	if err != nil && err.Error() != "EOF" {
		http.Error(w, "Invalid request body: "+err.Error(), http.StatusBadRequest)
		return
	}

	// If no account ID was provided, use an empty string (the client will use the default)
	accountID := req.AccountID

	// Call the NEAR client to grant paid tokens
	result, err := h.NearClient.GrantPaidTokens()
	if err != nil {
		http.Error(w, "Failed to grant paid tokens: "+err.Error(), http.StatusInternalServerError)
		return
	}

	status, ok := result["status"].(map[string]interface{})
	if !ok {
		http.Error(w, "Invalid contract result", http.StatusInternalServerError)
		return
	}

	successVal, _ := status["SuccessValue"].(string)
	if successVal != "" {
		decoded, _ := base64.StdEncoding.DecodeString(successVal)
		var grantInfo map[string]interface{}
		json.Unmarshal(decoded, &grantInfo)
		json.NewEncoder(w).Encode(map[string]interface{}{
			"success": true,
			"granted": grantInfo,
			"account": accountID,
		})
		return
	}

	http.Error(w, "Already granted or error: "+fmt.Sprint(result), http.StatusBadRequest)
}

func (h *Handler) AddTokensToConversationHandler(w http.ResponseWriter, r *http.Request) {
	req := struct {
		ConversationID string `json:"conversation_id"`
		Amount         string `json:"amount"`
	}{}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil || req.ConversationID == "" || req.Amount == "" {
		http.Error(w, "Missing conversation_id or amount", http.StatusBadRequest)
		return
	}

	result, err := h.NearClient.AddTokensToConversation(req.ConversationID, req.Amount)
	if err != nil {
		http.Error(w, "Failed to add tokens: "+err.Error(), http.StatusInternalServerError)
		return
	}

	status := extractSuccessValue(result)
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"result":  status,
	})
}

func (h *Handler) RefundTokensHandler(w http.ResponseWriter, r *http.Request) {
	req := struct {
		ConversationID string `json:"conversation_id"`
	}{}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil || req.ConversationID == "" {
		http.Error(w, "Missing conversation_id", http.StatusBadRequest)
		return
	}

	result, err := h.NearClient.RefundReservedTokens(req.ConversationID)
	if err != nil {
		http.Error(w, "Failed to refund tokens: "+err.Error(), http.StatusInternalServerError)
		return
	}

	status := extractSuccessValue(result)
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"result":  status,
	})
}

func extractSuccessValue(result map[string]interface{}) map[string]interface{} {
	status, ok := result["status"].(map[string]interface{})
	if !ok {
		return map[string]interface{}{"error": "missing status"}
	}
	successVal, ok := status["SuccessValue"].(string)
	if !ok || successVal == "" {
		return map[string]interface{}{"error": "empty success value"}
	}
	decoded, _ := base64.StdEncoding.DecodeString(successVal)
	var out map[string]interface{}
	json.Unmarshal(decoded, &out)
	return out
}

// DeductTokensFromConversationHandler lets the contract deduct tokens from a conversation
func (h *Handler) DeductTokensHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Only POST allowed", http.StatusMethodNotAllowed)
		return
	}

	req := struct {
		ConversationID string `json:"conversation_id"`
		Amount         string `json:"amount"`
		Timestamp      int64  `json:"timestamp"`
	}{}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil || req.ConversationID == "" || req.Amount == "" || req.Timestamp == 0 {
		http.Error(w, "Invalid JSON or missing fields", http.StatusBadRequest)
		return
	}

	// 🪵 Add simple logs
	fmt.Printf("[DeductTokens] Request received: ConversationID=%s | Amount=%s | Timestamp=%d\n", req.ConversationID, req.Amount, req.Timestamp)

	result, err := h.NearClient.DeductTokens(req.ConversationID, req.Amount, req.Timestamp)
	if err != nil {
		fmt.Printf("[DeductTokens] Error deducting tokens: %v\n", err)
		http.Error(w, "Failed to deduct tokens: "+err.Error(), http.StatusInternalServerError)
		return
	}

	statusMap, ok := result["status"].(map[string]interface{})
	if !ok {
		http.Error(w, "Invalid contract result: missing status", http.StatusInternalServerError)
		return
	}

	successVal, ok := statusMap["SuccessValue"].(string)
	if !ok || successVal == "" {
		http.Error(w, "Invalid contract result: no SuccessValue", http.StatusInternalServerError)
		return
	}

	decoded, err := base64.StdEncoding.DecodeString(successVal)
	if err != nil {
		http.Error(w, "Failed to decode contract response", http.StatusInternalServerError)
		return
	}

	var parsed map[string]interface{}
	if err := json.Unmarshal(decoded, &parsed); err != nil {
		http.Error(w, "Failed to parse JSON from contract", http.StatusInternalServerError)
		return
	}

	// 🪵 Log success
	fmt.Printf("[DeductTokens] Successfully deducted tokens for ConversationID=%s | New Used=%v | Remaining=%v\n",
		parsed["conversation_id"], parsed["new_used"], parsed["remaining"])

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success":         true,
		"conversation_id": parsed["conversation_id"],
		"new_used":        parsed["new_used"],
		"remaining":       parsed["remaining"],
	})
}
