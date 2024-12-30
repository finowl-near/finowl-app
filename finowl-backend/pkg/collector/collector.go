package collector

import (
	"finowl-backend/pkg/ai"
	"finowl-backend/pkg/analyzer"
	"log"
	"os"
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
	logger     *log.Logger // Add a logger field

}

func NewBot(token string, channelID map[string]string, config Config, aiKey string) (*Bot, error) {
	logFile, err := os.OpenFile("finowl.log", os.O_CREATE|os.O_WRONLY|os.O_APPEND, 0666)
	if err != nil {
		log.Fatalf("Error opening log file: %v", err)
	}

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

	// Create a new logger
	logger := log.New(logFile, "INFO: ", log.Ldate|log.Ltime|log.Lshortfile)
	return &Bot{
		session:    session,
		channelIDs: channelID,
		analyzer:   tweetAnalyzer,
		ai:         aiCLIENT,
		tweetBatch: make(map[string][]string),
		batchSize:  2, // Set the batch size to 5
		config:     config,
		logger:     logger,
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
