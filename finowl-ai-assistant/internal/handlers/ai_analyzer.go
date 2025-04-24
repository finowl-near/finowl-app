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

// AIAnalyzer handles market analysis requests
func (h *Handler) AIAnalyzer(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		log.Printf("❌ [%s] Method not allowed: %s", r.RemoteAddr, r.Method)
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// Read the request body completely into a variable so we can log it if needed
	body, err := io.ReadAll(r.Body)
	if err != nil {
		log.Printf("❌ [%s] Error reading request body: %v", r.RemoteAddr, err)
		http.Error(w, "Failed to read request body", http.StatusBadRequest)
		return
	}

	// Replace the body so it can be read again by json.Decoder
	r.Body = io.NopCloser(bytes.NewBuffer(body))

	var request struct {
		Question string `json:"question"`
	}
	if err := json.NewDecoder(r.Body).Decode(&request); err != nil {
		log.Printf("❌ [%s] Invalid request body: %v (Body was: %s)", r.RemoteAddr, err, string(body))
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	reqID := fmt.Sprintf("%x", md5.Sum([]byte(time.Now().String()+request.Question)))[:8]
	clientIP := r.RemoteAddr
	userAgent := r.UserAgent()

	log.Printf("📝 [REQ-%s] New analysis request from %s (%s)", reqID, clientIP, userAgent)
	log.Printf("📝 [REQ-%s] Question: %s", reqID, request.Question)
	log.Printf("📝 [REQ-%s] Using %d summaries for analysis", reqID, len(h.summaries))

	// Check if question is empty
	if strings.TrimSpace(request.Question) == "" {
		log.Printf("❌ [REQ-%s] Empty question received", reqID)
		http.Error(w, "Question cannot be empty", http.StatusBadRequest)
		return
	}

	// Additional request info for debugging
	log.Printf("📝 [REQ-%s] Request headers: %v", reqID, r.Header)

	if len(h.summaries) > 0 {
		log.Printf("📝 [REQ-%s] Summary IDs: %v", reqID, summarizeIDs(h.summaries))
		log.Printf("📝 [REQ-%s] Latest summary timestamp: %s", reqID, h.summaries[0].Timestamp.Format(time.RFC3339))
	} else {
		log.Printf("⚠️ [REQ-%s] No summaries available for analysis!", reqID)
	}

	// Set a longer timeout context (5 minutes)
	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Minute)
	defer cancel()

	startTime := time.Now()

	// Create a response channel
	responseCh := make(chan *ai.MarketAnalysisResponse, 1)
	errCh := make(chan error, 1)

	// Run analysis in a goroutine
	go func() {
		log.Printf("🔍 [REQ-%s] Starting market analysis...", reqID)
		response, err := h.marketAnalyzer.AnalyzeMarket(h.summaries, request.Question)
		if err != nil {
			log.Printf("❌ [REQ-%s] Analysis failed: %v", reqID, err)
			errCh <- err
			return
		}
		log.Printf("✅ [REQ-%s] Analysis completed successfully in %v", reqID, time.Since(startTime))
		responseCh <- response
	}()

	// Wait for analysis or timeout
	select {
	case response := <-responseCh:
		// Success, send the response
		w.Header().Set("Content-Type", "application/json")
		if err := json.NewEncoder(w).Encode(response); err != nil {
			log.Printf("❌ [REQ-%s] Error encoding response: %v", reqID, err)
			http.Error(w, "Error encoding response", http.StatusInternalServerError)
		} else {
			// Log the response summary
			log.Printf("✅ [REQ-%s] Response: sentiment=%s, decision=%s",
				reqID, response.MarketSentiment, response.InvestmentDecision)
			log.Printf("✅ [REQ-%s] Top tokens: %s",
				reqID, formatTopTokens(response.TopTokens))
			log.Printf("✅ [REQ-%s] Total processing time: %v", reqID, time.Since(startTime))
		}
		return

	case err := <-errCh:
		// Error from analysis
		log.Printf("❌ [REQ-%s] Analysis error: %v", reqID, err)
		if strings.HasPrefix(err.Error(), "i specialize in") {
			http.Error(w, err.Error(), http.StatusBadRequest)
		} else {
			http.Error(w, err.Error(), http.StatusInternalServerError)
		}
		return

	case <-ctx.Done():
		// Timeout
		log.Printf("⏱️ [REQ-%s] Timeout occurred after %v", reqID, time.Since(startTime))
		http.Error(w, "Analysis timed out after 5 minutes", http.StatusGatewayTimeout)
		return
	}
}

// Helper function to format summaries for logging
func summarizeIDs(summaries []feedstock.Summary) string {
	if len(summaries) == 0 {
		return "[]"
	}

	ids := make([]string, 0, len(summaries))
	for _, s := range summaries {
		ids = append(ids, fmt.Sprintf("%d", s.ID))
	}

	if len(ids) <= 5 {
		return "[" + strings.Join(ids, ", ") + "]"
	}

	return fmt.Sprintf("[%s, ... %d more]", strings.Join(ids[:5], ", "), len(ids)-5)
}

// Helper function to format tokens for logging
func formatTopTokens(tokens []ai.Token) string {
	if len(tokens) == 0 {
		return "none"
	}

	tokenStrs := make([]string, 0, len(tokens))
	for _, t := range tokens {
		tokenStrs = append(tokenStrs, t.Ticker)
	}

	return strings.Join(tokenStrs, ", ")
}

// HealthCheckHandler handles health check requests
func (h *Handler) HealthCheckHandler(w http.ResponseWriter, r *http.Request) {
	w.Write([]byte("OK"))
}
