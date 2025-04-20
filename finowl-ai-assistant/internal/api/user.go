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

func (h *Handler) ListAllUsersHandler(w http.ResponseWriter, r *http.Request) {
	// Call view function to list all users
	result, err := h.NearClient.ViewFunction("view_js_func", map[string]interface{}{
		"function_name": "list_all_users",
	})
	if err != nil {
		http.Error(w, "Failed to call view function: "+err.Error(), http.StatusInternalServerError)
		return
	}

	// Convert result bytes to string
	resultBytes := result["result"].([]interface{})
	bytes := make([]byte, len(resultBytes))
	for i, v := range resultBytes {
		if num, ok := v.(float64); ok {
			bytes[i] = byte(num)
		} else if n, ok := v.(json.Number); ok {
			n64, _ := n.Int64()
			bytes[i] = byte(n64)
		}
	}

	var users []string
	if err := json.Unmarshal(bytes, &users); err != nil {
		http.Error(w, "Failed to parse user list: "+err.Error(), http.StatusInternalServerError)
		return
	}

	// Respond with the decoded list
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"users":   users,
	})
}
