package ai

import (
	"encoding/json"
	"testing"
)

func TestMockClientResponse(t *testing.T) {
	client := NewMockClient()

	// Test with various prompts to ensure consistent responses
	prompts := []string{
		"Should I invest in Bitcoin?",
		"What's the market outlook for next week?",
		"Is Ethereum a good investment?",
	}

	for _, prompt := range prompts {
		response, err := client.GetCompletion(prompt, "any-model", 0.5, 100)
		if err != nil {
			t.Fatalf("Mock client returned error: %v", err)
		}

		// Verify we can parse the response as JSON
		var data map[string]interface{}
		err = json.Unmarshal([]byte(response), &data)
		if err != nil {
			t.Fatalf("Invalid JSON in mock response: %v", err)
		}

		// Check required fields
		requiredFields := []string{
			"market_sentiment",
			"investment_decision",
			"justification",
			"top_tokens",
		}

		for _, field := range requiredFields {
			if _, exists := data[field]; !exists {
				t.Errorf("Required field '%s' missing from mock response", field)
			}
		}

		// Check top tokens structure
		topTokens, ok := data["top_tokens"].([]interface{})
		if !ok {
			t.Fatalf("top_tokens is not an array")
		}

		if len(topTokens) == 0 {
			t.Error("top_tokens array is empty")
		}

		// Check first token structure
		if len(topTokens) > 0 {
			token, ok := topTokens[0].(map[string]interface{})
			if !ok {
				t.Fatalf("First token is not an object")
			}

			tokenFields := []string{"rank", "ticker", "reason"}
			for _, field := range tokenFields {
				if _, exists := token[field]; !exists {
					t.Errorf("Required token field '%s' missing", field)
				}
			}
		}
	}
}
