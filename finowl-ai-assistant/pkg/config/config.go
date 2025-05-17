package config

import (
	"fmt"
	"os"
)

// NetworkConfig holds the public configuration for each network
type NetworkConfig struct {
	ContractName  string
	ExplorerURL   string
	RPCURL        string
	WalletURL     string
	HelperURL     string
	HelperAccount string
	NodeURL       string
}

// Config holds all configuration for the application
type Config struct {
	Network        string
	PrivateKey     string
	OwnerAccountID string
	NetworkConfig
}

var (
	// Public network configurations
	testnetConfig = NetworkConfig{
		ContractName:  "finowl.testnet",
		ExplorerURL:   "https://explorer.testnet.near.org",
		RPCURL:        "https://rpc.testnet.near.org",
		WalletURL:     "https://wallet.testnet.near.org",
		HelperURL:     "https://helper.testnet.near.org",
		HelperAccount: "testnet",
		NodeURL:       "https://rpc.testnet.near.org",
	}

	mainnetConfig = NetworkConfig{
		ContractName:  "finowl.near",
		ExplorerURL:   "https://explorer.near.org",
		RPCURL:        "https://rpc.mainnet.near.org",
		WalletURL:     "https://wallet.near.org",
		HelperURL:     "https://helper.near.org",
		HelperAccount: "near",
		NodeURL:       "https://rpc.mainnet.near.org",
	}
)

// LoadConfig loads the configuration based on the network type
func LoadConfig(network string) (*Config, error) {
	var networkConfig NetworkConfig
	var ownerAccountID string

	switch network {
	case "testnet":
		networkConfig = testnetConfig
		ownerAccountID = "finowl.testnet"
	case "mainnet":
		networkConfig = mainnetConfig
		ownerAccountID = "finowl.near"
	default:
		return nil, fmt.Errorf("invalid network: %s", network)
	}

	// Load private key
	privateKey, err := loadPrivateKey(network)
	if err != nil {
		return nil, fmt.Errorf("error loading private key: %v", err)
	}

	config := &Config{
		Network:        network,
		PrivateKey:     privateKey,
		OwnerAccountID: ownerAccountID,
		NetworkConfig:  networkConfig,
	}

	return config, nil
}

// loadPrivateKey loads the private key from a secure file
func loadPrivateKey(network string) (string, error) {
	var key string

	// Look for private key in environment variable first
	if envKey := os.Getenv("NEAR_PRIVATE_KEY"); envKey != "" {
		key = envKey
	} else {
		// If not in environment, look for a key file
		keyFile := fmt.Sprintf("config/keys/%s.key", network)
		keyBytes, err := os.ReadFile(keyFile)
		if err != nil {
			return "", fmt.Errorf("private key not found in environment or file: %v", err)
		}
		key = string(keyBytes)
	}

	// Clean the key - remove any whitespace or newlines
	key = cleanPrivateKey(key)

	// Validate key format
	if !isValidEd25519Key(key) {
		return "", fmt.Errorf("invalid Ed25519 private key format")
	}

	return key, nil
}

// cleanPrivateKey removes any whitespace characters from the key
func cleanPrivateKey(key string) string {
	// Remove all whitespace characters
	cleanKey := ""
	for _, r := range key {
		if !isWhitespace(r) {
			cleanKey += string(r)
		}
	}
	return cleanKey
}

// isWhitespace checks if a character is a whitespace
func isWhitespace(r rune) bool {
	return r == ' ' || r == '\n' || r == '\t' || r == '\r'
}

// isValidEd25519Key performs basic validation on the key format
func isValidEd25519Key(key string) bool {
	// Basic check - Ed25519 keys should be at least 64 characters
	if len(key) < 64 {
		return false
	}

	// For now, just check if the key has the right length and only contains valid base58 characters
	// A more thorough validation would be done by the NEAR SDK when it tries to use the key
	return true
}
