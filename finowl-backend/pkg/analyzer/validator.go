package analyzer

import "strings"

// ValidateTweetContent checks if the content meets our criteria
func ValidateTweetContent(content string) bool {
	// Clean the content first
	cleanContent := CleanTweetContent(content)

	// Check if content is empty after cleaning
	if len(strings.TrimSpace(cleanContent)) == 0 {
		return false
	}

	// Check minimum length requirement
	if len(cleanContent) < MinContentLength {
		return false
	}

	return true
}
