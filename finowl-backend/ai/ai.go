package ai

import (
	"context"
	"errors"
	"fmt"

	"github.com/openai/openai-go"
	"github.com/openai/openai-go/option"
)

var (
	ErrAnalyzeTweets = errors.New("AI failed to analyze tweets")
)

type AI struct {
	APIKey  string
	Model   string
	BaseURL string
}

func NewDeepSeekAI(APIKey string) *AI {
	return &AI{
		APIKey:  APIKey,
		Model:   "deepseek-chat",
		BaseURL: "https://api.deepseek.com",
	}
}

func (ai *AI) AnalyzeTweets(ctx context.Context, prompt, tweets string) (string, error) {
	client := openai.NewClient(
		option.WithAPIKey(ai.APIKey),
		option.WithBaseURL(ai.BaseURL),
	)
	chatCompletion, err := client.Chat.Completions.New(ctx, openai.ChatCompletionNewParams{
		Messages: openai.F([]openai.ChatCompletionMessageParamUnion{
			openai.SystemMessage(prompt),
			openai.UserMessage(tweets),
		}),
		Model: openai.F(ai.Model),
	})
	if err != nil {
		return "", fmt.Errorf("%w: %w", ErrAnalyzeTweets, err)
	}

	if len(chatCompletion.Choices) < 1 {
		return "", fmt.Errorf("%w: empty response", ErrAnalyzeTweets)
	}

	return chatCompletion.Choices[0].Message.Content, nil
}
