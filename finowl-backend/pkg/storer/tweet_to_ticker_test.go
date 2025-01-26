package storer

import (
	"finowl-backend/pkg/influencer"
	"finowl-backend/pkg/ticker"
	"testing"
)

func TestConvertTweetToTicker(t *testing.T) {
	// Create a sample Tweet based on the log information
	tweet := Tweet{
		ID:        "e33fbc74-74e8-447b-9c0b-d02771ff7495",
		Author:    "Stats",
		Timestamp: "2024-12-31T01:11:49Z",
		Content:   "BREAKING:  $AIXBT  ",
		Links:     []string{"https://twitter.com/punk9059/status/1873899601813790970"},
		Tickers:   []string{"$AIXBT"},
	}

	// Convert the Tweet to Tickers
	tickers := ConvertTweetsToTickers([]Tweet{tweet}, influencer.InfluencerRankings{})

	// Check if we got the expected number of tickers
	if len(tickers) != 1 {
		t.Errorf("Expected 1 ticker, got %d", len(tickers))
	}

	// Check the values of the converted Ticker
	expectedTicker := ticker.Ticker{
		TickerSymbol:     "AIXBT",
		Category:         "Trenches",                      // Category is empty
		MindshareScore:   17.64290755116443,               // Mindshare score is 0
		LastMentionedAt:  parseTimestamp(tweet.Timestamp), // Parse the timestamp
		FirstMentionedAt: parseTimestamp(tweet.Timestamp),

		MentionDetails: ticker.MentionDetails{
			Influencers: map[string]ticker.MentionDetail{
				tweet.Author: {
					Tier:      3,              // Tier is 0
					TweetLink: tweet.Links[0], // First link from the tweet
					Content:   tweet.Content,
				},
			},
		},
	}

	// Compare the expected ticker with the actual ticker
	actualTicker := tickers[0]
	if actualTicker.TickerSymbol != expectedTicker.TickerSymbol ||
		actualTicker.Category != expectedTicker.Category ||
		actualTicker.MindshareScore != expectedTicker.MindshareScore ||
		!actualTicker.LastMentionedAt.Equal(expectedTicker.LastMentionedAt) {
		t.Errorf("Retrieved ticker does not match expected ticker: got %+v, want %+v", actualTicker, expectedTicker)
	}

	// Check if the MentionDetails match
	if len(actualTicker.MentionDetails.Influencers) != 1 {
		t.Errorf("Expected 1 influencer, got %d", len(actualTicker.MentionDetails.Influencers))
	}

	influencerDetail := actualTicker.MentionDetails.Influencers[tweet.Author]
	if influencerDetail.Tier != expectedTicker.MentionDetails.Influencers[tweet.Author].Tier ||
		influencerDetail.TweetLink != expectedTicker.MentionDetails.Influencers[tweet.Author].TweetLink {
		t.Errorf("Retrieved mention details do not match expected: got %+v, want %+v", influencerDetail, expectedTicker.MentionDetails.Influencers[tweet.Author])
	}
}
