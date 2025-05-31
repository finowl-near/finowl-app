package main

import (
	"database/sql"
	"encoding/json"
	"finowl-backend/pkg/mindshare"
	"finowl-backend/pkg/ticker"
	"net/http"
	"strconv"
)

type getTickersResponse struct {
	Tickers      []ticker.Ticker `json:"tickers"`
	TotalPageCnt int             `json:"total_page_cnt"`
	Page         int             `json:"page"`
	PageSize     int             `json:"page_size"`
}

type getSummaryResponse struct {
	Summary *mindshare.Summary `json:"summary"`
	Total   int                `json:"total"`
}

// getNearTickersHandler handles the NEAR token discovery endpoint
func (s *server) getNearTickersHandler(w http.ResponseWriter, r *http.Request) {
	pageStr := r.URL.Query().Get("page")
	pageSizeStr := r.URL.Query().Get("pageSize")

	page, _ := strconv.Atoi(pageStr)
	pageSize, _ := strconv.Atoi(pageSizeStr)

	if pageSize == 0 {
		pageSize = 20 // default page size
	}

	// Query NEAR tickers directly from DB
	rows, err := s.db.Query(`
		SELECT ticker_symbol, category, mindshare_score, last_mentioned_at, 
			   first_mentioned_at, mention_details
		FROM near_tickers
		WHERE last_mentioned_at > NOW() - INTERVAL '3 days'
		ORDER BY mindshare_score DESC
		LIMIT $1`, pageSize)
	if err != nil {
		http.Error(w, "Failed to fetch NEAR tickers", http.StatusInternalServerError)
		return
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
			http.Error(w, "Failed to process NEAR tickers", http.StatusInternalServerError)
			return
		}

		if err := json.Unmarshal([]byte(mentionDetailsJSON), &t.MentionDetails); err != nil {
			http.Error(w, "Failed to process ticker details", http.StatusInternalServerError)
			return
		}

		tickers = append(tickers, t)
	}

	response := getTickersResponse{
		Tickers:      tickers,
		TotalPageCnt: 1, // Simplified for now
		Page:         page,
		PageSize:     pageSize,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

// getNearSummaryHandler handles the NEAR ecosystem summary endpoint
func (s *server) getNearSummaryHandler(w http.ResponseWriter, r *http.Request) {
	// Check if ID is provided in query params
	idStr := r.URL.Query().Get("id")

	var summary mindshare.Summary
	var err error

	if idStr != "" {
		// Fetch specific summary by ID
		id, err := strconv.Atoi(idStr)
		if err != nil {
			http.Error(w, "Invalid summary ID", http.StatusBadRequest)
			return
		}

		err = s.db.QueryRow(`
			SELECT id, timestamp, content
			FROM near_summaries
			WHERE id = $1
		`, id).Scan(&summary.ID, &summary.Time, &summary.Content)
	} else {
		// Fetch latest summary
		err = s.db.QueryRow(`
			SELECT id, timestamp, content
			FROM near_summaries
			ORDER BY timestamp DESC
			LIMIT 1
		`).Scan(&summary.ID, &summary.Time, &summary.Content)
	}

	if err != nil {
		if err == sql.ErrNoRows {
			http.Error(w, "No summary available", http.StatusNotFound)
			return
		}
		http.Error(w, "Failed to fetch NEAR summary", http.StatusInternalServerError)
		return
	}

	response := getSummaryResponse{
		Summary: &summary,
		Total:   1,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}
