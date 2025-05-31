package main

// SQL query constants for clean, professional code organization
const (
	// Tickers queries

	// Tweet queries for summary generation
	queryGetLatestTweets = `
		SELECT id, author, content 
		FROM near_tweets 
		ORDER BY timestamp DESC 
		LIMIT 50`

	// Summary insertion
	queryInsertSummary = `
		INSERT INTO near_summaries (timestamp, content) 
		VALUES ($1, $2)`
)
