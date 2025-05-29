package analyzer

import (
	"testing"
)

func TestExtractTickers(t *testing.T) {
	tests := []struct {
		content         string
		expectedTickers []string
	}{
		{"$AAPL $GOOGL $MSFT", []string{"$AAPL", "$GOOGL", "$MSFT"}},
		{"$100 $69k $1.5M $329.57M P3ULL", []string{}},
		{"$AAPL made $100 in revenue", []string{"$AAPL"}},
		{"$AAPL $AAPL $GOOGL", []string{"$AAPL", "$GOOGL"}},
		{"$AAPL! $GOOGL, $MSFT.", []string{"$AAPL", "$GOOGL", "$MSFT"}},
		{"", []string{}},
		{"The stock market is doing well.", []string{}},
		{"$1000 $500k $1M", []string{}},
		{"$aapl $GoOGL $mSFT", []string{"$aapl", "$GoOGL", "$mSFT"}},
		{"$AAPL123 $GOOGL456", []string{"$AAPL123", "$GOOGL456"}},
		{"$BTC $ETH $LTC", []string{"$BTC", "$ETH", "$LTC"}},
		{"$1000 $BTC $69k $ETH", []string{"$BTC", "$ETH"}},
		{"$BTC $BTC $ETH", []string{"$BTC", "$ETH"}},
		{"$BTC! $ETH, $LTC.", []string{"$BTC", "$ETH", "$LTC"}},
		{"The crypto market is booming.", []string{}},
		{"$1000 $500k $1m", []string{}},
		{"$btc $Eth $ltc", []string{"$btc", "$Eth", "$ltc"}},
		{"$BTC123 $ETH456", []string{"$BTC123", "$ETH456"}},
		{"$10 $1k $10k $100k $1m $100B+", []string{}},
		{"$ $$$ $NODE) $5k/mo $2-3B", []string{}},
		{"The same people that thought I'm \"too late\" when I posted $ZEUS at 20m are now seeing huge projects like $POPCAT interacting with it at $50mil", []string{"$ZEUS", "$POPCAT"}},
		{"$1mil $2.5mil $100mil should all be filtered out", []string{}},
		{"$TICKER with $5mil value", []string{"$TICKER"}},
	}

	for _, test := range tests {
		tickers := ExtractTickers(test.content)
		if !equal(tickers, test.expectedTickers) {
			t.Errorf("ExtractTickers(%q) = %v; want %v", test.content, tickers, test.expectedTickers)
		}
	}
}

// Helper function to compare two slices
func equal(a, b []string) bool {
	if len(a) != len(b) {
		return false
	}
	for i := range a {
		if a[i] != b[i] {
			return false
		}
	}
	return true
}
