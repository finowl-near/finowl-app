package api

import (
	"encoding/base64"
	"encoding/json"
	"finowl-ai-assistant/pkg/near"
	"fmt"
	"net/http"
)

func (h *Handler) GrantFreeTokensHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Only POST allowed", http.StatusMethodNotAllowed)
		return
	}

	// Call the contract
	result, err := h.NearClient.GrantFreeTokens()
	if err != nil {
		http.Error(w, "Failed to grant tokens: "+err.Error(), http.StatusInternalServerError)
		return
	}

	// Try to decode success value
	status, ok := result["status"].(map[string]interface{})
	if !ok {
		http.Error(w, "Invalid contract result format (missing status)", http.StatusInternalServerError)
		return
	}

	// Check if success or failure
	if successVal, ok := status["SuccessValue"].(string); ok && successVal != "" {
		decoded, err := base64.StdEncoding.DecodeString(successVal)
		if err != nil {
			http.Error(w, "Failed to decode base64 contract response", http.StatusInternalServerError)
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
			"granted": parsed,
		})
		return
	}

	// Handle known contract failure (already granted)
	if failure, ok := status["Failure"]; ok {
		errorMsg := near.ExtractContractError(failure)
		http.Error(w, fmt.Sprintf("Already granted or error: %s", errorMsg), http.StatusBadRequest)
		return
	}

	// Fallback
	http.Error(w, "Unknown response from contract", http.StatusInternalServerError)
}
