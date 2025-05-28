package ai

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"time"

	"finowl-ai-assistant/pkg/chat"
)

// ClaudeClient is a client for Claude API (Anthropic)
type ClaudeClient struct {
	APIKey   string
	Endpoint string
	Model    string
}

// NewClaudeClient creates a new Claude API client
func NewClaudeClient(apiKey, endpoint, model string) *ClaudeClient {
	return &ClaudeClient{
		APIKey:   apiKey,
		Endpoint: endpoint,
		Model:    model,
	}
}

// GetCompletion sends a request to Claude API
func (c *ClaudeClient) GetCompletion(prompt string, model string, temperature float32, maxTokens int) (string, error) {
	if c.APIKey == "" {
		return "", fmt.Errorf("Claude API key not set")
	}

	if model == "" {
		model = c.Model
	}

	log.Printf("🔍 [Claude] Sending request to model: %s", model)

	// Claude API format
	requestBody := map[string]interface{}{
		"model":       model,
		"max_tokens":  maxTokens,
		"temperature": temperature,
		"messages": []map[string]string{
			{
				"role":    "user",
				"content": prompt,
			},
		},
	}

	jsonBody, err := json.Marshal(requestBody)
	if err != nil {
		return "", fmt.Errorf("failed to marshal Claude request: %w", err)
	}

	req, err := http.NewRequest("POST", c.Endpoint, bytes.NewBuffer(jsonBody))
	if err != nil {
		return "", fmt.Errorf("failed to create Claude request: %w", err)
	}

	// Claude-specific headers
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("x-api-key", c.APIKey)
	req.Header.Set("anthropic-version", "2023-06-01")

	client := &http.Client{Timeout: 300 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return "", fmt.Errorf("Claude API request failed: %w", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", fmt.Errorf("failed to read Claude response: %w", err)
	}

	if resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("Claude API returned status %d: %s", resp.StatusCode, string(body))
	}

	// Claude response format
	var claudeResp struct {
		Content []struct {
			Text string `json:"text"`
		} `json:"content"`
	}

	if err := json.Unmarshal(body, &claudeResp); err != nil {
		return "", fmt.Errorf("failed to decode Claude response: %w", err)
	}

	if len(claudeResp.Content) == 0 {
		return "", fmt.Errorf("no content in Claude response")
	}

	return claudeResp.Content[0].Text, nil
}

// GetChatCompletion handles chat with Claude
func (c *ClaudeClient) GetChatCompletion(messages []chat.Message, model string, temperature float32, maxTokens int) (string, error) {
	if c.APIKey == "" {
		return "", fmt.Errorf("Claude API key not set")
	}

	if model == "" {
		model = c.Model
	}

	// Convert to Claude format
	var claudeMessages []map[string]string
	for _, m := range messages {
		claudeMessages = append(claudeMessages, map[string]string{
			"role":    m.Role,
			"content": m.Content,
		})
	}

	requestBody := map[string]interface{}{
		"model":       model,
		"max_tokens":  maxTokens,
		"temperature": temperature,
		"messages":    claudeMessages,
	}

	body, err := json.Marshal(requestBody)
	if err != nil {
		return "", fmt.Errorf("failed to marshal Claude chat request: %w", err)
	}

	req, err := http.NewRequest("POST", c.Endpoint, bytes.NewReader(body))
	if err != nil {
		return "", fmt.Errorf("failed to create Claude chat request: %w", err)
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("x-api-key", c.APIKey)
	req.Header.Set("anthropic-version", "2023-06-01")

	client := &http.Client{Timeout: 300 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return "", fmt.Errorf("Claude chat request failed: %w", err)
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", fmt.Errorf("failed to read Claude chat response: %w", err)
	}

	if resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("Claude chat API returned status %d: %s", resp.StatusCode, string(respBody))
	}

	var parsed struct {
		Content []struct {
			Text string `json:"text"`
		} `json:"content"`
	}

	if err := json.Unmarshal(respBody, &parsed); err != nil {
		return "", fmt.Errorf("failed to decode Claude chat response: %w", err)
	}

	if len(parsed.Content) == 0 {
		return "", fmt.Errorf("no content in Claude chat response")
	}

	return parsed.Content[0].Text, nil
}
