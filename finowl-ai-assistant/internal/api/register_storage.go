package api

import (
	"encoding/base64"
	"encoding/json"
	"fmt"
	"net/http"
)

type RegisterStorageRequest struct {
	AccountID string `json:"account_id"`
}

func (h *Handler) RegisterStorageHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Only POST allowed", http.StatusMethodNotAllowed)
		return
	}

	var req RegisterStorageRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil || req.AccountID == "" {
		http.Error(w, "Invalid JSON or missing account_id", http.StatusBadRequest)
		return
	}

	result, err := h.NearClient.RegisterUserStorage(req.AccountID)
	if err != nil {
		http.Error(w, fmt.Sprintf("Failed to register storage: %v", err), http.StatusInternalServerError)
		return
	}

	// Extract base64 success from nested status
	status, ok := result["status"].(map[string]interface{})
	if !ok {
		http.Error(w, "Unexpected response structure (missing status)", http.StatusInternalServerError)
		return
	}

	if encoded, ok := status["SuccessValue"].(string); ok {
		data, err := base64.StdEncoding.DecodeString(encoded)
		if err == nil {
			var storageInfo map[string]string
			if err := json.Unmarshal(data, &storageInfo); err == nil {
				// Format and send nice response
				w.Header().Set("Content-Type", "application/json")
				json.NewEncoder(w).Encode(map[string]interface{}{
					"success":          true,
					"account_id":       req.AccountID,
					"storage_deposit":  "0.00125 NEAR",
					"storage_response": storageInfo,
				})
				return
			}
		}
	}

	// fallback: send full raw response
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success":    true,
		"account_id": req.AccountID,
		"raw_result": result,
	})
}
