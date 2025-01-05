package utils

import (
	"finowl-backend/pkg/influencer"
	"fmt"
	"log"
	"os"

	"gopkg.in/yaml.v2"
)

// LoadConfig reads the config.yaml file and unmarshals it into the Config struct.
func LoadConfig(filePath string) (*Prompt, error) {
	data, err := os.ReadFile(filePath)
	if err != nil {
		return nil, fmt.Errorf("error reading config file: %w", err)
	}

	var config Prompt
	if err := yaml.Unmarshal(data, &config); err != nil {
		return nil, fmt.Errorf("error unmarshaling config: %w", err)
	}

	return &config, nil
}

// mustLoadConfig reads and parses the configuration file. Exits on error.
func MustLoadConfig(filePath string) *Prompt {
	config, err := LoadConfig(filePath)
	if err != nil {
		log.Fatalf("Failed to load config: %v", err)
	}
	return config
}

// mustInitInfluencers initializes influencers from the provided file. Exits on error.
func MustInitInfluencers(filePath string) *influencer.InfluencerRankings {
	rankings := influencer.InitInfluencers(filePath)
	if rankings == nil {
		log.Fatalf("Failed to initialize influencers from file: %s", filePath)
	}
	return rankings
}
