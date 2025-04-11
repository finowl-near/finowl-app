package ai

import (
	"encoding/json"
	"finowl-ai-assistant/feedstock"
	"fmt"
	"os"
	"path/filepath"
	"strings"
)

// Token represents a cryptocurrency token
type Token struct {
	Rank   int    `json:"rank"`
	Ticker string `json:"ticker"`
	Reason string `json:"reason"`
}

// MarketAnalysisResponse is our structured output format
type MarketAnalysisResponse struct {
	MarketSentiment    string  `json:"market_sentiment"`
	InvestmentDecision string  `json:"investment_decision"`
	Justification      string  `json:"justification"`
	TopTokens          []Token `json:"top_tokens,omitempty"`
}

// MarketAnalyzer handles market analysis
type MarketAnalyzer struct {
	aiClient    *Client
	promptsPath string
}

// NewMarketAnalyzer creates a new market analyzer
func NewMarketAnalyzer(aiClient *Client) *MarketAnalyzer {
	// Default prompts path is relative to executable
	promptsPath := filepath.Join("config", "prompts")

	// Override with environment variable if set
	if envPath := os.Getenv("FINOWL_PROMPTS_PATH"); envPath != "" {
		promptsPath = envPath
	}

	return &MarketAnalyzer{
		aiClient:    aiClient,
		promptsPath: promptsPath,
	}
}

// AnalyzeMarket analyzes the market based on summaries and a question
func (ma *MarketAnalyzer) AnalyzeMarket(summaries []feedstock.Summary, question string) (*MarketAnalysisResponse, error) {
	// Pre-process question
	if !isCryptoRelated(question) {
		return nil, fmt.Errorf("i specialize in analyzing crypto markets and providing investment insights. Please ask about crypto trends, strategies, or investments")
	}

	// Prepare the AI prompt
	prompt, err := ma.buildPrompt(summaries, question)
	if err != nil {
		return nil, fmt.Errorf("failed to build prompt: %w", err)
	}

	// Call AI API
	model := "deepseek-chat" // Configurable if needed
	aiResponse, err := ma.aiClient.GetCompletion(prompt, model, 0, 500)
	if err != nil {
		return nil, fmt.Errorf("AI API error: %w", err)
	}

	// Parse the response
	var marketResponse MarketAnalysisResponse
	if err := json.Unmarshal([]byte(aiResponse), &marketResponse); err != nil {
		return nil, fmt.Errorf("failed to parse AI response: %w", err)
	}

	return &marketResponse, nil
}

// Helper function to check if a question is crypto-related
func isCryptoRelated(question string) bool {
	keywords := []string{
		"crypto", "token", "coin", "bitcoin", "ethereum",
		"market", "trend", "buy", "sell", "hold", "invest",
		"defi", "nft", "blockchain", "altcoin", "exchange",
	}
	lowerQuestion := strings.ToLower(question)
	for _, kw := range keywords {
		if strings.Contains(lowerQuestion, kw) {
			return true
		}
	}
	return false
}

// buildPrompt constructs the prompt for the AI
func (ma *MarketAnalyzer) buildPrompt(summaries []feedstock.Summary, question string) (string, error) {
	// Format summaries
	var summaryContents []string
	for _, s := range summaries {
		summaryContents = append(summaryContents, fmt.Sprintf("Summary ID %d: %s", s.ID, s.Content))
	}
	formattedSummaries := strings.Join(summaryContents, "\n\n")

	// Load the prompt template from file
	promptFile := filepath.Join(ma.promptsPath, "market_analysis.txt")
	promptTemplate, err := os.ReadFile(promptFile)
	if err != nil {
		return "", fmt.Errorf("failed to read prompt template: %w", err)
	}

	// Replace placeholders with actual content
	prompt := strings.Replace(string(promptTemplate), "{{SUMMARIES}}", formattedSummaries, 1)
	prompt = strings.Replace(prompt, "{{QUESTION}}", question, 1)

	return prompt, nil
}
