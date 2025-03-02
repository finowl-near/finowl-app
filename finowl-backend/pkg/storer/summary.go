package storer

import (
	"finowl-backend/pkg/mindshare"
	"fmt"
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
