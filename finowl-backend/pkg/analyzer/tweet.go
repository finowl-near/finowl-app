package analyzer

import (
	"strings"
	"time"

	"github.com/google/uuid"
)

const (
	// Twitter's maximum character limit is 280
	MaxTweetLength   = 280
	MinContentLength = 10 //MaxTweetLength / 3 // About 93 characters minimum
)

// CleanAuthorName extracts the actual username from Discord format
func CleanAuthorName(authorName string) string {
	// Split by common separators
	parts := strings.Split(authorName, " • ")
	if len(parts) > 0 {
		return strings.TrimSpace(parts[0])
	}

	// Fallback to splitting by hash if bullet point isn't found
	parts = strings.Split(authorName, "#")
	if len(parts) > 0 {
		return strings.TrimSpace(parts[0])
	}

	return authorName
}

// Tweet represents a processed tweet with relevant information
type Tweet struct {
	ID        string
	Content   string
	RawAuthor string // Original author string
	Author    string // Cleaned author name
	Timestamp time.Time
	IsValid   bool
	Links     []string
	Tickers   []string
}

// TweetAnalyzer handles tweet content analysis
type TweetAnalyzer struct {
	validTweets   []Tweet
	invalidTweets []Tweet
}

func NewTweetAnalyzer() *TweetAnalyzer {
	return &TweetAnalyzer{
		validTweets:   make([]Tweet, 0),
		invalidTweets: make([]Tweet, 0),
	}
}

func CleanTweetContent(content string) string {
	// Remove [Tweeted] or [Retweeted] pattern and everything after it
	patterns := []string{"[Tweeted]", "[Retweeted]", "[Replying]", "[Quoted]", "[▻]"}
	for _, pattern := range patterns {
		if idx := strings.Index(content, pattern); idx != -1 {
			content = content[:idx]
		}
	}

	// Remove any trailing whitespace
	content = strings.TrimSpace(content)

	// Remove any URLs and normalize whitespace
	words := strings.Fields(content)
	cleanWords := make([]string, 0, len(words))
	for _, word := range words {
		if !strings.HasPrefix(word, "http://") &&
			!strings.HasPrefix(word, "https://") {
			cleanWords = append(cleanWords, word)
		}
	}

	return strings.Join(cleanWords, " ")
}

// ExtractLinks extracts all links from the tweet content based on the specified patterns
func ExtractLinks(content string) []string {
	var links []string

	// Split the content by spaces to find patterns
	words := strings.Fields(content)
	for _, word := range words {
		// Check if the word starts with "[Tweeted](" or "[Retweeted](" or "[Replying](" or "[Quoted]("
		if strings.HasPrefix(word, "[Tweeted](") ||
			strings.HasPrefix(word, "[Retweeted](") ||
			strings.HasPrefix(word, "[Replying](") ||
			strings.HasPrefix(word, "[Quoted](") {
			// Extract the link from the word
			start := strings.Index(word, "(")
			end := strings.Index(word, ")")
			if start != -1 && end != -1 && end > start {
				link := word[start+1 : end] // Extract the URL
				links = append(links, link) // Add the link to the array
			}
		}
	}

	return links
}

// Helper function to check if a slice contains a string
func contains(slice []string, item string) bool {
	for _, s := range slice {
		if s == item {
			return true
		}
	}
	return false
}

// ProcessMessage analyzes a message and returns a Tweet if valid
func (ta *TweetAnalyzer) ProcessMessage(content, authorName string, timestamp time.Time) *Tweet {
	tweet := Tweet{
		ID:        uuid.New().String(),
		Content:   CleanTweetContent(content),
		Author:    CleanAuthorName(authorName),
		Timestamp: timestamp,
		IsValid:   false,
		Links:     ExtractLinks(content),
		Tickers:   ExtractTickers(content),
	}

	if ValidateTweetContent(content) {
		tweet.IsValid = true
		ta.validTweets = append(ta.validTweets, tweet)
	} else {
		ta.invalidTweets = append(ta.invalidTweets, tweet)
	}

	return &tweet
}

// GetValidTweets returns all valid tweets collected
func (ta *TweetAnalyzer) GetValidTweets() []Tweet {
	return ta.validTweets
}

// GetStats returns analysis statistics
func (ta *TweetAnalyzer) GetStats() map[string]interface{} {
	return map[string]interface{}{
		"total_tweets":   len(ta.validTweets) + len(ta.invalidTweets),
		"valid_tweets":   len(ta.validTweets),
		"invalid_tweets": len(ta.invalidTweets),
		"validity_ratio": float64(len(ta.validTweets)) / float64(len(ta.validTweets)+len(ta.invalidTweets)),
	}
}
