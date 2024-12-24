package ai

import (
	"context"
)

// Client is an interface that defines the methods used from the Claude client.
type Client interface {
	SendPrompt(ctx context.Context, prompt string) (string, error)
}
