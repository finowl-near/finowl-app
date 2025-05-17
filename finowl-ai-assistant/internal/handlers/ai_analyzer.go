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

// AIAnalyzer handles market analysis requests and now returns **Markdown**, not JSON.
func (h *Handler) AIAnalyzer(w http.ResponseWriter, r *http.Request) {
	log.Printf("📝 Init AI analyzer")
	if r.Method != http.MethodPost {
		log.Printf("❌ [%s] Method not allowed: %s", r.RemoteAddr, r.Method)
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// Read the request body so we can log it if needed
	body, err := io.ReadAll(r.Body)
	if err != nil {
		log.Printf("❌ [%s] Error reading request body: %v", r.RemoteAddr, err)
		http.Error(w, "Failed to read request body", http.StatusBadRequest)
		return
	}
	r.Body = io.NopCloser(bytes.NewBuffer(body))

	// Decode JSON {"question":"..."}
	var request struct {
		Question string `json:"question"`
	}
	if err := json.NewDecoder(r.Body).Decode(&request); err != nil {
		log.Printf("❌ [%s] Invalid request body: %v (Body: %s)", r.RemoteAddr, err, string(body))
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// Basic validation
	if strings.TrimSpace(request.Question) == "" {
		http.Error(w, "Question cannot be empty", http.StatusBadRequest)
		return
	}

	// ---- Metadata for logging ----
	reqID := fmt.Sprintf("%x", md5.Sum([]byte(time.Now().String()+request.Question)))[:8]
	log.Printf("📝 [REQ-%s] Question: %s", reqID, request.Question)
	log.Printf("📝 [REQ-%s] Using %d summaries", reqID, len(h.summaries))

	// Long‑running context (5 min)
	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Minute)
	defer cancel()

	// Run analysis concurrently
	answerCh := make(chan string, 1)
	errCh := make(chan error, 1)
	go func() {
		answer, err := h.marketAnalyzer.AnalyzeMarketMarkdown(h.summaries, request.Question)
		if err != nil {
			errCh <- err
			return
		}
		answerCh <- answer
	}()

	// Wait for result / error / timeout
	select {
	case answer := <-answerCh:
		w.Header().Set("Content-Type", "text/markdown; charset=utf-8")
		log.Printf("📝 [REQ-%s] Response content:\n%s", reqID, answer)
		log.Printf("📊 [REQ-%s] Response stats: %d chars, %d words", reqID, len(answer), len(strings.Fields(answer)))
		if _, err := w.Write([]byte(answer)); err != nil {
			log.Printf("❌ [REQ-%s] Failed writing response: %v", reqID, err)
		}
		log.Printf("✅ [REQ-%s] Successfully sent response", reqID)
		return

	case err := <-errCh:
		log.Printf("❌ [REQ-%s] Analysis error: %v", reqID, err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return

	case <-ctx.Done():
		log.Printf("⏱️ [REQ-%s] Timeout after 5 minutes", reqID)
		http.Error(w, "Analysis timed out after 5 minutes", http.StatusGatewayTimeout)
		return
	}
}

// HealthCheckHandler returns simple liveness probe
func (h *Handler) HealthCheckHandler(w http.ResponseWriter, r *http.Request) {
	_, _ = w.Write([]byte("OK"))
}
