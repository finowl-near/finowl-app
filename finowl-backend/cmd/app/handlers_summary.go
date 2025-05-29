package main

import (
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
	"log/slog"
	"net/http"
	"strconv"

	"finowl-backend/pkg/mindshare"
)

func (s *server) getSummaryByID(id int) (*mindshare.Summary, error) {
	summary := &mindshare.Summary{}

	if id == -1 {
		if err := s.db.QueryRow(queryGetSummaryLatest).Scan(&summary.ID, &summary.Time, &summary.Content); err != nil {
			return nil, fmt.Errorf("%w: %w", errGetSummary, err)
		}
		return summary, nil
	}

	if err := s.db.QueryRow(queryGetSummaryByID, id).Scan(&summary.ID, &summary.Time, &summary.Content); err != nil {
		return nil, fmt.Errorf("%w: %w", errGetSummary, err)
	}
	return summary, nil
}

func (s *server) getSummaryCount() (int, error) {
	count := 0
	if err := s.db.QueryRow(queryGetSummaryCount).Scan(&count); err != nil {
		return 0, fmt.Errorf("%w: %w", errGetSummariesCount, err)
	}
	return count, nil
}

func (s *server) getSummaryHandler(w http.ResponseWriter, r *http.Request) {
	summaryIDParam := r.URL.Query().Get("id")
	summaryID, err := func() (int, error) {
		if summaryIDParam == "" {
			return -1, nil
		}
		return strconv.Atoi(summaryIDParam)
	}()
	if err != nil {
		slog.Error(fmt.Errorf("error parsing id params: %w", err).Error())
		w.WriteHeader(http.StatusBadRequest)
		return
	}

	summary, err := s.getSummaryByID(summaryID)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			w.WriteHeader(http.StatusNotFound)
			return
		}
		slog.Error(err.Error())
		w.WriteHeader(http.StatusInternalServerError)
		return
	}

	total, err := s.getSummaryCount()
	if err != nil {
		slog.Error(err.Error())
		w.WriteHeader(http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)

	resp := getSummaryHandlerResponse{
		Summary: summary,
		Total:   total,
	}

	body, _ := json.Marshal(&resp)
	if _, err := w.Write(body); err != nil {
		slog.Error(err.Error())
		return
	}
}
