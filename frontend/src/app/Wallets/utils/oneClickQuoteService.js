/**
 * OneClick Quote Service Utility
 * 
 * This module provides functionality to interact with the 1Click API for cross-chain
 * token swaps. It integrates with our trade intent detection system to provide
 * seamless quote generation for detected trade intents.
 * 
 * @author FinOwl Team
 * @version 1.0.0
 */

import { OneClickService, OpenAPI } from '@defuse-protocol/one-click-sdk-typescript';

/**
 * Configuration for the OneClick service
 */
const ONE_CLICK_CONFIG = {
  BASE_URL: 'https://1click.chaindefuser.com',
  DEFAULT_SLIPPAGE: 100, // 1%
  DEFAULT_DRY_RUN: false
};

/**
 * Constants for request types (based on API documentation)
 */
const SWAP_TYPES = {
  EXACT_INPUT: 'EXACT_INPUT',
  EXACT_OUTPUT: 'EXACT_OUTPUT'
};

const DEPOSIT_TYPES = {
  ORIGIN_CHAIN: 'ORIGIN_CHAIN',
  DESTINATION_CHAIN: 'DESTINATION_CHAIN'
};

const REFUND_TYPES = {
  ORIGIN_CHAIN: 'ORIGIN_CHAIN',
  DESTINATION_CHAIN: 'DESTINATION_CHAIN'
};

const RECIPIENT_TYPES = {
  ORIGIN_CHAIN: 'ORIGIN_CHAIN',
  DESTINATION_CHAIN: 'DESTINATION_CHAIN'
};

/**
 * Token asset mapping for common tokens
 * Maps common token symbols to their 1Click asset identifiers
 */
const TOKEN_ASSET_MAP = {
  // NEAR native assets (based on actual API data)
  'NEAR': 'nep141:wrap.near',
  'WNEAR': 'nep141:wrap.near',
  'WRAP-NEAR': 'nep141:wrap.near',
  'USDT': 'nep141:usdt.tether-token.near',
  'USDC': 'nep141:17208628f84f5d6ad33f0da3bbbeb27ffcb398eac501a31bd6ad2011e36133a1',
  'ETH': 'nep141:eth.bridge.near',
  'WBTC': 'nep141:2260fac5e5542a773aa44fbcfedf7c193bc2c599.factory.bridge.near',
  'BTC': 'nep141:2260fac5e5542a773aa44fbcfedf7c193bc2c599.factory.bridge.near',
  'REF': 'nep141:token.v2.ref-finance.near',
  'FRAX': 'nep141:853d955acef822db058eb8505911ed77f175b99e.factory.bridge.near',
  'AURORA': 'nep141:aaaaaa20d9e0e2461697782ef11675f668207961.factory.bridge.near',
  
  // Cross-chain assets (keeping some for multi-chain support)
  'ARB-USDT': 'nep141:arb-0xaf88d065e77c8cc2239327c5edb3a432268e5831.omft.near',
  'ARB-USDC': 'nep141:arb-0xaf88d065e77c8cc2239327c5edb3a432268e5831.omft.near',
  'SOL': 'nep141:sol-5ce3bf3a31af18be40ba30f721101b4341690186.omft.near',
  'SOL-USDT': 'nep141:sol-es9vmfrzacermjfrf4h2fas4zxgr3sq7bup8fxaa.omft.near',
  
  // Default fallback (USDC on NEAR)
  'DEFAULT': 'nep141:17208628f84f5d6ad33f0da3bbbeb27ffcb398eac501a31bd6ad2011e36133a1'
};

/**
 * Initialize the OneClick API client
 * @param {string} jwtToken - JWT token for authentication
 * @param {string} baseUrl - Base URL for the API (optional)
 */
export function initializeOneClickService(jwtToken, baseUrl = ONE_CLICK_CONFIG.BASE_URL) {
  if (!jwtToken) {
    console.warn('OneClick service initialized without JWT token. Some features may not work.');
  }
  
  OpenAPI.BASE = baseUrl;
  OpenAPI.TOKEN = jwtToken;
  
}

