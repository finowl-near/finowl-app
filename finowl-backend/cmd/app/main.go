package main

import (
	"finowl-backend/internal/utils"
	"finowl-backend/pkg/collector"
	"finowl-backend/pkg/influencer"
	"fmt"
	"log"
)

const (
	configFilePath      = "config.yaml"
	influencersFilePath = "influencers.yaml"
)

func main() {
	// Load environment variables
	envVars := utils.LoadEnvVars()
	utils.ValidateEnvVars(envVars)

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
