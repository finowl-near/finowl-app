package collector

import (
	"finowl-backend/pkg/ai"
	"finowl-backend/pkg/analyzer"
	"log"
	"sync"

	"github.com/bwmarrin/discordgo"
	"github.com/psanford/claude"
)

type Bot struct {
	session    *discordgo.Session
	channelIDs map[string]string
	analyzer   *analyzer.TweetAnalyzer // Add this field
	ai         *ai.ClaudeClient        // Assuming you have a ClaudeClient instance
	tweetBatch map[string][]string     // Slice to hold tweets
	batchSize  int                     // Number of tweets to gather
	mu         sync.Mutex              // Mutex for concurrent access
	config     Config
}

func NewBot(token string, channelID map[string]string, config Config, aiKey string) (*Bot, error) {
	session, err := discordgo.New("Bot " + token)
	if err != nil {
		return nil, err
	}

	// Create a new analyzer instance
	tweetAnalyzer := analyzer.NewTweetAnalyzer()

	aiCLIENT, err := ai.NewClaudeClient(aiKey, claude.Claude3Dot5SonnetLatest, 256, false, true)
	if err != nil {
		log.Fatalf("Failed to create AI client: %v", err)
	}

	return &Bot{
		session:    session,
		channelIDs: channelID,
		analyzer:   tweetAnalyzer,
		ai:         aiCLIENT,
		tweetBatch: make(map[string][]string),
		batchSize:  5, // Set the batch size to 5
		config:     config,
	}, nil
}

func (b *Bot) Start() error {
	b.session.AddHandler(b.messageHandler)

	if err := b.session.Open(); err != nil {
		return err
	}

	b.session.UpdateGameStatus(0, "Watching for messages")
	return nil
}

func (b *Bot) Close() error {
	return b.session.Close()
}

// GetSession returns the discord session (useful if needed externally)
func (b *Bot) GetSession() *discordgo.Session {
	return b.session
}
