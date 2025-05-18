package session

import (
	"sync"
	"time"

	"finowl-ai-assistant/pkg/feedstock"
)

// ChatMessage represents a message exchanged with the AI
type ChatMessage struct {
	Role    string    // "user" or "assistant"
	Content string    // message content
	Time    time.Time // timestamp of message
}

// ChatSession holds summaries and chat messages for a user
type ChatSession struct {
	Summaries []feedstock.Summary
	Messages  []ChatMessage
	UpdatedAt time.Time // last activity time
}

// ChatSessionManager manages user chat sessions in memory
type ChatSessionManager struct {
	sessions map[string]*ChatSession
	mutex    sync.RWMutex
	ttl      time.Duration
}

// NewChatSessionManager creates a session manager with specified TTL
func NewChatSessionManager(ttl time.Duration) *ChatSessionManager {
	manager := &ChatSessionManager{
		sessions: make(map[string]*ChatSession),
		ttl:      ttl,
	}

	// Start background cleaner
	go manager.backgroundCleaner()

	return manager
}

// StartSession initializes a session with summaries
func (m *ChatSessionManager) StartSession(userID string, summaries []feedstock.Summary) {
	m.mutex.Lock()
	defer m.mutex.Unlock()

	m.sessions[userID] = &ChatSession{
		Summaries: summaries,
		Messages:  []ChatMessage{},
		UpdatedAt: time.Now(),
	}
}

// AddMessage appends a message to the session
func (m *ChatSessionManager) AddMessage(userID, role, content string) {
	m.mutex.Lock()
	defer m.mutex.Unlock()

	if session, exists := m.sessions[userID]; exists {
		session.Messages = append(session.Messages, ChatMessage{
			Role:    role,
			Content: content,
			Time:    time.Now(),
		})
		session.UpdatedAt = time.Now()
	}
}

// GetMessages returns the full message history for a session
func (m *ChatSessionManager) GetMessages(userID string) []ChatMessage {
	m.mutex.RLock()
	defer m.mutex.RUnlock()

	if session, exists := m.sessions[userID]; exists {
		return session.Messages
	}
	return nil
}

// GetSummaries returns the pre-analyzed summaries for a session
func (m *ChatSessionManager) GetSummaries(userID string) []feedstock.Summary {
	m.mutex.RLock()
	defer m.mutex.RUnlock()

	if session, exists := m.sessions[userID]; exists {
		return session.Summaries
	}
	return nil
}

// Clear removes a session
func (m *ChatSessionManager) Clear(userID string) {
	m.mutex.Lock()
	defer m.mutex.Unlock()

	delete(m.sessions, userID)
}

// backgroundCleaner removes expired sessions every 5 minutes
func (m *ChatSessionManager) backgroundCleaner() {
	ticker := time.NewTicker(5 * time.Minute)
	defer ticker.Stop()

	for range ticker.C {
		m.cleanupExpired()
	}
}

// cleanupExpired removes sessions older than TTL
func (m *ChatSessionManager) cleanupExpired() {
	m.mutex.Lock()
	defer m.mutex.Unlock()

	now := time.Now()
	for userID, session := range m.sessions {
		if now.Sub(session.UpdatedAt) > m.ttl {
			delete(m.sessions, userID)
		}
	}
}
