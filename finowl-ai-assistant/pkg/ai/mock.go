package ai

import (
	"encoding/json"
	"fmt"
)

// MockClient implements a mock AI client for testing
type MockClient struct {
	// No real API connection needed
}

// NewMockClient creates a new mock AI client
func NewMockClient() *MockClient {
	return &MockClient{}
}

// GetCompletion returns a mock response for testing
func (c *MockClient) GetCompletion(prompt string, model string, temperature float32, maxTokens int) (string, error) {
	fmt.Println("Using mock AI client")
	fmt.Printf("Prompt: %s\n", prompt)

	// Create a realistic-looking mock response
	response := map[string]interface{}{
		"market_sentiment":    "Bullish",
		"investment_decision": "BUY",
		"justification":       "Recent positive market trends and increasing institutional adoption suggest upward momentum for crypto assets.",
		"top_tokens": []map[string]interface{}{
			{
				"rank":   1,
				"ticker": "$BTC",
				"reason": "Strong technical indicators showing potential breakout above key resistance levels.",
			},
			{
				"rank":   2,
				"ticker": "$ETH",
				"reason": "Successful merge to Proof of Stake and increased developer activity on the platform.",
			},
			{
				"rank":   3,
				"ticker": "$BNB",
				"reason": "Solid ecosystem growth and strong financial position of Binance.",
			},
			{
				"rank":   4,
				"ticker": "$SOL",
				"reason": "Recovery from recent lows and increased dApp development activity.",
			},
			{
				"rank":   5,
				"ticker": "$MATIC",
				"reason": "Growing adoption for layer-2 scaling solutions and partnerships with major brands.",
			},
		},
	}

	// Convert to JSON string
	jsonResponse, err := json.Marshal(response)
	if err != nil {
		return "", fmt.Errorf("failed to create mock response: %w", err)
	}

	return string(jsonResponse), nil
}
