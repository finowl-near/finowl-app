package app

import (
	"finowl-ai-assistant/internal/api"
	"finowl-ai-assistant/internal/config"
	"finowl-ai-assistant/internal/handlers"
	"finowl-ai-assistant/pkg/ai"
	"finowl-ai-assistant/pkg/feedstock"
	"finowl-ai-assistant/pkg/near"
	"fmt"
	"log"
	"os"
)

// App is the main application container
type App struct {
	Config          *config.AppConfig
	AIClient        ai.AIClient
	FeedstockClient *feedstock.Client
	MarketAnalyzer  *ai.MarketAnalyzer
	Handler         *handlers.Handler
	APIHandler      *api.Handler
	NearClient      *near.Client
	Summaries       []feedstock.Summary
}

// NewApp creates and initializes a new application
func NewApp() (*App, error) {
	// Load configuration
	cfg := config.LoadConfig()

	// Validate configuration
	validationResult := cfg.Validate()
	if !validationResult.Valid {
		return nil, fmt.Errorf("invalid configuration")
	}

	// Create AI client
	var aiClient ai.AIClient
	if cfg.AI.APIKey == "" {
		log.Println("⚠️ Warning: AI API key not set, using mock client for development")
		aiClient = ai.NewMockClient()
	} else {
		log.Printf("✅ Using AI API with endpoint: %s", cfg.AI.Endpoint)
		aiClient = ai.NewClient(cfg.AI.APIKey, cfg.AI.Endpoint, cfg.AI.Model)
	}

	// Create market analyzer
	marketAnalyzer := ai.NewMarketAnalyzer(aiClient)

	// Configure market analyzer with application settings
	marketAnalyzer.Configure(cfg.ResourcePaths.PromptsPath, cfg.AI.Model)

	// Create feedstock client
	feedstockClient := feedstock.NewClient(
		cfg.Feedstock.APIBaseURL,
		cfg.Feedstock.SummaryPath,
		cfg.Feedstock.HTTPTimeout,
	)

	// Fetch summaries
	summaries, err := fetchSummaries(feedstockClient, cfg.Feedstock.SummaryCount)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch summaries: %w", err)
	}

	// Create handler
	handler := handlers.NewHandler(marketAnalyzer, summaries)

	// Create NEAR client
	var nearClient *near.Client
	var apiHandler *api.Handler

	if cfg.NEAR.UserAccountID != "" && cfg.NEAR.UserPrivateKey != "" &&
		cfg.NEAR.OwnerAccountID != "" && cfg.NEAR.OwnerPrivateKey != "" &&
		cfg.NEAR.ContractID != "" && cfg.NEAR.RPCURL != "" {
		nearClient, err = near.NewClient(
			cfg.NEAR.UserAccountID,
			cfg.NEAR.UserPrivateKey,
			cfg.NEAR.OwnerAccountID,
			cfg.NEAR.OwnerPrivateKey,
			cfg.NEAR.ContractID,
			cfg.NEAR.RPCURL,
		)
		if err != nil {
			log.Printf("⚠️ Warning: Failed to initialize NEAR client: %v", err)
			log.Println("NEAR blockchain functionality will not be available")
			// Continue without NEAR functionality
		} else {
			// Create API handler only if NEAR client was created successfully
			apiHandler = api.NewHandler(nearClient)
		}
	} else {
		log.Println("⚠️ Warning: NEAR configuration incomplete, blockchain features will be unavailable")
	}

	return &App{
		Config:          cfg,
		AIClient:        aiClient,
		FeedstockClient: feedstockClient,
		MarketAnalyzer:  marketAnalyzer,
		Handler:         handler,
		APIHandler:      apiHandler,
		NearClient:      nearClient,
		Summaries:       summaries,
	}, nil
}

// fetchSummaries fetches the latest summaries with error handling and fallback
func fetchSummaries(client *feedstock.Client, count int) ([]feedstock.Summary, error) {
	// Try to get the last summary ID
	lastID, err := client.GetLastSummaryID()
	if err != nil {
		log.Printf("Warning: Failed to get last summary ID: %v", err)
		log.Printf("Using default ID of %d for summaries", count)
		lastID = count // Fallback to using the count as the last ID
	}

	// Fetch the latest summaries
	summaries, err := client.FetchSummaries(lastID, count)
	if err != nil {
		return nil, err
	}

	log.Printf("Fetched %d summaries for analysis", len(summaries))
	return summaries, nil
}

// EnsureDirs creates necessary directories if they don't exist
func (a *App) EnsureDirs() error {
	// Ensure prompts directory exists
	promptsDir := a.Config.ResourcePaths.PromptsPath
	if _, err := os.Stat(promptsDir); os.IsNotExist(err) {
		log.Printf("Creating prompts directory: %s", promptsDir)
		if err := os.MkdirAll(promptsDir, 0755); err != nil {
			return fmt.Errorf("failed to create prompts directory: %w", err)
		}
	}

	return nil
}
