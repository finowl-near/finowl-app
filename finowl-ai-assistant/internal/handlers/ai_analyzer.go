package handlers

import (
	"encoding/json"
	"finowl-ai-assistant/pkg/ai"
	"finowl-ai-assistant/pkg/feedstock"
	"net/http"
	"strings"
)

// Handler contains dependencies needed by the HTTP handlers
type Handler struct {
	marketAnalyzer *ai.MarketAnalyzer
	summaries      []feedstock.Summary
}

// NewHandler creates a new HTTP handler
func NewHandler(marketAnalyzer *ai.MarketAnalyzer, summaries []feedstock.Summary) *Handler {
	return &Handler{
		marketAnalyzer: marketAnalyzer,
		summaries:      summaries,
	}
}

// AIAnalyzer handles market analysis requests
func (h *Handler) AIAnalyzer(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var request struct {
		Question string `json:"question"`
	}
	if err := json.NewDecoder(r.Body).Decode(&request); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	response, err := h.marketAnalyzer.AnalyzeMarket(h.summaries, request.Question)
	if err != nil {
		if strings.HasPrefix(err.Error(), "i specialize in") {
			http.Error(w, err.Error(), http.StatusBadRequest)
		} else {
			http.Error(w, err.Error(), http.StatusInternalServerError)
		}
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

// HealthCheckHandler handles health check requests
func (h *Handler) HealthCheckHandler(w http.ResponseWriter, r *http.Request) {
	w.Write([]byte("OK"))
}
