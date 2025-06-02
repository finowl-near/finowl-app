/**
 * Trade Intent Detector Utility
 * 
 * This module provides functionality to detect and parse structured trade intents
 * from user messages. It supports rigid template matching for buy/swap/invest/trade
 * operations and extracts structured data when templates match exactly.
 * 
 * @author FinOwl Team
 * @version 1.0.0
 */

import { getQuoteForTradeIntent, formatQuoteForDisplay } from './oneClickQuoteService';

/**
 * Supported Trade Intent Templates:
 * 
 * Template 1: BUY - "buy [amount] [destinationToken] with [originToken]"
 * Example: "buy 100 btc with usdt" → buy 100 BTC using USDT
 * 
 * Template 2: SWAP - "swap [amount] [originToken] for [destinationToken]"
 * Example: "swap 50 eth for dai" → swap 50 ETH for DAI
 * 
 * Template 3: INVEST - "invest [amount] [originToken] in [destinationToken]"
 * Example: "invest 1000 usdc in sol" → invest 1000 USDC in SOL
 * 
 * Template 4: TRADE - "trade [amount] [originToken] for [destinationToken]"
 * Example: "trade 25 near for eth" → trade 25 NEAR for ETH
 * 
 * Optional Prefixes: "i want to", "i'd like to", "please"
 * 
 * Validation Rules:
 * - Amount must be a positive number (integer or decimal)
 * - Token symbols must be 2-10 characters (letters only)
 * - Origin and destination tokens must be different
 * - Template must match exactly (case-insensitive)
 */

/**
 * Trade intent result structure
 * @typedef {Object} TradeIntentResult
 * @property {boolean} isTradeIntent - Whether a valid trade intent was detected
 * @property {TradeData|null} data - Extracted trade data if intent detected
 */

/**
 * Trade data structure
 * @typedef {Object} TradeData
 * @property {number} amount - Amount to trade/buy/swap
 * @property {string} originAsset - Token symbol being sold/traded from
 * @property {string} destinationAsset - Token symbol being bought/traded to
 */

/**
 * Template configuration for different trade operations
 */
