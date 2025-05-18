package ai

import (
	"context"

	"finowl-ai-assistant/internal/session"
	"finowl-ai-assistant/pkg/chat"
	"finowl-ai-assistant/pkg/feedstock"
)

// MarketChatter manages AI chat interactions with memory and summaries
type MarketChatter struct {
	sessionManager *session.ChatSessionManager
	aiClient       AIClient
	model          string
}

// NewMarketChatter creates a new MarketChatter instance
func NewMarketChatter(sm *session.ChatSessionManager, client AIClient, model string) *MarketChatter {
	return &MarketChatter{
		sessionManager: sm,
		aiClient:       client,
		model:          model,
	}
}

// Chat handles a user's message and returns the assistant's reply
func (mc *MarketChatter) Chat(userID, question string) (string, error) {
	history := mc.sessionManager.GetMessages(userID)
	if mc.sessionManager.GetSummaries(userID) == nil {
		return "", context.DeadlineExceeded
	}

	messages := append(history, chat.Message{Role: "user", Content: question})

	resp, err := mc.aiClient.GetChatCompletion(messages, mc.model, 0.1, 1000)
	if err != nil {
		return "", err
	}

	mc.sessionManager.AddMessage(userID, "user", question)
	mc.sessionManager.AddMessage(userID, "assistant", resp)

	return resp, nil
}

// Preload initializes the chat session with summaries and system instructions
func (mc *MarketChatter) Preload(userID string, summaries []feedstock.Summary) {
	mc.sessionManager.StartSession(userID, summaries)

	// Add priming instruction to enforce summary-based answers
	mc.sessionManager.AddMessage(userID, "system", "You are a crypto market assistant. Use only the summaries provided to answer questions. Do not fabricate data or go beyond the scope of the summaries.")

	// Add welcome message for user guidance
	mc.sessionManager.AddMessage(userID, "assistant", "Welcome! I'm ready to help based on this week's market summaries. Ask me anything you'd like to know about the current crypto market.")
}
