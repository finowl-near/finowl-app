# FinOwl API Endpoints

## Token Discovery Endpoints

### Generic Discovery
`GET /api/v0/generic-discovery`
- Returns tokens with activity in last 3 days
- Sort by: mindshare (default), first_mentioned, last_mentioned
- Example: `/api/v0/generic-discovery?sort=mindshare&sortDir=desc`

### Fresh Mentions
`GET /api/v0/fresh-mentions`
- Returns tokens discovered in last 6 hours
- Sorted by first mentioned date (newest first)
- Limited to 20 items

### Recent Momentum
`GET /api/v0/recent-momentum`
- Returns tokens with high activity in last 24h
- Sorted by last mentioned date
- Limited to 20 items

### Revived Interest
`GET /api/v0/revived-interest`
- Returns old tokens (7+ days) with recent attention
- Sorted by last mentioned date
- Limited to 20 items

## Common Parameters
- `page`: Page number (0-based)
- `pageSize`: Items per page (1-1024)
- `sort`: Sort field (varies by endpoint)
- `sortDir`: Sort direction (asc/desc)

## Response Format
```json
{
  "tickers": [...],
  "total_page_cnt": number,
  "page": number,
  "page_size": number
}
``` 