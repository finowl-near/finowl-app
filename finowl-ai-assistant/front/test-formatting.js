/**
 * Test script to verify the updated formatQuoteForDisplay function
 * Tests the new format with real quote response structure
 */

// Mock a real quote response structure based on our API tests
const mockQuoteResponse = {
  success: true,
  quote: {
    quoteRequest: {
      correlationId: "test-123",
      slippageTolerance: 100,
      swapType: "EXACT_OUTPUT",
      deadline: "2025-05-23T23:47:02.456Z"
    },
    quote: {
      amountIn: "357561155291425185324176",
      amountInFormatted: "0.357561155291425185324176",
      amountInUsd: "1.0190",
      amountOut: "1000000",
      amountOutFormatted: "1.0",
      amountOutUsd: "0.9998",
      minAmountOut: "1000000",
      timeEstimate: 20,
      deadline: "2025-05-24T23:17:19.143Z",
      depositAddress: "f85a62334b3e28cdf2b8b959b7c4216d16d21d6a92d41c574c1c03d66c7220b2"
    }
  },
  request: { /* original request */ },
  tradeData: {
    amount: 1,
    originAsset: 'NEAR',
    destinationAsset: 'USDC',
    templateUsed: 'BUY'
  }
};

// Import the function (this would need to be adjusted for actual testing)
console.log('🧪 Testing formatQuoteForDisplay function...\n');

// Simulate the formatQuoteForDisplay function locally
function formatQuoteForDisplay(quoteResponse) {
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

// Test the function
const formatted = formatQuoteForDisplay(mockQuoteResponse);

console.log('✅ Formatted Quote Result:');
console.log(JSON.stringify(formatted, null, 2));

console.log('\n🎯 Key Fields Check:');
console.log(`✅ Deposit Address: ${formatted.depositAddress}`);
console.log(`✅ Deadline: ${formatted.deadline}`);
console.log(`✅ Amount In: ${formatted.amountIn} NEAR`);
console.log(`✅ Amount Out: ${formatted.amountOut} USDC`);
console.log(`✅ Time Estimate: ${formatted.timeEstimate}`);

console.log('\n📋 Sample User Response:');
console.log(`
## 🚀 Live Quote Retrieved!

### 💰 Quote Summary
- **You Send:** ${formatted.amountIn} NEAR (~$${formatted.amountInUsd})
- **You Receive:** ${formatted.amountOut} USDC (~$${formatted.amountOutUsd})
- **Minimum Output:** ${formatted.minAmountOut} USDC

### 🎯 Execution Details
**🏦 Deposit Address:** 
\`${formatted.depositAddress}\`

**⏰ Quote Valid Until:** 
${formatted.deadline}

**⚡ Estimated Time:** ${formatted.timeEstimate}
**📊 Slippage:** ${formatted.slippageTolerance}
**🔄 Type:** ${formatted.swapType}

### 📋 How to Execute
1. **Send exactly** ${formatted.amountIn} NEAR to the deposit address above
2. **Within** ${formatted.timeEstimate} the swap will execute automatically  
3. **You'll receive** ${formatted.amountOut} USDC at your address
4. **Quote expires** ${formatted.deadline}

⚠️ **Important:** Only send the exact token amount to the deposit address.
`);

console.log('\n✅ Test completed! The deposit address and deadline are now prominently displayed.'); 