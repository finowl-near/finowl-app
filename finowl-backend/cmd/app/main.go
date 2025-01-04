package main

import (
	"finowl-backend/internal/utils"
	"finowl-backend/pkg/collector"
	"finowl-backend/pkg/influencer"
	"finowl-backend/pkg/storer"
	"fmt"
	"log"
	"os"

	"github.com/joho/godotenv"
)

const (
	configFilePath      = "config.yaml"
	influencersFilePath = "influencers.yaml"
)

func main() {
	// Load environment variables
	envVars := utils.LoadEnvVars()
	utils.ValidateEnvVars(envVars)

	// Database connection string using environment variables
	dataSourceName := fmt.Sprintf(
		"host=%s port=%s user=%s password=%s dbname=%s sslmode=disable",
		os.Getenv("FINOWL_DB_HOST"),
		os.Getenv("FINOWL_DB_PORT"),
		os.Getenv("FINOWL_DB_USER"),
		os.Getenv("FINOWL_DB_PASSWORD"),
		os.Getenv("FINOWL_DB_NAME"),
	)
	// Wait for database to be ready
	if err := utils.WaitForDB(dataSourceName, 30); err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}

	setup()

	// Load configuration
	config := utils.MustLoadConfig(configFilePath)

	// Initialize influencer rankings
	influencerRankings := utils.MustInitInfluencers(influencersFilePath)

	// Initialize bot
	bot := mustInitializeBot(envVars, config, influencerRankings)

	// Start the bot
	startBot(bot)

	// Wait for graceful shutdown
	waitForShutdown(bot)
}

// mustInitializeBot creates and configures the bot instance. Exits on error.
func mustInitializeBot(envVars map[string]string, config *collector.Config, influencerRankings *influencer.InfluencerRankings) *collector.Bot {
	channelMapping := map[string]string{
		collector.MacroNews: envVars["macroNewsChan"],
	}

	bot, err := collector.NewBot(envVars["token"], channelMapping, *config, envVars["aikey"], *influencerRankings)
	if err != nil {
		log.Fatalf("Error creating bot: %v", err)
	}

	dbConfig := utils.NewDBConfig(envVars)
	db, err := utils.InitDB(dbConfig)
	if err != nil {
		log.Fatalf("Failed to initialize database: %v", err)
	}
	defer db.Close()

	log.Printf("Successfully connected to database at %s:%s", dbConfig.Host, dbConfig.Port)

	return bot
}

// startBot starts the bot and logs any errors.
func startBot(bot *collector.Bot) {
	if err := bot.Start(); err != nil {
		log.Fatalf("Error starting bot: %v", err)
	}
	fmt.Println("Bot is now running. Press CTRL-C to exit.")
}

// waitForShutdown handles graceful shutdown on interrupt signals.
func waitForShutdown(bot *collector.Bot) {
	utils.WaitForShutdown()

	bot.Close()
	fmt.Println("Bot has been shut down gracefully.")
}

func setup() {
	// Use a test database connection string
	if err := godotenv.Load(); err != nil {
		log.Printf("Error loading .env file: %v", err)
	}
	// Change this line in setup()
	dataSourceName := fmt.Sprintf(
		"user=%s dbname=%s password=%s host=%s port=%s sslmode=disable",
		os.Getenv("FINOWL_DB_USER"),
		os.Getenv("FINOWL_DB_NAME"),
		os.Getenv("FINOWL_DB_PASSWORD"),
		os.Getenv("FINOWL_DB_HOST"), // This will be 'db' in Docker
		os.Getenv("FINOWL_DB_PORT"),
	)
	var err error
	testStorer, err := storer.NewStorer(dataSourceName)
	if err != nil {
		log.Fatalf("Failed to create storer: %v", err)
	}

	// Create the tweets table for testing
	_, err = testStorer.DB().Exec(`
		CREATE TABLE IF NOT EXISTS tweets (
			id UUID PRIMARY KEY,
			author VARCHAR(255),
			timestamp TIMESTAMP,
			content TEXT,
			links JSONB,
			tickers JSONB
		)`)
	if err != nil {
		log.Fatalf("Failed to create table: %v", err)
	}

	// Create a dummy tweet
	tweet := storer.Tweet{
		ID:        "72ab8cc2-2c92-4061-b0e7-86424cbe8754",
		Author:    "Test Author",
		Timestamp: "2024-12-30 10:00:00",
		Content:   "This is a test tweet.",
		Links:     []string{"https://example.com"},
		Tickers:   []string{"$TEST"},
	}

	// Insert the tweet into the database
	fmt.Println("insert tweet ..")
	err = testStorer.InsertTweet(tweet)
	if err != nil {
		log.Fatalf("Failed to insert tweet: %v", err)
	}

	// Retrieve the tweet from the database
	retrievedTweets, err := testStorer.GetTweets(tweet.Author)
	if err != nil {
		log.Fatalf("Failed to retrieve tweets: %v", err)
	}

	fmt.Println("==========")
	fmt.Println(retrievedTweets)
	fmt.Println("==========")
}
