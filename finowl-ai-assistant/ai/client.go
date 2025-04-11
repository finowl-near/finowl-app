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
	httpClient *http.Client
	apiKey     string
	endpoint   string
}

// NewClient creates a new AI API client
func NewClient(apiKey, endpoint string) *Client {
	return &Client{
		httpClient: &http.Client{
			Timeout: 60 * time.Second,
		},
		apiKey:   apiKey,
		endpoint: endpoint,
	}
}

// Message represents a message in a conversation
type Message struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

// CompletionRequest represents the request to the AI API
type CompletionRequest struct {
	Model       string    `json:"model"`
	Messages    []Message `json:"messages"`
	Temperature float32   `json:"temperature"`
	MaxTokens   int       `json:"max_tokens"`
}

// CompletionResponse represents the response from the AI API
type CompletionResponse struct {
	Choices []struct {
		Message struct {
			Content string `json:"content"`
		} `json:"message"`
	} `json:"choices"`
}

// GetCompletion sends a request to the AI API and returns the response
func (c *Client) GetCompletion(prompt string, model string, temperature float32, maxTokens int) (string, error) {
	requestBody := CompletionRequest{
		Model: model,
		Messages: []Message{
			{
				Role:    "user",
				Content: prompt,
			},
		},
		Temperature: temperature,
		MaxTokens:   maxTokens,
	}

	jsonBody, err := json.Marshal(requestBody)
	if err != nil {
		return "", fmt.Errorf("failed to marshal request: %w", err)
	}

	req, err := http.NewRequest("POST", c.endpoint, bytes.NewBuffer(jsonBody))
	if err != nil {
		return "", fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+c.apiKey)

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return "", fmt.Errorf("API request failed: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return "", fmt.Errorf("API returned status %d: %s", resp.StatusCode, string(body))
	}

	var aiResp CompletionResponse
	if err := json.NewDecoder(resp.Body).Decode(&aiResp); err != nil {
		return "", fmt.Errorf("failed to decode response: %w", err)
	}

	if len(aiResp.Choices) == 0 {
		return "", fmt.Errorf("no choices in AI response")
	}

	return aiResp.Choices[0].Message.Content, nil
}
