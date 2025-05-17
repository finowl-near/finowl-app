package config

import (
	"fmt"
	"log"
	"os"
	"path/filepath"
	"strconv"
	"time"
)

// AppConfig represents the application-wide configuration
type AppConfig struct {
	// Server configuration
	Server ServerConfig

	// API clients configuration
	AI        AIConfig
	Feedstock FeedstockConfig
	NEAR      NEARConfig

	// Resource paths
	ResourcePaths ResourceConfig
}

// ServerConfig holds HTTP server configuration
type ServerConfig struct {
	Port string
}

// AIConfig holds AI service configuration
type AIConfig struct {
	APIKey   string
	Endpoint string
	Model    string
}

// FeedstockConfig holds Feedstock API configuration
type FeedstockConfig struct {
	APIBaseURL   string
	SummaryPath  string
	HTTPTimeout  time.Duration
	SummaryCount int
}

// ResourceConfig holds paths to application resources
type ResourceConfig struct {
	PromptsPath string
}

// NEARConfig holds NEAR blockchain configuration
type NEARConfig struct {
	UserAccountID   string
	UserPrivateKey  string
	OwnerAccountID  string
	OwnerPrivateKey string
	ContractID      string
	RPCURL          string
}

// LoadConfig loads configuration from environment variables
func LoadConfig() *AppConfig {
	config := &AppConfig{
		Server: ServerConfig{
			Port: getEnvWithDefault("PORT", "8080"),
		},
		AI: AIConfig{
			APIKey:   getFirstEnv("FINOWL_AI_API_KEY", "AI_API_KEY", ""),
			Endpoint: getFirstEnv("FINOWL_AI_ENDPOINT", "AI_API_ENDPOINT", "https://api.deepseek.com/v1/chat/completions"),
			Model:    getEnvWithDefault("FINOWL_AI_MODEL", "deepseek-chat"),
		},
		Feedstock: FeedstockConfig{
			APIBaseURL:   getEnvWithDefault("FINOWL_API_BASE_URL", "http://localhost:8080"),
			SummaryPath:  getEnvWithDefault("FINOWL_SUMMARY_PATH", "/summary"),
			HTTPTimeout:  time.Duration(getEnvAsInt("FINOWL_HTTP_TIMEOUT", 60)) * time.Second,
			SummaryCount: getEnvAsInt("FINOWL_SUMMARY_COUNT", 10),
		},
		NEAR: NEARConfig{
			UserAccountID:   getEnvWithDefault("NEAR_USER_ACCOUNT_ID", ""),
			UserPrivateKey:  getEnvWithDefault("NEAR_USER_PRIVATE_KEY", ""),
			OwnerAccountID:  getEnvWithDefault("NEAR_OWNER_ACCOUNT_ID", ""),
			OwnerPrivateKey: getEnvWithDefault("NEAR_OWNER_PRIVATE_KEY", ""),
			ContractID:      getEnvWithDefault("NEAR_CONTRACT_ID", ""),
			RPCURL:          getEnvWithDefault("NEAR_RPC_URL", ""),
		},
		ResourcePaths: ResourceConfig{
			PromptsPath: getEnvWithDefault("FINOWL_PROMPTS_PATH", filepath.Join("config", "prompts")),
		},
	}

	// Log configuration details for debug
	log.Printf("🔧 Server configuration: Port=%s", config.Server.Port)
	log.Printf("🔧 AI configuration: Endpoint=%s, Model=%s, API Key Set=%v",
		config.AI.Endpoint,
		config.AI.Model,
		config.AI.APIKey != "")
	log.Printf("🔧 Feedstock configuration: API=%s, Timeout=%v, Summary Count=%d",
		config.Feedstock.APIBaseURL,
		config.Feedstock.HTTPTimeout,
		config.Feedstock.SummaryCount)
	log.Printf("🔧 Prompts Path: %s", config.ResourcePaths.PromptsPath)

	return config
}

// ValidationResult holds the result of configuration validation
type ValidationResult struct {
	Valid    bool
	Errors   []string
	Warnings []string
}

// Validate checks if the configuration is valid and collects validation issues
func (c *AppConfig) Validate() ValidationResult {
	result := ValidationResult{
		Valid:    true,
		Errors:   []string{},
		Warnings: []string{},
	}

	// Check AI configuration
	if c.AI.APIKey == "" {
		result.Warnings = append(result.Warnings, "AI API key not set - will use mock client")
	}

	// Check prompts directory
	if _, err := os.Stat(c.ResourcePaths.PromptsPath); os.IsNotExist(err) {
		result.Warnings = append(result.Warnings, fmt.Sprintf("Prompts directory '%s' does not exist", c.ResourcePaths.PromptsPath))
	}

	// Check feedstock summary count
	if c.Feedstock.SummaryCount <= 0 {
		result.Errors = append(result.Errors, "Invalid summary count - must be greater than 0")
		result.Valid = false
	}

	// Output validation results
	if !result.Valid {
		fmt.Println("❌ Configuration validation failed:")
		for _, err := range result.Errors {
			fmt.Printf("   - %s\n", err)
		}
	}

	for _, warn := range result.Warnings {
		fmt.Printf("⚠️ Warning: %s\n", warn)
	}

	return result
}

// Helper function to get environment variable with a default value
func getEnvWithDefault(key, defaultValue string) string {
	value := os.Getenv(key)
	if value == "" {
		return defaultValue
	}
	return value
}

// Helper function to get first non-empty environment variable from a list
func getFirstEnv(keys ...string) string {
	// Last element is default value
	defaultValue := ""
	if len(keys) > 0 {
		defaultValue = keys[len(keys)-1]
		keys = keys[:len(keys)-1]
	}

	for _, key := range keys {
		if value := os.Getenv(key); value != "" {
			return value
		}
	}

	return defaultValue
}

// Helper function to get and parse an integer environment variable
func getEnvAsInt(key string, defaultValue int) int {
	valueStr := os.Getenv(key)
	if valueStr == "" {
		return defaultValue
	}

	valueInt, err := strconv.Atoi(valueStr)
	if err != nil {
		fmt.Printf("⚠️ Warning: Could not parse %s as integer, using default value %d\n", key, defaultValue)
		return defaultValue
	}

	return valueInt
}
