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
			LastMentionedAt:  timeStamp, // Parse the timestamp
			FirstMentionedAt: timeStamp, // Corrected field name
			MentionDetails:   mentionsDetail,
		}
		tickers = append(tickers, ticker)
	}
	return tickers
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
