package ai

import (
	"encoding/json"
	"errors"
	"fmt"
	"os"
	"path/filepath"
	"regexp"
	"sort"
	"strings"

	"finowl-ai-assistant/pkg/feedstock"
)

// Constants for model execution
const (
	DefaultPromptDir       = "config/prompts"
	DefaultModelName       = "deepseek-chat"
	JSONResponseMaxTokens  = 2000
	MarkdownResponseTokens = 8000
	MarkdownTemperature    = 0.1
	JSONTemperature        = 0.0
	promptFilename         = "market_analysis.txt"
)

// Token represents an investment recommendation with context
type Token struct {
	Rank   int    `json:"rank"`
	Ticker string `json:"ticker"`
	Reason string `json:"reason"`
}

// MarketAnalysisResponse represents the AI model's structured output
type MarketAnalysisResponse struct {
	MarketSentiment    string  `json:"market_sentiment"`
	InvestmentDecision string  `json:"investment_decision"`
	Justification      string  `json:"justification"`
	TopTokens          []Token `json:"top_tokens,omitempty"`
}

// AIClient defines the expected interface for interacting with AI models
type AIClient interface {
	GetCompletion(prompt string, model string, temperature float32, maxTokens int) (string, error)
	GetChatCompletion(messages []ChatMessage, model string, temperature float32, maxTokens int) (string, error)
}

// MarketAnalyzer is the core engine for analyzing feedstock summaries via AI
type MarketAnalyzer struct {
	aiClient    AIClient
	promptsPath string
	model       string
}

// NewMarketAnalyzer returns a properly configured analyzer with optional env override
func NewMarketAnalyzer(aiClient AIClient) *MarketAnalyzer {
	promptsPath := DefaultPromptDir
	if env := os.Getenv("FINOWL_PROMPTS_PATH"); env != "" {
		promptsPath = env
	}
	return &MarketAnalyzer{
		aiClient:    aiClient,
		promptsPath: promptsPath,
		model:       DefaultModelName,
	}
}

// Configure allows dynamic override of prompt path or model name
func (ma *MarketAnalyzer) Configure(promptsPath, model string) {
	if promptsPath != "" {
		ma.promptsPath = promptsPath
	}
	if model != "" {
		ma.model = model
	}
}

// AnalyzeMarket returns a structured JSON response from the AI based on summaries and a question
func (ma *MarketAnalyzer) AnalyzeMarket(summaries []feedstock.Summary, question string) (*MarketAnalysisResponse, error) {
	if len(summaries) == 0 {
		return nil, fmt.Errorf("no market data available for analysis")
	}
	prompt, err := ma.buildPrompt(summaries, question)
	if err != nil {
		return nil, fmt.Errorf("failed to build prompt: %w", err)
	}
	aiResp, err := ma.aiClient.GetCompletion(prompt, ma.model, JSONTemperature, JSONResponseMaxTokens)
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

// AnalyzeMarketMarkdown returns a markdown-formatted string using LLM reasoning
func (ma *MarketAnalyzer) AnalyzeMarketMarkdown(summaries []feedstock.Summary, question string) (string, error) {
	if len(summaries) == 0 {
		return "", fmt.Errorf("no market data available for analysis")
	}
	prompt, err := ma.buildPrompt(summaries, question)
	if err != nil {
		return "", fmt.Errorf("failed to build prompt: %w", err)
	}
	aiResp, err := ma.aiClient.GetCompletion(prompt, ma.model, MarkdownTemperature, MarkdownResponseTokens)
	if err != nil {
		return "", fmt.Errorf("AI API error: %w", err)
	}
	answer := strings.TrimSpace(aiResp)
	if strings.HasPrefix(answer, "**Error:**") {
		return "", errors.New(strings.TrimPrefix(answer, "**Error:**"))
	}
	return scrubHiddenNotes(answer), nil
}

// buildPrompt formats the summaries and loads the template file for prompt construction
func (ma *MarketAnalyzer) buildPrompt(summaries []feedstock.Summary, question string) (string, error) {
	sort.SliceStable(summaries, func(i, j int) bool {
		return summaries[i].Timestamp.After(summaries[j].Timestamp)
	})

	var parts []string
	for _, s := range summaries {
		parts = append(parts, fmt.Sprintf("((%s)) %s", s.Timestamp.Format("2006-01-02"), s.Content))
	}
	formatted := strings.Join(parts, "\n\n")

	promptPath := filepath.Join(ma.promptsPath, promptFilename)
	tplBytes, err := os.ReadFile(promptPath)
	if err != nil {
		return "", fmt.Errorf("failed to read prompt template: %w", err)
	}

	prompt := strings.Replace(string(tplBytes), "{{SUMMARIES}}", formatted, 1)
	prompt = strings.Replace(prompt, "{{QUESTION}}", question, 1)
	return prompt, nil
}

// extractJSON attempts to extract a valid JSON payload from an AI model response
func extractJSON(text string) string {
	var js json.RawMessage
	if err := json.Unmarshal([]byte(text), &js); err == nil {
		return text
	}

	re := regexp.MustCompile("```json\\s*([\\s\\S]*?)```")
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

// scrubHiddenNotes removes (( ... )) sections from markdown output
func scrubHiddenNotes(markdown string) string {
	re := regexp.MustCompile(`\$begin:math:text\$$begin:math:text$([\\s\\S]*?)$end:math:text$\$end:math:text\$`)
	return strings.TrimSpace(re.ReplaceAllString(markdown, ""))
}
