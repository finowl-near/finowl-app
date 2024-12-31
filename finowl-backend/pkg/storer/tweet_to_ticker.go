package storer

import (
	"time"
)

// ConvertTweetsToTickers converts a slice of Tweets to a slice of Tickers
func ConvertTweetsToTickers(tweets []Tweet) []Ticker {
	var tickers []Ticker

	for _, tweet := range tweets {
		for _, tickerSymbol := range tweet.Tickers {
			// Create a new Ticker for each ticker symbol
			ticker := Ticker{
				TickerSymbol:    tickerSymbol,
				Category:        "",                              // Keep category empty as specified
				MindshareScore:  0,                               // Keep mindshare score empty as specified
				LastMentionedAt: parseTimestamp(tweet.Timestamp), // Parse the timestamp
				MentionDetails: MentionDetails{
					Influencers: map[string]MentionDetail{
						tweet.Author: {
							Tier:      0,                         // Keep tier empty as specified
							TweetLink: getFirstLink(tweet.Links), // Get the first link from the links
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
func parseTimestamp(timestamp string) time.Time {
	parsedTime, err := time.Parse("2006-01-02 15:04:05", timestamp)
	if err != nil {
		// Handle error (e.g., log it, return zero time, etc.)
		return time.Time{} // Return zero time if parsing fails
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
