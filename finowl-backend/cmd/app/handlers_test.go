package main

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"finowl-backend/pkg/ticker"

	"github.com/DATA-DOG/go-sqlmock"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// Helper function to create a test server with mocked database
func createTestServer(t *testing.T) (*server, sqlmock.Sqlmock) {
	db, mock, err := sqlmock.New()
	require.NoError(t, err)

	server := &server{
		db:       db,
		aiPrompt: "test prompt",
	}

	return server, mock
}

// Helper function to create sample ticker data
func createSampleTickers() []ticker.Ticker {
	mentionDetails := ticker.MentionDetails{
		Influencers: map[string]ticker.MentionDetail{
			"test_user": {
				Tier:      1,
				TweetLink: "https://twitter.com/test_user/status/123",
				Content:   "Test content about crypto",
			},
		},
	}

	return []ticker.Ticker{
		{
			TickerSymbol:     "BTC",
			Category:         "crypto",
			MindshareScore:   85.5,
			LastMentionedAt:  time.Now(),
			FirstMentionedAt: time.Now(),
			MentionDetails:   mentionDetails,
		},
		{
			TickerSymbol:     "ETH",
			Category:         "crypto",
			MindshareScore:   92.3,
			LastMentionedAt:  time.Now(),
			FirstMentionedAt: time.Now(),
			MentionDetails:   mentionDetails,
		},
	}
}

func TestGetTickersHandler(t *testing.T) {
	tests := []struct {
		name           string
		queryParams    map[string]string
		setupMock      func(sqlmock.Sqlmock)
		expectedStatus int
		expectedLen    int
	}{
		{
			name:        "successful request with default params",
			queryParams: map[string]string{},
			setupMock: func(mock sqlmock.Sqlmock) {
				sampleTickers := createSampleTickers()
				mentionDetailsJSON, _ := json.Marshal(sampleTickers[0].MentionDetails)

				// Mock the query for getting tickers
				rows := sqlmock.NewRows([]string{
					"ticker_symbol", "category", "mindshare_score",
					"last_mentioned_at", "first_mentioned_at", "mention_details",
				})
				for _, ticker := range sampleTickers {
					rows.AddRow(
						ticker.TickerSymbol, ticker.Category, ticker.MindshareScore,
						ticker.LastMentionedAt, ticker.FirstMentionedAt, string(mentionDetailsJSON),
					)
				}
				mock.ExpectQuery("SELECT ticker_symbol, category, mindshare_score").WillReturnRows(rows)

				// Mock the count query
				countRows := sqlmock.NewRows([]string{"count"}).AddRow(len(sampleTickers))
				mock.ExpectQuery("SELECT COUNT").WillReturnRows(countRows)
			},
			expectedStatus: http.StatusOK,
			expectedLen:    2,
		},
		{
			name: "request with custom page size",
			queryParams: map[string]string{
				"pageSize": "1",
				"page":     "0",
			},
			setupMock: func(mock sqlmock.Sqlmock) {
				sampleTickers := createSampleTickers()
				mentionDetailsJSON, _ := json.Marshal(sampleTickers[0].MentionDetails)

				rows := sqlmock.NewRows([]string{
					"ticker_symbol", "category", "mindshare_score",
					"last_mentioned_at", "first_mentioned_at", "mention_details",
				}).AddRow(
					sampleTickers[0].TickerSymbol, sampleTickers[0].Category, sampleTickers[0].MindshareScore,
					sampleTickers[0].LastMentionedAt, sampleTickers[0].FirstMentionedAt, string(mentionDetailsJSON),
				)
				mock.ExpectQuery("SELECT ticker_symbol, category, mindshare_score").WillReturnRows(rows)

				countRows := sqlmock.NewRows([]string{"count"}).AddRow(2)
				mock.ExpectQuery("SELECT COUNT").WillReturnRows(countRows)
			},
			expectedStatus: http.StatusOK,
			expectedLen:    1,
		},
		{
			name: "invalid page parameter",
			queryParams: map[string]string{
				"page": "invalid",
			},
			setupMock:      func(mock sqlmock.Sqlmock) {},
			expectedStatus: http.StatusBadRequest,
			expectedLen:    0,
		},
		{
			name: "invalid pageSize parameter",
			queryParams: map[string]string{
				"pageSize": "invalid",
			},
			setupMock:      func(mock sqlmock.Sqlmock) {},
			expectedStatus: http.StatusBadRequest,
			expectedLen:    0,
		},
		{
			name: "pageSize too large",
			queryParams: map[string]string{
				"pageSize": "2000",
			},
			setupMock:      func(mock sqlmock.Sqlmock) {},
			expectedStatus: http.StatusBadRequest,
			expectedLen:    0,
		},
		{
			name: "negative page",
			queryParams: map[string]string{
				"page": "-1",
			},
			setupMock:      func(mock sqlmock.Sqlmock) {},
			expectedStatus: http.StatusBadRequest,
			expectedLen:    0,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			server, mock := createTestServer(t)
			defer server.db.Close()

			tt.setupMock(mock)

			// Create request with query parameters
			req := httptest.NewRequest("GET", "/api/v0/tickers", nil)
			q := req.URL.Query()
			for key, value := range tt.queryParams {
				q.Add(key, value)
			}
			req.URL.RawQuery = q.Encode()

			// Create response recorder
			rr := httptest.NewRecorder()

			// Call the handler
			server.getTickersHandler(rr, req)

			// Check status code
			assert.Equal(t, tt.expectedStatus, rr.Code)

			// Check response for successful requests
			if tt.expectedStatus == http.StatusOK {
				var response getTickersHandlerResponse
				err := json.Unmarshal(rr.Body.Bytes(), &response)
				assert.NoError(t, err)
				assert.Len(t, response.Tickers, tt.expectedLen)
				assert.Equal(t, "application/json", rr.Header().Get("Content-Type"))
			}

			// Ensure all expectations were met
			assert.NoError(t, mock.ExpectationsWereMet())
		})
	}
}

