package main

import (
	"finowl-backend/internal/utils"
	"finowl-backend/pkg/collector"
	"finowl-backend/pkg/influencer"
	"fmt"
	"log"
	"os"
	"time"
)

const (
	configFilePath      = "config.yaml"
	influencersFilePath = "influencers.yaml"
)

func main() {
	// Load and validate the configuration
	appConfig, err := utils.LoadAppConfig()
	if err != nil {
		log.Fatalf("Error loading config: %v", err)
	}

	// Load configuration
	config := utils.MustLoadConfig(configFilePath)

	// Initialize influencer rankings
	influencerRankings := utils.MustInitInfluencers(influencersFilePath)

	// Initialize bot
	bot := mustInitializeBot(*appConfig, config, influencerRankings)

	prompt, err := os.ReadFile("prompt.txt")
	if err != nil {
		log.Fatalln("error reading prompt file" + err.Error())
	}

	summaryGenInterval, err := time.ParseDuration(appConfig.AIGenSummaryInterval)
	if err != nil {
		log.Fatalln("error parsing AIGenSummaryInterval: ", err)
	}

	cfg := utils.NewDBConfig(*appConfig)
	go RunAPIServer(serverConfig{
		dbHost:               cfg.Host,
		dbPort:               cfg.Port,
		dbUser:               cfg.User,
		dbPassword:           cfg.Password,
		dbName:               cfg.DBName,
		sslmode:              "disable",
		aiAPIKey:             appConfig.ClaudeAPIKey,
		aiPrompt:             string(prompt),
		aiGenSummaryInterval: summaryGenInterval,
	})

	// Start the bot
	startBot(bot)

	// Wait for graceful shutdown
	waitForShutdown(bot)
}

// mustInitializeBot creates and configures the bot instance. Exits on error.
func mustInitializeBot(appConfig utils.AppConfig, config *utils.Prompt, influencerRankings *influencer.InfluencerRankings) *collector.Bot {

	storer, err := utils.InitDB(utils.NewDBConfig(appConfig))
	if err != nil {
		log.Fatalf("Failed to create storer: %v", err)
	}

	bot, err := collector.NewBot(
		appConfig,
		*config,
		*influencerRankings,
		storer,
	)
	if err != nil {
		log.Fatalf("Error creating bot: %v", err)
	}

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
