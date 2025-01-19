package storer

import (
	"finowl-backend/pkg/mindshare"
	"fmt"
	"os"
	"time"
)

// GetAllSummaries retrieves all summaries from the database
func (s *Storer) GetAllSummaries() ([]mindshare.Summary, error) {
	query := `SELECT id, timestamp, content FROM Summaries`
	rows, err := s.db.Query(query)
	if err != nil {
		return nil, fmt.Errorf("failed to retrieve summaries: %w", err)
	}
	defer rows.Close()

	var summaries []mindshare.Summary
	for rows.Next() {
		var summary mindshare.Summary
		if err := rows.Scan(&summary.ID, &summary.Time, &summary.Content); err != nil {
			return nil, err
		}
		summaries = append(summaries, summary)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	return summaries, nil
}

// WriteSummariesToFile writes all summaries to a text file
func (s *Storer) WriteSummariesToFile(filename string) error {
	summaries, err := s.GetAllSummaries()
	if err != nil {
		return fmt.Errorf("failed to get summaries: %w", err)
	}

	// Create or open the file
	file, err := os.Create(filename)
	if err != nil {
		return fmt.Errorf("failed to create file: %w", err)
	}
	defer file.Close()

	// Write summaries to the file
	for _, summary := range summaries {
		_, err := fmt.Fprintf(file, "ID: %s\nTimestamp: %s\nContent: %s\n\n", summary.ID, summary.Time.Format(time.RFC3339), summary.Content)
		if err != nil {
			return fmt.Errorf("failed to write summary to file: %w", err)
		}
	}

	return nil
}
