package chat

import "time"

type Message struct {
	Role    string    `json:"role"`    // "user" or "assistant"
	Content string    `json:"content"` // actual message
	Time    time.Time `json:"time"`    // timestamp of message
}
