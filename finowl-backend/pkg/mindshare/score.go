package mindshare

import (
	"finowl-backend/pkg/ticker"
	"fmt"
	"math"
)

// Mindshare holds the computed mindshare metrics
type Mindshare struct {
	Score    float64
	Category string
}

// CalculateMindshare computes final mindshare score and category from existing and new mentions
func CalculateMindshare(existing, new ticker.MentionDetails) (*Mindshare, error) {
	// Merge mention details
	mergedDetails := MergeMentionDetails(existing, new)

	// Calculate score
	score, err := CalculateScore(mergedDetails, TotalTierCounts)
	if err != nil {
		return nil, fmt.Errorf("failed to calculate score: %w", err)
	}

	// Determine category
	category, err := determineCategory(score)
	if err != nil {
		return nil, fmt.Errorf("failed to determine category: %w", err)
	}

	return &Mindshare{
		Score:    score,
		Category: category,
	}, nil
}

// Helper function to merge existing and new mention details
func MergeMentionDetails(existing, new ticker.MentionDetails) ticker.MentionDetails {
	// If existing map is nil, initialize it
	if existing.Influencers == nil {
		existing.Influencers = make(map[string]ticker.MentionDetail)
	}

	// Update or add new mentions to existing map
	for influencer, mention := range new.Influencers {
		existing.Influencers[influencer] = mention
	}

	return existing
}

// // Helper function to calculate the score
// func calculateScore(details ticker.MentionDetails) (float64, error) {
// 	if len(details.Influencers) == 0 {
// 		return 0, fmt.Errorf("no influencer mentions found")
// 	}

// 	tierWeights := map[string]float64{
// 		"S": 1.0,
// 		"A": 0.8,
// 		"B": 0.6,
// 		"C": 0.4,
// 	}

// 	var weightedSum float64
// 	var totalMentions int

// 	for _, mention := range details.Influencers {
// 		weight, exists := tierWeights["2"]
// 		if !exists {
// 			return 0, fmt.Errorf("invalid tier found: %s", strconv.Itoa(mention.Tier))
// 		}
// 		weightedSum += weight
// 		totalMentions++
// 	}

// 	// Normalize score to 0-100 range
// 	score := (weightedSum / float64(totalMentions)) * 100

// 	return score, nil
// }

// Helper function to determine category from score
func determineCategory(score float64) (string, error) {
	if score < 0 || score > 100 {
		return "", fmt.Errorf("invalid score: %f (must be between 0 and 100)", score)
	}

	switch {
	case score >= 80:
		return "High Alpha", nil
	case score >= 50:
		return "Medium Impact", nil
	case score >= 20:
		return "Alpha", nil
	default:
		return "Trenches", nil
	}
}

const (
	MaxScore    = 1000.0
	Tier1Weight = 95.0 // Top influencers weight
	Tier2Weight = 55.0 // Mid influencers weight
	Tier3Weight = 15.0 // Regular influencers weight
)

// TotalTierCounts represents the total number of influencers per tier
var TotalTierCounts = map[int]int{
	1: 5,  // CZ, Sreeram, Balaji, cygaar, YQ
	2: 15, // Andrew Kang, overdose, crash, Bull.BnB, etc.
	3: 33, // All tier 3 influencers
}

func CalculateScore(details ticker.MentionDetails, totalTierCounts map[int]int) (float64, error) {
	if len(details.Influencers) == 0 {
		return 0, fmt.Errorf("no influencer mentions found")
	}

	// Initialize counters for each tier
	var (
		tier1Count float64
		tier2Count float64
		tier3Count float64
		rawScore   float64
	)

	// Count mentions by tier and calculate raw score
	for _, mention := range details.Influencers {
		switch mention.Tier {
		case 1:
			tier1Count++
			rawScore += Tier1Weight
		case 2:
			tier2Count++
			rawScore += Tier2Weight
		case 3:
			tier3Count++
			rawScore += Tier3Weight
		default:
			return 0, fmt.Errorf("invalid tier found: %d", mention.Tier)
		}
	}

	// Apply bonuses for tier 1 influencers
	if tier1Count > 0 {
		rawScore *= 5.5 // Base bonus for tier 1 presence
	}
	if tier1Count > 1 {
		rawScore *= 1.3 // Additional bonus for multiple tier 1s
	}

	// Apply bonuses for tier 1 influencers
	if tier2Count > 0 {
		rawScore *= 3.9 // Base bonus for tier 1 presence
	}
	if tier2Count > 1 {
		rawScore *= 1.6 // Additional bonus for multiple tier 1s
	}

	// Calculate the theoretical maximum raw score based on 25% thresholds
	tier1Threshold := math.Ceil(0.25*float64(totalTierCounts[1])) * Tier1Weight // 25% of tier 1
	tier2Threshold := math.Ceil(0.25*float64(totalTierCounts[2])) * Tier2Weight // 25% of tier 2
	tier3Threshold := math.Ceil(0.25*float64(totalTierCounts[3])) * Tier3Weight // 25% of tier 3

	// Calculate theoretical max score (with bonuses)
	theoreticalMaxRawScore := (tier1Threshold + tier2Threshold + tier3Threshold) * 1.2 * 1.3

	// Normalize the score to MaxScore (1000)
	normalizedScore := (rawScore / theoreticalMaxRawScore) * MaxScore

	// Cap at MaxScore
	if normalizedScore > MaxScore {
		normalizedScore = MaxScore
	}

	return normalizedScore, nil
}