func TestGetFreshMentionsHandler(t *testing.T) {
	tests := []struct {
		name           string
		setupMock      func(sqlmock.Sqlmock)
		expectedStatus int
		expectedLen    int
	}{
		{
			name: "successful request",
			setupMock: func(mock sqlmock.Sqlmock) {
				sampleTickers := createSampleTickers()
				mentionDetailsJSON, _ := json.Marshal(sampleTickers[0].MentionDetails)

				rows := sqlmock.NewRows([]string{
					"ticker_symbol", "category", "mindshare_score",
					"last_mentioned_at", "first_mentioned_at", "mention_details",
				})
				for _, ticker := range sampleTickers {
					rows.AddRow(
						ticker.TickerSymbol, ticker.Category, ticker.MindshareScore,
						ticker.LastMentionedAt, ticker.FirstMentionedAt, string(mentionDetailsJSON),
					)
				}
				mock.ExpectQuery("SELECT ticker_symbol, category, mindshare_score").WillReturnRows(rows)
			},
			expectedStatus: http.StatusOK,
			expectedLen:    2,
		},
		{
			name: "empty result set",
			setupMock: func(mock sqlmock.Sqlmock) {
				rows := sqlmock.NewRows([]string{
					"ticker_symbol", "category", "mindshare_score",
					"last_mentioned_at", "first_mentioned_at", "mention_details",
				})
				mock.ExpectQuery("SELECT ticker_symbol, category, mindshare_score").WillReturnRows(rows)
			},
			expectedStatus: http.StatusOK,
			expectedLen:    0,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			server, mock := createTestServer(t)
			defer server.db.Close()

			tt.setupMock(mock)

			req := httptest.NewRequest("GET", "/api/v0/fresh-mentions", nil)
			rr := httptest.NewRecorder()

			server.getFreshMentionsHandler(rr, req)

			assert.Equal(t, tt.expectedStatus, rr.Code)

			if tt.expectedStatus == http.StatusOK {
				var response getTickersHandlerResponse
				err := json.Unmarshal(rr.Body.Bytes(), &response)
				assert.NoError(t, err)
				assert.Len(t, response.Tickers, tt.expectedLen)
				assert.Equal(t, 1, response.TotalPageCnt)
				assert.Equal(t, 0, response.Page)
				assert.Equal(t, "application/json", rr.Header().Get("Content-Type"))
			}

			assert.NoError(t, mock.ExpectationsWereMet())
		})
	}
}

