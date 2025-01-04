package main

import (
	"finowl-backend/pkg/collector"
	"finowl-backend/pkg/influencer"
	"fmt"
	"log"
	"os"
	"os/signal"
	"syscall"

	"github.com/joho/godotenv"
	"gopkg.in/yaml.v2"
)

func main() {
	// Load .env file
	if err := godotenv.Load(); err != nil {
		log.Printf("Error loading .env file: %v", err)
	}

	token := os.Getenv("DISCORD_BOT_TOKEN")
	aikey := os.Getenv("CLAUDE_API")
	// alphaChannelID := os.Getenv("DISCORD_ALPHA_CHANNEL_ID")
	MacroNewsChannelID := os.Getenv("DISCORD_Macro_News_CHANNEL_ID")

	if token == "" || MacroNewsChannelID == "" {
		log.Fatal("DISCORD_BOT_TOKEN and DISCORD_CHANNEL_ID must be set")
	}

	myMap := make(map[string]string)

	// myMap[collector.AlphaTrenches] = alphaChannelID
	myMap[collector.MacroNews] = MacroNewsChannelID

	// Load the configuration
	config, err := LoadConfig("config.yaml")
	if err != nil {
		log.Fatalf("Failed to load config: %v", err)
	}

	// Initialize influencer rankings
	influencerRankings := influencer.InitInfluencers("influencers.yaml")

	// Initialize collector bot
	bot, err := collector.NewBot(token, myMap, *config, aikey, *influencerRankings)
	if err != nil {
		log.Fatal("Error creating bot:", err)
	}

	// Start the bot
	if err := bot.Start(); err != nil {
		log.Fatal("Error starting bot:", err)
	}

	fmt.Println("Bot is now running. Press CTRL-C to exit.")

	// Wait for interrupt signal
	sc := make(chan os.Signal, 1)
	signal.Notify(sc, syscall.SIGINT, syscall.SIGTERM)
	<-sc

	// Cleanly close down the Discord session
	bot.Close()
}

// LoadConfig reads the config.yaml file and unmarshals it into the Config struct
func LoadConfig(filePath string) (*collector.Config, error) {
	data, err := os.ReadFile(filePath)
	if err != nil {
		return nil, fmt.Errorf("error reading config file: %w", err)
	}

	var config collector.Config
	if err := yaml.Unmarshal(data, &config); err != nil {
		return nil, fmt.Errorf("error unmarshaling config: %w", err)
	}

	return &config, nil
}
