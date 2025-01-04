package utils

import (
	"log"
	"os"

	"github.com/joho/godotenv"
)

const (
	// Discord related constants
	envDiscordBotToken    = "DISCORD_BOT_TOKEN"
	envMacroNewsChannelID = "DISCORD_Macro_News_CHANNEL_ID"

	// AI API related constants
	envClaudeAPIKey = "CLAUDE_API"

	// Database related constants
	envDBHost     = "FINOWL_DB_HOST"
	envDBPort     = "FINOWL_DB_PORT"
	envDBUser     = "FINOWL_DB_USER"
	envDBPassword = "FINOWL_DB_PASSWORD"
	envDBName     = "FINOWL_DB_NAME"
)

// loadEnvVars loads environment variables from the .env file and retrieves required ones.
func LoadEnvVars() map[string]string {
	if err := godotenv.Load(); err != nil {
		log.Printf("Error loading .env file: %v", err)
	}

	return map[string]string{
		// Discord related vars
		"token":         os.Getenv(envDiscordBotToken),
		"macroNewsChan": os.Getenv(envMacroNewsChannelID),

		// AI API related constants
		"aikey": os.Getenv(envClaudeAPIKey),

		// Database related vars
		"dbHost":     os.Getenv(envDBHost),
		"dbPort":     os.Getenv(envDBPort),
		"dbUser":     os.Getenv(envDBUser),
		"dbPassword": os.Getenv(envDBPassword),
		"dbName":     os.Getenv(envDBName),
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
