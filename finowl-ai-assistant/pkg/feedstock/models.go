package feedstock

import "time"

// Summary represents the structure of the Finowl API response
type Summary struct {
	ID        int       `json:"id"`
	Timestamp time.Time `json:"timestamp"`
	Content   string    `json:"content"`
}

// Response represents the full API response
type Response struct {
	Summary Summary `json:"summary"`
	Total   int     `json:"total"`
}
