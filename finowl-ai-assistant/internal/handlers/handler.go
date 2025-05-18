package handlers

import (
	"bytes"
	"encoding/json"
	"finowl-ai-assistant/pkg/ai"
	"finowl-ai-assistant/pkg/feedstock"
	"fmt"
	"io"
	"log"
	"net/http"
	"strings"
)

// Handler aggregates all dependencies for public HTTP endpoints
type Handler struct {
	marketAnalyzer *ai.MarketAnalyzer
	summaries      []feedstock.Summary
	marketChatter  *ai.MarketChatter
}

// NewHandler initializes a full-featured handler
func NewHandler(
	marketAnalyzer *ai.MarketAnalyzer,
	summaries []feedstock.Summary,
	marketChatter *ai.MarketChatter,

) *Handler {
	return &Handler{
		marketAnalyzer: marketAnalyzer,
		summaries:      summaries,
		marketChatter:  marketChatter,
	}
}

// decodeQuestion parses a POST body and extracts the `question` field
func decodeQuestion(r *http.Request) (string, error) {
	var request struct {
		Question string `json:"question"`
	}
	body, err := io.ReadAll(r.Body)
	if err != nil {
		return "", fmt.Errorf("error reading request body: %w", err)
	}
	r.Body = io.NopCloser(bytes.NewBuffer(body))

	if err := json.NewDecoder(r.Body).Decode(&request); err != nil {
		return "", fmt.Errorf("invalid request body: %w", err)
	}
	if strings.TrimSpace(request.Question) == "" {
		return "", fmt.Errorf("question cannot be empty")
	}
	return request.Question, nil
}

// logRequest formats logs with a consistent request ID
func logRequest(reqID, label, msg string) {
	log.Printf("📝 [REQ-%s] %s: %s", reqID, label, msg)
}
