package handlers

import (
	"crypto/md5"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strings"
	"time"

	"finowl-ai-assistant/internal/session"
	"finowl-ai-assistant/pkg/ai"
	"finowl-ai-assistant/pkg/chat"
)

type AskHandler struct {
	SessionManager *session.ChatSessionManager
	AIClient       ai.AIClient
	Model          string
}

type askRequest struct {
	UserID   string `json:"user_id"`
	Question string `json:"question"`
}

type askResponse struct {
	Reply string `json:"reply"`
}

func (h *Handler) MarketChatter() *ai.MarketChatter {
	return h.marketChatter
}

func (h *Handler) AIMarketChat(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req struct {
		UserID   string `json:"user_id"`
		Question string `json:"question"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}
	if strings.TrimSpace(req.UserID) == "" || strings.TrimSpace(req.Question) == "" {
		http.Error(w, "Both user_id and question are required", http.StatusBadRequest)
		return
	}

	reqID := fmt.Sprintf("%x", md5.Sum([]byte(time.Now().String()+req.UserID+req.Question)))[:8]
	log.Printf("💬 [CHAT-%s] New chat request from %s", reqID, req.UserID)
	log.Printf("💬 [CHAT-%s] Question: %s", reqID, req.Question)

	answer, err := h.marketChatter.Chat(req.UserID, req.Question)
	if err != nil {
		log.Printf("❌ [CHAT-%s] Chat error: %v", reqID, err)
		http.Error(w, "Failed to process chat request", http.StatusInternalServerError)
		return
	}

	resp := map[string]string{"reply": answer}
	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(resp); err != nil {
		log.Printf("❌ [CHAT-%s] Failed to send response: %v", reqID, err)
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return
	}

	log.Printf("✅ [CHAT-%s] Responded successfully", reqID)
}
func (h *AskHandler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req askRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil || req.UserID == "" || req.Question == "" {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// Retrieve full history and summaries
	history := h.SessionManager.GetMessages(req.UserID)
	summaries := h.SessionManager.GetSummaries(req.UserID)
	if summaries == nil {
		http.Error(w, "No session found for user", http.StatusNotFound)
		return
	}

	// Add current user question to message history
	messages := append(history, chat.Message{
		Role:    "user",
		Content: req.Question,
	})

	// Call AI
	reply, err := h.AIClient.GetChatCompletion(messages, h.Model, 0.1, 1000)
	if err != nil {
		http.Error(w, "AI error: "+err.Error(), http.StatusInternalServerError)
		return
	}

	// Store assistant reply
	h.SessionManager.AddMessage(req.UserID, "user", req.Question)
	h.SessionManager.AddMessage(req.UserID, "assistant", reply)

	resp := askResponse{Reply: reply}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(resp)
}
