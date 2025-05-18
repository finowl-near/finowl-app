package app

import (
	"finowl-ai-assistant/internal/api"
	"finowl-ai-assistant/internal/config"
	"finowl-ai-assistant/internal/handlers"
	"finowl-ai-assistant/internal/session"
	"finowl-ai-assistant/pkg/ai"
	netconfig "finowl-ai-assistant/pkg/config"
	"finowl-ai-assistant/pkg/feedstock"
	"finowl-ai-assistant/pkg/near"

	"fmt"
	"log"
	"os"
	"time"
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
	NetworkConfig   *netconfig.Config
	SessionManager  *session.ChatSessionManager
}

// NewApp creates and initializes a new application
func NewApp(networkType string) (*App, error) {
	// Load configuration
	cfg := config.LoadConfig()

	// Load network configuration
	netCfg, err := netconfig.LoadConfig(networkType)
	if err != nil {
		return nil, fmt.Errorf("failed to load network configuration: %w", err)
	}

	log.Printf("🔧 Network configuration: Network=%s, Contract=%s",
		netCfg.Network, netCfg.ContractName)

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

	// Create session manager (2-hour TTL)
	sessionTTL := 2 * time.Hour
	sessionManager := session.NewChatSessionManager(sessionTTL)

	// Create market chatter (chat logic)
	marketChatter := ai.NewMarketChatter(sessionManager, aiClient, cfg.AI.Model)

	// Create handler
	handler := handlers.NewHandler(marketAnalyzer, summaries, marketChatter, sessionManager)

	// Create NEAR client (optional)
	var nearClient *near.Client
	var apiHandler *api.Handler

	if netCfg.PrivateKey == "" {
		log.Printf("⚠️ Warning: No private key found for %s network", netCfg.Network)
		log.Println("⚠️ Warning: NEAR blockchain functionality will not be available")
	} else {
		nearClient, err = near.NewClient(
			netCfg.OwnerAccountID,
			netCfg.PrivateKey,
			netCfg.ContractName,
			netCfg.RPCURL,
		)

		if err != nil {
			log.Printf("⚠️ Warning: Failed to initialize NEAR client: %v", err)
		} else {
			apiHandler = api.NewHandler(nearClient)
			log.Printf("✅ NEAR client initialized for network %s with contract %s and owner %s",
				netCfg.Network, netCfg.ContractName, netCfg.OwnerAccountID)
		}
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
		NetworkConfig:   netCfg,
		SessionManager:  sessionManager,
	}, nil
}

// fetchSummaries fetches the latest summaries with error handling and fallback
func fetchSummaries(client *feedstock.Client, count int) ([]feedstock.Summary, error) {
	log.Printf("🔍 Attempting to fetch %d summaries...", count)

	lastID, err := client.GetLastSummaryID()
	if err != nil {
		log.Printf("⚠️ Warning: Failed to get last summary ID: %v", err)
		lastID = count
	} else {
		log.Printf("✅ Successfully retrieved last summary ID: %d", lastID)
	}

	log.Printf("🔍 Fetching %d summaries from ID %d...", count, lastID)
	startTime := time.Now()

	summaries, err := client.FetchSummaries(lastID, count)
	if err != nil {
		log.Printf("❌ Failed to fetch summaries: %v", err)
		return nil, err
	}

	log.Printf("✅ Fetched %d summaries in %v", len(summaries), time.Since(startTime))
	return summaries, nil
}

// EnsureDirs creates necessary directories if they don't exist
func (a *App) EnsureDirs() error {
	promptsDir := a.Config.ResourcePaths.PromptsPath
	if _, err := os.Stat(promptsDir); os.IsNotExist(err) {
		log.Printf("Creating prompts directory: %s", promptsDir)
		if err := os.MkdirAll(promptsDir, 0755); err != nil {
			return fmt.Errorf("failed to create prompts directory: %w", err)
		}
	}
	return nil
}