/**
 * Maps a trade intent token symbol to a 1Click asset identifier
 * @param {string} tokenSymbol - Token symbol (e.g., 'BTC', 'ETH', 'USDT')
 * @param {string} preferredChain - Preferred blockchain (optional)
 * @returns {string} - 1Click asset identifier
 */
function mapTokenToAsset(tokenSymbol, preferredChain = 'eth') {
  const upperSymbol = tokenSymbol.toUpperCase();
  
  // Try chain-specific mapping first
  const chainSpecificKey = `${preferredChain.toUpperCase()}-${upperSymbol}`;
  if (TOKEN_ASSET_MAP[chainSpecificKey]) {
    return TOKEN_ASSET_MAP[chainSpecificKey];
  }
  
  // Try direct symbol mapping
  if (TOKEN_ASSET_MAP[upperSymbol]) {
    return TOKEN_ASSET_MAP[upperSymbol];
  }
  
  // Fallback to default
  console.warn(`Token mapping not found for ${tokenSymbol}, using default USDC`);
  return TOKEN_ASSET_MAP.DEFAULT;
}

/**
 * Convert amount to the appropriate units for the API
 * @param {number} amount - Amount in human-readable format
 * @param {string} tokenSymbol - Token symbol for decimals reference
 * @returns {string} - Amount in API format
 */
function formatAmountForAPI(amount, tokenSymbol) {
  // Validate amount
  if (!amount || isNaN(amount) || amount <= 0) {
    throw new Error(`Invalid amount: ${amount}. Must be a positive number.`);
  }

  // Most tokens use 18 decimals, but NEAR uses 24 decimals
  const decimalsMap = {
    'NEAR': 24,
    'WNEAR': 24,
    'WRAP-NEAR': 24,
    'USDT': 6,
    'USDC': 6,
    'BTC': 8,
    'WBTC': 8,
    'ETH': 18,
    'REF': 18,
    'FRAX': 18,
    'AURORA': 18,
    'SOL': 9,
    'DEFAULT': 18
  };
  
  const decimals = decimalsMap[tokenSymbol.toUpperCase()] || decimalsMap.DEFAULT;
  
  // Use BigInt for very large numbers to avoid overflow
  try {
    // Convert to string with appropriate decimals
    const multiplierStr = '1' + '0'.repeat(decimals);
    const amountBigInt = BigInt(Math.floor(amount * Number(multiplierStr)));
    
    // Convert back to string for API
    const formattedAmount = amountBigInt.toString();
    
    // Validate the result is reasonable (not too large for practical use)
    if (amountBigInt <= 0n) {
      throw new Error(`Amount too small after formatting: ${formattedAmount}`);
    }
    
    // Check if the amount is reasonable (less than a very large threshold)
    const maxAmount = BigInt('1000000000000000000000000000'); // 1 billion with 18 decimals
    if (amountBigInt > maxAmount) {
      throw new Error(`Amount too large for practical use: ${formattedAmount}. Please use a smaller amount.`);
    }
    
    
    return formattedAmount;
    
  } catch (error) {
    if (error.message.includes('too large') || error.message.includes('too small')) {
      throw error; // Re-throw our custom errors
    }
    throw new Error(`Failed to format amount ${amount} for ${tokenSymbol}: ${error.message}`);
  }
}

/**
 * Generate a quote request from trade intent data
 * @param {Object} tradeData - Trade data from trade intent detection
 * @param {Object} options - Additional options for the quote
 * @returns {Object} - Formatted quote request
 */
