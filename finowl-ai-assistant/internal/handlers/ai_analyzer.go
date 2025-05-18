package handlers

import (
	"context"
	"crypto/md5"
	"fmt"
	"log"
	"net/http"
	"strings"
	"time"
)

// analysisTimeout defines the max time allowed for market analysis
const analysisTimeout = 5 * time.Minute

// AIAnalyzer handles POST /analyze and returns markdown
func (h *Handler) AIAnalyzer(w http.ResponseWriter, r *http.Request) {
	log.Println("📝 Init AI analyzer")

	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		log.Printf("❌ [%s] Method not allowed: %s", r.RemoteAddr, r.Method)
		return
	}

	question, err := decodeQuestion(r)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		log.Printf("❌ [%s] Decode error: %v", r.RemoteAddr, err)
		return
	}

	reqID := fmt.Sprintf("%x", md5.Sum([]byte(time.Now().String()+question)))[:8]
	logRequest(reqID, "Question", question)
	logRequest(reqID, "Using summaries", fmt.Sprintf("%d", len(h.summaries)))

	ctx, cancel := context.WithTimeout(r.Context(), analysisTimeout)
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
		_, _ = w.Write([]byte(answer))

	case err := <-errCh:
		log.Printf("❌ [REQ-%s] Analysis error: %v", reqID, err)
		http.Error(w, err.Error(), http.StatusInternalServerError)

	case <-ctx.Done():
		log.Printf("⏱️ [REQ-%s] Timeout after 5 minutes", reqID)
		http.Error(w, "Analysis timed out after 5 minutes", http.StatusGatewayTimeout)
	}
}

// HealthCheckHandler returns a simple OK status
func (h *Handler) HealthCheckHandler(w http.ResponseWriter, r *http.Request) {
	_, _ = w.Write([]byte("OK"))
}
