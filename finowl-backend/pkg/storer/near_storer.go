// finowl-backend/storer/storer.go
package storer

import (
	"encoding/json"
	"finowl-backend/pkg/mindshare"
	"fmt"

	_ "github.com/lib/pq"
)

// InsertTweet inserts a new tweet into the database
func (s *Storer) InsertTweetNEAR(tweet Tweet) error {
	query := buildInsertTweetQueryNEAR()
	linksJSON, _ := json.Marshal(tweet.Links)
	tickersJSON, _ := json.Marshal(tweet.Tickers)
	_, err := s.db.Exec(query, tweet.ID, tweet.Author, tweet.Timestamp, tweet.Content, linksJSON, tickersJSON)
	if err != nil {
		return fmt.Errorf("failed to insert tweet: %w", err)
	}
	return nil
}

// buildInsertTweetQuery constructs the SQL query for inserting a tweet.
func buildInsertTweetQueryNEAR() string {
	return `
		INSERT INTO near_tweets (id, author, timestamp, content, links, tickers)
		VALUES ($1, $2, $3, $4, $5, $6)`
}

// InsertSummary inserts a new summary into the database
func (s *Storer) InsertSummaryNEAR(summary *mindshare.Summary) error {
	query := buildInsertSummaryQueryNEAR()
	_, err := s.db.Exec(query, summary.Time, summary.Content)
	if err != nil {
		return fmt.Errorf("failed to insert summary: %w", err)
	}
	return nil
}

// buildInsertSummaryQuery constructs the SQL query for inserting a summary.
func buildInsertSummaryQueryNEAR() string {
	return `
        INSERT INTO near_summaries (timestamp, content)
        VALUES ($1, $2)`
}

// CreateNEARTables creates the NEAR-specific tables in the database
func CreateNEARTables(storer *Storer) error {
	queries := []string{
		`CREATE TABLE IF NOT EXISTS near_tweets (
			id UUID PRIMARY KEY,
			author VARCHAR(255),
			timestamp TIMESTAMP,
			content TEXT,
			links JSONB,
			tickers JSONB,
			created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
		)`,
		`CREATE TABLE IF NOT EXISTS near_tickers (
			ticker_symbol VARCHAR(50) PRIMARY KEY,
			category VARCHAR(20),
			mindshare_score DECIMAL(10,2),
			last_mentioned_at TIMESTAMP,
			first_mentioned_at TIMESTAMP,
			mention_details JSONB,
			created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
			updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
		)`,
		`CREATE TABLE IF NOT EXISTS near_summaries (
			id SERIAL PRIMARY KEY,
			timestamp TIMESTAMP NOT NULL,
			content TEXT NOT NULL,
			created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
		)`,
	}

	for i, query := range queries {
		if _, err := storer.db.Exec(query); err != nil {
			return fmt.Errorf("failed to create table %d: %w", i+1, err)
		}
	}

	return nil
}
