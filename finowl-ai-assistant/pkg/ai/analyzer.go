package ai

import (
	"encoding/json"
	"errors"
	"fmt"
	"os"
	"path/filepath"
	"regexp"
	"strings"

	"finowl-ai-assistant/pkg/feedstock"
)

type Token struct {
	Rank   int    `json:"rank"`
	Ticker string `json:"ticker"`
	Reason string `json:"reason"`
}

type MarketAnalysisResponse struct {
	MarketSentiment    string  `json:"market_sentiment"`
	InvestmentDecision string  `json:"investment_decision"`
	Justification      string  `json:"justification"`
	TopTokens          []Token `json:"top_tokens,omitempty"`
}

type AIClient interface {
	GetCompletion(prompt string, model string, temperature float32, maxTokens int) (string, error)
}

type MarketAnalyzer struct {
	aiClient    AIClient
	promptsPath string
	model       string
}

func NewMarketAnalyzer(aiClient AIClient) *MarketAnalyzer {
	promptsPath := filepath.Join("config", "prompts")
	if env := os.Getenv("FINOWL_PROMPTS_PATH"); env != "" {
		promptsPath = env
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

func (ma *MarketAnalyzer) AnalyzeMarket(summaries []feedstock.Summary, question string) (*MarketAnalysisResponse, error) {
	// legacy path kept for backwards-compat
	if len(summaries) == 0 {
		return nil, fmt.Errorf("no market data available for analysis")
	}

	prompt, err := ma.buildPrompt(summaries, question)
	if err != nil {
		return nil, fmt.Errorf("failed to build prompt: %w", err)
	}

	aiResp, err := ma.aiClient.GetCompletion(prompt, ma.model, 0.0, 2000)
	if err != nil {
		return nil, fmt.Errorf("AI API error: %w", err)
	}

	jsonStr := extractJSON(aiResp)
	if jsonStr == "" {
		return nil, fmt.Errorf("could not find valid JSON in the AI response")
	}

	var resp MarketAnalysisResponse
	if err := json.Unmarshal([]byte(jsonStr), &resp); err != nil {
		return nil, fmt.Errorf("failed to parse AI response: %w", err)
	}
	return &resp, nil
}

func (ma *MarketAnalyzer) AnalyzeMarketMarkdown(summaries []feedstock.Summary, question string) (string, error) {
	// 1. Validate input
	if len(summaries) == 0 {
		return "", fmt.Errorf("no market data available for analysis")
	}

	// 2. Build prompt
	prompt, err := ma.buildPrompt(summaries, question)
	if err != nil {
		return "", fmt.Errorf("failed to build prompt: %w", err)
	}

	// 3. Call model – low temperature for determinism
	aiResp, err := ma.aiClient.GetCompletion(prompt, ma.model, 0.1, 8000)
	if err != nil {
		return "", fmt.Errorf("AI API error: %w", err)
	}

	answer := strings.TrimSpace(aiResp)

	// 4. Pass through model-level error signalling
	if strings.HasPrefix(answer, "**Error:**") {
		return "", errors.New(strings.TrimSpace(strings.TrimPrefix(answer, "**Error:**")))
	}

	// 5. Final scrub for hidden helper notes (( ... ))
	return scrubHiddenNotes(answer), nil
}

func scrubHiddenNotes(markdown string) string {
	re := regexp.MustCompile(`\(\([\s\S]*?\)\)`) // match (( ... )) in non-greedy fashion
	return strings.TrimSpace(re.ReplaceAllString(markdown, ""))
}

func isCryptoRelated(question string) bool {
	keywords := []string{"crypto", "token", "coin", "bitcoin", "ethereum", "btc", "eth", "market", "trend", "buy", "sell", "hold", "invest", "trading", "defi", "nft", "blockchain", "altcoin", "exchange", "price", "binance", "coinbase", "wallet", "mining", "staking", "chain"}
	lq := strings.ToLower(question)
	for _, kw := range keywords {
		if strings.Contains(lq, kw) {
			return true
		}
	}
	return true
}

func (ma *MarketAnalyzer) buildPrompt(summaries []feedstock.Summary, question string) (string, error) {
	var parts []string
	for _, s := range summaries {
		parts = append(parts, fmt.Sprintf("Summary ID %d: %s", s.ID, s.Content))
	}
	formatted := strings.Join(parts, "\n\n")

	promptTemplatePath := filepath.Join(ma.promptsPath, "market_analysis.txt")
	tplBytes, err := os.ReadFile(promptTemplatePath)
	if err != nil {
		return "", fmt.Errorf("failed to read prompt template: %w", err)
	}

	prompt := strings.Replace(string(tplBytes), "{{SUMMARIES}}", formatted, 1)
	prompt = strings.Replace(prompt, "{{QUESTION}}", question, 1)
	return prompt, nil
}

// extractJSON (unchanged legacy helper)
func extractJSON(text string) string {
	var js json.RawMessage
	if err := json.Unmarshal([]byte(text), &js); err == nil {
		return text
	}

	codeBlockPattern := "```json\\s*([\\s\\S]*?)```"
	re := regexp.MustCompile(codeBlockPattern)
	if m := re.FindStringSubmatch(text); len(m) > 1 {
		jc := strings.TrimSpace(m[1])
		if json.Unmarshal([]byte(jc), &js) == nil {
			return jc
		}
	}

	start := strings.Index(text, "{")
	if start == -1 {
		return ""
	}
	depth := 1
	for i := start + 1; i < len(text); i++ {
		switch text[i] {
		case '{':
			depth++
		case '}':
			depth--
			if depth == 0 {
				candidate := text[start : i+1]
				if json.Unmarshal([]byte(candidate), &js) == nil {
					return candidate
				}
			}
		}
	}
	return ""
}
