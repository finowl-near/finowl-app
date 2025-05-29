package main

// SQL query constants for clean, professional code organization
const (
	// Tickers queries
	queryGetTickers = `
		SELECT ticker_symbol, category, mindshare_score, last_mentioned_at, first_mentioned_at, mention_details 
		FROM tickers_1_0 
		ORDER BY %s %s 
		LIMIT $1 OFFSET $2`

	queryGetTickersCount = `
		SELECT COUNT(*) 
		FROM tickers_1_0`

	// Summary queries
	queryGetSummaryLatest = `
		SELECT id, timestamp, content 
		FROM Summaries 
		ORDER BY timestamp DESC 
		LIMIT 1`

	queryGetSummaryByID = `
		SELECT id, timestamp, content 
		FROM Summaries 
		WHERE id = $1 
		LIMIT 1`

	queryGetSummaryCount = `
		SELECT COUNT(*) 
		FROM Summaries`

	// Fresh mentions - tokens discovered in last 6 hours
	queryFreshMentions = `
		SELECT ticker_symbol, category, mindshare_score, last_mentioned_at, first_mentioned_at, mention_details 
		FROM tickers_1_0 
		WHERE first_mentioned_at >= NOW() - INTERVAL '6 hours'
		ORDER BY first_mentioned_at DESC
		LIMIT 20`

	// Recent momentum - tokens mentioned most frequently in last 24h
	queryRecentMomentum = `
		SELECT ticker_symbol, category, mindshare_score, last_mentioned_at, first_mentioned_at, mention_details 
		FROM tickers_1_0 
		WHERE last_mentioned_at >= NOW() - INTERVAL '24 hours'
		ORDER BY last_mentioned_at DESC
		LIMIT 20`

	// Revived interest - old tokens with recent attention
	queryRevivedInterest = `
		SELECT ticker_symbol, category, mindshare_score, last_mentioned_at, first_mentioned_at, mention_details 
		FROM tickers_1_0 
		WHERE first_mentioned_at <= NOW() - INTERVAL '7 days'
		  AND last_mentioned_at >= NOW() - INTERVAL '12 hours'
		ORDER BY last_mentioned_at DESC
		LIMIT 20`

	// Generic discovery - smart mix of recent action and high mentions (PAGINATED like /tickers)
	queryGenericDiscovery = `
		SELECT ticker_symbol, category, mindshare_score, last_mentioned_at, first_mentioned_at, mention_details 
		FROM tickers_1_0 
		WHERE last_mentioned_at >= NOW() - INTERVAL '3 days'
		ORDER BY %s %s
		LIMIT $1 OFFSET $2`

	queryGenericDiscoveryCount = `
		SELECT COUNT(*) 
		FROM tickers_1_0 
		WHERE last_mentioned_at >= NOW() - INTERVAL '3 days'`

	// Tweet queries for summary generation
	queryGetLatestTweets = `
		SELECT id, author, content 
		FROM tweets 
		ORDER BY timestamp DESC 
		LIMIT 150`

	// Summary insertion
	queryInsertSummary = `
		INSERT INTO Summaries (timestamp, content) 
		VALUES ($1, $2)`
)
