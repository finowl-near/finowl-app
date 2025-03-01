package main

import (
	"context"
	"database/sql"
	"encoding/json"
	"errors"
	"finowl-backend/ai"
	"finowl-backend/pkg/mindshare"
	"finowl-backend/pkg/ticker"
	"fmt"
	"log"
	"log/slog"
	"net/http"
	"strconv"
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
		// Set CORS headers
		w.Header().Set("Access-Control-Allow-Origin", "http://localhost:3000") // Use specific domains instead of "*" in production
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")

		// Handle preflight requests
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}

		// Call the next handler
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
)

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

	query := fmt.Sprintf(`SELECT ticker_symbol, category, mindshare_score, last_mentioned_at, first_mentioned_at, mention_details 
FROM tickers_1_0 ORDER BY %s %s LIMIT $1 OFFSET $2`, orderBy, orderByDir)
	rows, err := s.db.Query(query, pageSize, pageSize*page)
	if err != nil {
		return nil, fmt.Errorf("%w: %w", errGetTickers, err)
	}

	tickers := []ticker.Ticker{}
	for rows.Next() {
		var t ticker.Ticker
		var mentionDetailsJSON string

		if err := rows.Scan(&t.TickerSymbol, &t.Category, &t.MindshareScore, &t.LastMentionedAt, &t.FirstMentionedAt, &mentionDetailsJSON); err != nil {
			return nil, fmt.Errorf("%w: %w", errGetTickers, err)
		}

		if err := json.Unmarshal([]byte(mentionDetailsJSON), &t.MentionDetails); err != nil {
			return nil, fmt.Errorf("%w: %w", errGetTickers, err)
		}

		tickers = append(tickers, t)
	}

	return tickers, nil
}

func (s *server) getTickersCount() (int, error) {
	count := 0
	if err := s.db.QueryRow("SELECT COUNT(*) FROM tickers_1_0").Scan(&count); err != nil {
		return 0, fmt.Errorf("%w: %w", errGetTickersCount, err)
	}

	return count, nil
}

func (s *server) getSummaryByID(id int) (*mindshare.Summary, error) {
	summary := &mindshare.Summary{}

	if id == -1 {
		queryStr := "SELECT * FROM Summaries ORDER BY timestamp DESC LIMIT 1"
		if err := s.db.QueryRow(queryStr).Scan(&summary.ID, &summary.Time, &summary.Content); err != nil {
			return nil, fmt.Errorf("%w: %w", errGetSummary, err)
		}

		return summary, nil
	}

	queryStr := "SELECT * FROM Summaries WHERE id = $1 LIMIT 1"
	if err := s.db.QueryRow(queryStr, id).Scan(&summary.ID, &summary.Time, &summary.Content); err != nil {
		return nil, fmt.Errorf("%w: %w", errGetSummary, err)
	}

	return summary, nil
}

func (s *server) getSummaryCount() (int, error) {
	count := 0
	if err := s.db.QueryRow("SELECT COUNT(*) FROM Summaries").Scan(&count); err != nil {
		return 0, fmt.Errorf("%w: %w", errGetSummariesCount, err)
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
	w.WriteHeader(200)

	if _, err := w.Write(body); err != nil {
		slog.Error(err.Error())

		return
	}
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

func (s *server) generateSummary() error {
	type tweet struct {
		author  string
		content string
	}

	log.Println("Started summary generation")

	rows, err := s.db.Query("SELECT author, content FROM tweets ORDER BY timestamp DESC LIMIT 100")
	if err != nil {
		return fmt.Errorf("%w: %w", errGetTickers, err)
	}

	tweets := strings.Builder{}
	for rows.Next() {
		var t tweet
		if err := rows.Scan(&t.author, &t.content); err != nil {
			return fmt.Errorf("%w: %w", errGetTickers, err)
		}

		tweets.WriteString(t.author)
		tweets.WriteString(": ")
		tweets.WriteString(t.content)
	}

	summary, err := s.aiClient.AnalyzeTweets(context.Background(), s.aiPrompt, tweets.String())
	if err != nil {
		return fmt.Errorf("%w: %w", errGetTickers, err)
	}

	if _, err := s.db.Exec("INSERT INTO Summaries (timestamp, content) VALUES ($1, $2)", time.Now(), summary); err != nil {
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

	go func() {
		ticker := time.NewTimer(cfg.aiGenSummaryInterval)
		defer ticker.Stop()

		for {
			if err := server.generateSummary(); err != nil {
				log.Println(err)
			}

			<-ticker.C
		}
	}()

	log.Fatal(http.ListenAndServe(":8080", nil))
}
