package collector

import (
	"finowl-backend/ai"
	"finowl-backend/internal/utils"
	"finowl-backend/pkg/analyzer"
	"finowl-backend/pkg/influencer"
	"finowl-backend/pkg/storer"
	"log"
	"os"

	"github.com/bwmarrin/discordgo"
)

type Bot struct {
	session      *discordgo.Session
	channelIDs   map[string]string
	analyzer     *analyzer.TweetAnalyzer
	aiClient     *ai.AI
	tweetBatch   map[string][]string
	currentBatch []string
	batchSize    int
	config       utils.Prompt
	influencers  influencer.InfluencerRankings
	storer       *storer.Storer
	logger       *log.Logger
}

// channelMapping := map[string]string{
// 	collector.MacroNews: envVars["macroNewsChan"],
// }
// bot, err := collector.NewBot(
// 	envVars["discordToken"],
// 	channelMapping,
// 	*config,
// 	envVars["claudeAPIKey"],
// 	*influencerRankings,
// 	storer,
// )

func NewBot(
	appConfig utils.AppConfig,
	config utils.Prompt,
	influencers influencer.InfluencerRankings,
	storer *storer.Storer,
) (*Bot, error) {
	logFile, err := os.OpenFile("finowl.log", os.O_CREATE|os.O_WRONLY|os.O_APPEND, 0666)
	if err != nil {
		log.Fatalf("Error opening log file: %v", err)
	}

	session, err := discordgo.New("Bot " + appConfig.DiscordToken)
	if err != nil {
		return nil, err
	}

	// Create a new logger
	logger := log.New(logFile, "INFO: ", log.Ldate|log.Ltime|log.Lshortfile)
	return &Bot{
		session: session,
		channelIDs: map[string]string{
			"mainChannel": appConfig.ChannelID},
		analyzer:    analyzer.NewTweetAnalyzer(),
		aiClient:    ai.NewDeepSeekAI(appConfig.ClaudeAPIKey),
		tweetBatch:  make(map[string][]string),
		batchSize:   2, // Set the batch size to 5
		influencers: influencers,
		config:      config,
		logger:      logger,
		storer:      storer,
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
