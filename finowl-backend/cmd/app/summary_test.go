package main

import (
	"database/sql"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/DATA-DOG/go-sqlmock"
	"github.com/stretchr/testify/assert"
)

func TestGetSummaryHandler(t *testing.T) {
	tests := []struct {
		name           string
		queryParams    map[string]string
		setupMock      func(sqlmock.Sqlmock)
		expectedStatus int
		expectSummary  bool
	}{
		{
			name:        "get latest summary (no ID)",
			queryParams: map[string]string{},
			setupMock: func(mock sqlmock.Sqlmock) {
				summaryRow := sqlmock.NewRows([]string{"id", "timestamp", "content"}).
					AddRow(1, time.Now(), "Latest summary content")
				mock.ExpectQuery("SELECT id, timestamp, content FROM Summaries ORDER BY timestamp DESC LIMIT 1").
					WillReturnRows(summaryRow)

				countRow := sqlmock.NewRows([]string{"count"}).AddRow(5)
				mock.ExpectQuery("SELECT COUNT").WillReturnRows(countRow)
			},
			expectedStatus: http.StatusOK,
			expectSummary:  true,
		},
		{
			name: "get specific summary by ID",
			queryParams: map[string]string{
				"id": "2",
			},
			setupMock: func(mock sqlmock.Sqlmock) {
				summaryRow := sqlmock.NewRows([]string{"id", "timestamp", "content"}).
					AddRow(2, time.Now(), "Specific summary content")
				mock.ExpectQuery("SELECT id, timestamp, content FROM Summaries WHERE id = \\$1 LIMIT 1").
					WithArgs(2).WillReturnRows(summaryRow)

				countRow := sqlmock.NewRows([]string{"count"}).AddRow(5)
				mock.ExpectQuery("SELECT COUNT").WillReturnRows(countRow)
			},
			expectedStatus: http.StatusOK,
			expectSummary:  true,
		},
		{
			name: "invalid ID parameter",
			queryParams: map[string]string{
				"id": "invalid",
			},
			setupMock:      func(mock sqlmock.Sqlmock) {},
			expectedStatus: http.StatusBadRequest,
			expectSummary:  false,
		},
		{
			name:        "summary not found",
			queryParams: map[string]string{},
			setupMock: func(mock sqlmock.Sqlmock) {
				mock.ExpectQuery("SELECT id, timestamp, content FROM Summaries ORDER BY timestamp DESC LIMIT 1").
					WillReturnError(sql.ErrNoRows)
			},
			expectedStatus: http.StatusNotFound,
			expectSummary:  false,
		},
		{
			name: "specific summary not found",
			queryParams: map[string]string{
				"id": "999",
			},
			setupMock: func(mock sqlmock.Sqlmock) {
				mock.ExpectQuery("SELECT id, timestamp, content FROM Summaries WHERE id = \\$1 LIMIT 1").
					WithArgs(999).WillReturnError(sql.ErrNoRows)
			},
			expectedStatus: http.StatusNotFound,
			expectSummary:  false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			server, mock := createTestServer(t)
			defer server.db.Close()

			tt.setupMock(mock)

			req := httptest.NewRequest("GET", "/api/v0/summary", nil)
			q := req.URL.Query()
			for key, value := range tt.queryParams {
				q.Add(key, value)
			}
			req.URL.RawQuery = q.Encode()

			rr := httptest.NewRecorder()
			server.getSummaryHandler(rr, req)

			assert.Equal(t, tt.expectedStatus, rr.Code)

			if tt.expectSummary {
				var response getSummaryHandlerResponse
				err := json.Unmarshal(rr.Body.Bytes(), &response)
				assert.NoError(t, err)
				assert.NotNil(t, response.Summary)
				assert.Greater(t, response.Total, 0)
				assert.Equal(t, "application/json", rr.Header().Get("Content-Type"))
			}

			assert.NoError(t, mock.ExpectationsWereMet())
		})
	}
}

func TestGetSummaryByID(t *testing.T) {
	tests := []struct {
		name          string
		summaryID     int
		setupMock     func(sqlmock.Sqlmock)
		expectedError bool
	}{
		{
			name:      "get latest summary (ID = -1)",
			summaryID: -1,
			setupMock: func(mock sqlmock.Sqlmock) {
				summaryRow := sqlmock.NewRows([]string{"id", "timestamp", "content"}).
					AddRow(1, time.Now(), "Latest summary content")
				mock.ExpectQuery("SELECT id, timestamp, content FROM Summaries ORDER BY timestamp DESC LIMIT 1").
					WillReturnRows(summaryRow)
			},
			expectedError: false,
		},
		{
			name:      "get specific summary",
			summaryID: 5,
			setupMock: func(mock sqlmock.Sqlmock) {
				summaryRow := sqlmock.NewRows([]string{"id", "timestamp", "content"}).
					AddRow(5, time.Now(), "Specific summary content")
				mock.ExpectQuery("SELECT id, timestamp, content FROM Summaries WHERE id = \\$1 LIMIT 1").
					WithArgs(5).WillReturnRows(summaryRow)
			},
			expectedError: false,
		},
		{
			name:      "summary not found",
			summaryID: 999,
			setupMock: func(mock sqlmock.Sqlmock) {
				mock.ExpectQuery("SELECT id, timestamp, content FROM Summaries WHERE id = \\$1 LIMIT 1").
					WithArgs(999).WillReturnError(sql.ErrNoRows)
			},
			expectedError: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			server, mock := createTestServer(t)
			defer server.db.Close()

			tt.setupMock(mock)

			summary, err := server.getSummaryByID(tt.summaryID)

			if tt.expectedError {
				assert.Error(t, err)
				assert.Nil(t, summary)
			} else {
				assert.NoError(t, err)
				assert.NotNil(t, summary)
				assert.NotEmpty(t, summary.Content)
			}

			assert.NoError(t, mock.ExpectationsWereMet())
		})
	}
}

func TestGetSummaryCount(t *testing.T) {
	tests := []struct {
		name          string
		setupMock     func(sqlmock.Sqlmock)
		expectedCount int
		expectedError bool
	}{
		{
			name: "successful count",
			setupMock: func(mock sqlmock.Sqlmock) {
				countRow := sqlmock.NewRows([]string{"count"}).AddRow(42)
				mock.ExpectQuery("SELECT COUNT").WillReturnRows(countRow)
			},
			expectedCount: 42,
			expectedError: false,
		},
		{
			name: "database error",
			setupMock: func(mock sqlmock.Sqlmock) {
				mock.ExpectQuery("SELECT COUNT").WillReturnError(sql.ErrConnDone)
			},
			expectedCount: 0,
			expectedError: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			server, mock := createTestServer(t)
			defer server.db.Close()

			tt.setupMock(mock)

			count, err := server.getSummaryCount()

			if tt.expectedError {
				assert.Error(t, err)
				assert.Equal(t, 0, count)
			} else {
				assert.NoError(t, err)
				assert.Equal(t, tt.expectedCount, count)
			}

			assert.NoError(t, mock.ExpectationsWereMet())
		})
	}
}
