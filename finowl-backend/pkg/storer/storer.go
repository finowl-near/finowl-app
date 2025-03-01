// finowl-backend/storer/storer.go
package storer

import (
	"database/sql"
	"encoding/json"
	"finowl-backend/pkg/analyzer"
	"finowl-backend/pkg/mindshare"
	"fmt"
	"log"
	"time"

	_ "github.com/lib/pq"
)

// Tweet represents the structure of a tweet to be stored in the database
type Tweet struct {
	ID        string   `json:"id"`
	Author    string   `json:"author"`
	Timestamp string   `json:"timestamp"`
	Content   string   `json:"content"`
	Links     []string `json:"links"`
	Tickers   []string `json:"tickers"`
}

// Storer handles database operations for tweets
type Storer struct {
	db *sql.DB
}

// NewStorer creates a new Storer instance and connects to the database
func NewStorer(dataSourceName string) (*Storer, error) {
	db, err := sql.Open("postgres", dataSourceName)
	if err != nil {
		return nil, err
	}

	// Test the connection
	if err := db.Ping(); err != nil {
		return nil, err
	}

	return &Storer{db: db}, nil
}

// Close closes the database connection
func (s *Storer) Close() {
	if err := s.db.Close(); err != nil {
		log.Fatal(err)
	}
}

// InsertTweet inserts a new tweet into the database
func (s *Storer) InsertTweet(tweet Tweet) error {
	query := buildInsertTweetQuery()
	linksJSON, _ := json.Marshal(tweet.Links)
	tickersJSON, _ := json.Marshal(tweet.Tickers)
	_, err := s.db.Exec(query, tweet.ID, tweet.Author, tweet.Timestamp, tweet.Content, linksJSON, tickersJSON)
	if err != nil {
		return fmt.Errorf("failed to insert tweet: %w", err)
	}
	return nil
}

// buildInsertTweetQuery constructs the SQL query for inserting a tweet.
func buildInsertTweetQuery() string {
	return `
		INSERT INTO tweets (id, author, timestamp, content, links, tickers)
		VALUES ($1, $2, $3, $4, $5, $6)`
}

func (s *Storer) DB() *sql.DB {
	return s.db
}

// TransformToStorerTweet transforms a Tweet into a storer.Tweet format for database storage.
func TransformToStorerTweet(input analyzer.Tweet) Tweet {
	return Tweet{
		ID:        input.ID,
		Author:    input.Author,
		Timestamp: input.Timestamp.Format(time.RFC3339), // Convert to ISO 8601 format
		Content:   input.Content,
		Links:     input.Links,
		Tickers:   input.Tickers,
	}
}

// CreateTables handles the creation of necessary tables in the database.
func CreateTables(storer *Storer) error {
	if err := createTweetsTable(storer); err != nil {
		return err
	}
	if err := createTickersTable(storer); err != nil {
		return err
	}
	if err := createSummariesTable(storer); err != nil {
		return err
	}
	return nil
}

// createTweetsTable creates the 'tweets' table if it doesn't exist.
func createTweetsTable(storer *Storer) error {
	_, err := storer.db.Exec(`
		CREATE TABLE IF NOT EXISTS tweets (
			id UUID PRIMARY KEY,
			author VARCHAR(255),
			timestamp TIMESTAMP,
			content TEXT,
			links JSONB,
			tickers JSONB
		)`)
	if err != nil {
		return fmt.Errorf("failed to create tweets table: %w", err)
	}
	return nil
}

// createTickersTable creates the 'Tickers' table if it doesn't exist.
func createTickersTable(storer *Storer) error {
	_, err := storer.db.Exec(`
		CREATE TABLE IF NOT EXISTS Tickers_1_0 (
			ticker_symbol VARCHAR(10) PRIMARY KEY,
			category VARCHAR(20) CHECK (category IN ('High Alpha', 'Alpha', 'Trenches')),
			mindshare_score DECIMAL(10,2),
			last_mentioned_at TIMESTAMP,
			first_mentioned_at TIMESTAMP,
			mention_details JSONB
		)`)
	if err != nil {
		return fmt.Errorf("failed to create Tickers table: %w", err)
	}
	return nil
}

// createSummariesTable creates the 'Summaries' table if it doesn't exist.
func createSummariesTable(storer *Storer) error {
	_, err := storer.db.Exec(`
		CREATE TABLE IF NOT EXISTS Summaries (
			id SERIAL PRIMARY KEY,
			timestamp TIMESTAMP NOT NULL,
			content TEXT NOT NULL
		)`)
	if err != nil {
		return fmt.Errorf("failed to create Summaries table: %w", err)
	}
	return nil
}

// InsertSummary inserts a new summary into the database
func (s *Storer) InsertSummary(summary *mindshare.Summary) error {
	query := buildInsertSummaryQuery()
	_, err := s.db.Exec(query, summary.Time, summary.Content)
	if err != nil {
		return fmt.Errorf("failed to insert summary: %w", err)
	}
	return nil
}

// buildInsertSummaryQuery constructs the SQL query for inserting a summary.
func buildInsertSummaryQuery() string {
	return `
        INSERT INTO Summaries (timestamp, content)
        VALUES ($1, $2)`
}
