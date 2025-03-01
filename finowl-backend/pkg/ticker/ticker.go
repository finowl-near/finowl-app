package ticker

import (
	"time"

	_ "github.com/lib/pq" // Import the PostgreSQL driver
)

// Ticker represents the structure of a ticker to be stored in the database
type Ticker struct {
	TickerSymbol     string            `json:"ticker_symbol"`
	Category         string            `json:"category"`
	MindshareScore   float64           `json:"mindshare_score"`
	LastMentionedAt  time.Time         `json:"last_mentioned_at"`
	FirstMentionedAt time.Time         `json:"first_mentioned_at"`
	MentionDetails   MentionDetails    `json:"mention_details"`
	Variation        string            `json:"variation"`       // e.g., "+/- 29%", "+100%"
	Time             string            `json:"time"`            // e.g., "19s ago", "22s ago", "5 min ago", "1 day ago"
	TopInfluencers   map[int]int       `json:"top_influencers"` // always will have structure map[int]int
	Description      string            `json:"description"`
	MindshareRecords []MindshareRecord `json:"mindshare_records"` // List of mindshare records

}

// MindshareRecord represents a record of mindshare score with a timestamp
type MindshareRecord struct {
	Score     float64   `json:"score"`     // Current mindshare score
	Timestamp time.Time `json:"timestamp"` // When the score was recorded
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
