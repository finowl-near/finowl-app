package storer

import (
	"finowl-backend/pkg/influencer"
	"finowl-backend/pkg/mindshare"
	"finowl-backend/pkg/ticker"
	"log"
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
	var initScore float64
	var err error

	for _, tweet := range tweets {
		tier := DefaultInfluencerTier
		influencer, _ := influencers.FindInfluencer(tweet.Author)
		if influencer != nil {
			tier = influencer.Tier
		}
		mentionDetials := ticker.MentionDetails{
			Influencers: map[string]ticker.MentionDetail{
				tweet.Author: {
					Tier:      tier,                      // Default tier value
					TweetLink: getFirstLink(tweet.Links), // Get the first link from the tweet's links
					Content:   tweet.Content,
				},
			},
		}
		initScore, err = mindshare.CalculateScore(mentionDetials, mindshare.TotalTierCounts)
		if err != nil {
			// Handle the error if the string does not match the expected format
			log.Fatalf("Error calculaing score timestamp: %v", err)
			initScore = 10
		}

		for _, tickerSymbol := range tweet.Tickers {
			// Create a new Ticker for each ticker symbol
			ticker := ticker.Ticker{
				TickerSymbol:    tickerSymbol,
				Category:        "Alpha",                         // Default category as "Alpha"
				MindshareScore:  initScore,                       // Default mindshare score
				LastMentionedAt: parseTimestamp(tweet.Timestamp), // Parse the timestamp
				MentionDetails: ticker.MentionDetails{
					Influencers: map[string]ticker.MentionDetail{
						tweet.Author: {
							Tier:      tier,                      // Default tier value
							TweetLink: getFirstLink(tweet.Links), // Get the first link from the tweet's links
							Content:   tweet.Content,
						},
					},
				},
			}
			tickers = append(tickers, ticker)
		}
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
