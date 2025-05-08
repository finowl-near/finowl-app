package ai

import (
	"encoding/json"
	"fmt"
	"log"
	"os"
	"path/filepath"
	"regexp"
	"strings"

	"finowl-ai-assistant/pkg/feedstock"
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

// AIClient defines the interface for AI completion services
type AIClient interface {
	GetCompletion(prompt string, model string, temperature float32, maxTokens int) (string, error)
}

// MarketAnalyzer handles market analysis
type MarketAnalyzer struct {
	aiClient    AIClient
	promptsPath string
	model       string
}

// NewMarketAnalyzer creates a new market analyzer
func NewMarketAnalyzer(aiClient AIClient) *MarketAnalyzer {
	// Default prompts path is relative to executable
	promptsPath := filepath.Join("config", "prompts")

	// Override with environment variable if set
	if envPath := os.Getenv("FINOWL_PROMPTS_PATH"); envPath != "" {
		promptsPath = envPath
	}

	return &MarketAnalyzer{
		aiClient:    aiClient,
		promptsPath: promptsPath,
		model:       "deepseek-chat",
	}
}

// Configure updates the market analyzer's configuration
func (ma *MarketAnalyzer) Configure(promptsPath, model string) {
	if promptsPath != "" {
		ma.promptsPath = promptsPath
	}

	if model != "" {
		ma.model = model
	}
}

// AnalyzeMarket analyzes the market based on summaries and a question
func (ma *MarketAnalyzer) AnalyzeMarket(summaries []feedstock.Summary, question string) (*MarketAnalysisResponse, error) {
	// Pre-process question
	log.Printf("🔍 Analyzing question: '%s'", question)

	if !isCryptoRelated(question) {
		log.Printf("❌ Question rejected: Not crypto-related: '%s'", question)
		return nil, fmt.Errorf("i specialize in analyzing crypto markets and providing investment insights. Please ask about crypto trends, strategies, or investments")
	}

	log.Printf("✅ Question is crypto-related, proceeding with analysis")

	// Check if we have any summaries to analyze
	if len(summaries) == 0 {
		log.Printf("⚠️ No summaries provided for analysis")
		return nil, fmt.Errorf("no market data available for analysis")
	}

	// Prepare the AI prompt
	prompt, err := ma.buildPrompt(summaries, question)
	if err != nil {
		log.Printf("❌ Failed to build prompt: %v", err)
		return nil, fmt.Errorf("failed to build prompt: %w", err)
	}

	// Log prompt length for debugging
	log.Printf("📝 Prompt built successfully (%d characters)", len(prompt))

	// Call AI API
	log.Printf("🔄 Sending request to AI model: %s", ma.model)
	aiResponse, err := ma.aiClient.GetCompletion(prompt, ma.model, 0, 2000)
	if err != nil {
		log.Printf("❌ AI API error: %v", err)
		return nil, fmt.Errorf("AI API error: %w", err)
	}

	// Log response length for debugging
	log.Printf("📝 Received AI response (%d characters)", len(aiResponse))

	// Extract JSON from the response (in case it's embedded in text/markdown)
	jsonStr := extractJSON(aiResponse)
	if jsonStr == "" {
		log.Printf("❌ Could not find valid JSON in the AI response")
		log.Printf("📝 Raw AI response: %s", aiResponse)
		return nil, fmt.Errorf("could not find valid JSON in the AI response")
	}

	// Parse the response
	var marketResponse MarketAnalysisResponse
	if err := json.Unmarshal([]byte(jsonStr), &marketResponse); err != nil {
		log.Printf("❌ Failed to parse AI response: %v", err)
		log.Printf("📝 JSON content: %s", jsonStr)
		return nil, fmt.Errorf("failed to parse AI response: %w", err)
	}

	log.Printf("✅ Analysis complete: sentiment=%s, decision=%s",
		marketResponse.MarketSentiment, marketResponse.InvestmentDecision)

	return &marketResponse, nil
}

// extractJSON attempts to extract a JSON object from a potentially larger text block
func extractJSON(text string) string {
	// If the text is already valid JSON, return it directly
	var js json.RawMessage
	if err := json.Unmarshal([]byte(text), &js); err == nil {
		return text
	}

	// Check for JSON wrapped in markdown code blocks with backticks
	codeBlockPattern := "```json\\s*([\\s\\S]*?)```"
	re := regexp.MustCompile(codeBlockPattern)
	matches := re.FindStringSubmatch(text)
	if len(matches) > 1 {
		// Extract the content between the backticks
		jsonContent := strings.TrimSpace(matches[1])
		// Verify it's valid JSON
		if err := json.Unmarshal([]byte(jsonContent), &js); err == nil {
			return jsonContent
		}
	}

	// Look for JSON object starting with { and ending with }
	startIdx := strings.Index(text, "{")
	if startIdx == -1 {
		return ""
	}

	// Find the matching closing brace
	depth := 1
	for i := startIdx + 1; i < len(text); i++ {
		if text[i] == '{' {
			depth++
		} else if text[i] == '}' {
			depth--
			if depth == 0 {
				// Found the matching closing brace
				jsonCandidate := text[startIdx : i+1]
				// Verify it's valid JSON
				if err := json.Unmarshal([]byte(jsonCandidate), &js); err == nil {
					return jsonCandidate
				}
				// If not valid, continue searching
			}
		}
	}

	return ""
}

// Helper function to check if a question is crypto-related
func isCryptoRelated(question string) bool {
	keywords := []string{
		"crypto", "token", "coin", "bitcoin", "ethereum", "btc", "eth",
		"market", "trend", "buy", "sell", "hold", "invest", "trading",
		"defi", "nft", "blockchain", "altcoin", "exchange", "price",
		"binance", "coinbase", "wallet", "mining", "staking", "chain",
	}

	lowerQuestion := strings.ToLower(question)

	log.Printf("🔍 Checking if question is crypto-related: '%s'", lowerQuestion)

	for _, kw := range keywords {
		if strings.Contains(lowerQuestion, kw) {
			log.Printf("✅ Crypto keyword matched: '%s'", kw)
			return true
		}
	}

	log.Printf("❌ No crypto keywords matched in question")
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
