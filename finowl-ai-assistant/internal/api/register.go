package api

import (
	"encoding/json"
	"net/http"
)

type RegisterRequest struct {
	AccountID string `json:"account_id"`
}

func (h *Handler) RegisterHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Only POST allowed", http.StatusMethodNotAllowed)
		return
	}

	var req RegisterRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil || req.AccountID == "" {
		http.Error(w, "Invalid request", http.StatusBadRequest)
		return
	}

	result, err := h.NearClient.RegisterAccount(req.AccountID)
	if err != nil {
		http.Error(w, "Registration failed: "+err.Error(), http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(result)
}
