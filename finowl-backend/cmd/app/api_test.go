package main

import (
	"encoding/json"
	"finowl-backend/pkg/ticker"
	"testing"
	"time"

	"github.com/DATA-DOG/go-sqlmock"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestProcessTickers(t *testing.T) {
	tests := []struct {
		name          string
		setupMock     func(sqlmock.Sqlmock)
		expectedLen   int
		expectedError bool
	}{
		{
			name: "successful processing of tickers",
			setupMock: func(mock sqlmock.Sqlmock) {
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

				rows := sqlmock.NewRows([]string{
					"ticker_symbol", "category", "mindshare_score",
					"last_mentioned_at", "first_mentioned_at", "mention_details",
				}).AddRow(
					"BTC", "crypto", 85.5,
					time.Now(), time.Now(), string(mentionDetailsJSON),
				).AddRow(
					"ETH", "crypto", 92.3,
					time.Now(), time.Now(), string(mentionDetailsJSON),
				)
				mock.ExpectQuery("SELECT").WillReturnRows(rows)
			},
			expectedLen:   2,
			expectedError: false,
		},
		{
			name: "empty result set",
			setupMock: func(mock sqlmock.Sqlmock) {
				rows := sqlmock.NewRows([]string{
					"ticker_symbol", "category", "mindshare_score",
					"last_mentioned_at", "first_mentioned_at", "mention_details",
				})
				mock.ExpectQuery("SELECT").WillReturnRows(rows)
			},
			expectedLen:   0,
			expectedError: false,
		},
		{
			name: "invalid JSON in mention_details",
			setupMock: func(mock sqlmock.Sqlmock) {
				rows := sqlmock.NewRows([]string{
					"ticker_symbol", "category", "mindshare_score",
					"last_mentioned_at", "first_mentioned_at", "mention_details",
				}).AddRow(
					"BTC", "crypto", 85.5,
					time.Now(), time.Now(), "invalid json",
				)
				mock.ExpectQuery("SELECT").WillReturnRows(rows)
			},
			expectedLen:   0,
			expectedError: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// Create mock database
			db, mock, err := sqlmock.New()
			require.NoError(t, err)
			defer db.Close()

			// Setup mock expectations
			tt.setupMock(mock)

			// Execute query
			rows, err := db.Query("SELECT ticker_symbol, category, mindshare_score, last_mentioned_at, first_mentioned_at, mention_details FROM tickers_1_0")
			require.NoError(t, err)

			// Test processTickers
			tickers, err := processTickers(rows)

			if tt.expectedError {
				assert.Error(t, err)
			} else {
				assert.NoError(t, err)
				assert.Len(t, tickers, tt.expectedLen)

				// Verify structure if we have results
				if len(tickers) > 0 {
					assert.NotEmpty(t, tickers[0].TickerSymbol)
					assert.NotEmpty(t, tickers[0].Category)
					assert.Greater(t, tickers[0].MindshareScore, float64(0))
				}
			}

			// Ensure all expectations were met
			assert.NoError(t, mock.ExpectationsWereMet())
		})
	}
}

func TestProcessTickersFiltersMonetaryValues(t *testing.T) {
	tests := []struct {
		name            string
		setupMock       func(sqlmock.Sqlmock)
		expectedLen     int
		expectedTickers []string
	}{
		{
			name: "filters out monetary values from database results",
			setupMock: func(mock sqlmock.Sqlmock) {
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

				rows := sqlmock.NewRows([]string{
					"ticker_symbol", "category", "mindshare_score",
					"last_mentioned_at", "first_mentioned_at", "mention_details",
				}).AddRow(
					"BTC", "crypto", 85.5, // Valid ticker
					time.Now(), time.Now(), string(mentionDetailsJSON),
				).AddRow(
					"50mil", "crypto", 75.0, // Invalid - monetary value
					time.Now(), time.Now(), string(mentionDetailsJSON),
				).AddRow(
					"ETH", "crypto", 92.3, // Valid ticker
					time.Now(), time.Now(), string(mentionDetailsJSON),
				).AddRow(
					"100k", "crypto", 65.0, // Invalid - monetary value
					time.Now(), time.Now(), string(mentionDetailsJSON),
				)
				mock.ExpectQuery("SELECT").WillReturnRows(rows)
			},
			expectedLen:     2,
			expectedTickers: []string{"BTC", "ETH"}, // Only valid tickers should remain
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// Create mock database
			db, mock, err := sqlmock.New()
			require.NoError(t, err)
			defer db.Close()

			// Setup mock expectations
			tt.setupMock(mock)

			// Execute query
			rows, err := db.Query("SELECT ticker_symbol, category, mindshare_score, last_mentioned_at, first_mentioned_at, mention_details FROM tickers_1_0")
			require.NoError(t, err)

			// Test processTickers with filtering
			tickers, err := processTickers(rows)
			require.NoError(t, err)

			// Verify filtering worked
			assert.Len(t, tickers, tt.expectedLen)

			// Verify only valid tickers remain
			for i, expectedTicker := range tt.expectedTickers {
				assert.Equal(t, expectedTicker, tickers[i].TickerSymbol)
			}

			// Ensure all expectations were met
			assert.NoError(t, mock.ExpectationsWereMet())
		})
	}
}

func TestNewServer(t *testing.T) {
	tests := []struct {
		name        string
		config      serverConfig
		expectError bool
	}{
		{
			name: "valid configuration",
			config: serverConfig{
				dbHost:     "localhost",
				dbPort:     "5432",
				dbUser:     "test",
				dbPassword: "password",
				dbName:     "testdb",
				sslmode:    "disable",
				aiAPIKey:   "test-key",
				aiPrompt:   "test prompt",
			},
			expectError: true, // Will fail due to no actual DB connection
		},
		{
			name: "missing API key",
			config: serverConfig{
				dbHost:     "localhost",
				dbPort:     "5432",
				dbUser:     "test",
				dbPassword: "password",
				dbName:     "testdb",
				sslmode:    "disable",
				aiAPIKey:   "",
				aiPrompt:   "test prompt",
			},
			expectError: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			server, err := newServer(tt.config)

			if tt.expectError {
				assert.Error(t, err)
				assert.Nil(t, server)
			} else {
				assert.NoError(t, err)
				assert.NotNil(t, server)
				if server != nil {
					assert.NotNil(t, server.db)
					assert.NotNil(t, server.aiClient)
				}
			}
		})
	}
}
