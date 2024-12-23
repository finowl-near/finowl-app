package main

import (
	"finowl-backend/pkg/collector"
	"fmt"
	"log"
	"os"
	"os/signal"
	"syscall"

	"github.com/joho/godotenv"
)

func main() {
	// Load .env file
	if err := godotenv.Load(); err != nil {
		log.Printf("Error loading .env file: %v", err)
	}

	token := os.Getenv("DISCORD_BOT_TOKEN")
	channelID := os.Getenv("DISCORD_CHANNEL_ID")

	if token == "" || channelID == "" {
		log.Fatal("DISCORD_BOT_TOKEN and DISCORD_CHANNEL_ID must be set")
	}

	// Initialize collector bot
	bot, err := collector.NewBot(token, channelID)
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