export function createQuoteRequest(tradeData, options = {}) {
  if (!tradeData || !tradeData.amount || !tradeData.originAsset || !tradeData.destinationAsset) {
    throw new Error('Invalid trade data: missing required fields (amount, originAsset, destinationAsset)');
  }

  const {
    slippageTolerance = ONE_CLICK_CONFIG.DEFAULT_SLIPPAGE,
    dry = ONE_CLICK_CONFIG.DEFAULT_DRY_RUN,
    refundTo = null,
    recipient = null,
    preferredChain = 'eth',
    connectedWallet = null // Pass the connected wallet address
  } = options;

  // Use connected wallet as default for refundTo and recipient if not provided
  // For NEAR addresses, we might need to format them differently for the API
  const defaultWallet = connectedWallet || 'finowl.near'; // Better fallback
  let finalRefundTo = refundTo || defaultWallet;
  let finalRecipient = recipient || defaultWallet;

  // If the wallet is a NEAR address, keep it as-is since 1Click supports NEAR
  // The API should handle NEAR addresses like "unholy38.near" directly
  
  // Map tokens to 1Click asset identifiers
  const originAsset = mapTokenToAsset(tradeData.originAsset, preferredChain);
  const destinationAsset = mapTokenToAsset(tradeData.destinationAsset, preferredChain);
  
  // Determine swap type and format amount based on trade template
  let swapType, formattedAmount, amountTokenSymbol;
  
  if (tradeData.templateUsed === 'BUY') {
    // For BUY: "buy 1 USDC with NEAR" means we want exactly 1 USDC output
    swapType = SWAP_TYPES.EXACT_OUTPUT;
    amountTokenSymbol = tradeData.destinationAsset; // Amount is in destination asset
    formattedAmount = formatAmountForAPI(tradeData.amount, amountTokenSymbol);
  } else {
    // For SELL: "sell 1 NEAR for USDC" means we're providing exactly 1 NEAR input  
    swapType = SWAP_TYPES.EXACT_INPUT;
    amountTokenSymbol = tradeData.originAsset; // Amount is in origin asset
    formattedAmount = formatAmountForAPI(tradeData.amount, amountTokenSymbol);
  }


  const quoteRequest = {
    dry: dry,
    swapType: swapType,
    slippageTolerance: slippageTolerance,
    originAsset: originAsset,
    depositType: DEPOSIT_TYPES.ORIGIN_CHAIN,
    destinationAsset: destinationAsset,
    amount: formattedAmount,
    refundTo: finalRefundTo,
    refundType: REFUND_TYPES.ORIGIN_CHAIN,
    recipient: finalRecipient,
    recipientType: RECIPIENT_TYPES.DESTINATION_CHAIN,
    deadline: new Date(Date.now() + 30 * 60 * 1000).toISOString() // 30 minutes from now
  };

  // Remove any null/undefined fields but keep empty strings and false values
  Object.keys(quoteRequest).forEach(key => {
    if (quoteRequest[key] === null || quoteRequest[key] === undefined) {
      delete quoteRequest[key];
    }
  });


  return quoteRequest;
}

/**
 * Get a quote for a trade intent
 * @param {Object} tradeData - Trade data from trade intent detection
 * @param {Object} options - Additional options for the quote
 * @returns {Promise<Object>} - Quote response from 1Click API
 */
export async function getQuoteForTradeIntent(tradeData, options = {}) {
  try {
    
    // Validate input
    if (!tradeData) {
      throw new Error('Trade data is required');
    }

    // Create quote request
    const quoteRequest = createQuoteRequest(tradeData, options);

    // Call the correct API method
    let quote;
    if (typeof OneClickService.getQuote === 'function') {
      quote = await OneClickService.getQuote(quoteRequest);
    } else {
      throw new Error('getQuote method not found in OneClickService. Available methods: ' + Object.getOwnPropertyNames(OneClickService).join(', '));
    }


    return {
      success: true,
      quote: quote,
      request: quoteRequest,
      tradeData: tradeData
    };

  } catch (error) {
    
    // Try to extract more detailed error information
    let detailedError = error.message;
    if (error.body) {
      try {
        const errorBody = typeof error.body === 'string' ? JSON.parse(error.body) : error.body;
        console.error('📄 API Error Body:', errorBody);
        if (errorBody.detail) {
          detailedError = errorBody.detail;
        } else if (errorBody.message) {
          detailedError = errorBody.message;
        } else if (errorBody.error) {
          detailedError = errorBody.error;
        }
      } catch (parseError) {
      }
    }
    
    // Handle specific API errors
    if (error.status === 401) {
      return {
        success: false,
        error: 'Authentication failed. Please check your JWT token.',
        code: 'AUTH_ERROR',
        details: error
      };
    } else if (error.status === 400) {
      return {
        success: false,
        error: `Invalid request: ${detailedError}`,
        code: 'INVALID_REQUEST',
        details: error.body || error
      };
    } else if (error.status === 404) {
      return {
        success: false,
        error: 'Quote service not available.',
        code: 'SERVICE_UNAVAILABLE',
        details: error
      };
    } else {
      return {
        success: false,
        error: `Failed to get quote: ${detailedError}`,
        code: 'UNKNOWN_ERROR',
        details: error
      };
    }
  }
}

