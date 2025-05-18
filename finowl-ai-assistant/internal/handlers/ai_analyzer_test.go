package handlers

import (
	"bytes"
	"encoding/json"
	"finowl-ai-assistant/pkg/ai"
	"finowl-ai-assistant/pkg/chat"
	"finowl-ai-assistant/pkg/feedstock"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"testing"
	"time"
)

// mockAIClient implements ai.AIClient
type mockAIClient struct{}

// Mock GetCompletion always returns a valid markdown answer
func (m *mockAIClient) GetCompletion(prompt string, model string, temperature float32, maxTokens int) (string, error) {
	return "# Mocked AI Response\n\nMarket is volatile today with BTC leading gains.", nil
}

// GetChatCompletion returns a mock assistant reply using message history
func (m *mockAIClient) GetChatCompletion(messages []chat.Message, model string, temperature float32, maxTokens int) (string, error) {
	return "Sure, let's dive into your question based on the latest market summaries.", nil
}

func TestAIAnalyzer_Success(t *testing.T) {
	// Create a mock AI client that returns a fixed markdown response
	mockClient := &mockAIClient{}

	// Step 1: Create a temporary prompts directory and file
	tmpDir := t.TempDir()
	promptsDir := filepath.Join(tmpDir, "prompts")
	err := os.MkdirAll(promptsDir, 0755)
	if err != nil {
		t.Fatalf("Failed to create test prompts directory: %v", err)
	}

	promptTemplate := `Analyze the following market summaries and answer the question.

SUMMARIES:
{{SUMMARIES}}

QUESTION:
{{QUESTION}}

Respond in Markdown format.`

	err = os.WriteFile(filepath.Join(promptsDir, "market_analysis.txt"), []byte(promptTemplate), 0644)
	if err != nil {
		t.Fatalf("Failed to create test prompt file: %v", err)
	}

	// Step 2: Create the analyzer and inject the temp prompt path
	analyzer := ai.NewMarketAnalyzer(mockClient)
	analyzer.Configure(promptsDir, "mock-model")

	// Step 3: Set up the HTTP handler with mock summary
	summaries := []feedstock.Summary{
		{
			Timestamp: time.Now(),
			Content:   "BTC is up 5% today.",
		},
	}
	handler := NewHandler(analyzer, summaries, nil)

	// Step 4: Build request and response
	body, _ := json.Marshal(map[string]string{
		"question": "What's happening in the crypto market?",
	})
	req := httptest.NewRequest(http.MethodPost, "/analyze", bytes.NewReader(body))
	w := httptest.NewRecorder()

	// Step 5: Call the handler
	handler.AIAnalyzer(w, req)

	resp := w.Result()
	if resp.StatusCode != http.StatusOK {
		t.Fatalf("Expected status 200 OK, got %d", resp.StatusCode)
	}
}

func TestAIAnalyzer_EmptyQuestion(t *testing.T) {
	mockClient := &mockAIClient{}
	marketAnalyzer := ai.NewMarketAnalyzer(mockClient)
	handler := NewHandler(marketAnalyzer, []feedstock.Summary{}, nil)

	body, _ := json.Marshal(map[string]string{
		"question": "  ",
	})

	req := httptest.NewRequest(http.MethodPost, "/analyze", bytes.NewReader(body))
	w := httptest.NewRecorder()

	handler.AIAnalyzer(w, req)

	if w.Result().StatusCode != http.StatusBadRequest {
		t.Errorf("Expected 400 Bad Request for empty question")
	}
}

func TestAIAnalyzer_MethodNotAllowed(t *testing.T) {
	handler := NewHandler(nil, nil, nil)
	req := httptest.NewRequest(http.MethodGet, "/analyze", nil)
	w := httptest.NewRecorder()

	handler.AIAnalyzer(w, req)

	if w.Result().StatusCode != http.StatusMethodNotAllowed {
		t.Errorf("Expected 405 Method Not Allowed, got %d", w.Result().StatusCode)
	}
}
