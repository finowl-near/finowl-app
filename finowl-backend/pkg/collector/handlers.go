package collector

import (
	"context"
	"finowl-backend/pkg/analyzer"
	"finowl-backend/pkg/mindshare"
	"finowl-backend/pkg/storer"
	"fmt"
	"log"
	"strings"
	"time"

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
		b.processValidTweet(category, m, tweet, false)
	} else {
		b.logInvalidTweet(category, tweet)
	}
}

// processValidTweet handles the logic for valid tweets
func (b *Bot) processValidTweet(category string, m *discordgo.MessageCreate, tweet *analyzer.Tweet, generateSummary bool) {

	b.writeSummariesOnce()
	tt := storer.TransformToStorerTweet(*tweet)

	b.storer.InsertTweet(tt)
	tickers := storer.ConvertTweetsToTickers([]storer.Tweet{tt}, b.influencers)
	b.storer.InsertTickersBatch(tickers)

	b.logInfluencerInfo(tweet.Author)

	// Collect the formatted tweet content
	b.collectFormattedTweet(category, m)

	// Check if we need to generate a summary
	if generateSummary && len(b.tweetBatch[category]) > 50 {

		// Pass the new batch to generateSummary
		// FIXME: Turned off...
		// b.generateSummary(category, b.currentBatch)

		b.currentBatch = []string{}
	}
}

// writeSummariesOnce writes summaries to a file only once
func (b *Bot) writeSummariesOnce() {
	staticOnce := false
	if !staticOnce {
		err := b.storer.WriteSummariesToFile("summary.txt")
		if err != nil {
			fmt.Println("failed to write summaries .........")
		}
		staticOnce = true
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

// generateSummary generates a summary from the collected tweets
func (b *Bot) generateSummary(category string, tweets []string) {
	b.logger.Printf("Generating summary for category: %s", category)

	tweetsStr := strings.Builder{}
	for _, t := range tweets {
		tweetsStr.WriteString(t)
		tweetsStr.WriteByte('\n')
	}

	response, err := b.aiClient.AnalyzeTweets(context.Background(), b.config.Prompts[category].Prompt, tweetsStr.String())
	if err != nil {
		b.logger.Printf("ERROR sending tweets to AI for category %s: %v", category, err)
		return
	}

	// Prepare the summary content
	summaryContent := response

	b.logger.Printf("Summary response: %s", summaryContent)

	// Create a new summary object
	summary := &mindshare.Summary{
		Time:    time.Now(),
		Content: summaryContent,
	}

	// Insert the summary into the database
	err = b.storer.InsertSummary(summary)
	if err != nil {
		b.logger.Printf("ERROR inserting summary into DB for category %s: %v", category, err)
	} else {
		b.logger.Printf("Inserted summary with ID: %v for category %s", summary.ID, category)
	}

	// Clear the batch after processing
	b.tweetBatch[category] = nil
}
