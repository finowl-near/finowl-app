package session

import (
	"finowl-ai-assistant/pkg/feedstock"
	"testing"
	"time"
)

func TestChatSessionManager(t *testing.T) {
	manager := NewChatSessionManager(2 * time.Second)

	uid := "user-123"
	summaries := []feedstock.Summary{
		{ID: 1, Content: "BTC is up", Timestamp: time.Now()},
	}

	manager.StartSession(uid, summaries)
	manager.AddMessage(uid, "user", "Should I buy BTC?")
	manager.AddMessage(uid, "assistant", "Market looks bullish.")

	msgs := manager.GetMessages(uid)
	if len(msgs) != 2 {
		t.Errorf("Expected 2 messages, got %d", len(msgs))
	}

	if msgs[0].Role != "user" || msgs[1].Role != "assistant" {
		t.Error("Unexpected message roles or order")
	}

	sums := manager.GetSummaries(uid)
	if len(sums) != 1 {
		t.Errorf("Expected 1 summary, got %d", len(sums))
	}

	manager.Clear(uid)
	if len(manager.GetMessages(uid)) != 0 {
		t.Error("Expected messages to be cleared")
	}
}

func TestSessionExpiration(t *testing.T) {
	manager := NewChatSessionManager(1 * time.Second)

	uid := "expire-user"
	manager.StartSession(uid, nil)

	// Wait for TTL to expire
	time.Sleep(2 * time.Second)
	manager.cleanupExpired()

	if manager.GetMessages(uid) != nil {
		t.Error("Expected session to be cleaned up after TTL")
	}
}
