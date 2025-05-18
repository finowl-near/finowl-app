package api

import (
	"encoding/json"
	"net/http"
	"strings"

	"finowl-ai-assistant/internal/session"
)

// DebugHandler exposes session inspection and control endpoints
type DebugHandler struct {
	SessionManager *session.ChatSessionManager
}

// NewDebugHandler creates a debug handler with access to the session manager
func NewDebugHandler(sm *session.ChatSessionManager) *DebugHandler {
	return &DebugHandler{SessionManager: sm}
}

// GetSessionState returns full session state for a given user
func (h *DebugHandler) GetSessionState(w http.ResponseWriter, r *http.Request) {
	userID := r.URL.Query().Get("user_id")
	if strings.TrimSpace(userID) == "" {
		http.Error(w, "Missing user_id", http.StatusBadRequest)
		return
	}

	summaries := h.SessionManager.GetSummaries(userID)
	messages := h.SessionManager.GetMessages(userID)

	resp := map[string]interface{}{
		"user_id":   userID,
		"summaries": summaries,
		"messages":  messages,
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(resp)
}