func TestGetGenericDiscoveryHandler(t *testing.T) {
	tests := []struct {
		name           string
		queryParams    map[string]string
		setupMock      func(sqlmock.Sqlmock)
		expectedStatus int
		expectedLen    int
	}{
		{
			name: "successful request with pagination",
			queryParams: map[string]string{
				"pageSize": "5",
				"page":     "0",
			},
			setupMock: func(mock sqlmock.Sqlmock) {
				sampleTickers := createSampleTickers()
				mentionDetailsJSON, _ := json.Marshal(sampleTickers[0].MentionDetails)

				// Mock the main query
				rows := sqlmock.NewRows([]string{
					"ticker_symbol", "category", "mindshare_score",
					"last_mentioned_at", "first_mentioned_at", "mention_details",
				})
				for _, ticker := range sampleTickers {
					rows.AddRow(
						ticker.TickerSymbol, ticker.Category, ticker.MindshareScore,
						ticker.LastMentionedAt, ticker.FirstMentionedAt, string(mentionDetailsJSON),
					)
				}
				mock.ExpectQuery("SELECT ticker_symbol, category, mindshare_score").WillReturnRows(rows)

				// Mock the count query
				countRows := sqlmock.NewRows([]string{"count"}).AddRow(10)
				mock.ExpectQuery("SELECT COUNT").WillReturnRows(countRows)
			},
			expectedStatus: http.StatusOK,
			expectedLen:    2,
		},
		{
			name: "invalid pagination parameters",
			queryParams: map[string]string{
				"pageSize": "invalid",
			},
			setupMock:      func(mock sqlmock.Sqlmock) {},
			expectedStatus: http.StatusBadRequest,
			expectedLen:    0,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			server, mock := createTestServer(t)
			defer server.db.Close()

			tt.setupMock(mock)

			req := httptest.NewRequest("GET", "/api/v0/generic-discovery", nil)
			q := req.URL.Query()
			for key, value := range tt.queryParams {
				q.Add(key, value)
			}
			req.URL.RawQuery = q.Encode()

			rr := httptest.NewRecorder()
			server.getGenericDiscoveryHandler(rr, req)

			assert.Equal(t, tt.expectedStatus, rr.Code)

			if tt.expectedStatus == http.StatusOK {
				var response getTickersHandlerResponse
				err := json.Unmarshal(rr.Body.Bytes(), &response)
				assert.NoError(t, err)
				assert.Len(t, response.Tickers, tt.expectedLen)
				assert.Equal(t, "application/json", rr.Header().Get("Content-Type"))
			}

			assert.NoError(t, mock.ExpectationsWereMet())
		})
	}
}

// Benchmark tests
func BenchmarkProcessTickers(b *testing.B) {
	db, mock, err := sqlmock.New()
	require.NoError(b, err)
	defer db.Close()

	// Setup mock data
	mentionDetails := ticker.MentionDetails{
		Influencers: map[string]ticker.MentionDetail{
			"test_user": {
				Tier:      1,
				TweetLink: "https://twitter.com/test_user/status/123",
				Content:   "Test content",
			},
		},
	}
	mentionDetailsJSON, _ := json.Marshal(mentionDetails)

	for i := 0; i < b.N; i++ {
		rows := sqlmock.NewRows([]string{
			"ticker_symbol", "category", "mindshare_score",
			"last_mentioned_at", "first_mentioned_at", "mention_details",
		}).AddRow(
			"BTC", "crypto", 85.5,
			time.Now(), time.Now(), string(mentionDetailsJSON),
		)
		mock.ExpectQuery("SELECT").WillReturnRows(rows)

		queryRows, _ := db.Query("SELECT ticker_symbol, category, mindshare_score, last_mentioned_at, first_mentioned_at, mention_details FROM tickers_1_0")
		processTickers(queryRows)
	}
}
