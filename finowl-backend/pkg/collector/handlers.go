package collector

import (
	"context"
	"fmt"
	"log"

	"github.com/bwmarrin/discordgo"
)

const test = ``

func (b *Bot) messageHandler(s *discordgo.Session, m *discordgo.MessageCreate) {
	// Ignore bot's own messages
	if m.Author.ID == s.State.User.ID {
		return
	}

	// Check if message is in target channel
	if m.ChannelID != b.channelID {
		return
	}

	// Add debug logging
	if b.analyzer == nil {
		log.Printf("Warning: analyzer is nil")
		return
	}

	tweet := b.analyzer.ProcessMessage(
		m.Content,
		m.Author.Username,
		m.Timestamp,
	)

	if tweet.IsValid {
		fmt.Printf("\n=== Valid Tweet Detected ===\n")
		fmt.Printf("From: %s\n", tweet.Author) // This will now show just "based16z"
		fmt.Printf("Time: %s\n", tweet.Timestamp.Format("2006-01-02 15:04:05"))
		fmt.Printf("Content: %s\n", tweet.Content)
		fmt.Printf("Length: %d characters\n", len(tweet.Content))
		fmt.Printf("========================\n")
	} else {
		log.Printf("Invalid tweet from %s: too short (%d characters)\n",
			tweet.Author, // Clean author name here too
			len(tweet.Content),
		)
	}

	// Gather tweets
	b.mu.Lock()
	b.tweetBatch = append(b.tweetBatch, m.Content) // Collect the tweet content
	if len(b.tweetBatch) >= b.batchSize {
		// Send the batch to the AI
		response, err := b.ai.SendPrompt(context.Background(), fmt.Sprintf("%v tweets: %v", test, b.tweetBatch))
		if err != nil {
			log.Printf("Error sending tweets to AI: %v", err)
		} else {
			// Output the AI's response
			fmt.Println("AI Response:", response)
		}
		// Clear the batch after processing
		b.tweetBatch = nil
	}
	b.mu.Unlock()

}
