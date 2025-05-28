package config

import (
	"fmt"
	"log"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"time"
)

// AppConfig represents the application-wide configuration
type AppConfig struct {
	// Server configuration
	Server ServerConfig

	// API clients configuration
	AI        AIConfigs
	Feedstock FeedstockConfig
	NEAR      NEARConfig

	// Resource paths
	ResourcePaths ResourceConfig
}

// AIConfigs holds multiple AI provider configurations
type AIConfigs struct {
	Providers []AIConfig
	Strategy  string // "round-robin", "priority", "fallback"
}

// ServerConfig holds HTTP server configuration
type ServerConfig struct {
	Port string
}

// AIConfig holds individual AI service configuration
type AIConfig struct {
	Provider    string
	APIKey      string
	Endpoint    string
	Model       string
	Priority    int
	MaxTokens   int
	Temperature float32
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

// loadAIProviders loads all configured AI providers
func loadAIProviders() []AIConfig {
	providersStr := getEnvWithDefault("FINOWL_AI_PROVIDERS", "DEEPSEEK,CLAUDE,OPENAI")
	providerList := strings.Split(providersStr, ",")

	var providers []AIConfig
	for _, provider := range providerList {
		provider = strings.TrimSpace(provider)
		if provider == "" {
			continue
		}

		config := AIConfig{
			Provider: provider,
			APIKey: getFirstEnv(
				fmt.Sprintf("FINOWL_%s_API_KEY", strings.ToUpper(provider)),
				fmt.Sprintf("%s_API_KEY", strings.ToUpper(provider)),
				"",
			),
			Endpoint: getFirstEnv(
				fmt.Sprintf("FINOWL_%s_ENDPOINT", strings.ToUpper(provider)),
				fmt.Sprintf("%s_API_ENDPOINT", strings.ToUpper(provider)),
				getDefaultEndpoint(provider),
			),
			Model: getEnvWithDefault(
				fmt.Sprintf("FINOWL_%s_MODEL", strings.ToUpper(provider)),
				getDefaultModel(provider),
			),
			Priority: getEnvAsInt(
				fmt.Sprintf("FINOWL_%s_PRIORITY", strings.ToUpper(provider)),
				getDefaultPriority(provider),
			),
			MaxTokens: getEnvAsInt(
				fmt.Sprintf("FINOWL_%s_MAX_TOKENS", strings.ToUpper(provider)),
				getDefaultMaxTokens(provider),
			),
			Temperature: float32(getEnvAsFloat(
				fmt.Sprintf("FINOWL_%s_TEMPERATURE", strings.ToUpper(provider)),
				0.1,
			)),
		}
		providers = append(providers, config)
	}
	return providers
}

// Helper functions for default values
func getDefaultEndpoint(provider string) string {
	switch provider {
	case "deepseek":
		return "https://api.deepseek.com/v1/chat/completions"
	case "claude":
		return "https://api.anthropic.com/v1/messages"
	case "openai":
		return "https://api.openai.com/v1/chat/completions"
	default:
		return ""
	}
}

func getDefaultModel(provider string) string {
	switch provider {
	case "deepseek":
		return "deepseek-chat"
	case "claude":
		return "claude-3-opus"
	case "openai":
		return "gpt-4"
	default:
		return ""
	}
}

func getDefaultPriority(provider string) int {
	switch provider {
	case "deepseek":
		return 1
	case "claude":
		return 2
	case "openai":
		return 3
	default:
		return 999
	}
}

func getDefaultMaxTokens(provider string) int {
	switch provider {
	case "deepseek":
		return 4000
	case "claude":
		return 100000
	case "openai":
		return 4000
	default:
		return 2000
	}
}

func getEnvAsFloat(key string, defaultValue float64) float64 {
	valueStr := os.Getenv(key)
	if valueStr == "" {
		return defaultValue
	}
	value, err := strconv.ParseFloat(valueStr, 32)
	if err != nil {
		return defaultValue
	}
	return value
}

// LoadConfig loads configuration from environment variables
func LoadConfig() *AppConfig {
	// Simple AI provider selector - can be "DEEPSEEK" or "CLAUDE"
	selectedProvider := getEnvWithDefault("AI_PROVIDER", "DEEPSEEK")

	config := &AppConfig{
		Server: ServerConfig{
			Port: getEnvWithDefault("PORT", "3001"),
		},
		AI: AIConfigs{
			Strategy:  getEnvWithDefault("FINOWL_AI_STRATEGY", "priority"),
			Providers: loadAIProviders(),
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

	// Override the first provider based on AI_PROVIDER selection
	if len(config.AI.Providers) > 0 {
		selectedProviderConfig := getProviderConfig(selectedProvider)
		if selectedProviderConfig != nil {
			config.AI.Providers[0] = *selectedProviderConfig
		}
	}

	// Log configuration details for debug
	log.Printf("🔧 Server configuration: Port=%s", config.Server.Port)
	log.Printf("🔧 Selected AI Provider: %s", selectedProvider)
	log.Printf("🔧 AI configuration: Endpoint=%s, Model=%s, API Key Set=%v",
		config.AI.Providers[0].Endpoint,
		config.AI.Providers[0].Model,
		config.AI.Providers[0].APIKey != "")
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
	if c.AI.Providers[0].APIKey == "" {
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

// getProviderConfig returns a configured AIConfig for the specified provider
func getProviderConfig(provider string) *AIConfig {
	provider = strings.ToUpper(strings.TrimSpace(provider))

	switch provider {
	case "DEEPSEEK":
		return &AIConfig{
			Provider: "DEEPSEEK",
			APIKey: getFirstEnv(
				"FINOWL_DEEPSEEK_API_KEY",
				"DEEPSEEK_API_KEY",
				"",
			),
			Endpoint:    getEnvWithDefault("FINOWL_DEEPSEEK_ENDPOINT", "https://api.deepseek.com/v1/chat/completions"),
			Model:       getEnvWithDefault("FINOWL_DEEPSEEK_MODEL", "deepseek-chat"),
			Priority:    1,
			MaxTokens:   getEnvAsInt("FINOWL_DEEPSEEK_MAX_TOKENS", 4000),
			Temperature: float32(getEnvAsFloat("FINOWL_DEEPSEEK_TEMPERATURE", 0.1)),
		}
	case "CLAUDE":
		return &AIConfig{
			Provider: "CLAUDE",
			APIKey: getFirstEnv(
				"FINOWL_CLAUDE_API_KEY",
				"CLAUDE_API_KEY",
				"",
			),
			Endpoint:    getEnvWithDefault("FINOWL_CLAUDE_ENDPOINT", "https://api.anthropic.com/v1/messages"),
			Model:       getEnvWithDefault("FINOWL_CLAUDE_MODEL", "claude-3-5-sonnet-20241022"),
			Priority:    1,
			MaxTokens:   getEnvAsInt("FINOWL_CLAUDE_MAX_TOKENS", 100000),
			Temperature: float32(getEnvAsFloat("FINOWL_CLAUDE_TEMPERATURE", 0.1)),
		}
	default:
		log.Printf("⚠️ Warning: Unknown AI provider '%s', falling back to default configuration", provider)
		return nil
	}
}
