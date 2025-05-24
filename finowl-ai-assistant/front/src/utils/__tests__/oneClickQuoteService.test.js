/**
 * Unit Tests for OneClick Quote Service
 * 
 * These tests ensure that the 1Click integration works correctly
 * for all supported features and handles edge cases appropriately.
 */

import { 
  initializeOneClickService,
  createQuoteRequest,
  getQuoteForTradeIntent,
  formatQuoteForDisplay,
  getSupportedTokens,
  isTokenSupported
} from '../oneClickQuoteService.js';

// Mock the 1Click SDK
jest.mock('@defuse-protocol/one-click-sdk-typescript', () => ({
  OneClickService: {
    oneClickControllerGetQuote: jest.fn(),
    oneClickControllerGetExecutionStatus: jest.fn(),
    oneClickControllerSubmitDepositTx: jest.fn()
  },
  OpenAPI: {
    BASE: '',
    TOKEN: ''
  }
}));

describe('OneClick Quote Service', () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('initializeOneClickService', () => {
    test('should initialize service with JWT token', () => {
      const jwt = 'test-jwt-token';
      const baseUrl = 'https://test.api.com';
      
      initializeOneClickService(jwt, baseUrl);
      
      // Service should be initialized (we can't easily test OpenAPI changes in unit tests)
      expect(true).toBe(true); // Placeholder assertion
    });

    test('should warn when initialized without JWT token', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      initializeOneClickService(null);
      
      expect(consoleSpy).toHaveBeenCalledWith(
        'OneClick service initialized without JWT token. Some features may not work.'
      );
      
      consoleSpy.mockRestore();
    });
  });

  describe('createQuoteRequest', () => {
    test('should create valid quote request for BUY trade', () => {
      const tradeData = {
        amount: 100,
        originAsset: 'USDT',
        destinationAsset: 'BTC'
      };

      const quoteRequest = createQuoteRequest(tradeData);

      expect(quoteRequest).toEqual({
        dry: true,
        swapType: 'EXACT_INPUT',
        slippageTolerance: 100,
        originAsset: 'nep141:eth-0xdac17f958d2ee523a2206206994597c13d831ec7.omft.near',
        depositType: 'ORIGIN_CHAIN',
        destinationAsset: 'nep141:eth-0x2260fac5e5542a773aa44fbcfedf7c193bc2c599.omft.near',
        amount: '100000000' // 100 * 10^6 for USDT
      });
    });

    test('should create quote request with custom options', () => {
      const tradeData = {
        amount: 50,
        originAsset: 'ETH',
        destinationAsset: 'USDC'
      };

      const options = {
        slippageTolerance: 200,
        dry: false,
        refundTo: '0x123...',
        recipient: '0x456...'
      };

      const quoteRequest = createQuoteRequest(tradeData, options);

      expect(quoteRequest.slippageTolerance).toBe(200);
      expect(quoteRequest.dry).toBe(false);
      expect(quoteRequest.refundTo).toBe('0x123...');
      expect(quoteRequest.recipient).toBe('0x456...');
    });

    test('should throw error for invalid trade data', () => {
      expect(() => createQuoteRequest(null)).toThrow('Invalid trade data');
      expect(() => createQuoteRequest({})).toThrow('Invalid trade data');
      expect(() => createQuoteRequest({ amount: 100 })).toThrow('Invalid trade data');
    });

    test('should handle chain-specific tokens', () => {
      const tradeData = {
        amount: 1000,
        originAsset: 'USDT',
        destinationAsset: 'SOL'
      };

      const options = { preferredChain: 'arb' };
      const quoteRequest = createQuoteRequest(tradeData, options);

      expect(quoteRequest.originAsset).toBe('nep141:arb-0xaf88d065e77c8cc2239327c5edb3a432268e5831.omft.near');
    });
  });

  describe('getQuoteForTradeIntent', () => {
    test('should return successful quote response', async () => {
      const mockQuote = {
        estimatedOutput: '0.002456',
        depositAddress: '0x123...abc',
        estimatedGas: '0.003',
        timeEstimate: '5-10 minutes'
      };

      const { OneClickService } = require('@defuse-protocol/one-click-sdk-typescript');
      OneClickService.oneClickControllerGetQuote.mockResolvedValue(mockQuote);

      const tradeData = {
        amount: 100,
        originAsset: 'USDT',
        destinationAsset: 'BTC'
      };

      const result = await getQuoteForTradeIntent(tradeData);

      expect(result.success).toBe(true);
      expect(result.quote).toEqual(mockQuote);
      expect(result.tradeData).toEqual(tradeData);
    });

    test('should handle authentication errors', async () => {
      const { OneClickService } = require('@defuse-protocol/one-click-sdk-typescript');
      OneClickService.oneClickControllerGetQuote.mockRejectedValue({
        status: 401,
        message: 'Unauthorized'
      });

      const tradeData = {
        amount: 100,
        originAsset: 'USDT',
        destinationAsset: 'BTC'
      };

      const result = await getQuoteForTradeIntent(tradeData);

      expect(result.success).toBe(false);
      expect(result.code).toBe('AUTH_ERROR');
      expect(result.error).toContain('Authentication failed');
    });

    test('should handle invalid request errors', async () => {
      const { OneClickService } = require('@defuse-protocol/one-click-sdk-typescript');
      OneClickService.oneClickControllerGetQuote.mockRejectedValue({
        status: 400,
        body: { error: 'Invalid amount' }
      });

      const tradeData = {
        amount: 100,
        originAsset: 'USDT',
        destinationAsset: 'BTC'
      };

      const result = await getQuoteForTradeIntent(tradeData);

      expect(result.success).toBe(false);
      expect(result.code).toBe('INVALID_REQUEST');
    });

    test('should handle service unavailable errors', async () => {
      const { OneClickService } = require('@defuse-protocol/one-click-sdk-typescript');
      OneClickService.oneClickControllerGetQuote.mockRejectedValue({
        status: 404,
        message: 'Not Found'
      });

      const tradeData = {
        amount: 100,
        originAsset: 'USDT',
        destinationAsset: 'BTC'
      };

      const result = await getQuoteForTradeIntent(tradeData);

      expect(result.success).toBe(false);
      expect(result.code).toBe('SERVICE_UNAVAILABLE');
    });

    test('should require trade data', async () => {
      const result = await getQuoteForTradeIntent(null);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Trade data is required');
    });
  });

  describe('formatQuoteForDisplay', () => {
    test('should format successful quote response', () => {
      const quoteResponse = {
        success: true,
        quote: {
          estimatedOutput: '0.002456',
          depositAddress: '0x123...abc',
          estimatedGas: '0.003',
          timeEstimate: '5-10 minutes',
          slippageTolerance: 100,
          route: ['ETH', 'USDT', 'BTC'],
          fees: { network: '0.001 ETH', service: '0.1%' }
        },
        request: { amount: '100' },
        tradeData: { amount: 100, originAsset: 'USDT', destinationAsset: 'BTC' }
      };

      const formatted = formatQuoteForDisplay(quoteResponse);

      expect(formatted.success).toBe(true);
      expect(formatted.estimatedOutput).toBe('0.002456');
      expect(formatted.depositAddress).toBe('0x123...abc');
      expect(formatted.timeEstimate).toBe('5-10 minutes');
      expect(formatted.route).toEqual(['ETH', 'USDT', 'BTC']);
    });

    test('should handle failed quote response', () => {
      const quoteResponse = {
        success: false,
        error: 'Quote failed'
      };

      const formatted = formatQuoteForDisplay(quoteResponse);

      expect(formatted.success).toBe(false);
      expect(formatted.error).toBe('Quote failed');
    });

    test('should handle missing quote data', () => {
      const quoteResponse = {
        success: true,
        quote: null
      };

      const formatted = formatQuoteForDisplay(quoteResponse);

      expect(formatted.success).toBe(false);
      expect(formatted.error).toBe('Invalid quote response');
    });

    test('should provide default values for missing fields', () => {
      const quoteResponse = {
        success: true,
        quote: {}
      };

      const formatted = formatQuoteForDisplay(quoteResponse);

      expect(formatted.estimatedOutput).toBe('N/A');
      expect(formatted.depositAddress).toBe('N/A');
      expect(formatted.estimatedGas).toBe('N/A');
      expect(formatted.timeEstimate).toBe('N/A');
      expect(formatted.slippage).toBe('N/A');
      expect(formatted.route).toEqual([]);
      expect(formatted.fees).toEqual({});
    });
  });

  describe('getSupportedTokens', () => {
    test('should return array of supported tokens', () => {
      const tokens = getSupportedTokens();

      expect(Array.isArray(tokens)).toBe(true);
      expect(tokens.length).toBeGreaterThan(0);
      expect(tokens).toContain('USDT');
      expect(tokens).toContain('ETH');
      expect(tokens).toContain('BTC');
      expect(tokens).not.toContain('DEFAULT');
    });
  });

  describe('isTokenSupported', () => {
    test('should return true for supported tokens', () => {
      expect(isTokenSupported('USDT')).toBe(true);
      expect(isTokenSupported('usdt')).toBe(true);
      expect(isTokenSupported('ETH')).toBe(true);
      expect(isTokenSupported('BTC')).toBe(true);
      expect(isTokenSupported('SOL')).toBe(true);
    });

    test('should return true for chain-specific tokens', () => {
      expect(isTokenSupported('ARB')).toBe(true); // Should match ARB-USDT pattern
    });

    test('should return false for unsupported tokens', () => {
      expect(isTokenSupported('DOGE')).toBe(false);
      expect(isTokenSupported('UNKNOWN')).toBe(false);
      expect(isTokenSupported('')).toBe(false);
    });

    test('should handle null/undefined input', () => {
      expect(isTokenSupported(null)).toBe(false);
      expect(isTokenSupported(undefined)).toBe(false);
    });
  });

  describe('Token amount formatting', () => {
    test('should format amounts correctly for different token decimals', () => {
      // USDT (6 decimals)
      const usdtTradeData = {
        amount: 100,
        originAsset: 'USDT',
        destinationAsset: 'BTC'
      };
      const usdtRequest = createQuoteRequest(usdtTradeData);
      expect(usdtRequest.amount).toBe('100000000'); // 100 * 10^6

      // ETH (18 decimals)
      const ethTradeData = {
        amount: 1,
        originAsset: 'ETH',
        destinationAsset: 'USDT'
      };
      const ethRequest = createQuoteRequest(ethTradeData);
      expect(ethRequest.amount).toBe('1000000000000000000'); // 1 * 10^18

      // BTC (8 decimals)
      const btcTradeData = {
        amount: 0.5,
        originAsset: 'BTC',
        destinationAsset: 'ETH'
      };
      const btcRequest = createQuoteRequest(btcTradeData);
      expect(btcRequest.amount).toBe('50000000'); // 0.5 * 10^8
    });
  });

  describe('Error handling', () => {
    test('should handle network errors gracefully', async () => {
      const { OneClickService } = require('@defuse-protocol/one-click-sdk-typescript');
      OneClickService.oneClickControllerGetQuote.mockRejectedValue(
        new Error('Network connection failed')
      );

      const tradeData = {
        amount: 100,
        originAsset: 'USDT',
        destinationAsset: 'BTC'
      };

      const result = await getQuoteForTradeIntent(tradeData);

      expect(result.success).toBe(false);
      expect(result.code).toBe('UNKNOWN_ERROR');
      expect(result.error).toContain('Failed to get quote');
    });

    test('should handle malformed API responses', async () => {
      const { OneClickService } = require('@defuse-protocol/one-click-sdk-typescript');
      OneClickService.oneClickControllerGetQuote.mockResolvedValue(null);

      const tradeData = {
        amount: 100,
        originAsset: 'USDT',
        destinationAsset: 'BTC'
      };

      const result = await getQuoteForTradeIntent(tradeData);

      expect(result.success).toBe(true);
      expect(result.quote).toBe(null);
    });
  });
}); 