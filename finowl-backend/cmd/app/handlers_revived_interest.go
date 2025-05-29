package main

import (
	"encoding/json"
	"fmt"
	"log/slog"
	"net/http"

	"finowl-backend/pkg/ticker"
)

func (s *server) getRevivedInterest() ([]ticker.Ticker, error) {
	rows, err := s.db.Query(queryRevivedInterest)
	if err != nil {
		return nil, fmt.Errorf("%w: %w", errGetMentions, err)
	}
	defer rows.Close()

	tickers := []ticker.Ticker{}
	for rows.Next() {
		var t ticker.Ticker
		var mentionDetailsJSON string

		if err := rows.Scan(&t.TickerSymbol, &t.Category, &t.MindshareScore, &t.LastMentionedAt, &t.FirstMentionedAt, &mentionDetailsJSON); err != nil {
			return nil, fmt.Errorf("%w: %w", errGetMentions, err)
		}

		if err := json.Unmarshal([]byte(mentionDetailsJSON), &t.MentionDetails); err != nil {
			return nil, fmt.Errorf("%w: %w", errGetMentions, err)
		}

		tickers = append(tickers, t)
	}

	return tickers, nil
}

func (s *server) getRevivedInterestHandler(w http.ResponseWriter, r *http.Request) {
	tickers, err := s.getRevivedInterest()
	if err != nil {
		slog.Error(err.Error())
		w.WriteHeader(http.StatusInternalServerError)
		return
	}

	resp := getTickersHandlerResponse{
		Tickers:      tickers,
		TotalPageCnt: 1,
		Page:         0,
		PageSize:     len(tickers),
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)

	body, err := json.Marshal(&resp)
	if err != nil {
		slog.Error(err.Error())
		w.WriteHeader(http.StatusInternalServerError)
		return
	}

	if _, err := w.Write(body); err != nil {
		slog.Error(err.Error())
		return
	}
}
