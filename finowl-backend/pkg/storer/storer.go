// finowl-backend/storer/storer.go
package storer

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"log"

	_ "github.com/lib/pq" // Import the PostgreSQL driver
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
	linksJSON, _ := json.Marshal(tweet.Links)
	tickersJSON, _ := json.Marshal(tweet.Tickers)

	query := `
		INSERT INTO tweets (id, author, timestamp, content, links, tickers)
		VALUES ($1, $2, $3, $4, $5, $6)`

	_, err := s.db.Exec(query, tweet.ID, tweet.Author, tweet.Timestamp, tweet.Content, linksJSON, tickersJSON)
	if err != nil {
		return fmt.Errorf("failed to insert tweet: %w", err)
	}

	return nil
}

// GetTweets retrieves tweets from the database based on author name
func (s *Storer) GetTweets(author string) ([]Tweet, error) {
	query := `SELECT id, author, timestamp, content, links, tickers FROM tweets WHERE author = $1`
	rows, err := s.db.Query(query, author)
	if err != nil {
		return nil, fmt.Errorf("failed to retrieve tweets: %w", err)
	}
	defer rows.Close()

	var tweets []Tweet
	for rows.Next() {
		var tweet Tweet
		var linksJSON, tickersJSON string

		if err := rows.Scan(&tweet.ID, &tweet.Author, &tweet.Timestamp, &tweet.Content, &linksJSON, &tickersJSON); err != nil {
			return nil, err
		}

		// Unmarshal JSON arrays
		json.Unmarshal([]byte(linksJSON), &tweet.Links)
		json.Unmarshal([]byte(tickersJSON), &tweet.Tickers)

		tweets = append(tweets, tweet)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	return tweets, nil
}

// GetTweetByID retrieves a tweet from the database based on its ID
func (s *Storer) GetTweetByID(id string) (*Tweet, error) {
	query := `SELECT id, author, timestamp, content, links, tickers FROM tweets WHERE id = $1`
	row := s.db.QueryRow(query, id)

	var tweet Tweet
	var linksJSON, tickersJSON string

	if err := row.Scan(&tweet.ID, &tweet.Author, &tweet.Timestamp, &tweet.Content, &linksJSON, &tickersJSON); err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("no tweet found with ID: %s", id)
		}
		return nil, fmt.Errorf("failed to retrieve tweet: %w", err)
	}

	// Unmarshal JSON arrays
	json.Unmarshal([]byte(linksJSON), &tweet.Links)
	json.Unmarshal([]byte(tickersJSON), &tweet.Tickers)

	return &tweet, nil
}
