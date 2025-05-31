package main

import (
	"encoding/json"
	"fmt"
	"log"
	"strings"
	"time"

	"github.com/bwmarrin/discordgo"
	"github.com/google/uuid"
)

type DiscordHandler struct {
	server  *server
	session *discordgo.Session
}

func NewDiscordHandler(server *server, token string) (*DiscordHandler, error) {
	session, err := discordgo.New("Bot " + token)
	if err != nil {
		return nil, fmt.Errorf("failed to create discord session: %w", err)
	}

	handler := &DiscordHandler{
		server:  server,
		session: session,
	}

	session.AddHandler(handler.messageCreate)
	return handler, nil
}

func (h *DiscordHandler) Start() error {
	if err := h.session.Open(); err != nil {
		return fmt.Errorf("failed to open discord session: %w", err)
	}
	return nil
}

func (h *DiscordHandler) Stop() {
	if h.session != nil {
		h.session.Close()
	}
}

func (h *DiscordHandler) messageCreate(s *discordgo.Session, m *discordgo.MessageCreate) {
	// Ignore messages from the bot itself
	if m.Author.ID == s.State.User.ID {
		return
	}

	// Process message content
	content := m.Content
	if content == "" {
		return
	}

	// Extract tickers (words starting with $)
	var tickers []string
	words := strings.Fields(content)
	for _, word := range words {
		if strings.HasPrefix(word, "$") {
			ticker := strings.TrimPrefix(word, "$")
			tickers = append(tickers, ticker)
		}
	}

	// Extract links
	var links []string
	for _, attachment := range m.Attachments {
		links = append(links, attachment.URL)
	}

	// Store tweet
	tweet := struct {
		ID        uuid.UUID
		Author    string
		Timestamp time.Time
		Content   string
		Links     []string
		Tickers   []string
	}{
		ID:        uuid.New(),
		Author:    m.Author.Username,
		Timestamp: m.Timestamp,
		Content:   content,
		Links:     links,
		Tickers:   tickers,
	}

	linksJSON, _ := json.Marshal(links)
	tickersJSON, _ := json.Marshal(tickers)

	_, err := h.server.db.Exec(`
		INSERT INTO near_tweets (id, author, timestamp, content, links, tickers)
		VALUES ($1, $2, $3, $4, $5, $6)`,
		tweet.ID, tweet.Author, tweet.Timestamp, tweet.Content, linksJSON, tickersJSON)

	if err != nil {
		log.Printf("Error storing tweet: %v", err)
		return
	}

	// Update ticker stats
	for _, ticker := range tickers {
		_, err := h.server.db.Exec(`
			INSERT INTO near_tickers (
				ticker_symbol, category, mindshare_score, 
				last_mentioned_at, first_mentioned_at, 
				mention_details
			)
			VALUES (
				$1, 'Unknown', 1.0, 
				NOW(), NOW(),
				'{"mentions": 1, "sentiment": 0.5}'::jsonb
			)
			ON CONFLICT (ticker_symbol) DO UPDATE
			SET 
				mindshare_score = near_tickers.mindshare_score + 1.0,
				last_mentioned_at = NOW(),
				mention_details = jsonb_set(
					near_tickers.mention_details,
					'{mentions}',
					(COALESCE((near_tickers.mention_details->>'mentions')::int, 0) + 1)::text::jsonb
				)`,
			ticker)

		if err != nil {
			log.Printf("Error updating ticker stats for %s: %v", ticker, err)
		}
	}
}
