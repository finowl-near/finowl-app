# Trade Intent Detection System

This utility provides robust detection and parsing of structured trade intents from user messages. It supports rigid template matching for buy/swap/invest/trade operations.

## 📋 Supported Templates

### 1. BUY Template
**Pattern**: `"buy [amount] [destinationToken] with [originToken]"`
**Example**: `"buy 100 btc with usdt"`
**Result**: Buy 100 BTC using USDT

### 2. SWAP Template  
**Pattern**: `"swap [amount] [originToken] for [destinationToken]"`
**Example**: `"swap 50 eth for dai"`
**Result**: Swap 50 ETH for DAI

### 3. INVEST Template
**Pattern**: `"invest [amount] [originToken] in [destinationToken]"`  
**Example**: `"invest 1000 usdc in sol"`
**Result**: Invest 1000 USDC in SOL

### 4. TRADE Template
**Pattern**: `"trade [amount] [originToken] for [destinationToken]"`
**Example**: `"trade 25 near for eth"`
**Result**: Trade 25 NEAR for ETH

## 🔧 Optional Prefixes

All templates support these optional prefixes:
- `"i want to"`
- `"i'd like to"`  
- `"please"`

**Examples**:
- `"i want to buy 100 btc with usdt"`
- `"please swap 50 eth for dai"`
- `"i'd like to invest 1000 usdc in sol"`

## ✅ Validation Rules

1. **Amount**: Must be a positive number (integer or decimal)
2. **Token Symbols**: Must be 2-10 characters (letters only)
3. **Different Assets**: Origin and destination tokens must be different
4. **Exact Match**: Template must match exactly (case-insensitive)

## 🚀 Usage

### Basic Detection

```javascript
import { detectTradeIntent } from './tradeIntentDetector';

// Valid trade intent
const result = detectTradeIntent('buy 100 btc with usdt');
// Output: {
//   isTradeIntent: true,
//   data: {
//     amount: 100,
//     originAsset: 'USDT',
//     destinationAsset: 'BTC',
//     templateUsed: 'BUY'
//   }
// }

// Invalid/no trade intent
const result2 = detectTradeIntent('what is the price of bitcoin?');
console.log(result2);
// Output: { isTradeIntent: false, data: null }
```

### Generate Response

```javascript
import { generateTradeIntentResponse } from './tradeIntentDetector';

const tradeData = {
  amount: 100,
  originAsset: 'USDT',
  destinationAsset: 'BTC',
  templateUsed: 'BUY'
};

const response = generateTradeIntentResponse(tradeData);
console.log(response);
// Returns formatted markdown with JSON structure
```

### Check Potential Intent

```javascript
import { mightBeTradeIntent } from './tradeIntentDetector';

// Quick check for UI hints
const mightBeTrade = mightBeTradeIntent('I want to buy some bitcoin');
console.log(mightBeTrade); // true
```

### Get Supported Templates

```javascript
import { getSupportedTemplates } from './tradeIntentDetector';

const templates = getSupportedTemplates();
console.log(templates);
// Returns array of all supported templates with examples
```

## 📊 JSON Response Format

When a template matches, the system generates a structured JSON response:

```json
{
  "intent": "trade_request",
  "timestamp": "2024-01-15T10:30:00Z",
  "trade_details": {
    "originAsset": "USDT",
    "destinationAsset": "BTC",
    "amount": 100
  },
  "status": "pending_confirmation",
  "message": "Trade intent detected: 100 USDT → BTC",
  "template_used": "BUY",
  "next_steps": [
    "Review trade details",
    "Connect to preferred DEX",
    "Confirm transaction parameters",
    "Execute trade"
  ],
  "metadata": {
    "processed_at": "2024-01-15T10:30:00Z",
    "confidence": "high",
    "validation_passed": true
  }
}
```

## 🔄 Two-Workflow System

### Workflow 1: Template Matched (Front-side Only)
- ✅ Detects exact template match
- ✅ Generates structured JSON response
- ✅ No backend API call needed
- ✅ No token deduction for template responses
- ✅ Immediate response

### Workflow 2: Template Not Matched (AI Analysis)
- ✅ Falls back to existing AI analyzer
- ✅ Calls backend API for analysis
- ✅ Deducts tokens normally
- ✅ Full market analysis

## ✅ Valid Examples

```javascript
// These will trigger template matching:
"buy 100 btc with usdt"
"swap 50 eth for dai"  
"invest 1000 usdc in sol"
"trade 25 near for eth"
"i want to buy 500 link with usdt"
"please swap 0.5 eth for usdc"
"i'd like to invest 2500 usdt into btc"
```

## ❌ Invalid Examples (will go to AI)

```javascript
// These will NOT match templates:
"buy some bitcoin"           // no amount
"what is the price of btc"   // no template match
"swap btc"                   // incomplete
"buy 100"                    // no tokens specified
"sell 100 btc for usdt"      // sell not supported
"buy 0 btc with usdt"        // zero amount
"buy 100 btc with btc"       // same tokens
```

## 🧪 Testing

Run the test suite to verify all functionality:

```bash
# Run all trade intent tests
npm run test:trade-intent

# Run all tests
npm test
```

The test suite covers:
- ✅ All template patterns
- ✅ Edge cases and validation
- ✅ Error handling
- ✅ Real-world examples
- ✅ Integration workflows

## 🛠 Development

### Adding New Templates

To add a new template:

1. Add template configuration to `TRADE_TEMPLATES` array
2. Include regex pattern and extract function
3. Add comprehensive tests
4. Update documentation

### Template Structure

```javascript
{
  name: 'TEMPLATE_NAME',
  description: 'Human readable description',
  pattern: /regex_pattern_here/,
  extract: (match) => ({
    amount: parseFloat(match[1]),
    originAsset: match[2].toUpperCase(),
    destinationAsset: match[3].toUpperCase()
  }),
  example: 'example usage here'
}
```

## 🔍 Error Handling

The system gracefully handles:
- Invalid input types
- Malformed messages  
- Edge cases (zero amounts, same tokens, etc.)
- Extraction errors
- Validation failures

All errors are logged but don't break the workflow - the system falls back to AI analysis when template matching fails.

## 📈 Performance

- **Fast**: Regex-based matching is extremely fast
- **Lightweight**: No external dependencies
- **Efficient**: Template matching avoids expensive AI calls
- **Scalable**: Easy to add new templates without impacting performance 