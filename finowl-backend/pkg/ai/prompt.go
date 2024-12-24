package ai

// PromptManager handles the preparation of prompts for the Claude API
type PromptManager struct {
	context []string // Store the context for the conversation
}

// NewPromptManager initializes a new PromptManager
func NewPromptManager() *PromptManager {
	return &PromptManager{
		context: make([]string, 0),
	}
}

// PreparePrompt prepares the prompt based on the current context and the new tweet
func (pm *PromptManager) PreparePrompt(tweet string) string {
	// Add the new tweet to the context
	pm.context = append(pm.context, tweet)

	// Create a prompt that includes the context
	prompt := "Please rank and classify the following tweet:\n"
	for _, t := range pm.context {
		prompt += t + "\n"
	}

	return prompt
}

// ClearContext clears the context if needed
func (pm *PromptManager) ClearContext() {
	pm.context = make([]string, 0)
}
