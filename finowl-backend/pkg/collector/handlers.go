package collector

import (
	"finowl-backend/pkg/storer"
	"log"

	"github.com/bwmarrin/discordgo"
)

const (
	EarlyAlpha        = "EarlyAlpha"
	MacroNews         = "MacroNews"
	PortfolioInsights = "PortfolioInsights"
	AlphaTrenches     = "AlphaTrenches"
)

func (b *Bot) messageHandler(s *discordgo.Session, m *discordgo.MessageCreate) {
	// Ignore bot's own messages
	if m.Author.ID == s.State.User.ID {
		return
	}

	// Check which category the message belongs to
	for category, channelID := range b.channelIDs {
		if m.ChannelID == channelID {
			go b.handleCategoryMessage(category, m) // Launch a goroutine for each category
			return
		}
	}
}

// handleCategoryMessage processes messages for a specific category
func (b *Bot) handleCategoryMessage(category string, m *discordgo.MessageCreate) {
	if b.analyzer == nil {
		log.Printf("Warning: analyzer is nil for category: %s", category)
		return
	}

	tweet := b.analyzer.ProcessMessage(
		m.Content,
		m.Author.Username,
		m.Timestamp,
	)

	if tweet.IsValid {

		tt := storer.TransformToStorerTweet(*tweet)

		b.storer.InsertTweet(tt)

		tickers := storer.ConvertTweetsToTickers([]storer.Tweet{tt}, b.influencers)

		b.storer.InsertTickersBatch(tickers)

		b.logger.Printf("\n=== VALID TWEET DETECTED in %s ===\n", category)
		b.logger.Printf("ID: %s\n", tweet.ID)
		b.logger.Printf("From: %s\n", tweet.Author)

		influencer, twitterName := b.influencers.FindInfluencer(tweet.Author)
		if influencer != nil {
			b.logger.Printf("Found Influencer: Twitter: %s, Tier: %d, Category: %s", twitterName, influencer.Tier, influencer.Category)
		} else {
			b.logger.Printf("No match found for query: %s", tweet.Author)
		}

		b.logger.Printf("Time: %s\n", tweet.Timestamp.Format("2006-01-02 15:04:05"))
		b.logger.Printf("Content: %s\n", tweet.Content)
		b.logger.Printf("Links: %s\n", tweet.Links)
		b.logger.Printf("Tickers: %s\n", tweet.Tickers)

		b.logger.Printf("=================================================\n")
	} else {
		b.logger.Printf("INVALID TWEET in %s from %s: too short (%d characters)\n",
			category,
			tweet.Author,
			len(tweet.Content),
		)
	}

	// Gather tweets
	b.mu.Lock()
	b.tweetBatch[category] = append(b.tweetBatch[category], m.Content) // Collect the tweet content

	// if len(b.tweetBatch[category]) >= b.batchSize {
	// 	// Send the batch to the AI
	// 	response, err := b.ai.SendPrompt(context.Background(), fmt.Sprintf("%v tweets: %v", b.config.Prompts[category].Prompt, b.tweetBatch[category]))
	// 	if err != nil {
	// 		b.logger.Printf("ERROR sending tweets to AI for category %s: %v", category, err)
	// 	} else {
	// 		// Output the AI's response
	// 		b.logger.Printf("\n=== AI RESPONSE for %s ===\n", category)
	// 		b.logger.Println(response)
	// 		b.logger.Printf("========================\n")
	// 	}
	// 	// Clear the batch after processing
	// 	b.tweetBatch[category] = nil
	// }
	// b.mu.Unlock()
}
