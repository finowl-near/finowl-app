package ai

import (
	"bytes"
	"crypto/md5"
	"encoding/json"
	"errors"
	"finowl-ai-assistant/pkg/chat"
	"fmt"
	"io"
	"log"
	"net/http"
	"strings"
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

	// Generate a short request ID for logging
	reqID := fmt.Sprintf("%x", md5.Sum([]byte(time.Now().String()+prompt[:min(20, len(prompt))])))[:8]

	promptWords := countWords(prompt)
	log.Printf("🔍 [AI-%s] Sending request to model: %s", reqID, model)
	log.Printf("🔍 [AI-%s] Prompt length: %d words", reqID, promptWords)
	log.Printf("🔍 [AI-%s] Temperature: %.2f, Max tokens: %d", reqID, temperature, maxTokens)

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

	log.Printf("🔍 [AI-%s] Connecting to API: %s", reqID, c.Endpoint)
	startTime := time.Now()

	// Increase timeout to 5 minutes to allow for longer AI processing time
	client := &http.Client{Timeout: 300 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		log.Printf("❌ [AI-%s] API request failed after %v: %v", reqID, time.Since(startTime), err)
		return "", fmt.Errorf("API request failed: %w", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		log.Printf("❌ [AI-%s] Failed to read response body: %v", reqID, err)
		return "", fmt.Errorf("failed to read response body: %w", err)
	}

	if resp.StatusCode != http.StatusOK {
		log.Printf("❌ [AI-%s] API returned error status %d: %s", reqID, resp.StatusCode, string(body))
		return "", fmt.Errorf("API returned status %d: %s", resp.StatusCode, string(body))
	}

	log.Printf("✅ [AI-%s] Received response in %v", reqID, time.Since(startTime))

	var aiResp struct {
		Choices []struct {
			Message struct {
				Content string `json:"content"`
			} `json:"message"`
		} `json:"choices"`
	}

	if err := json.Unmarshal(body, &aiResp); err != nil {
		log.Printf("❌ [AI-%s] Failed to decode response: %v", reqID, err)
		return "", fmt.Errorf("failed to decode response: %w", err)
	}

	if len(aiResp.Choices) == 0 {
		log.Printf("❌ [AI-%s] No choices in AI response", reqID)
		return "", fmt.Errorf("no choices in AI response")
	}

	content := aiResp.Choices[0].Message.Content
	responseWords := countWords(content)
	log.Printf("✅ [AI-%s] Response length: %d words", reqID, responseWords)

	return content, nil
}

func (c *Client) GetChatCompletion(messages []chat.Message, model string, temperature float32, maxTokens int) (string, error) {
	if c.APIKey == "" {
		return "", fmt.Errorf("API key not set")
	}

	if model == "" {
		model = c.Model
	}

	// Build OpenAI-compatible message format
	var apiMessages []map[string]string
	for _, m := range messages {
		apiMessages = append(apiMessages, map[string]string{
			"role":    m.Role,
			"content": m.Content,
		})
	}

	reqBody := map[string]interface{}{
		"model":       model,
		"messages":    apiMessages,
		"temperature": temperature,
		"max_tokens":  maxTokens,
	}

	body, err := json.Marshal(reqBody)
	if err != nil {
		return "", fmt.Errorf("failed to marshal chat request: %w", err)
	}

	req, err := http.NewRequest("POST", c.Endpoint, bytes.NewReader(body))
	if err != nil {
		return "", fmt.Errorf("failed to create chat request: %w", err)
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+c.APIKey)

	client := &http.Client{Timeout: 300 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return "", fmt.Errorf("chat request failed: %w", err)
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", fmt.Errorf("failed to read chat response: %w", err)
	}
	if resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("chat API returned status %d: %s", resp.StatusCode, string(respBody))
	}

	var parsed struct {
		Choices []struct {
			Message struct {
				Content string `json:"content"`
			} `json:"message"`
		} `json:"choices"`
	}
	if err := json.Unmarshal(respBody, &parsed); err != nil {
		return "", fmt.Errorf("failed to decode chat response: %w", err)
	}
	if len(parsed.Choices) == 0 {
		return "", errors.New("no response from AI")
	}

	return parsed.Choices[0].Message.Content, nil
}

// Helper function to count words in a string
func countWords(s string) int {
	return len(strings.Fields(s))
}

// Helper function to get minimum of two integers
func min(a, b int) int {
	if a < b {
		return a
	}
	return b
}
