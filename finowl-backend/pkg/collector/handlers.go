package collector

import (
	"finowl-backend/pkg/analyzer"
	"fmt"
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

	tweet := b.analyzer.ProcessMessage(m.Content, m.Author.Username, m.Timestamp)

	if tweet.IsValid {
		b.processValidTweetNEAR(category, m, tweet)
	} else {
		b.logInvalidTweet(category, tweet)
	}
}

// logInfluencerInfo logs information about the influencer
func (b *Bot) logInfluencerInfo(author string) {
	influencer, twitterName := b.influencers.FindInfluencer(author)
	if influencer != nil {
		b.logger.Printf("Found Influencer: Twitter: %s, Tier: %d, Category: %s", twitterName, influencer.Tier, influencer.Category)
	} else {
		b.logger.Printf("No match found for query: %s", author)
	}
}

// collectFormattedTweet formats and collects the tweet content
func (b *Bot) collectFormattedTweet(category string, m *discordgo.MessageCreate) {
	formattedTweet := fmt.Sprintf("%s: %s", m.Author.Username, m.Content)
	b.tweetBatch[category] = append(b.tweetBatch[category], formattedTweet)
	b.currentBatch = append(b.currentBatch, formattedTweet)

}

// logInvalidTweet logs information about invalid tweets
func (b *Bot) logInvalidTweet(category string, tweet *analyzer.Tweet) {
	b.logger.Printf("INVALID TWEET in %s from %s: too short (%d characters)\n",
		category,
		tweet.Author,
		len(tweet.Content),
	)
}
