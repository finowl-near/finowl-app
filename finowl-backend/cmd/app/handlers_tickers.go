package main

import (
	"encoding/json"
	"fmt"
	"log/slog"
	"net/http"
	"strconv"

	"finowl-backend/pkg/ticker"
)

func (s *server) getTickers(page int, pageSize int, sort string, sortDir string) ([]ticker.Ticker, error) {
	orderBy, err := func(sort string) (string, error) {
		switch sort {
		case "last_mentioned":
			return "last_mentioned_at", nil
		case "ticker":
			return "ticker_symbol", nil
		case "mindshare":
			return "mindshare_score", nil
		}

		return "", fmt.Errorf(`%w: unknown sort key "%s"`, errGetTickers, sort)
	}(sort)
	if err != nil {
		return nil, err
	}

	orderByDir, err := func(sortDir string) (string, error) {
		switch sortDir {
		case "asc":
			return "ASC", nil
		case "desc":
			return "DESC", nil
		}

		return "", fmt.Errorf(`%w: unknown sort order "%s"`, errGetTickers, sortDir)
	}(sortDir)
	if err != nil {
		return nil, err
	}

	query := fmt.Sprintf(queryGetTickers, orderBy, orderByDir)
	rows, err := s.db.Query(query, pageSize, pageSize*page)
	if err != nil {
		return nil, fmt.Errorf("%w: %w", errGetTickers, err)
	}

	return processTickers(rows)
}

func (s *server) getTickersCount() (int, error) {
	count := 0
	if err := s.db.QueryRow(queryGetTickersCount).Scan(&count); err != nil {
		return 0, fmt.Errorf("%w: %w", errGetTickersCount, err)
	}

	return count, nil
}

func (s *server) getTickersHandler(w http.ResponseWriter, r *http.Request) {
	var err error
	page := 0
	pageSize := 10
	sort := "last_mentioned"
	sortDir := "asc"

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

	if querySort := r.URL.Query().Get("sort"); querySort != "" {
		sort = querySort
	}

	if querySortDir := r.URL.Query().Get("sortDir"); querySortDir != "" {
		sortDir = querySortDir
	}

	tickers, err := s.getTickers(page, pageSize, sort, sortDir)
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		slog.Error(err.Error())
		return
	}

	tickersCnt, err := s.getTickersCount()
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		slog.Error(err.Error())
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

	body, err := json.Marshal(&resp)
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		slog.Error(err.Error())
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)

	if _, err := w.Write(body); err != nil {
		slog.Error(err.Error())
		return
	}
}