const TRADE_TEMPLATES = [
  {
    name: 'BUY',
    description: 'Buy [amount] [token] with [token]',
    pattern: /^(?:i want to |i'd like to |please |)?buy\s+(\d+(?:\.\d+)?)\s+([a-zA-Z]{2,10})\s+(?:with|using)\s+([a-zA-Z]{2,10})$/,
    extract: (match) => ({
      amount: parseFloat(match[1]),
      destinationAsset: match[2].toUpperCase(),
      originAsset: match[3].toUpperCase()
    }),
    example: 'buy 100 btc with usdt'
  },
  {
    name: 'SWAP',
    description: 'Swap [amount] [token] for [token]',
    pattern: /^(?:i want to |i'd like to |please |)?swap\s+(\d+(?:\.\d+)?)\s+([a-zA-Z]{2,10})\s+(?:for|to)\s+([a-zA-Z]{2,10})$/,
    extract: (match) => ({
      amount: parseFloat(match[1]),
      originAsset: match[2].toUpperCase(),
      destinationAsset: match[3].toUpperCase()
    }),
    example: 'swap 50 eth for dai'
  },
  {
    name: 'INVEST',
    description: 'Invest [amount] [token] in [token]',
    pattern: /^(?:i want to |i'd like to |please |)?invest\s+(\d+(?:\.\d+)?)\s+([a-zA-Z]{2,10})\s+(?:in|into)\s+([a-zA-Z]{2,10})$/,
    extract: (match) => ({
      amount: parseFloat(match[1]),
      originAsset: match[2].toUpperCase(),
      destinationAsset: match[3].toUpperCase()
    }),
    example: 'invest 1000 usdc in sol'
  },
  {
    name: 'TRADE',
    description: 'Trade [amount] [token] for [token]',
    pattern: /^(?:i want to |i'd like to |please |)?trade\s+(\d+(?:\.\d+)?)\s+([a-zA-Z]{2,10})\s+(?:for|to)\s+([a-zA-Z]{2,10})$/,
    extract: (match) => ({
      amount: parseFloat(match[1]),
      originAsset: match[2].toUpperCase(),
      destinationAsset: match[3].toUpperCase()
    }),
    example: 'trade 25 near for eth'
  }
];

/**
 * Validates extracted trade data to ensure it meets business rules
 * @param {TradeData} data - The extracted trade data
 * @returns {boolean} - Whether the data is valid
 */
function validateTradeData(data) {
  // Amount must be positive
  if (!data.amount || data.amount <= 0) {
    return false;
  }

  // Both assets must be present
  if (!data.originAsset || !data.destinationAsset) {
    return false;
  }

  // Assets must be different
  if (data.originAsset === data.destinationAsset) {
    return false;
  }

  // Amount must be a valid number
  if (isNaN(data.amount) || !isFinite(data.amount)) {
    return false;
  }

  return true;
}

/**
 * Detects trade intent from user message and extracts structured data
 * 
 * This function analyzes a user message to determine if it matches any of the
 * predefined trade intent templates. If a match is found, it extracts and
 * validates the trade parameters.
 * 
 * @param {string} message - User message to analyze
 * @returns {TradeIntentResult} - Detection result with extracted data
 * 
 * @example
 * // Valid trade intent
 * detectTradeIntent("buy 100 btc with usdt")
 * // Returns: { isTradeIntent: true, data: { amount: 100, originAsset: "USDT", destinationAsset: "BTC" } }
 * 
 * @example
 * // Invalid/no trade intent
 * detectTradeIntent("what is the price of bitcoin?")
 * // Returns: { isTradeIntent: false, data: null }
 */
export function detectTradeIntent(message) {
  if (!message || typeof message !== 'string') {
    return {
      isTradeIntent: false,
      data: null
    };
  }

  const cleanMessage = message.toLowerCase().trim();
  
  // Test each template
  for (const template of TRADE_TEMPLATES) {
    const match = cleanMessage.match(template.pattern);
    if (match) {
      try {
        const extractedData = template.extract(match);
        
        // Validate extracted data
        if (validateTradeData(extractedData)) {
          return {
            isTradeIntent: true,
            data: {
              ...extractedData,
              templateUsed: template.name
            }
          };
        }
      } catch (error) {
        console.error(`Error extracting data from template ${template.name}:`, error);
        continue;
      }
    }
  }

  return {
    isTradeIntent: false,
    data: null
  };
}

/**
 * Generates a formatted response for detected trade intent
 * 
 * Creates a structured JSON response with trade details and next steps
 * when a valid trade intent is detected. The response includes both
 * human-readable content and machine-readable JSON data.
 * 
 * @param {TradeData} tradeData - Validated trade data
 * @returns {string} - Formatted markdown response with JSON
 * 
 * @example
 * const tradeData = { amount: 100, originAsset: "USDT", destinationAsset: "BTC" };
 * const response = generateTradeIntentResponse(tradeData);
 * // Returns formatted markdown with trade details and JSON structure
 */
export function generateTradeIntentResponse(tradeData) {
  if (!tradeData || !validateTradeData(tradeData)) {
    throw new Error('Invalid trade data provided');
  }

  const response = {
    intent: "trade_request",
    timestamp: new Date().toISOString(),
    trade_details: {
      originAsset: tradeData.originAsset,
      destinationAsset: tradeData.destinationAsset,
      amount: tradeData.amount
    },
    status: "pending_confirmation",
    message: `Trade intent detected: ${tradeData.amount} ${tradeData.originAsset} → ${tradeData.destinationAsset}`,
    template_used: tradeData.templateUsed || "UNKNOWN",
    next_steps: [
      "Review trade details",
      "Connect to preferred DEX",
      "Confirm transaction parameters",
      "Execute trade"
    ],
    metadata: {
      processed_at: new Date().toISOString(),
      confidence: "high",
      validation_passed: true
    }
  };

  return `# Trade Intent Detected 🔄

**Trade Details:**
- **Amount:** ${tradeData.amount} ${tradeData.originAsset}
- **From:** ${tradeData.originAsset}
- **To:** ${tradeData.destinationAsset}
- **Intent:** ${tradeData.templateUsed || 'Trade'}
- **Status:** Ready for processing

**Structured Data:**
\`\`\`json
${JSON.stringify(response, null, 2)}
\`\`\`

**Next Steps:**
1. Review the trade details above
2. Confirm the transaction parameters
3. Connect to your preferred DEX or trading platform
4. Execute the trade

**Note:** This trade intent has been parsed from your message and is ready for execution. No AI analysis was needed as it matched our structured template format.`;
}

/**
 * Gets information about all supported templates
 * @returns {Array} - Array of template information
 */
export function getSupportedTemplates() {
  return TRADE_TEMPLATES.map(template => ({
    name: template.name,
    description: template.description,
    example: template.example
  }));
}

/**
 * Checks if a message might be a trade intent (loose check)
 * This is useful for UI hints before actual processing
 * @param {string} message - Message to check
 * @returns {boolean} - Whether message might contain trade intent
 */
export function mightBeTradeIntent(message) {
  if (!message || typeof message !== 'string') {
    return false;
  }

  const cleanMessage = message.toLowerCase();
  const tradeKeywords = ['buy', 'swap', 'trade', 'invest', 'exchange', 'convert'];
  
  return tradeKeywords.some(keyword => cleanMessage.includes(keyword));
}

/**
 * Generates a comprehensive response with 1Click quote for detected trade intent
 * 
 * This function combines the structured template response with a real quote
 * from the 1Click API, providing both structured data and executable swap details.
 * 
 * @param {TradeData} tradeData - Validated trade data
 * @param {Object} quoteOptions - Options for the quote request
 * @returns {Promise<string>} - Formatted markdown response with JSON and quote
 */
export async function generateTradeIntentResponseWithQuote(tradeData, quoteOptions = {}) {
  if (!tradeData || !validateTradeData(tradeData)) {
    throw new Error('Invalid trade data provided');
  }

  // Generate base structured response
  const baseResponse = generateTradeIntentResponse(tradeData);
  
  try {
    // Get quote from 1Click API
    const quoteResponse = await getQuoteForTradeIntent(tradeData, quoteOptions);
    
    if (quoteResponse.success) {
      const formattedQuote = formatQuoteForDisplay(quoteResponse);
      
      return `${baseResponse}

## 🚀 Live Quote Retrieved!

### 💰 Quote Summary
- **You Send:** ${formattedQuote.amountIn} ${tradeData.originAsset} (~$${formattedQuote.amountInUsd})
- **You Receive:** ${formattedQuote.amountOut} ${tradeData.destinationAsset} (~$${formattedQuote.amountOutUsd})
- **Minimum Output:** ${formattedQuote.minAmountOut} ${tradeData.destinationAsset}

### 🎯 Execution Details
**🏦 Deposit Address:** 
\`${formattedQuote.depositAddress}\`

**⏰ Quote Valid Until:** 
${formattedQuote.deadline}

**⚡ Estimated Time:** ${formattedQuote.timeEstimate}
**📊 Slippage:** ${formattedQuote.slippageTolerance}
**🔄 Type:** ${formattedQuote.swapType}

### 📋 How to Execute
1. **Send exactly** ${formattedQuote.amountIn} ${tradeData.originAsset} to the deposit address above
2. **Within** ${formattedQuote.timeEstimate} the swap will execute automatically  
3. **You'll receive** ${formattedQuote.amountOut} ${tradeData.destinationAsset} at your address
4. **Quote expires** ${formattedQuote.deadline}

⚠️ **Important:** Only send the exact token amount to the deposit address. Any other amount or token will be lost.

### 🔍 Technical Details
**Correlation ID:** \`${formattedQuote.correlationId}\`

**Full Quote Data:**
\`\`\`json
${JSON.stringify({
  quote: quoteResponse.quote,
  request: quoteResponse.request,
  timestamp: new Date().toISOString()
}, null, 2)}
\`\`\``;

    } else {
      // Quote failed, return base response with error info
      return `${baseResponse}

## ⚠️ Quote Request Failed

**Error:** ${quoteResponse.error}
**Code:** ${quoteResponse.code}

**What you can do:**
- Check if the tokens are supported on the 1Click network
- Verify your JWT token is valid (if required)
- Try again in a few moments
- Use a different amount or token pair

**Supported Tokens:** ETH, BTC, USDT, USDC, SOL, NEAR, and more
**Note:** This template was detected correctly, but the live quote could not be retrieved.`;
    }
    
  } catch (error) {
    console.error('Error generating quote for trade intent:', error);
    
    // Return base response with error info
    return `${baseResponse}

## ❌ Quote Service Error

**Error:** Failed to connect to quote service
**Details:** ${error.message}

**Note:** The trade intent was detected correctly, but we couldn't fetch a live quote. You can still use the structured data above for manual execution or try again later.`;
  }
} 