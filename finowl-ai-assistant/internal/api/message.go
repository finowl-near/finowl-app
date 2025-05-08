package api

import (
	"encoding/base64"
	"encoding/json"
	"net/http"
)

type StoreMessageRequest struct {
	ConversationID string `json:"conversation_id"`
	Role           string `json:"role"`
	Content        string `json:"content"`
}

func (h *Handler) StoreMessageHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Only POST allowed", http.StatusMethodNotAllowed)
		return
	}

	var req StoreMessageRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil ||
		req.ConversationID == "" || req.Role == "" || req.Content == "" {
		http.Error(w, "Missing required fields", http.StatusBadRequest)
		return
	}

	result, err := h.NearClient.StoreMessage(req.ConversationID, req.Role, req.Content)
	if err != nil {
		http.Error(w, "Failed to store message: "+err.Error(), http.StatusInternalServerError)
		return
	}

	status, ok := result["status"].(map[string]interface{})
	if !ok {
		http.Error(w, "Invalid contract result", http.StatusInternalServerError)
		return
	}

	successVal, ok := status["SuccessValue"].(string)
	if !ok || successVal == "" {
		http.Error(w, "Missing SuccessValue in contract response", http.StatusInternalServerError)
		return
	}

	decoded, err := base64.StdEncoding.DecodeString(successVal)
	if err != nil {
		http.Error(w, "Failed to decode contract response", http.StatusInternalServerError)
		return
	}

	var parsed map[string]interface{}
	if err := json.Unmarshal(decoded, &parsed); err != nil {
		http.Error(w, "Failed to parse contract JSON", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"result":  parsed,
	})
}
