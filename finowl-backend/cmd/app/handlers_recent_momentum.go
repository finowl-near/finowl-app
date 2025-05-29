package main

import (
	"encoding/json"
	"fmt"
	"log/slog"
	"net/http"

	"finowl-backend/pkg/ticker"
)

func (s *server) getRecentMomentum() ([]ticker.Ticker, error) {
	rows, err := s.db.Query(queryRecentMomentum)
	if err != nil {
		return nil, fmt.Errorf("%w: %w", errGetMentions, err)
	}

	return processTickers(rows)
}

func (s *server) getRecentMomentumHandler(w http.ResponseWriter, r *http.Request) {
	tickers, err := s.getRecentMomentum()
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
