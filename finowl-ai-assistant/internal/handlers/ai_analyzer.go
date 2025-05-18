package handlers

import (
	"bytes"
	"context"
	"crypto/md5"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"strings"
	"time"

	"finowl-ai-assistant/pkg/ai"
	"finowl-ai-assistant/pkg/feedstock"
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

// AIAnalyzer handles market analysis requests and returns Markdown-formatted response
func (h *Handler) AIAnalyzer(w http.ResponseWriter, r *http.Request) {
	log.Printf("📝 Init AI analyzer")
	if r.Method != http.MethodPost {
		log.Printf("❌ [%s] Method not allowed: %s", r.RemoteAddr, r.Method)
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	question, err := decodeQuestion(r)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		log.Printf("❌ [%s] %v", r.RemoteAddr, err)
		return
	}

	reqID := fmt.Sprintf("%x", md5.Sum([]byte(time.Now().String()+question)))[:8]
	logRequest(reqID, "Question", question)
	logRequest(reqID, "Using summaries", fmt.Sprintf("%d", len(h.summaries)))

	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Minute)
	defer cancel()

	answerCh := make(chan string, 1)
	errCh := make(chan error, 1)

	go func() {
		answer, err := h.marketAnalyzer.AnalyzeMarketMarkdown(h.summaries, question)
		if err != nil {
			errCh <- err
			return
		}
		answerCh <- answer
	}()

	select {
	case answer := <-answerCh:
		w.Header().Set("Content-Type", "text/markdown; charset=utf-8")
		logRequest(reqID, "Response content", answer)
		log.Printf("📊 [REQ-%s] Response stats: %d chars, %d words", reqID, len(answer), len(strings.Fields(answer)))
		if _, err := w.Write([]byte(answer)); err != nil {
			log.Printf("❌ [REQ-%s] Failed writing response: %v", reqID, err)
		}
		log.Printf("✅ [REQ-%s] Successfully sent response", reqID)

	case err := <-errCh:
		log.Printf("❌ [REQ-%s] Analysis error: %v", reqID, err)
		http.Error(w, err.Error(), http.StatusInternalServerError)

	case <-ctx.Done():
		log.Printf("⏱️ [REQ-%s] Timeout after 5 minutes", reqID)
		http.Error(w, "Analysis timed out after 5 minutes", http.StatusGatewayTimeout)
	}
}

// HealthCheckHandler returns simple liveness probe
func (h *Handler) HealthCheckHandler(w http.ResponseWriter, r *http.Request) {
	_, _ = w.Write([]byte("OK"))
}

// decodeQuestion parses JSON from the request body and extracts the question
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

// logRequest is a helper to standardize request logs
func logRequest(reqID, label, msg string) {
	log.Printf("📝 [REQ-%s] %s: %s", reqID, label, msg)
}
