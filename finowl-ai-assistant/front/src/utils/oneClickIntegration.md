# 1Click SDK Integration Guide

This guide explains how to use the integrated 1Click SDK for cross-chain token swaps with live quotes.

## 🚀 Overview

The 1Click integration enhances our trade intent detection system by providing:
- **Live cross-chain swap quotes**
- **Real deposit addresses** for immediate execution
- **Estimated gas and fees**
- **Route information** showing swap paths
- **Time estimates** for completion

## 🔧 Setup

### 1. Enable 1Click Service

Navigate to the **1Click Quote Service** panel in the conversation management interface:

1. ✅ Check "Enable 1Click Live Quotes"
2. 🔑 (Optional) Enter your JWT token for authenticated endpoints
3. The service will initialize automatically

### 2. Supported Tokens

Currently supported tokens include:
- **Ethereum**: ETH, USDT, USDC, WBTC
- **Arbitrum**: ARB-USDT, ARB-USDC  
- **Solana**: SOL, SOL-USDT
- **NEAR**: NEAR, WRAP-NEAR

## 💬 Usage

### Template Messages

When 1Click is enabled, these template messages will include live quotes:

```
"buy 100 btc with usdt"
"swap 50 eth for usdc"
"invest 1000 usdc in sol"
"trade 25 near for eth"
```

### Example Response

**Without 1Click** (Basic template):
```markdown
# Trade Intent Detected 🔄

**Trade Details:**
- Amount: 100 USDT
- From: USDT
- To: BTC
- Status: Ready for processing

**Structured Data:**
{JSON with trade details}
```

**With 1Click** (Enhanced with live quote):
```markdown
# Trade Intent Detected 🔄

{Basic template data}

## 🔄 Live Quote Details

**Quote Status:** ✅ Successfully retrieved
**Estimated Output:** 0.002456 BTC
**Deposit Address:** `0x1234...abcd`
**Estimated Gas:** 0.003 ETH
**Time Estimate:** 5-10 minutes
**Slippage Tolerance:** 1%

**How to Execute:**
1. Send 100 USDT to: `0x1234...abcd`
2. The swap will execute automatically
3. You'll receive BTC at your specified address
```

## 🔐 Authentication

### JWT Token (Optional)

Some 1Click endpoints require authentication:
- **Quote generation**: Usually works without JWT
- **Transaction submission**: Requires JWT  
- **Status checking**: Requires JWT

To get a JWT token:
1. Visit the 1Click API documentation
2. Create an account and get your token
3. Enter it in the configuration panel

### Without JWT Token

Basic functionality works without authentication:
- ✅ Quote generation (dry run mode)
- ✅ Route information
- ✅ Fee estimates
- ❌ Transaction submission
- ❌ Status tracking

## 🛠 Configuration Options

### Default Settings

```javascript
{
  slippageTolerance: 100,  // 1%
  dry: true,              // Always dry run for safety
  preferredChain: 'eth'   // Default to Ethereum
}
```

### Customization

You can modify default settings in the quote options:

```javascript
// In oneClickQuoteService.js
const quoteOptions = {
  slippageTolerance: 200,  // 2% slippage
  preferredChain: 'arb',   // Prefer Arbitrum
  refundTo: 'your_address',
  recipient: 'destination_address'
};
```

## 🔄 Workflow

### Template Detected → Quote Enhanced

1. **User Input**: `"buy 100 btc with usdt"`
2. **Template Detection**: ✅ BUY template matched
3. **Quote Request**: Call 1Click API with trade data
4. **Response Enhancement**: Combine template + live quote
5. **Display**: Show enhanced response with execution details

### Fallback Behavior

If 1Click fails:
- ✅ Template detection still works
- ✅ Basic structured response provided
- ⚠️ Error message explains quote failure
- 🔄 User can retry or continue with template data

## 🐛 Troubleshooting

### Common Issues

**Quote Request Failed**
- Check internet connection
- Verify token symbols are supported
- Try with different amount or token pair

**Authentication Errors**
- Verify JWT token is valid
- Check token hasn't expired
- Try without JWT for basic functionality

**Service Unavailable**
- 1Click API might be down
- Try again later
- Basic template responses still work

### Error Codes

- `AUTH_ERROR`: Invalid or missing JWT token
- `INVALID_REQUEST`: Bad request parameters
- `SERVICE_UNAVAILABLE`: API temporarily down
- `UNKNOWN_ERROR`: General error

## 📊 Response Structure

### Basic Template Response
```json
{
  "intent": "trade_request",
  "trade_details": {
    "originAsset": "USDT",
    "destinationAsset": "BTC",
    "amount": 100
  },
  "status": "pending_confirmation"
}
```

### Enhanced Quote Response
```json
{
  "quote": {
    "estimatedOutput": "0.002456",
    "depositAddress": "0x1234...abcd",
    "estimatedGas": "0.003",
    "timeEstimate": "5-10 minutes",
    "route": [...],
    "fees": {...}
  },
  "request": {...},
  "timestamp": "2024-01-15T10:30:00Z"
}
```

## 🔗 API Reference

### Main Functions

```javascript
// Initialize service
initializeOneClickService(jwtToken, baseUrl)

// Get quote for trade intent
getQuoteForTradeIntent(tradeData, options)

// Check execution status
getExecutionStatus(depositAddress)

// Submit deposit transaction
submitDepositTransaction(txHash, depositAddress)
```

### Utility Functions

```javascript
// Check token support
isTokenSupported(tokenSymbol)

// Get supported tokens list
getSupportedTokens()

// Format quote for display
formatQuoteForDisplay(quoteResponse)
```

## 🎯 Best Practices

1. **Always use dry run** for initial quotes
2. **Verify token support** before requesting quotes
3. **Handle errors gracefully** with fallback responses
4. **Cache JWT tokens** securely if using authentication
5. **Monitor quote expiration** for time-sensitive trades

## 🔮 Future Enhancements

- **Multi-chain routing** optimization
- **Real-time price updates** 
- **Transaction tracking** integration
- **Gas optimization** suggestions
- **Slippage protection** alerts 