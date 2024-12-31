// finowl-backend/storer/storer.go
package storer

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"time"

	_ "github.com/lib/pq" // Import the PostgreSQL driver
)

// Ticker represents the structure of a ticker to be stored in the database
type Ticker struct {
	TickerSymbol    string         `json:"ticker_symbol"`
	Category        string         `json:"category"`
	MindshareScore  int            `json:"mindshare_score"`
	LastMentionedAt time.Time      `json:"last_mentioned_at"`
	MentionDetails  MentionDetails `json:"mention_details"`
}

// MentionDetail represents the details of a mention for a specific influencer
type MentionDetail struct {
	Tier      int    `json:"tier"`
	TweetLink string `json:"tweet_link"`
}

// MentionDetails represents the overall mention details structure
type MentionDetails struct {
	Influencers map[string]MentionDetail `json:"influencers"`
}

// InsertTicker inserts a new ticker into the database or updates it if it already exists
func (s *Storer) InsertTicker(ticker Ticker) error {
	// Marshal the MentionDetails into JSON
	mentionDetailsJSON, err := json.Marshal(ticker.MentionDetails)
	if err != nil {
		return fmt.Errorf("failed to marshal mention details: %w", err)
	}

	// Check if the ticker already exists
	var existingTicker Ticker
	queryCheck := `SELECT ticker_symbol, category, mindshare_score, last_mentioned_at, mention_details FROM Tickers WHERE ticker_symbol = $1`
	var mentionDetailsString string // Use a string to hold the JSONB data
	err = s.db.QueryRow(queryCheck, ticker.TickerSymbol).Scan(&existingTicker.TickerSymbol, &existingTicker.Category, &existingTicker.MindshareScore, &existingTicker.LastMentionedAt, &mentionDetailsString)

	if err == sql.ErrNoRows {
		// Ticker does not exist, insert a new one
		queryInsert := `
			INSERT INTO Tickers (ticker_symbol, category, mindshare_score, last_mentioned_at, mention_details)
			VALUES ($1, $2, $3, $4, $5)`

		_, err = s.db.Exec(queryInsert, ticker.TickerSymbol, ticker.Category, ticker.MindshareScore, ticker.LastMentionedAt, mentionDetailsJSON)
		if err != nil {
			return fmt.Errorf("failed to insert ticker: %w", err)
		}
	} else if err != nil {
		return fmt.Errorf("failed to check if ticker exists: %w", err)
	} else {
		// Ticker exists, update it
		// Unmarshal existing mention details from the JSON string
		var existingMentionDetails MentionDetails
		if err := json.Unmarshal([]byte(mentionDetailsString), &existingMentionDetails); err != nil {
			return fmt.Errorf("failed to unmarshal existing mention details: %w", err)
		}

		// Append new mention details
		for influencer, detail := range ticker.MentionDetails.Influencers {
			existingMentionDetails.Influencers[influencer] = detail
		}

		// Marshal updated mention details
		updatedMentionDetailsJSON, err := json.Marshal(existingMentionDetails)
		if err != nil {
			return fmt.Errorf("failed to marshal updated mention details: %w", err)
		}

		// Update the ticker
		queryUpdate := `
			UPDATE Tickers 
			SET last_mentioned_at = $1, mention_details = $2 
			WHERE ticker_symbol = $3`

		_, err = s.db.Exec(queryUpdate, ticker.LastMentionedAt, updatedMentionDetailsJSON, ticker.TickerSymbol)
		if err != nil {
			return fmt.Errorf("failed to update ticker: %w", err)
		}
	}

	return nil
}

// GetTicker retrieves a ticker from the database based on its symbol
func (s *Storer) GetTicker(tickerSymbol string) (*Ticker, error) {
	query := `SELECT ticker_symbol, category, mindshare_score, last_mentioned_at, mention_details FROM Tickers WHERE ticker_symbol = $1`
	row := s.db.QueryRow(query, tickerSymbol)

	var ticker Ticker
	var mentionDetailsJSON string

	if err := row.Scan(&ticker.TickerSymbol, &ticker.Category, &ticker.MindshareScore, &ticker.LastMentionedAt, &mentionDetailsJSON); err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("no ticker found with symbol: %s", tickerSymbol)
		}
		return nil, fmt.Errorf("failed to retrieve ticker: %w", err)
	}

	// Unmarshal the JSONB field into the MentionDetails struct
	if err := json.Unmarshal([]byte(mentionDetailsJSON), &ticker.MentionDetails); err != nil {
		return nil, fmt.Errorf("failed to unmarshal mention details: %w", err)
	}

	return &ticker, nil
}
