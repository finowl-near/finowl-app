package main

import (
	"fmt"
	"strings"
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestQuerySyntax(t *testing.T) {
	tests := []struct {
		name  string
		query string
	}{
		{"queryGetTickers", queryGetTickers},
		{"queryGetTickersCount", queryGetTickersCount},
		{"queryGetSummaryLatest", queryGetSummaryLatest},
		{"queryGetSummaryByID", queryGetSummaryByID},
		{"queryGetSummaryCount", queryGetSummaryCount},
		{"queryFreshMentions", queryFreshMentions},
		{"queryRecentMomentum", queryRecentMomentum},
		{"queryRevivedInterest", queryRevivedInterest},
		{"queryGenericDiscovery", queryGenericDiscovery},
		{"queryGenericDiscoveryCount", queryGenericDiscoveryCount},
		{"queryGetLatestTweets", queryGetLatestTweets},
		{"queryInsertSummary", queryInsertSummary},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// Basic syntax checks
			assert.NotEmpty(t, tt.query, "Query should not be empty")
			assert.True(t, strings.Contains(strings.ToUpper(tt.query), "SELECT") ||
				strings.Contains(strings.ToUpper(tt.query), "INSERT"),
				"Query should contain SELECT or INSERT")

			// Check for common SQL injection vulnerabilities
			assert.False(t, strings.Contains(tt.query, "--"), "Query should not contain SQL comments")
			assert.False(t, strings.Contains(tt.query, ";--"), "Query should not contain dangerous patterns")
		})
	}
}

func TestQueryParameters(t *testing.T) {
	tests := []struct {
		name           string
		query          string
		expectedParams int
	}{
		{"queryGetTickers", queryGetTickers, 2},             // LIMIT $1 OFFSET $2
		{"queryGetTickersCount", queryGetTickersCount, 0},   // No parameters
		{"queryGetSummaryByID", queryGetSummaryByID, 1},     // WHERE id = $1
		{"queryGenericDiscovery", queryGenericDiscovery, 2}, // LIMIT $1 OFFSET $2
		{"queryInsertSummary", queryInsertSummary, 2},       // VALUES ($1, $2)
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// Count parameter placeholders
			paramCount := 0
			for i := 1; i <= 10; i++ {
				if strings.Contains(tt.query, fmt.Sprintf("$%d", i)) {
					paramCount++
				}
			}
			assert.Equal(t, tt.expectedParams, paramCount,
				"Query should have expected number of parameters")
		})
	}
}

func TestTimeBasedQueries(t *testing.T) {
	timeBasedQueries := []struct {
		name     string
		query    string
		interval string
	}{
		{"queryFreshMentions", queryFreshMentions, "6 hours"},
		{"queryRecentMomentum", queryRecentMomentum, "24 hours"},
		{"queryRevivedInterest", queryRevivedInterest, "7 days"},
		{"queryGenericDiscovery", queryGenericDiscovery, "3 days"},
	}

	for _, tt := range timeBasedQueries {
		t.Run(tt.name, func(t *testing.T) {
			assert.Contains(t, tt.query, "NOW() - INTERVAL",
				"Time-based query should use NOW() - INTERVAL")
			assert.Contains(t, tt.query, tt.interval,
				"Query should contain expected time interval")
		})
	}
}

func TestQueryStructure(t *testing.T) {
	// Test that all ticker queries have consistent column selection
	tickerQueries := []string{
		queryGetTickers,
		queryFreshMentions,
		queryRecentMomentum,
		queryRevivedInterest,
		queryGenericDiscovery,
	}

	expectedColumns := []string{
		"ticker_symbol",
		"category",
		"mindshare_score",
		"last_mentioned_at",
		"first_mentioned_at",
		"mention_details",
	}

	for i, query := range tickerQueries {
		t.Run(fmt.Sprintf("ticker_query_%d", i), func(t *testing.T) {
			for _, col := range expectedColumns {
				assert.Contains(t, query, col,
					"Ticker query should select all required columns")
			}
			assert.Contains(t, query, "FROM tickers_1_0",
				"Query should use correct table name")
		})
	}
}

func TestOrderByLogic(t *testing.T) {
	tests := []struct {
		name          string
		query         string
		expectedOrder string
	}{
		{"queryFreshMentions", queryFreshMentions, "ORDER BY first_mentioned_at DESC"},
		{"queryRecentMomentum", queryRecentMomentum, "ORDER BY mindshare_score DESC, last_mentioned_at DESC"},
		{"queryRevivedInterest", queryRevivedInterest, "ORDER BY last_mentioned_at DESC"},
		{"queryGenericDiscovery", queryGenericDiscovery, "ORDER BY mindshare_score DESC, last_mentioned_at DESC"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			assert.Contains(t, tt.query, tt.expectedOrder,
				"Query should have correct ORDER BY clause")
		})
	}
}

func TestLimitLogic(t *testing.T) {
	// Test that simple queries have LIMIT 20
	simpleQueries := []string{
		queryFreshMentions,
		queryRecentMomentum,
		queryRevivedInterest,
	}

	for i, query := range simpleQueries {
		t.Run(fmt.Sprintf("simple_query_limit_%d", i), func(t *testing.T) {
			assert.Contains(t, query, "LIMIT 20",
				"Simple queries should have LIMIT 20")
		})
	}

	// Test that paginated queries use parameters
	paginatedQueries := []string{
		queryGetTickers,
		queryGenericDiscovery,
	}

	for i, query := range paginatedQueries {
		t.Run(fmt.Sprintf("paginated_query_limit_%d", i), func(t *testing.T) {
			assert.Contains(t, query, "LIMIT $1 OFFSET $2",
				"Paginated queries should use parameterized LIMIT/OFFSET")
		})
	}
}
