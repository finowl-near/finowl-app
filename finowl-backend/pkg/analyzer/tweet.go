package analyzer

import (
	"strings"
	"time"
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
	Content   string
	RawAuthor string // Original author string
	Author    string // Cleaned author name
	Timestamp time.Time
	IsValid   bool
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
	patterns := []string{"[Tweeted]", "[Retweeted]", "[▻]"}
	for _, pattern := range patterns {
		if idx := strings.Index(content, pattern); idx != -1 {
			content = content[:idx]
		}
	}

	// Remove @mentions
	// content = regexp.MustCompile(`@\S+`).ReplaceAllString(content, "")

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

// ProcessMessage analyzes a message and returns a Tweet if valid
func (ta *TweetAnalyzer) ProcessMessage(content, authorName string, timestamp time.Time) *Tweet {
	tweet := Tweet{
		Content:   CleanTweetContent(content),
		Author:    CleanAuthorName(authorName),
		Timestamp: timestamp,
		IsValid:   false,
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
