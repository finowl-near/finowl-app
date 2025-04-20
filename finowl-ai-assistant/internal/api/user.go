package api

import (
	"encoding/json"
	"net/http"
)

func (h *Handler) CheckUserStatusHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Only POST allowed", http.StatusMethodNotAllowed)
		return
	}

	// Smart contract uses signer, so input body is not needed anymore
	status, err := h.NearClient.CheckUserStatus()
	if err != nil {
		http.Error(w, "Failed to check user status: "+err.Error(), http.StatusInternalServerError)
		return
	}

	// Respond to client
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"status":  status,
	})
}
