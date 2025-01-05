package storer

import (
	"finowl-backend/pkg/influencer"
	"log"
	"time"
)

// ConvertTweetsToTickers converts a slice of Tweets to a slice of Tickers
func ConvertTweetsToTickers(
	tweets []Tweet,
	influencers influencer.InfluencerRankings,
) []Ticker {
	var tickers []Ticker

	for _, tweet := range tweets {
		tier := 0
		influencer, _ := influencers.FindInfluencer(tweet.Author)
		if influencer != nil {
			tier = influencer.Tier
		}
		for _, tickerSymbol := range tweet.Tickers {
			// Create a new Ticker for each ticker symbol
			ticker := Ticker{
				TickerSymbol:    tickerSymbol,
				Category:        "Alpha",                         // Default category as "Alpha"
				MindshareScore:  50,                              // Default mindshare score
				LastMentionedAt: parseTimestamp(tweet.Timestamp), // Parse the timestamp
				MentionDetails: MentionDetails{
					Influencers: map[string]MentionDetail{
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
