package analyzer

import (
	"strings"
)

func ExtractTickers(content string) []string {
	var tickers []string

	// Split the content into words
	words := strings.Fields(content)
	for _, word := range words {
		// Check if the word starts with '$' and is followed by alphanumeric characters
		if strings.HasPrefix(word, "$") {
			// Remove any trailing punctuation (e.g., commas, periods)
			ticker := strings.Trim(word, ".,!?;:")

			// Check if the ticker is a monetary value
			if isMonetaryValue(ticker) {
				continue // Skip this ticker if it's a monetary value
			}

			// Add the ticker to the list if it's not already present
			if !contains(tickers, ticker) {
				tickers = append(tickers, ticker)
			}
		}
	}

	return tickers
}

func isMonetaryValue(ticker string) bool {
	if len(ticker) < 2 {
		return false // Too short to be a valid monetary value
	}

	// Remove the dollar sign for easier checks
	tickerWithoutDollar := ticker[1:]

	// Check for suffixes like k, M, B (case-insensitive)
	lastChar := tickerWithoutDollar[len(tickerWithoutDollar)-1]
	if lastChar == 'k' || lastChar == 'K' || lastChar == 'M' || lastChar == 'm' || lastChar == 'B' || lastChar == 'b' || lastChar == 'T' || lastChar == 't' {
		// Ensure the rest of the string is a valid number (integer or decimal)
		numberPart := tickerWithoutDollar[:len(tickerWithoutDollar)-1]
		return isValidNumber(numberPart)
	}

	// If there is no suffix, ensure the whole string is numeric
	return isValidNumber(tickerWithoutDollar)
}

// isValidNumber checks if a string is a valid integer or decimal number
func isValidNumber(s string) bool {
	if len(s) == 0 {
		return false
	}

	decimalCount := 0
	for i, char := range s {
		if char == '.' {
			decimalCount++
			if decimalCount > 1 || i == 0 || i == len(s)-1 {
				return false // Invalid if more than one '.' or it starts/ends with '.'
			}
		} else if char < '0' || char > '9' {
			return false // Non-numeric character found
		}
	}

	return true
}
