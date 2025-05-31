-- Insert test tweets
INSERT INTO near_tweets (id, author, timestamp, content, links, tickers, created_at)
VALUES 
    (gen_random_uuid(), 'near_protocol', NOW() - INTERVAL '2 hours',
    'Exciting news! NEAR Protocol just reached 1M daily transactions! 🚀 #NEAR $NEAR', 
    '[]'::jsonb,
    '["NEAR"]'::jsonb,
    NOW()),
    
    (gen_random_uuid(), 'aurora_labs', NOW() - INTERVAL '1 hour',
    'Aurora Engine upgrade coming next week! Enhanced EVM compatibility and better performance for all dApps. $AURORA $NEAR',
    '["https://aurora.dev/blog/upgrade"]'::jsonb,
    '["AURORA", "NEAR"]'::jsonb,
    NOW()),
    
    (gen_random_uuid(), 'ref_finance', NOW() - INTERVAL '30 minutes',
    'New farming pools live on Ref Finance! Earn $REF by providing liquidity to NEAR/AURORA pairs 💰',
    '[]'::jsonb,
    '["REF", "NEAR", "AURORA"]'::jsonb,
    NOW());

-- Insert test tickers
INSERT INTO near_tickers (symbol, category, mindshare_score, last_mentioned_at, first_mentioned_at, mention_details, created_at, updated_at)
VALUES
    ('NEAR', 'L1', 95.5, NOW(), NOW() - INTERVAL '24 hours',
    '{"mentions": 150, "sentiment": 0.8}'::jsonb,
    NOW(), NOW()),
    
    ('AURORA', 'L2', 85.2, NOW(), NOW() - INTERVAL '24 hours',
    '{"mentions": 75, "sentiment": 0.75}'::jsonb,
    NOW(), NOW()),
    
    ('REF', 'DeFi', 78.4, NOW(), NOW() - INTERVAL '24 hours',
    '{"mentions": 45, "sentiment": 0.7}'::jsonb,
    NOW(), NOW()),
    
    ('OCT', 'Infrastructure', 65.8, NOW(), NOW() - INTERVAL '24 hours',
    '{"mentions": 30, "sentiment": 0.65}'::jsonb,
    NOW(), NOW());

-- Insert a test summary
INSERT INTO near_summaries (timestamp, content)
VALUES (
    NOW(),
    'NEAR Ecosystem Update:
    - Protocol Performance: NEAR reaches milestone of 1M daily transactions
    - Infrastructure: Aurora announces major engine upgrade for enhanced EVM compatibility
    - DeFi Activity: Ref Finance launches new farming pools for NEAR/AURORA pairs
    Overall sentiment is bullish with significant development activity across the ecosystem.'
); 