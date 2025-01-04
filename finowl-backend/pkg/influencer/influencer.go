package influencer

import (
	"fmt"
	"log"
	"os"
	"strings"

	"gopkg.in/yaml.v2"
)

// Influencer represents the structure for an influencer's data.
type Influencer struct {
	Tier     int    `yaml:"tier"`
	Category string `yaml:"category"`
}

// InfluencerRankings holds all influencers with their tiers and categories.
type InfluencerRankings struct {
	Accounts map[string]Influencer `yaml:"accounts"`
}

// LoadInfluencerRankings loads the influencer rankings from a YAML file.
func LoadInfluencerRankings(filePath string) (*InfluencerRankings, error) {
	// Read the YAML file
	data, err := os.ReadFile(filePath)
	if err != nil {
		return nil, fmt.Errorf("error reading influencer rankings file: %w", err)
	}

	// Unmarshal the YAML into the struct
	var rankings InfluencerRankings
	if err := yaml.Unmarshal(data, &rankings); err != nil {
		return nil, fmt.Errorf("error unmarshaling influencer rankings: %w", err)
	}

	return &rankings, nil
}

// InitInfluencers initializes the rankings and handles errors gracefully.
func InitInfluencers(filePath string) *InfluencerRankings {
	rankings, err := LoadInfluencerRankings(filePath)
	if err != nil {
		log.Fatalf("Failed to initialize influencer rankings: %v", err)
	}
	log.Printf("Successfully loaded %d influencers", len(rankings.Accounts))
	return rankings
}

// FindInfluencer looks up an influencer by matching a case-insensitive substring of their Twitter name.
func (r *InfluencerRankings) FindInfluencer(query string) (*Influencer, string) {
	// Convert the query to lowercase for case-insensitive matching
	query = strings.ToLower(query)

	// Iterate through all accounts to find a match
	for name, influencer := range r.Accounts {
		if strings.Contains(strings.ToLower(name), query) {
			// Return the first match (Twitter name and influencer details)
			return &influencer, name
		}
	}

	// Return nil if no match is found
	return nil, ""
}
