package analyzer

import (
	"strings"
)

func ExtractTickers(content string) []string {
	var tickers []string

	// Split the content into words
	words := strings.Fields(content)
	for _, word := range words {
		// Check if the word starts with '$'
		if strings.HasPrefix(word, "$") {
			// Remove any trailing punctuation (e.g., commas, periods)
			ticker := strings.Trim(word, ".,!?;:")

			// Skip words that are only '$', '$$', '$$$', etc.
			if len(ticker) == 1 || strings.Trim(ticker, "$") == "" {
				continue
			}

			// Check if the ticker is a monetary value
			if IsMonetaryValue(ticker) {
				continue // Skip this ticker if it's a monetary value
			}

			// New condition to check if ticker contains only valid characters
			if !isValidTicker(ticker[1:]) { // Check only the part after '$'
				continue // Skip this ticker if it contains invalid characters
			}

			// Add the ticker to the list if it's not already present
			if !contains(tickers, ticker) {
				tickers = append(tickers, ticker)
			}
		}
	}

	return tickers
}

// isValidTicker checks if a ticker is composed only of letters and numbers
func isValidTicker(ticker string) bool {
	for _, char := range ticker {
		if !((char >= 'A' && char <= 'Z') || (char >= 'a' && char <= 'z') || (char >= '0' && char <= '9')) {
			return false // Invalid character found
		}
	}
	return true // All characters are valid
}

func IsMonetaryValue(ticker string) bool {
	if len(ticker) < 2 {
		return false // Too short to be a valid monetary value
	}

	// Remove the dollar sign for easier checks
	tickerWithoutDollar := ticker[1:]

	// Remove any trailing characters like "+" or other non-numeric suffixes
	tickerWithoutDollar = strings.TrimRight(tickerWithoutDollar, "+")

	// Remove commas in numbers (e.g., $10,000 becomes 10000)
	tickerWithoutDollar = strings.ReplaceAll(tickerWithoutDollar, ",", "")

	// Check for 3-character suffixes first (mil)
	if len(tickerWithoutDollar) > 3 {
		lastThreeChars := strings.ToLower(tickerWithoutDollar[len(tickerWithoutDollar)-3:])
		if lastThreeChars == "mil" {
			// Ensure the rest of the string is a valid number
			numberPart := tickerWithoutDollar[:len(tickerWithoutDollar)-3]
			return isValidNumber(numberPart)
		}
	}

	// Check for 2-character suffixes (mn, bn)
	if len(tickerWithoutDollar) > 2 {
		lastTwoChars := strings.ToLower(tickerWithoutDollar[len(tickerWithoutDollar)-2:])
		if lastTwoChars == "mn" || lastTwoChars == "bn" {
			// Ensure the rest of the string is a valid number
			numberPart := tickerWithoutDollar[:len(tickerWithoutDollar)-2]
			return isValidNumber(numberPart)
		}
	}

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