/**
 * Get execution status for a deposit
 * @param {string} depositAddress - Deposit address to check status for
 * @returns {Promise<Object>} - Execution status response
 */
export async function getExecutionStatus(depositAddress) {
  try {
    
    if (!depositAddress) {
      throw new Error('Deposit address is required');
    }

    const status = await OneClickService.getExecutionStatus(depositAddress);


    return {
      success: true,
      status: status,
      depositAddress: depositAddress
    };

  } catch (error) {
    console.error('Error getting execution status:', error);
    
    return {
      success: false,
      error: 'Failed to get execution status.',
      code: 'STATUS_ERROR',
      details: error
    };
  }
}

/**
 * Submit a deposit transaction
 * @param {string} txHash - Transaction hash
 * @param {string} depositAddress - Deposit address
 * @returns {Promise<Object>} - Submission result
 */
export async function submitDepositTransaction(txHash, depositAddress) {
  try {
    
    if (!txHash || !depositAddress) {
      throw new Error('Transaction hash and deposit address are required');
    }

    const result = await OneClickService.submitDepositTx({
      txHash: txHash,
      depositAddress: depositAddress
    });
    

    return {
      success: true,
      result: result,
      txHash: txHash,
      depositAddress: depositAddress
    };

  } catch (error) {
    console.error('Error submitting deposit transaction:', error);
    
    return {
      success: false,
      error: 'Failed to submit deposit transaction.',
      code: 'SUBMIT_ERROR',
      details: error
    };
  }
}

/**
 * Get supported tokens list
 * @returns {Array} - List of supported token symbols
 */
export function getSupportedTokens() {
  return Object.keys(TOKEN_ASSET_MAP).filter(key => key !== 'DEFAULT');
}

/**
 * Check if a token is supported
 * @param {string} tokenSymbol - Token symbol to check
 * @returns {boolean} - Whether the token is supported
 */
export function isTokenSupported(tokenSymbol) {
  const upperSymbol = tokenSymbol.toUpperCase();
  return upperSymbol in TOKEN_ASSET_MAP || getSupportedTokens().some(token => 
    token.includes(upperSymbol)
  );
}

/**
 * Format quote response for display
 * @param {Object} quoteResponse - Quote response from API
 * @returns {Object} - Formatted quote for UI display
 */
export function formatQuoteForDisplay(quoteResponse) {
  if (!quoteResponse.success || !quoteResponse.quote) {
    return {
      success: false,
      error: quoteResponse.error || 'Invalid quote response'
    };
  }

  const quote = quoteResponse.quote.quote; // Access the nested quote object
  const request = quoteResponse.quote.quoteRequest;
  
  // Format deadline for user display
  const formatDeadline = (deadline) => {
    if (!deadline) return 'N/A';
    try {
      const date = new Date(deadline);
      return date.toLocaleString();
    } catch (error) {
      return deadline;
    }
  };

  return {
    success: true,
    // Core quote information
    amountIn: quote.amountInFormatted || 'N/A',
    amountOut: quote.amountOutFormatted || 'N/A',
    amountInUsd: quote.amountInUsd || 'N/A',
    amountOutUsd: quote.amountOutUsd || 'N/A',
    
    // Critical execution information
    depositAddress: quote.depositAddress || 'N/A',
    deadline: formatDeadline(quote.deadline),
    timeEstimate: quote.timeEstimate ? `${quote.timeEstimate} seconds` : 'N/A',
    
    // Additional useful information
    minAmountOut: quote.minAmountOut || 'N/A',
    slippageTolerance: request.slippageTolerance ? `${request.slippageTolerance / 100}%` : 'N/A',
    swapType: request.swapType || 'N/A',
    
    // Request information for reference
    originalRequest: quoteResponse.request,
    tradeData: quoteResponse.tradeData,
    correlationId: request.correlationId || 'N/A'
  };
} 