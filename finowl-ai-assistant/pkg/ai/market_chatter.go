package ai

import (
	"context"
	"finowl-ai-assistant/internal/session"
	"finowl-ai-assistant/pkg/chat"
	"finowl-ai-assistant/pkg/feedstock"
)

type MarketChatter struct {
	sessionManager *session.ChatSessionManager
	aiClient       AIClient
	model          string
}

func NewMarketChatter(sm *session.ChatSessionManager, client AIClient, model string) *MarketChatter {
	return &MarketChatter{
		sessionManager: sm,
		aiClient:       client,
		model:          model,
	}
}

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

// Preload initializes the session with summaries for a user
func (mc *MarketChatter) Preload(userID string, summaries []feedstock.Summary) {
	mc.sessionManager.StartSession(userID, summaries)
}
