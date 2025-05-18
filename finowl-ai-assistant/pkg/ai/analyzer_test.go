package ai

import (
	"finowl-ai-assistant/pkg/feedstock"
	"os"
	"path/filepath"
	"strings"
	"testing"
	"time"
)

// MockClientWithErrorResponse simulates markdown response with model-level error
type MockClientWithErrorResponse struct{}

func (m *MockClientWithErrorResponse) GetCompletion(prompt string, model string, temperature float32, maxTokens int) (string, error) {
	return "**Error:** simulated AI error", nil
}

// TestMarketAnalyzer tests the market analyzer functionality
func TestMarketAnalyzer(t *testing.T) {
	mockClient := NewMockClient()
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

Please respond with a JSON object containing the following fields:
- market_sentiment: "Bullish", "Bearish", or "Neutral"
- investment_decision: "BUY", "SELL", or "HOLD"
- justification: A brief explanation of your recommendation
- top_tokens: An array of up to 5 token objects with fields:
  - rank: (1-5)
  - ticker: Symbol with $ prefix
  - reason: Brief explanation why this token is recommended
`

	err = os.WriteFile(filepath.Join(promptsDir, "market_analysis.txt"), []byte(promptTemplate), 0644)
	if err != nil {
		t.Fatalf("Failed to create test prompt file: %v", err)
	}

	summaries := []feedstock.Summary{
		{
			ID:        1,
			Timestamp: time.Now(),
			Content:   "Bitcoin surged past $50,000 today.",
		},
		{
			ID:        2,
			Timestamp: time.Now().Add(-24 * time.Hour),
			Content:   "Ethereum activity is growing.",
		},
	}

	analyzer := NewMarketAnalyzer(mockClient)
	analyzer.Configure(promptsDir, "test-model")

	t.Run("Valid crypto question", func(t *testing.T) {
		response, err := analyzer.AnalyzeMarket(summaries, "Should I invest in Bitcoin or Ethereum?")
		if err != nil {
			t.Fatalf("AnalyzeMarket failed: %v", err)
		}
		if response.MarketSentiment != "Bullish" {
			t.Errorf("Expected Bullish sentiment, got %s", response.MarketSentiment)
		}
		if response.InvestmentDecision != "BUY" {
			t.Errorf("Expected BUY decision, got %s", response.InvestmentDecision)
		}
		if len(response.TopTokens) == 0 {
			t.Error("Expected top tokens, got none")
		}
	})

	t.Run("AnalyzeMarket with empty summaries", func(t *testing.T) {
		_, err := analyzer.AnalyzeMarket([]feedstock.Summary{}, "What now?")
		if err == nil || !strings.Contains(err.Error(), "no market data") {
			t.Errorf("Expected error for empty summaries, got: %v", err)
		}
	})

	t.Run("AnalyzeMarketMarkdown success", func(t *testing.T) {
		md, err := analyzer.AnalyzeMarketMarkdown(summaries, "Should I hold BTC?")
		if err != nil {
			t.Fatalf("Expected markdown, got error: %v", err)
		}
		if !strings.Contains(md, "BTC") {
			t.Errorf("Expected markdown to mention BTC, got: %s", md)
		}
	})

	t.Run("AnalyzeMarketMarkdown model error prefix", func(t *testing.T) {
		errorClient := &MockClientWithErrorResponse{}
		errAnalyzer := NewMarketAnalyzer(errorClient)
		errAnalyzer.Configure(promptsDir, "test-model")

		_, err := errAnalyzer.AnalyzeMarketMarkdown(summaries, "Trigger error")
		if err == nil || !strings.Contains(err.Error(), "simulated AI error") {
			t.Errorf("Expected simulated AI error, got: %v", err)
		}
	})

	t.Run("buildPrompt with missing template file", func(t *testing.T) {
		missingAnalyzer := NewMarketAnalyzer(mockClient)
		missingAnalyzer.Configure(filepath.Join(tmpDir, "missing"), "test-model")

		_, err := missingAnalyzer.AnalyzeMarket(summaries, "Will BTC pump?")
		if err == nil || !strings.Contains(err.Error(), "failed to read prompt template") {
			t.Errorf("Expected missing template error, got: %v", err)
		}
	})
}

// TestJsonExtraction tests the JSON extraction functionality
func TestJsonExtraction(t *testing.T) {
	tests := []struct {
		name     string
		input    string
		expected string
		isValid  bool
	}{
		{
			name:     "Pure JSON",
			input:    `{"market_sentiment":"Bullish","investment_decision":"BUY"}`,
			expected: `{"market_sentiment":"Bullish","investment_decision":"BUY"}`,
			isValid:  true,
		},
		{
			name: "JSON in markdown",
			input: "Here's my analysis:\n\n```json\n" +
				`{"market_sentiment":"Bearish","investment_decision":"SELL"}` +
				"\n```\n\nHope this helps!",
			expected: `{"market_sentiment":"Bearish","investment_decision":"SELL"}`,
			isValid:  true,
		},
		{
			name: "JSON embedded in text",
			input: "Based on my analysis, I recommend: " +
				`{"market_sentiment":"Neutral","investment_decision":"HOLD"}` +
				" as the best strategy.",
			expected: `{"market_sentiment":"Neutral","investment_decision":"HOLD"}`,
			isValid:  true,
		},
		{
			name:     "No JSON",
			input:    "There's no JSON here, just plain text.",
			expected: "",
			isValid:  false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := extractJSON(tt.input)
			if tt.isValid && result == "" {
				t.Errorf("Expected to extract JSON, but got empty string")
			}
			if !tt.isValid && result != "" {
				t.Errorf("Expected no JSON to be found, but got: %s", result)
			}
			if tt.isValid && result != tt.expected {
				t.Errorf("Expected: %s, got: %s", tt.expected, result)
			}
		})
	}
}
