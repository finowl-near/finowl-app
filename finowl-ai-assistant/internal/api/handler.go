package api

import (
	"finowl-ai-assistant/pkg/near"
)

// Handler handles HTTP requests for the application
type Handler struct {
	NearClient *near.Client
}

// NewHandler creates a new Handler instance
func NewHandler(nearClient *near.Client) *Handler {
	return &Handler{
		NearClient: nearClient,
	}
}
