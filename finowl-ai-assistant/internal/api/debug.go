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

// ClearSession wipes a user's session
func (h *DebugHandler) ClearSession(w http.ResponseWriter, r *http.Request) {
	var req struct {
		UserID string `json:"user_id"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil || strings.TrimSpace(req.UserID) == "" {
		http.Error(w, "Invalid or missing user_id", http.StatusBadRequest)
		return
	}

	h.SessionManager.Clear(req.UserID)
	w.WriteHeader(http.StatusOK)
	_, _ = w.Write([]byte("session cleared"))
}

// ListActiveSessions returns all user IDs with active sessions
func (h *DebugHandler) ListActiveSessions(w http.ResponseWriter, r *http.Request) {
	h.SessionManager.Mutex().RLock()
	defer h.SessionManager.Mutex().RUnlock()

	ids := make([]string, 0, len(h.SessionManager.Sessions()))
	for userID := range h.SessionManager.Sessions() {
		ids = append(ids, userID)
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(ids)
}
