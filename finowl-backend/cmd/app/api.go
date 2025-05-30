package main

import (
	"context"
	"database/sql"
	"encoding/json"
	"errors"
	"finowl-backend/ai"
	"finowl-backend/pkg/analyzer"
	"finowl-backend/pkg/mindshare"
	"finowl-backend/pkg/ticker"
	"fmt"
	"log"
	"log/slog"
	"net/http"
	"strings"
	"time"
)

func logMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		slog.Info("req", "method", r.Method, "uri", r.RequestURI)
		next.ServeHTTP(w, r)
	})
}

func corsMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		origin := r.Header.Get("Origin")

		// Allow localhost and your production domains
		allowedOrigins := map[string]bool{
			"http://localhost:3000":  true,
			"https://finowl.finance": true,
			"http://finowl.finance":  true,
		}

		if allowedOrigins[origin] {
			w.Header().Set("Access-Control-Allow-Origin", origin)
			w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
			w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
			w.Header().Set("Access-Control-Allow-Credentials", "true")
		}

		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}

		next.ServeHTTP(w, r)
	})
}

type server struct {
	db *sql.DB

	aiClient *ai.AI
	aiPrompt string
}

type serverConfig struct {
	dbHost     string
	dbPort     string
	dbUser     string
	dbPassword string
	dbName     string
	sslmode    string

	aiPrompt             string
	aiAPIKey             string
	aiGenSummaryInterval time.Duration
}

type getTickersHandlerResponse struct {
	Tickers      []ticker.Ticker `json:"tickers"`
	TotalPageCnt int             `json:"total_page_cnt"`
	Page         int             `json:"page"`
	PageSize     int             `json:"page_size"`
}

type getSummaryHandlerResponse struct {
	Summary *mindshare.Summary `json:"summary"`
	Total   int                `json:"total"`
}

const maxPageSize = 1024

var (
	errNewServer         = errors.New("failed to create new server")
	errGetTickers        = errors.New("failed to retrieve tickers")
	errGetTickersCount   = errors.New("failed to retrieve tickers count")
	errGetSummary        = errors.New("failed to retrieve summary")
	errGetSummariesCount = errors.New("failed to retrieve summaries count")
	errGetMentions       = errors.New("failed to retrieve mentions")
)

// Common helper function to process ticker rows and reduce code duplication
func processTickers(rows *sql.Rows) ([]ticker.Ticker, error) {
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

		// Filter out any tickers that look like monetary values (e.g., "50mil", "100k", etc.)
		// This prevents old bad data from being returned by the API
		if isValidTickerSymbol(t.TickerSymbol) {
			tickers = append(tickers, t)
		}
	}

	return tickers, nil
}

// isValidTickerSymbol checks if a ticker symbol is valid (not a monetary value)
func isValidTickerSymbol(symbol string) bool {
	// Add dollar sign prefix to reuse existing monetary detection logic
	withDollarSign := "$" + symbol
	return !analyzer.IsMonetaryValue(withDollarSign)
}

func newServer(cfg serverConfig) (*server, error) {
	db, err := sql.Open("postgres", fmt.Sprintf("host=%s port=%s user=%s password=%s dbname=%s sslmode=%s",
		cfg.dbHost, cfg.dbPort, cfg.dbUser, cfg.dbPassword, cfg.dbName, cfg.sslmode))
	if err != nil {
		return nil, fmt.Errorf("%w: %w", errNewServer, err)
	}

	if err := db.Ping(); err != nil {
		return nil, fmt.Errorf("%w: %w", errNewServer, err)
	}

	return &server{
		db:       db,
		aiClient: ai.NewDeepSeekAI(cfg.aiAPIKey),
		aiPrompt: cfg.aiPrompt,
	}, nil
}

func (s *server) generateSummary() error {
	type tweet struct {
		id      string
		author  string
		content string
	}

	log.Println("Started summary generation")

	// Query to get the latest 150 tweets
	rows, err := s.db.Query(queryGetLatestTweets)
	if err != nil {
		return fmt.Errorf("%w: %w", errGetTickers, err)
	}
	defer rows.Close() // Ensure rows are closed after processing

	tweets := strings.Builder{}
	var firstTweetID, lastTweetID string
	tweetCount := 0

	for rows.Next() {
		var t tweet
		if err := rows.Scan(&t.id, &t.author, &t.content); err != nil {
			return fmt.Errorf("%w: %w", errGetTickers, err)
		}

		// Log the first tweet ID
		if tweetCount == 0 {
			firstTweetID = t.id
		}
		lastTweetID = t.id // Update last tweet ID on each iteration

		tweets.WriteString(t.author)
		tweets.WriteString(": ")
		tweets.WriteString(t.content)
		tweetCount++
	}

	// Log the number of tweets processed and the first and last tweet IDs
	log.Printf("Processed %d tweets. First tweet ID: %s, Last tweet ID: %s", tweetCount, firstTweetID, lastTweetID)

	summary, err := s.aiClient.AnalyzeTweets(context.Background(), s.aiPrompt, tweets.String())
	if err != nil {
		return fmt.Errorf("%w: %w", errGetTickers, err)
	}

	if _, err := s.db.Exec(queryInsertSummary, time.Now(), summary); err != nil {
		return fmt.Errorf("%w: %w", errGetTickers, err)
	}

	log.Println("Finished summary generation")

	return nil
}

func RunAPIServer(cfg serverConfig) {
	slog.Info("starting API server")

	server, err := newServer(cfg)
	if err != nil {
		log.Fatal(err)
	}

	http.Handle("GET /api/v0/tickers", corsMiddleware(logMiddleware(http.HandlerFunc(server.getTickersHandler))))
	http.Handle("GET /api/v0/summary", corsMiddleware(logMiddleware(http.HandlerFunc(server.getSummaryHandler))))
	http.Handle("GET /api/v0/fresh-mentions", corsMiddleware(logMiddleware(http.HandlerFunc(server.getFreshMentionsHandler))))
	http.Handle("GET /api/v0/recent-momentum", corsMiddleware(logMiddleware(http.HandlerFunc(server.getRecentMomentumHandler))))
	http.Handle("GET /api/v0/revived-interest", corsMiddleware(logMiddleware(http.HandlerFunc(server.getRevivedInterestHandler))))
	http.Handle("GET /api/v0/generic-discovery", corsMiddleware(logMiddleware(http.HandlerFunc(server.getGenericDiscoveryHandler))))

	go func() {
		ticker := time.NewTicker(cfg.aiGenSummaryInterval)
		defer ticker.Stop()

		for {
			if err := server.generateSummary(); err != nil {
				log.Printf("Error generating summary: %v", err)
			} else {
				log.Println("Summary generated successfully.")
			}
			<-ticker.C
		}
	}()

	log.Fatal(http.ListenAndServe(":8080", nil))
}
