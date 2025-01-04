package utils

import (
	"log"
	"os"

	"github.com/joho/godotenv"
)

const (
	envDiscordBotToken    = "DISCORD_BOT_TOKEN"
	envClaudeAPIKey       = "CLAUDE_API"
	envMacroNewsChannelID = "DISCORD_Macro_News_CHANNEL_ID"
)

// loadEnvVars loads environment variables from the .env file and retrieves required ones.
func LoadEnvVars() map[string]string {
	if err := godotenv.Load(); err != nil {
		log.Printf("Error loading .env file: %v", err)
	}

	return map[string]string{
		"token":         os.Getenv(envDiscordBotToken),
		"aikey":         os.Getenv(envClaudeAPIKey),
		"macroNewsChan": os.Getenv(envMacroNewsChannelID),
	}
}

// validateEnvVars ensures all required environment variables are set.
func ValidateEnvVars(vars map[string]string) {
	if vars["token"] == "" || vars["macroNewsChan"] == "" {
		log.Fatal("Environment variables DISCORD_BOT_TOKEN and DISCORD_Macro_News_CHANNEL_ID must be set")
	}
}

// LoadEnv loads the environment variables from a .env file.
func LoadEnv() {
	if err := godotenv.Load(); err != nil {
		log.Printf("Error loading .env file: %v", err)
	}
}

// GetRequiredEnv retrieves the value of a required environment variable.
func GetRequiredEnv(key string) string {
	value := os.Getenv(key)
	if value == "" {
		log.Fatalf("Environment variable %s must be set", key)
	}
	return value
}
