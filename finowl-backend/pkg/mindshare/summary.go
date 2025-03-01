package mindshare

import "time"

// Summary represents the structure of a summary to be stored in the database
type Summary struct {
	ID      int       `json:"id"`
	Time    time.Time `json:"timestamp"`
	Content string    `json:"content"`
}
