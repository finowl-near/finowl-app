package storer

import (
	"finowl-backend/pkg/influencer"
	"testing"
)

func TestConvertTweetToTicker(t *testing.T) {
	// Create a sample Tweet based on the log information
	tweet := Tweet{
		ID:        "e33fbc74-74e8-447b-9c0b-d02771ff7495",
		Author:    "Stats",
		Timestamp: "2024-12-31 01:11:49",
		Content:   "BREAKING: THE QUANTUM CATS TREASURY HAS ACQUIRED 2,104,245 $AIXBT FOR ~$1.1 MILLION USD AT AN AVERAGE PRICE OF ~$0.52 PER TOKEN. @QuantumCatsXYZ we have also sent @aixbt_agent a second Quantum Cat. why are we doing this? we experienced aixbt’s dominance over CT mindshare this weekend. we are happy to top-blast the chart here, we are bullish on AI dominating attention over the cycle. switching to a Quantum Cat pfp helped aixbt push his AI agent mindshare over 65%. aixbt might decide to switch back to his original pfp at some point, or he might choose to embrace his new feline for longer. either way he will forever be a part of the Quantum Cats community, and therefore the Quantum Cats will support him on his mission. we will continue to monitor aixbt’s journey and might decide to add more to our position in the future. gmeow! p.s. if you think aixbt will continue to grow his mindshare by keeping his Quantum Cat as his pfp, you should let him know! (tweet directly at him from your timeline, he will ignore replies to this thread)",
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
	expectedTicker := Ticker{
		TickerSymbol:    "$AIXBT",
		Category:        "",                              // Category is empty
		MindshareScore:  0,                               // Mindshare score is 0
		LastMentionedAt: parseTimestamp(tweet.Timestamp), // Parse the timestamp
		MentionDetails: MentionDetails{
			Influencers: map[string]MentionDetail{
				tweet.Author: {
					Tier:      0,              // Tier is 0
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
