/**
 * Unit Tests for Trade Intent Detector
 * 
 * These tests ensure that the trade intent detection system works correctly
 * for all supported templates and handles edge cases appropriately.
 */

import { 
  detectTradeIntent, 
  generateTradeIntentResponse, 
  getSupportedTemplates,
  mightBeTradeIntent 
} from '../tradeIntentDetector.js';

describe('Trade Intent Detector', () => {
  
  describe('detectTradeIntent', () => {
    
    describe('BUY template', () => {
      test('should detect basic buy intent', () => {
        const result = detectTradeIntent('buy 100 btc with usdt');
        expect(result.isTradeIntent).toBe(true);
        expect(result.data).toEqual({
          amount: 100,
          destinationAsset: 'BTC',
          originAsset: 'USDT',
          templateUsed: 'BUY'
        });
      });

      test('should detect buy intent with decimal amount', () => {
        const result = detectTradeIntent('buy 100.5 eth with usdc');
        expect(result.isTradeIntent).toBe(true);
        expect(result.data.amount).toBe(100.5);
      });

      test('should detect buy intent with prefixes', () => {
        const testCases = [
          'i want to buy 50 link with usdt',
          "i'd like to buy 25 sol with usdc", 
          'please buy 75 ada with dai'
        ];

        testCases.forEach(testCase => {
          const result = detectTradeIntent(testCase);
          expect(result.isTradeIntent).toBe(true);
          expect(result.data.templateUsed).toBe('BUY');
        });
      });

      test('should support "using" keyword', () => {
        const result = detectTradeIntent('buy 200 near using usdt');
        expect(result.isTradeIntent).toBe(true);
        expect(result.data).toEqual({
          amount: 200,
          destinationAsset: 'NEAR',
          originAsset: 'USDT',
          templateUsed: 'BUY'
        });
      });
    });

    describe('SWAP template', () => {
      test('should detect basic swap intent', () => {
        const result = detectTradeIntent('swap 50 eth for dai');
        expect(result.isTradeIntent).toBe(true);
        expect(result.data).toEqual({
          amount: 50,
          originAsset: 'ETH',
          destinationAsset: 'DAI',
          templateUsed: 'SWAP'
        });
      });

      test('should support "to" keyword', () => {
        const result = detectTradeIntent('swap 100 usdc to eth');
        expect(result.isTradeIntent).toBe(true);
        expect(result.data.destinationAsset).toBe('ETH');
      });
    });

    describe('INVEST template', () => {
      test('should detect basic invest intent', () => {
        const result = detectTradeIntent('invest 1000 usdc in sol');
        expect(result.isTradeIntent).toBe(true);
        expect(result.data).toEqual({
          amount: 1000,
          originAsset: 'USDC',
          destinationAsset: 'SOL',
          templateUsed: 'INVEST'
        });
      });

      test('should support "into" keyword', () => {
        const result = detectTradeIntent('invest 500 usdt into btc');
        expect(result.isTradeIntent).toBe(true);
        expect(result.data.destinationAsset).toBe('BTC');
      });
    });

    describe('TRADE template', () => {
      test('should detect basic trade intent', () => {
        const result = detectTradeIntent('trade 25 near for eth');
        expect(result.isTradeIntent).toBe(true);
        expect(result.data).toEqual({
          amount: 25,
          originAsset: 'NEAR',
          destinationAsset: 'ETH',
          templateUsed: 'TRADE'
        });
      });
    });

    describe('Edge cases and validation', () => {
      test('should reject same origin and destination tokens', () => {
        const result = detectTradeIntent('buy 100 btc with btc');
        expect(result.isTradeIntent).toBe(false);
        expect(result.data).toBe(null);
      });

      test('should reject zero amount', () => {
        const result = detectTradeIntent('buy 0 btc with usdt');
        expect(result.isTradeIntent).toBe(false);
      });

      test('should reject negative amount', () => {
        const result = detectTradeIntent('buy -100 btc with usdt');
        expect(result.isTradeIntent).toBe(false);
      });

      test('should reject tokens with invalid characters', () => {
        const result = detectTradeIntent('buy 100 btc123 with usdt');
        expect(result.isTradeIntent).toBe(false);
      });

      test('should reject tokens that are too short', () => {
        const result = detectTradeIntent('buy 100 b with usdt');
        expect(result.isTradeIntent).toBe(false);
      });

      test('should reject tokens that are too long', () => {
        const result = detectTradeIntent('buy 100 verylongtoken with usdt');
        expect(result.isTradeIntent).toBe(false);
      });

      test('should handle empty or invalid input', () => {
        expect(detectTradeIntent('').isTradeIntent).toBe(false);
        expect(detectTradeIntent(null).isTradeIntent).toBe(false);
        expect(detectTradeIntent(undefined).isTradeIntent).toBe(false);
        expect(detectTradeIntent(123).isTradeIntent).toBe(false);
      });

      test('should be case insensitive', () => {
        const result = detectTradeIntent('BUY 100 BTC WITH USDT');
        expect(result.isTradeIntent).toBe(true);
        expect(result.data.originAsset).toBe('USDT');
        expect(result.data.destinationAsset).toBe('BTC');
      });

      test('should handle extra whitespace', () => {
        const result = detectTradeIntent('  buy   100   btc   with   usdt  ');
        expect(result.isTradeIntent).toBe(true);
      });
    });

    describe('Non-matching messages', () => {
      test('should not detect incomplete commands', () => {
        const invalidMessages = [
          'buy btc',
          'buy 100',
          'buy 100 btc',
          'swap eth',
          'trade for usdt',
          'invest in btc',
          'what is the price of bitcoin?',
          'how much does eth cost?',
          'i want to know about crypto',
          'buy some bitcoin',
          'sell 100 btc for usdt' // sell is not supported
        ];

        invalidMessages.forEach(message => {
          const result = detectTradeIntent(message);
          expect(result.isTradeIntent).toBe(false);
          expect(result.data).toBe(null);
        });
      });
    });
  });

  describe('generateTradeIntentResponse', () => {
    test('should generate valid response for trade data', () => {
      const tradeData = {
        amount: 100,
        originAsset: 'USDT',
        destinationAsset: 'BTC',
        templateUsed: 'BUY'
      };

      const response = generateTradeIntentResponse(tradeData);
      
      expect(response).toContain('Trade Intent Detected');
      expect(response).toContain('100 USDT');
      expect(response).toContain('BTC');
      expect(response).toContain('```json');
      expect(response).toContain('trade_request');
    });

    test('should throw error for invalid trade data', () => {
      expect(() => generateTradeIntentResponse(null)).toThrow('Invalid trade data provided');
      expect(() => generateTradeIntentResponse({})).toThrow('Invalid trade data provided');
      expect(() => generateTradeIntentResponse({
        amount: -1,
        originAsset: 'USDT',
        destinationAsset: 'BTC'
      })).toThrow('Invalid trade data provided');
    });

    test('should include all required fields in JSON response', () => {
      const tradeData = {
        amount: 50,
        originAsset: 'ETH',
        destinationAsset: 'USDC',
        templateUsed: 'SWAP'
      };

      const response = generateTradeIntentResponse(tradeData);
      
      // Extract JSON from response
      const jsonMatch = response.match(/```json\n([\s\S]*?)\n```/);
      expect(jsonMatch).toBeTruthy();
      
      const jsonData = JSON.parse(jsonMatch[1]);
      expect(jsonData).toHaveProperty('intent', 'trade_request');
      expect(jsonData).toHaveProperty('timestamp');
      expect(jsonData).toHaveProperty('trade_details');
      expect(jsonData).toHaveProperty('status', 'pending_confirmation');
      expect(jsonData).toHaveProperty('template_used', 'SWAP');
      expect(jsonData).toHaveProperty('next_steps');
      expect(jsonData).toHaveProperty('metadata');
      
      expect(jsonData.trade_details).toEqual({
        originAsset: 'ETH',
        destinationAsset: 'USDC',
        amount: 50
      });
    });
  });

  describe('getSupportedTemplates', () => {
    test('should return all supported templates', () => {
      const templates = getSupportedTemplates();
      
      expect(templates).toHaveLength(4);
      expect(templates.map(t => t.name)).toEqual(['BUY', 'SWAP', 'INVEST', 'TRADE']);
      
      templates.forEach(template => {
        expect(template).toHaveProperty('name');
        expect(template).toHaveProperty('description');
        expect(template).toHaveProperty('example');
      });
    });
  });

  describe('mightBeTradeIntent', () => {
    test('should detect potential trade keywords', () => {
      const potentialTradeMessages = [
        'I want to buy some bitcoin',
        'How do I swap tokens?',
        'Can I trade eth for usdt?',
        'Invest in solana',
        'Exchange my tokens',
        'Convert usdc to eth'
      ];

      potentialTradeMessages.forEach(message => {
        expect(mightBeTradeIntent(message)).toBe(true);
      });
    });

    test('should not detect non-trade messages', () => {
      const nonTradeMessages = [
        'What is the price of bitcoin?',
        'How is the market today?',
        'Tell me about defi',
        'What are smart contracts?'
      ];

      nonTradeMessages.forEach(message => {
        expect(mightBeTradeIntent(message)).toBe(false);
      });
    });

    test('should handle invalid input', () => {
      expect(mightBeTradeIntent(null)).toBe(false);
      expect(mightBeTradeIntent(undefined)).toBe(false);
      expect(mightBeTradeIntent('')).toBe(false);
      expect(mightBeTradeIntent(123)).toBe(false);
    });
  });

  describe('Integration tests', () => {
    test('should handle complete workflow for valid trade intent', () => {
      const message = 'buy 100 btc with usdt';
      
      // First, check if it might be a trade intent
      expect(mightBeTradeIntent(message)).toBe(true);
      
      // Then detect the actual intent
      const detection = detectTradeIntent(message);
      expect(detection.isTradeIntent).toBe(true);
      
      // Finally, generate response
      const response = generateTradeIntentResponse(detection.data);
      expect(response).toContain('Trade Intent Detected');
    });

    test('should handle workflow for non-trade message', () => {
      const message = 'What is the current price of Bitcoin?';
      
      // Might be detected as potential (contains 'bitcoin')
      // but won't match strict template
      const detection = detectTradeIntent(message);
      expect(detection.isTradeIntent).toBe(false);
      expect(detection.data).toBe(null);
    });
  });

  describe('Real-world examples', () => {
    test('should handle realistic user messages', () => {
      const realWorldExamples = [
        {
          message: 'i want to buy 0.5 eth with usdc',
          expected: { amount: 0.5, originAsset: 'USDC', destinationAsset: 'ETH' }
        },
        {
          message: 'please swap 1000 usdt for sol',
          expected: { amount: 1000, originAsset: 'USDT', destinationAsset: 'SOL' }
        },
        {
          message: 'trade 50.25 near for eth',
          expected: { amount: 50.25, originAsset: 'NEAR', destinationAsset: 'ETH' }
        },
        {
          message: "i'd like to invest 2500 usdc into btc",
          expected: { amount: 2500, originAsset: 'USDC', destinationAsset: 'BTC' }
        }
      ];

      realWorldExamples.forEach(({ message, expected }) => {
        const result = detectTradeIntent(message);
        expect(result.isTradeIntent).toBe(true);
        expect(result.data.amount).toBe(expected.amount);
        expect(result.data.originAsset).toBe(expected.originAsset);
        expect(result.data.destinationAsset).toBe(expected.destinationAsset);
      });
    });
  });
}); 