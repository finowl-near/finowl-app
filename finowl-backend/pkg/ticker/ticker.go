package ticker

import (
	"time"

	_ "github.com/lib/pq" // Import the PostgreSQL driver
)

// Ticker represents the structure of a ticker to be stored in the database
type Ticker struct {
	TickerSymbol     string         `json:"ticker_symbol"`
	Category         string         `json:"category"`
	MindshareScore   float64        `json:"mindshare_score"`
	LastMentionedAt  time.Time      `json:"last_mentioned_at"`
	FirstMentionedAt time.Time      `json:"first_mentioned_at"`
	MentionDetails   MentionDetails `json:"mention_details"`
}

// MentionDetail represents the details of a mention for a specific influencer
type MentionDetail struct {
	Tier      int    `json:"tier"`
	TweetLink string `json:"tweet_link"`
	Content   string `json:"content"`
}

// MentionDetails represents the overall mention details structure
type MentionDetails struct {
	Influencers map[string]MentionDetail `json:"influencers"`
}
