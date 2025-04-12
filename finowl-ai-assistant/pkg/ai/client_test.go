package ai

import (
	"encoding/json"
	"testing"
)

func TestNewClient(t *testing.T) {
	// Test creating a client with valid parameters
	client := NewClient("test-api-key", "https://api.example.com", "test-model")

	if client.APIKey != "test-api-key" {
		t.Errorf("Expected API key to be 'test-api-key', got '%s'", client.APIKey)
	}

	if client.Endpoint != "https://api.example.com" {
		t.Errorf("Expected endpoint to be 'https://api.example.com', got '%s'", client.Endpoint)
	}

	if client.Model != "test-model" {
		t.Errorf("Expected model to be 'test-model', got '%s'", client.Model)
	}
}

func TestMockClient(t *testing.T) {
	// Create a mock client
	mockClient := NewMockClient()

	// Test that it implements the AIClient interface
	var _ AIClient = mockClient

	// Test that it returns expected mock responses
	response, err := mockClient.GetCompletion("Test prompt", "test-model", 0.7, 100)
	if err != nil {
		t.Fatalf("Expected no error, got %v", err)
	}

	if response == "" {
		t.Error("Expected non-empty response, got empty string")
	}

	// The mock should return a JSON with certain fields
	jsonContent := extractJSON(response)
	if jsonContent == "" {
		t.Fatalf("Expected valid JSON response, got: %s", response)
	}

	// Parse the response
	var marketResponse MarketAnalysisResponse
	if err := parseJSON(jsonContent, &marketResponse); err != nil {
		t.Fatalf("Failed to parse mock response: %v", err)
	}

	// Verify the mock response structure
	if marketResponse.MarketSentiment == "" {
		t.Error("Expected market sentiment to be non-empty")
	}

	if marketResponse.InvestmentDecision == "" {
		t.Error("Expected investment decision to be non-empty")
	}

	if marketResponse.Justification == "" {
		t.Error("Expected justification to be non-empty")
	}

	if len(marketResponse.TopTokens) == 0 {
		t.Error("Expected top tokens to be non-empty")
	}
}

// Helper function to parse JSON (for testing)
func parseJSON(jsonStr string, v interface{}) error {
	return json.Unmarshal([]byte(jsonStr), v)
}
