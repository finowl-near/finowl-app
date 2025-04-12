package ai

import (
	"finowl-ai-assistant/pkg/feedstock"
	"os"
	"path/filepath"
	"testing"
	"time"
)

// TestMarketAnalyzer tests the market analyzer functionality
func TestMarketAnalyzer(t *testing.T) {
	// Create a mock AI client
	mockClient := NewMockClient()

	// Create a test prompts directory and file
	tmpDir := t.TempDir()
	promptsDir := filepath.Join(tmpDir, "prompts")
	err := os.MkdirAll(promptsDir, 0755)
	if err != nil {
		t.Fatalf("Failed to create test prompts directory: %v", err)
	}

	// Create a test prompt template
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

	// Create sample summaries
	summaries := []feedstock.Summary{
		{
			ID:        1,
			Timestamp: time.Now(),
			Content:   "Bitcoin surged past $50,000 today, marking a new high for the year.",
		},
		{
			ID:        2,
			Timestamp: time.Now().Add(-24 * time.Hour),
			Content:   "Ethereum development activity continues to increase ahead of upcoming scaling upgrades.",
		},
	}

	// Create market analyzer with custom prompts path
	analyzer := NewMarketAnalyzer(mockClient)
	analyzer.Configure(promptsDir, "test-model")

	// Test with a valid crypto question
	t.Run("Valid crypto question", func(t *testing.T) {
		response, err := analyzer.AnalyzeMarket(summaries, "Should I invest in Bitcoin or Ethereum?")
		if err != nil {
			t.Fatalf("AnalyzeMarket failed: %v", err)
		}

		// Verify the response
		if response.MarketSentiment != "Bullish" {
			t.Errorf("Expected Bullish sentiment, got %s", response.MarketSentiment)
		}

		if response.InvestmentDecision != "BUY" {
			t.Errorf("Expected BUY decision, got %s", response.InvestmentDecision)
		}

		if len(response.TopTokens) == 0 {
			t.Error("Expected top tokens, got none")
		} else {
			if response.TopTokens[0].Ticker != "$BTC" && response.TopTokens[0].Ticker != "$ETH" {
				t.Errorf("Expected either BTC or ETH as top token, got %s", response.TopTokens[0].Ticker)
			}
		}
	})

	// Test with a non-crypto question
	t.Run("Non-crypto question", func(t *testing.T) {
		_, err := analyzer.AnalyzeMarket(summaries, "What's the weather like today?")
		if err == nil {
			t.Fatal("Expected error for non-crypto question, got nil")
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

// TestCryptoQuestion tests the crypto question detection
func TestCryptoQuestion(t *testing.T) {
	tests := []struct {
		question string
		isCrypto bool
	}{
		{"Should I buy Bitcoin?", true},
		{"What do you think about Ethereum?", true},
		{"Is DeFi still a good investment?", true},
		{"How's the crypto market today?", true},
		{"What's the weather like?", false},
		{"How do I bake a cake?", false},
		{"Tell me about history", false},
	}

	for _, tt := range tests {
		t.Run(tt.question, func(t *testing.T) {
			result := isCryptoRelated(tt.question)
			if result != tt.isCrypto {
				t.Errorf("Question: %s, expected isCrypto: %v, got: %v",
					tt.question, tt.isCrypto, result)
			}
		})
	}
}
