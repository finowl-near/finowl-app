package storer

import (
	"finowl-backend/pkg/influencer"
	"finowl-backend/pkg/mindshare"
	"finowl-backend/pkg/ticker"
	"fmt"
	"log"
	"strings"
	"time"
)

const (
	// DefaultInfluencerTier represents the default tier assigned to influencers
	// when no specific tier is specified. Tier 3 is the base level.
	DefaultInfluencerTier = 3
)

// ConvertTweetsToTickers converts a slice of Tweets to a slice of Tickers
func ConvertTweetsToTickers(
	tweets []Tweet,
	influencers influencer.InfluencerRankings,
) []ticker.Ticker {
	var tickers []ticker.Ticker

	for _, tweet := range tweets {
		tier := getInfluencerTier(tweet.Author, influencers)
		mentionDetails := createMentionDetails(tweet.Author, tier, tweet)

		timeStamp := parseTimestamp(tweet.Timestamp) // Parse the timestamp
		mindShare, err := mindshare.CalculateMindshare(mentionDetails, ticker.MentionDetails{})
		if err != nil {
			fmt.Printf("failed to calculate mindShare: %v", err)
			return nil
		}

		tickers = appendTickers(tickers, tweet.Tickers, *mindShare, timeStamp, tier, tweet)
	}

	return tickers
}

// getInfluencerTier retrieves the influencer tier for a given author
func getInfluencerTier(author string, influencers influencer.InfluencerRankings) int {
	influencer, _ := influencers.FindInfluencer(author)
	if influencer != nil {
		return influencer.Tier
	}
	return DefaultInfluencerTier
}

// createMentionDetails creates mention details for a given author and tier
func createMentionDetails(author string, tier int, tweet Tweet) ticker.MentionDetails {

	// Create the MentionDetails
	mentionDetails := ticker.MentionDetails{
		Influencers: map[string]ticker.MentionDetail{
			author: {
				Tier:      tier,                      // Default tier value
				TweetLink: getFirstLink(tweet.Links), // Get the first link from the tweet's links
				Content:   tweet.Content,
			},
		},
	}

	return mentionDetails // Return both mention details and tier counts
}

// appendTickers appends new tickers to the existing slice based on the tweet's tickers
func appendTickers(
	tickers []ticker.Ticker, tickerSymbols []string, mindShare mindshare.Mindshare, timeStamp time.Time, tier int, tweet Tweet) []ticker.Ticker {
	for _, tickerSymbol := range tickerSymbols {
		// Convert ticker symbol to uppercase
		tickerSymbol = strings.ToUpper(tickerSymbol)

		// Check if the ticker is excluded
		if isTickerExcluded(tickerSymbol[1:]) {
			continue // Skip this ticker if it is in the excluded list
		}

		mentionsDetail := createMentionDetails(tweet.Author, tier, tweet)

		// Create a new Ticker for each ticker symbol
		ticker := ticker.Ticker{
			TickerSymbol:     tickerSymbol[1:],
			Category:         mindShare.Category,
			MindshareScore:   mindShare.Score,
			LastMentionedAt:  timeStamp,
			FirstMentionedAt: timeStamp,
			MentionDetails:   mentionsDetail,
			Variation:        "",
			Time:             CalculateTimeAgo(timeStamp),
			TopInfluencers:   InitializeTopInfluencers(tier),
			Description:      "",
		}
		tickers = append(tickers, ticker)
	}
	return tickers
}

// InitializeTopInfluencers initializes the TopInfluencers map based on the provided tier
func InitializeTopInfluencers(tier int) map[int]int {
	topInfluencers := make(map[int]int)

	// Set the specified tier to 1 and others to 0
	for i := 1; i <= 3; i++ {
		if i == tier {
			topInfluencers[i] = 1
		} else {
			topInfluencers[i] = 0
		}
	}

	return topInfluencers
}

// MergeTopInfluencers merges two maps by adding the counts of their keys
func MergeTopInfluencers(existingMap, newMap map[int]int) map[int]int {
	merged := existingMap
	for key, value := range newMap {
		merged[key] += value
	}
	return merged
}

// parseTimestamp parses the timestamp string into a time.Time object
func parseTimestamp(timestampStr string) time.Time {
	// Parse the RFC3339 formatted timestamp string back to a time.Time
	parsedTime, err := time.Parse(time.RFC3339, timestampStr)
	if err != nil {
		// Handle the error if the string does not match the expected format
		log.Fatalf("Error parsing timestamp: %v", err)
		return time.Time{}
	}
	return parsedTime
}

// getFirstLink returns the first link from the slice of links
func getFirstLink(links []string) string {
	if len(links) > 0 {
		return links[0] // Return the first link if it exists
	}
	return "" // Return an empty string if there are no links
}

// CalculateTimeAgo calculates the time difference from FirstMentionedAt to now
func CalculateTimeAgo(firstMentionedAt time.Time) string {
	now := time.Now()
	diff := now.Sub(firstMentionedAt)

	// Define time durations
	seconds := int(diff.Seconds())
	minutes := seconds / 60
	hours := minutes / 60
	days := hours / 24
	weeks := days / 7
	months := int(diff.Hours() / 720) // Approximation: 30 days per month

	// Determine the appropriate string representation
	if seconds < 60 {
		return fmt.Sprintf("%ds ago", seconds)
	} else if minutes < 60 {
		return fmt.Sprintf("%dmin ago", minutes)
	} else if hours < 24 {
		return fmt.Sprintf("%dh ago", hours)
	} else if days < 7 {
		return fmt.Sprintf("%dd ago", days)
	} else if weeks < 4 {
		return fmt.Sprintf("%d week ago", weeks)
	} else {
		return fmt.Sprintf("%d month ago", months)
	}
}

// GenerateInfluencerString generates a formatted string from the Influencers map
func GenerateInfluencerSummary(mentionDetails ticker.MentionDetails) string {
	var result string

	for influencer, detail := range mentionDetails.Influencers {
		result += fmt.Sprintf("%s: %s\n", influencer, detail.Content) // Assuming MentionDetail has a Content field
	}

	return result
}
