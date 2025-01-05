// finowl-backend/storer/storer.go
package storer

import (
	"database/sql"
	"encoding/json"
	"finowl-backend/pkg/mindshare"
	"finowl-backend/pkg/ticker"
	"fmt"
	"log"

	_ "github.com/lib/pq" // Import the PostgreSQL driver
)

// InsertTickersBatch processes a batch of tickers, inserting or updating each one into the database.
// It will call InsertTicker for each ticker and handle errors appropriately.
func (s *Storer) InsertTickersBatch(tickers []ticker.Ticker) error {
	// Early exit if no tickers are provided
	if len(tickers) == 0 {
		return fmt.Errorf("no tickers provided for batch insert")
	}

	// Iterate over each ticker in the batch and process it individually
	for i, ticker := range tickers {
		// Call InsertTicker for each ticker and handle errors
		if err := s.InsertTicker(ticker); err != nil {
			// Log error with context for better troubleshooting
			log.Printf("Error inserting/updating ticker at index %d (Ticker Symbol: %s): %v", i, ticker.TickerSymbol, err)
			// Return the error to stop further processing
			return fmt.Errorf("failed to insert/update ticker at index %d (Ticker Symbol: %s): %w", i, ticker.TickerSymbol, err)
		}
	}

	// Successfully processed all tickers
	return nil
}

// InsertTicker handles the main flow of ticker insertion/update
func (s *Storer) InsertTicker(ticker ticker.Ticker) error {
	existing, err := s.getExistingTicker(ticker.TickerSymbol)
	if err != nil && err != sql.ErrNoRows {
		return fmt.Errorf("failed to check existing ticker: %w", err)
	}

	if err == sql.ErrNoRows {
		return s.createNewTicker(ticker)
	}

	return s.updateExistingTicker(existing, ticker)
}

// getExistingTicker retrieves an existing ticker from the database
func (s *Storer) getExistingTicker(symbol string) (*ticker.Ticker, error) {
	var ticker ticker.Ticker
	var mentionDetailsString string

	query := `SELECT ticker_symbol, category, mindshare_score, last_mentioned_at, mention_details 
             FROM Tickers_1_0 WHERE ticker_symbol = $1`

	err := s.db.QueryRow(query, symbol).Scan(
		&ticker.TickerSymbol,
		&ticker.Category,
		&ticker.MindshareScore,
		&ticker.LastMentionedAt,
		&mentionDetailsString,
	)

	if err != nil {
		return nil, err
	}

	if err := json.Unmarshal([]byte(mentionDetailsString), &ticker.MentionDetails); err != nil {
		return nil, fmt.Errorf("failed to unmarshal mention details: %w", err)
	}

	return &ticker, nil
}

// createNewTicker inserts a new ticker into the database
func (s *Storer) createNewTicker(ticker ticker.Ticker) error {
	mentionDetailsJSON, err := json.Marshal(ticker.MentionDetails)
	if err != nil {
		return fmt.Errorf("failed to marshal mention details: %w", err)
	}

	query := `INSERT INTO Tickers_1_0 (ticker_symbol, category, mindshare_score, last_mentioned_at, mention_details)
             VALUES ($1, $2, $3, $4, $5)`

	_, err = s.db.Exec(query,
		ticker.TickerSymbol,
		ticker.Category,
		ticker.MindshareScore,
		ticker.LastMentionedAt,
		mentionDetailsJSON,
	)

	return err
}

// TotalTierCounts represents the total number of influencers per tier
var TotalTierCounts = map[int]int{
	1: 5,  // CZ, Sreeram, Balaji, cygaar, YQ
	2: 15, // Andrew Kang, overdose, crash, Bull.BnB, etc.
	3: 33, // All tier 3 influencers
}

// updateExistingTicker updates an existing ticker with new information
func (s *Storer) updateExistingTicker(existing *ticker.Ticker, newTicker ticker.Ticker) error {
	// Merge mention details
	for influencer, detail := range newTicker.MentionDetails.Influencers {
		existing.MentionDetails.Influencers[influencer] = detail
	}

	mindShare, err := mindshare.CalculateMindshare(existing.MentionDetails, newTicker.MentionDetails)
	if err != nil {
		fmt.Printf("failed to calculate mindShare: %v", err)
		return nil
	}

	// Here we'll add the mindshare calculation later
	// existing.MindshareScore = mindshare.Calculate(existing.MentionDetails)
	// existing.Category = mindshare.DetermineCategory(existing.MindshareScore)

	mentionDetailsJSON, err := json.Marshal(existing.MentionDetails)
	if err != nil {
		return fmt.Errorf("failed to marshal updated mention details: %w", err)
	}

	query := `UPDATE Tickers_1_0
             SET last_mentioned_at = $1, 
                 mention_details = $2,
                 mindshare_score = $3,
                 category = $4
             WHERE ticker_symbol = $5`

	_, err = s.db.Exec(query,
		newTicker.LastMentionedAt,
		mentionDetailsJSON,
		mindShare.Score,    // Updated score
		mindShare.Category, // Updated category
		existing.TickerSymbol,
	)

	return err
}

// GetTicker retrieves a ticker from the database based on its symbol
func (s *Storer) GetTicker(tickerSymbol string) (*ticker.Ticker, error) {
	query := `SELECT ticker_symbol, category, mindshare_score, last_mentioned_at, mention_details FROM Tickers WHERE ticker_symbol = $1`
	row := s.db.QueryRow(query, tickerSymbol)

	var ticker ticker.Ticker
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
