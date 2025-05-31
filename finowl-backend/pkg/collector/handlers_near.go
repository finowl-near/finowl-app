package collector

import (
	"finowl-backend/pkg/analyzer"
	"finowl-backend/pkg/storer"

	"github.com/bwmarrin/discordgo"
)

// processValidTweet handles the logic for valid tweets
func (b *Bot) processValidTweetNEAR(category string, m *discordgo.MessageCreate, tweet *analyzer.Tweet) {

	tt := storer.TransformToStorerTweet(*tweet)

	b.storer.InsertTweetNEAR(tt)
	tickers := storer.ConvertTweetsToTickers([]storer.Tweet{tt}, b.influencers)
	b.storer.InsertTickersBatchNEAR(tickers)

	b.logInfluencerInfo(tweet.Author)

	// Collect the formatted tweet content
	b.collectFormattedTweet(category, m)

}
