package ai

import (
	"context"
	"errors"
	"fmt"

	"github.com/psanford/claude"
	"github.com/psanford/claude/anthropic"
	"github.com/psanford/claude/clientiface"
)

const defaultSystemPrompt = `The assistant is Claude, created by Anthropic. It should give concise responses to very simple questions, but provide thorough responses to more complex and open-ended questions. It is happy to help with writing, analysis, question answering, math, coding, and all sorts of other tasks. It uses markdown for coding.`

// ClaudeClient represents a reusable Claude AI client.
type ClaudeClient struct {
	client        clientiface.Client
	modelName     string
	systemPrompt  string
	maxTokens     int
	conversation  []claude.MessageTurn
	streamEnabled bool
	debug         bool
}

// NewClaudeClient initializes a new ClaudeClient instance.
func NewClaudeClient(apiKey string, modelName string, maxTokens int, streamEnabled, debug bool) (*ClaudeClient, error) {
	if apiKey == "" {
		return nil, errors.New("API key cannot be empty")
	}

	client := anthropic.NewClient(apiKey)

	return &ClaudeClient{
		client:        client,
		modelName:     modelName,
		systemPrompt:  defaultSystemPrompt,
		maxTokens:     maxTokens,
		streamEnabled: streamEnabled,
		debug:         debug,
	}, nil
}

// AddMessageToConversation appends a message to the ongoing conversation history.
func (c *ClaudeClient) AddMessageToConversation(role, content string) {
	c.conversation = append(c.conversation, claude.MessageTurn{
		Role: role,
		Content: []claude.TurnContent{
			claude.TextContent(content),
		},
	})
}

// SendPrompt sends a prompt to the Claude AI and returns the response. Supports both streaming and non-streaming modes.
func (c *ClaudeClient) SendPrompt(ctx context.Context, prompt string) (string, error) {
	// Add user's prompt to the conversation history
	c.AddMessageToConversation("user", prompt)

	req := claude.MessageRequest{
		Model:     c.modelName,
		System:    c.systemPrompt,
		MaxTokens: c.maxTokens,
		Stream:    c.streamEnabled,
		Messages:  c.conversation,
	}

	resp, err := c.client.Message(ctx, &req)
	if err != nil {
		return "", fmt.Errorf("failed to send prompt: %w", err)
	}

	if c.streamEnabled {
		return c.handleStreamingResponse(resp), nil
	}

	return c.handleCompleteResponse(resp)
}

// handleCompleteResponse processes a non-streaming response.
func (c *ClaudeClient) handleCompleteResponse(resp claude.MessageResponse) (string, error) {
	var responseText string
	for event := range resp.Responses() {
		if event.Type != "message" {
			return "", fmt.Errorf("unexpected event type: %s", event.Type)
		}

		msg, ok := event.Data.(*claude.MessageStart)
		if !ok {
			return "", fmt.Errorf("event data is not of type MessageStart: %T", event.Data)
		}

		for _, content := range msg.Content {
			responseText += content.TextContent()
		}
	}

	// Append assistant's response to conversation history
	c.AddMessageToConversation("assistant", responseText)

	return responseText, nil
}

// handleStreamingResponse processes a streaming response.
func (c *ClaudeClient) handleStreamingResponse(resp claude.MessageResponse) string {
	var responseText string
	for event := range resp.Responses() {
		if c.debug {
			fmt.Printf("event type: %s\n", event.Type)
		}

		if event.Type == "message" {
			msg, ok := event.Data.(*claude.MessageStart)
			if ok {
				for _, content := range msg.Content {
					responseText += content.TextContent()
				}
			}
		}
	}
	// Append assistant's response to conversation history
	c.AddMessageToConversation("assistant", responseText)
	return responseText
}

// ClearConversation clears the conversation history.
func (c *ClaudeClient) ClearConversation() {
	c.conversation = nil
}
