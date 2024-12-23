package collector

import (
	"finowl-backend/pkg/analyzer"

	"github.com/bwmarrin/discordgo"
)

type Bot struct {
	session   *discordgo.Session
	channelID string
	analyzer  *analyzer.TweetAnalyzer // Add this field

}

func NewBot(token, channelID string) (*Bot, error) {
	session, err := discordgo.New("Bot " + token)
	if err != nil {
		return nil, err
	}

	// Create a new analyzer instance
	tweetAnalyzer := analyzer.NewTweetAnalyzer()

	return &Bot{
		session:   session,
		channelID: channelID,
		analyzer:  tweetAnalyzer,
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
