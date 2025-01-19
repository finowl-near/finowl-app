package utils

import (
	"fmt"
	"log"
	"os"

	"github.com/joho/godotenv"
)

// Constants for environment variable keys
const (
	// Discord related constants
	discordTokenKey = "DISCORD_BOT_TOKEN"
	channelIDKey    = "DISCORD_Macro_News_CHANNEL_ID"

	// AI API related constants
	claudeAPIKeyKey = "CLAUDE_API"

	// Database related constants
	dbHostKey     = "FINOWL_DB_HOST"
	dbPortKey     = "FINOWL_DB_PORT"
	dbUserKey     = "FINOWL_DB_USER"
	dbPasswordKey = "FINOWL_DB_PASSWORD"
	dbNameKey     = "FINOWL_DB_NAME"
)

// AppConfig holds all the environment configuration for the application
type AppConfig struct {
	DiscordToken string
	ChannelID    string
	ClaudeAPIKey string
	DBHost       string
	DBPort       string
	DBUser       string
	DBPassword   string
	DBName       string
}

// LoadAppConfig loads and validates the environment variables from the .env file.
func LoadAppConfig() (*AppConfig, error) {
	// Load .env file
	if err := godotenv.Load(); err != nil {
		log.Printf("Error loading .env file: %v", err)
	}

	// Initialize the AppConfig struct and populate it with environment variables
	config := &AppConfig{
		DiscordToken: os.Getenv(discordTokenKey),
		ChannelID:    os.Getenv(channelIDKey),
		ClaudeAPIKey: os.Getenv(claudeAPIKeyKey),
		DBHost:       os.Getenv(dbHostKey),
		DBPort:       os.Getenv(dbPortKey),
		DBUser:       os.Getenv(dbUserKey),
		DBPassword:   os.Getenv(dbPasswordKey),
		DBName:       os.Getenv(dbNameKey),
	}

	// Validate that all required environment variables are set
	if err := validateConfig(config); err != nil {
		return nil, err
	}

	return config, nil
}

// validateConfig checks that all required environment variables are present
func validateConfig(config *AppConfig) error {
	if config.DiscordToken == "" {
		return fmt.Errorf("environment variable %s is required but not set", discordTokenKey)
	}
	if config.ChannelID == "" {
		return fmt.Errorf("environment variable %s is required but not set", channelIDKey)
	}
	if config.ClaudeAPIKey == "" {
		return fmt.Errorf("environment variable %s is required but not set", claudeAPIKeyKey)
	}
	if config.DBHost == "" {
		return fmt.Errorf("environment variable %s is required but not set", dbHostKey)
	}
	if config.DBPort == "" {
		return fmt.Errorf("environment variable %s is required but not set", dbPortKey)
	}
	if config.DBUser == "" {
		return fmt.Errorf("environment variable %s is required but not set", dbUserKey)
	}
	if config.DBPassword == "" {
		return fmt.Errorf("environment variable %s is required but not set", dbPasswordKey)
	}
	if config.DBName == "" {
		return fmt.Errorf("environment variable %s is required but not set", dbNameKey)
	}
	return nil
}

type Prompt struct {
	Prompts map[string]struct {
		Prompt string   `yaml:"prompt"`
		Coins  []string `yaml:"coins"`
	} `yaml:"prompts"`
}
