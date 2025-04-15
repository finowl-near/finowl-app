package ai

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"
)

// Client is a client for AI API
type Client struct {
	APIKey   string
	Endpoint string
	Model    string
}

// NewClient creates a new AI API client with specific configuration
func NewClient(apiKey, endpoint, model string) *Client {
	return &Client{
		APIKey:   apiKey,
		Endpoint: endpoint,
		Model:    model,
	}
}

// GetCompletion sends a request to the AI API and returns the response
func (c *Client) GetCompletion(prompt string, model string, temperature float32, maxTokens int) (string, error) {
	if c.APIKey == "" {
		return "", fmt.Errorf("API key not set")
	}

	if c.Endpoint == "" {
		return "", fmt.Errorf("API endpoint not set")
	}

	if model == "" {
		model = c.Model
	}

	requestBody := map[string]interface{}{
		"model": model,
		"messages": []map[string]string{
			{
				"role":    "user",
				"content": prompt,
			},
		},
		"temperature": temperature,
		"max_tokens":  maxTokens,
	}

	jsonBody, err := json.Marshal(requestBody)
	if err != nil {
		return "", fmt.Errorf("failed to marshal request: %w", err)
	}

	req, err := http.NewRequest("POST", c.Endpoint, bytes.NewBuffer(jsonBody))
	if err != nil {
		return "", fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+c.APIKey)

	client := &http.Client{Timeout: 60 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return "", fmt.Errorf("API request failed: %w", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", fmt.Errorf("failed to read response body: %w", err)
	}

	if resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("API returned status %d: %s", resp.StatusCode, string(body))
	}

	var aiResp struct {
		Choices []struct {
			Message struct {
				Content string `json:"content"`
			} `json:"message"`
		} `json:"choices"`
	}

	if err := json.Unmarshal(body, &aiResp); err != nil {
		return "", fmt.Errorf("failed to decode response: %w", err)
	}

	if len(aiResp.Choices) == 0 {
		return "", fmt.Errorf("no choices in AI response")
	}

	return aiResp.Choices[0].Message.Content, nil
}
