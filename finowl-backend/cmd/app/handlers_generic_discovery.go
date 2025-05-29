package main

import (
	"encoding/json"
	"fmt"
	"log/slog"
	"net/http"
	"strconv"

	"finowl-backend/pkg/ticker"
)

func (s *server) getGenericDiscovery(page int, pageSize int) ([]ticker.Ticker, error) {
	rows, err := s.db.Query(queryGenericDiscovery, pageSize, pageSize*page)
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

func (s *server) getGenericDiscoveryCount() (int, error) {
	count := 0
	if err := s.db.QueryRow(queryGenericDiscoveryCount).Scan(&count); err != nil {
		return 0, fmt.Errorf("%w: %w", errGetMentions, err)
	}
	return count, nil
}

func (s *server) getGenericDiscoveryHandler(w http.ResponseWriter, r *http.Request) {
	var err error
	page := 0
	pageSize := 10

	if queryPage := r.URL.Query().Get("page"); queryPage != "" {
		page, err = strconv.Atoi(queryPage)
		if err != nil || page < 0 {
			w.WriteHeader(http.StatusBadRequest)
			return
		}
	}

	if queryPageSize := r.URL.Query().Get("pageSize"); queryPageSize != "" {
		pageSize, err = strconv.Atoi(queryPageSize)
		if err != nil || pageSize <= 0 || pageSize > maxPageSize {
			w.WriteHeader(http.StatusBadRequest)
			return
		}
	}

	tickers, err := s.getGenericDiscovery(page, pageSize)
	if err != nil {
		slog.Error(err.Error())
		w.WriteHeader(http.StatusInternalServerError)
		return
	}

	tickersCnt, err := s.getGenericDiscoveryCount()
	if err != nil {
		slog.Error(err.Error())
		w.WriteHeader(http.StatusInternalServerError)
		return
	}

	resp := getTickersHandlerResponse{
		Tickers: tickers,
		TotalPageCnt: func() int {
			remaining := 0
			if tickersCnt%pageSize > 0 {
				remaining = 1
			}
			return (tickersCnt / pageSize) + remaining
		}(),
		Page:     page,
		PageSize: pageSize,
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
