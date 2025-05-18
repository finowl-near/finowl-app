package handlers

import (
	"encoding/json"
	"log"
	"net/http"
	"strings"
)

// PreloadSessionHandler initializes a session with summaries for a given user_id
func (h *Handler) PreloadSessionHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	type preloadRequest struct {
		UserID string `json:"user_id"`
	}

	var req preloadRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil || strings.TrimSpace(req.UserID) == "" {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	h.sessionManager.StartSession(req.UserID, h.summaries)
	log.Printf("📦 Preloaded session for user: %s", req.UserID)

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(map[string]string{
		"status":  "ready",
		"message": "Session initialized for user " + req.UserID,
	})
}
