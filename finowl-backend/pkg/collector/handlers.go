package collector

import (
	"context"
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

type Config struct {
	Prompts map[string]struct {
		Prompt string   `yaml:"prompt"`
		Coins  []string `yaml:"coins"`
	} `yaml:"prompts"`
}

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
		fmt.Printf("\n=== Valid Tweet Detected in %s ===\n", category)
		fmt.Printf("From: %s\n", tweet.Author)
		fmt.Printf("Time: %s\n", tweet.Timestamp.Format("2006-01-02 15:04:05"))
		fmt.Printf("Content: %s\n", tweet.Content)
		fmt.Printf("Length: %d characters\n", len(tweet.Content))
		fmt.Printf("========================\n")
	} else {
		log.Printf("Invalid tweet in %s from %s: too short (%d characters)\n",
			category,
			tweet.Author,
			len(tweet.Content),
		)
	}

	// Gather tweets
	b.mu.Lock()
	b.tweetBatch[category] = append(b.tweetBatch[category], m.Content) // Collect the tweet content

	if len(b.tweetBatch[category]) >= b.batchSize {
		// Send the batch to the AI
		response, err := b.ai.SendPrompt(context.Background(), fmt.Sprintf("%v tweets: %v", b.config.Prompts[category].Prompt, b.tweetBatch[category]))
		if err != nil {
			log.Printf("Error sending tweets to AI for category %s: %v", category, err)
		} else {
			// Output the AI's response
			fmt.Printf("\n=== AI Response for %s ===\n", category)
			fmt.Println(response)
			fmt.Printf("========================\n")
		}
		// Clear the batch after processing
		b.tweetBatch[category] = nil
	}
	b.mu.Unlock()
}
