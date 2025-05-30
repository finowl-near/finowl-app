package storer

import (
	"database/sql"
	"encoding/json"
	"finowl-backend/pkg/mindshare"
	"finowl-backend/pkg/ticker"
	"fmt"
)

// CreateNearTables creates NEAR-specific tables
func (s *Storer) CreateNearTables() error {
	if err := s.createNearTweetsTable(); err != nil {
		return err
	}
	if err := s.createNearTickersTable(); err != nil {
		return err
	}
	if err := s.createNearSummariesTable(); err != nil {
		return err
	}
	return nil
}

func (s *Storer) createNearTweetsTable() error {
	_, err := s.db.Exec(`
		CREATE TABLE IF NOT EXISTS near_tweets (
			id UUID PRIMARY KEY,
			author VARCHAR(255),
			timestamp TIMESTAMP,
			content TEXT,
			links JSONB,
			tickers JSONB,
			created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
		)`)
	return err
}

func (s *Storer) createNearTickersTable() error {
	_, err := s.db.Exec(`
		CREATE TABLE IF NOT EXISTS near_tickers (
			symbol VARCHAR(50) PRIMARY KEY,
			category VARCHAR(20),
			mindshare_score DECIMAL(10,2),
			last_mentioned_at TIMESTAMP,
			first_mentioned_at TIMESTAMP,
			mention_details JSONB,
			created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
			updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
		)`)
	return err
}

func (s *Storer) createNearSummariesTable() error {
	_, err := s.db.Exec(`
		CREATE TABLE IF NOT EXISTS near_summaries (
			id SERIAL PRIMARY KEY,
			timestamp TIMESTAMP NOT NULL,
			content TEXT NOT NULL,
			created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
		)`)
	return err
}

// InsertNearTweet stores a tweet in the NEAR-specific table
func (s *Storer) InsertNearTweet(tweet Tweet) error {
	query := `
		INSERT INTO near_tweets (id, author, timestamp, content, links, tickers)
		VALUES ($1, $2, $3, $4, $5, $6)`

	linksJSON, _ := json.Marshal(tweet.Links)
	tickersJSON, _ := json.Marshal(tweet.Tickers)

	_, err := s.db.Exec(query, tweet.ID, tweet.Author, tweet.Timestamp, tweet.Content, linksJSON, tickersJSON)
	if err != nil {
		return fmt.Errorf("failed to insert NEAR tweet: %w", err)
	}
	return nil
}

// GetNearTickers retrieves recent NEAR tickers
func (s *Storer) GetNearTickers(limit int) ([]ticker.Ticker, error) {
	query := `
		SELECT symbol, category, mindshare_score, last_mentioned_at, 
			   first_mentioned_at, mention_details
		FROM near_tickers
		WHERE last_mentioned_at > NOW() - INTERVAL '3 days'
		ORDER BY mindshare_score DESC
		LIMIT $1`

	rows, err := s.db.Query(query, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var tickers []ticker.Ticker
	for rows.Next() {
		var t ticker.Ticker
		var mentionDetailsJSON string

		err := rows.Scan(
			&t.TickerSymbol,
			&t.Category,
			&t.MindshareScore,
			&t.LastMentionedAt,
			&t.FirstMentionedAt,
			&mentionDetailsJSON)
		if err != nil {
			return nil, err
		}

		if err := json.Unmarshal([]byte(mentionDetailsJSON), &t.MentionDetails); err != nil {
			return nil, err
		}

		tickers = append(tickers, t)
	}

	return tickers, rows.Err()
}

// GetLatestNearSummary retrieves the most recent NEAR ecosystem summary
func (s *Storer) GetLatestNearSummary() (*mindshare.Summary, error) {
	query := `
		SELECT id, timestamp, content
		FROM near_summaries
		ORDER BY timestamp DESC
		LIMIT 1`

	summary := &mindshare.Summary{}
	err := s.db.QueryRow(query).Scan(
		&summary.ID,
		&summary.Time,
		&summary.Content)

	if err == sql.ErrNoRows {
		return nil, nil
	}
	return summary, err
}
