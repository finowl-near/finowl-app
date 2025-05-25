import { utils } from 'near-api-js';

/**
 * Service for handling NEAR token transfers to 1Click deposit addresses
 */
export class NearTransferService {
  
  /**
   * Execute a NEAR transfer to a deposit address
   * @param {Object} params - Transfer parameters
   * @param {string} params.amountIn - Amount with token symbol (e.g., "1.2 NEAR")
   * @param {string} params.depositAddress - Target deposit address
   * @param {Object} params.walletSelector - Wallet selector instance from useWalletSelector hook
   * @returns {Promise<Object>} Transfer result with success/error status and transaction details
   */
  static async executeNearTransfer({ amountIn, depositAddress, walletSelector }) {
    try {
      console.log(`🏦 Initiating NEAR transfer:`, {
        to: depositAddress,
        amount: amountIn,
        asset: 'NEAR'
      });
      
      // Extract numeric amount from the amountIn string (e.g., "1.2 NEAR" -> "1.2")
      const numericAmount = amountIn.split(' ')[0];
      console.log(`💰 Parsed amount: ${numericAmount} NEAR`);
      
      // Convert NEAR amount to yoctoNEAR for the transfer
      const amountInYocto = utils.format.parseNearAmount(numericAmount);
      console.log(`💱 Amount in yoctoNEAR: ${amountInYocto}`);
      
      if (!amountInYocto) {
        throw new Error(`Invalid amount format: ${amountIn}`);
      }
      
      console.log('🔐 Initiating NEAR transfer using signAndSendTransactions...');
      
      // Execute the transfer using wallet selector
      const result = await walletSelector.signAndSendTransactions({
        transactions: [{
          receiverId: depositAddress,
          actions: [
            {
              type: 'Transfer',
              params: {
                deposit: amountInYocto
              }
            }
          ]
        }]
      });
      
      console.log('✅ Transfer transaction result:', result);
      
      return {
        success: true,
        result,
        transactionHash: result.transaction?.hash || result.transactionHashes?.[0] || result[0]?.transaction?.hash || 'Processing...',
        amountTransferred: amountIn,
        depositAddress
      };
      
    } catch (error) {
      console.error('❌ Transfer failed:', error);
      
      return {
        success: false,
        error: error.message,
        amountTransferred: amountIn,
        depositAddress
      };
    }
  }
  
  /**
   * Generate success message for completed NEAR transfer
   * @param {Object} transferResult - Result from executeNearTransfer
   * @param {Object} tradeData - Trade data with timing and destination info
   * @returns {Object} Message object for display
   */
  static generateSuccessMessage(transferResult, tradeData) {
    return {
      role: "system",
      content: `# Transfer Initiated Successfully! 🎉

**Transaction Details:**
- **Amount Sent:** ${transferResult.amountTransferred}
- **To Address:** \`${transferResult.depositAddress}\`
- **Transaction Hash:** \`${transferResult.transactionHash}\`

**Status:** ✅ Transfer completed successfully

**What happens next:**
1. Your NEAR transfer has been sent to the 1Click deposit address
2. The cross-chain swap will execute automatically within ${tradeData.quote.timeEstimate}
3. You'll receive ${tradeData.quote.amountOut} ${tradeData.tradeIntent.destinationAsset} at your destination address

**Important:** You can track the swap progress using the transaction hash above. The swap will complete automatically - no further action needed!`,
      timestamp: Math.floor(Date.now() / 1000)
    };
  }
  
  /**
   * Generate error message for failed NEAR transfer
   * @param {Object} transferResult - Result from executeNearTransfer
   * @returns {Object} Message object for display
   */
  static generateErrorMessage(transferResult) {
    return {
      role: "system",
      content: `# Transfer Failed ❌

**Error Details:**
- **Amount:** ${transferResult.amountTransferred}
- **To Address:** \`${transferResult.depositAddress}\`
- **Error:** ${transferResult.error}

**What went wrong:**
The NEAR transfer to the deposit address could not be completed. This might be due to:
- Insufficient NEAR balance in your wallet
- Network connectivity issues
- Transaction was rejected or cancelled
- Invalid deposit address

**Next Steps:**
1. Check your NEAR wallet balance
2. Ensure you have enough NEAR for the transfer plus gas fees
3. Try the trade again if you want to proceed
4. Contact support if the problem persists

**Note:** No funds have been transferred. Your wallet balance is unchanged.`,
      timestamp: Math.floor(Date.now() / 1000)
    };
  }
  
  /**
   * Generate manual transfer message for non-NEAR tokens
   * @param {string} originAsset - Token symbol (e.g., "BTC", "ETH")
   * @param {string} amountIn - Amount with token symbol
   * @param {string} depositAddress - Target deposit address
   * @param {Object} tradeData - Trade data with timing and destination info
   * @returns {Object} Message object for display
   */
  static generateManualTransferMessage(originAsset, amountIn, depositAddress, tradeData) {
    return {
      role: "system",
      content: `# Manual Transfer Required 📝

**Token:** ${originAsset}
**Amount:** ${amountIn}
**Deposit Address:** \`${depositAddress}\`

**Important:** This trade requires ${originAsset} tokens, which cannot be automatically transferred through this interface.

**Manual Steps:**
1. Open your ${originAsset} wallet or exchange
2. Send exactly **${amountIn}** to the deposit address: \`${depositAddress}\`
3. The cross-chain swap will execute automatically within ${tradeData.quote.timeEstimate}
4. You'll receive ${tradeData.quote.amountOut} ${tradeData.tradeIntent.destinationAsset}

**⚠️ Warning:** Only send the exact amount specified. Any other amount will be lost.`,
      timestamp: Math.floor(Date.now() / 1000)
    };
  }
  
  /**
   * Generate cancellation message for user-cancelled trades
   * @param {Object} tradeIntent - Original trade intent data
   * @returns {Object} Message object for display
   */
  static generateCancellationMessage(tradeIntent) {
    return {
      role: "system",
      content: `# Trade Cancelled 🚫

**Trade Details:**
- **Amount:** ${tradeIntent.amount} ${tradeIntent.originAsset}
- **From:** ${tradeIntent.originAsset}
- **To:** ${tradeIntent.destinationAsset}

**Status:** Cancelled by user

You can send a new message if you'd like to try a different trade or ask another question.`,
      timestamp: Math.floor(Date.now() / 1000)
    };
  }
  
  /**
   * Main function to handle trade confirmation and execute appropriate transfer
   * @param {Object} params - Trade confirmation parameters
   * @param {boolean} params.confirmed - Whether user confirmed the trade
   * @param {Object} params.tradeModalData - Complete trade data from modal
   * @param {Object} params.walletSelector - Wallet selector instance
   * @param {Function} params.setLoading - Loading state setter function
   * @param {Function} params.setInMemoryMessages - Message state setter function
   * @returns {Promise<void>}
   */
  static async handleTradeConfirmation({ 
    confirmed, 
    tradeModalData, 
    walletSelector, 
    setLoading, 
    setInMemoryMessages 
  }) {
    try {
      if (confirmed) {
        console.log('✅ User confirmed trade:', tradeModalData.tradeIntent);
        console.log('📋 Quote details:', tradeModalData.quote);
        console.log('🚀 User wants to proceed with the token purchase');
        
        const { depositAddress, amountIn } = tradeModalData.quote;
        const { originAsset } = tradeModalData.tradeIntent;
        
        if (depositAddress && depositAddress !== 'N/A' && originAsset === 'NEAR') {
          // Handle NEAR transfer
          setLoading(true);
          
          try {
            const transferResult = await this.executeNearTransfer({
              amountIn,
              depositAddress,
              walletSelector
            });
            
            if (transferResult.success) {
              // Generate and add success message
              const successMessage = this.generateSuccessMessage(transferResult, tradeModalData);
              setInMemoryMessages(prev => [...prev, successMessage]);
              console.log('✅ Transfer success message added to in-memory messages');
              
              // Show user notification
              alert(`🎉 Transfer successful!\n\nSent: ${amountIn}\nTo: ${depositAddress}\n\nThe cross-chain swap will complete automatically within ${tradeModalData.quote.timeEstimate}.`);
            } else {
              // Generate and add error message
              const errorMessage = this.generateErrorMessage(transferResult);
              setInMemoryMessages(prev => [...prev, errorMessage]);
              console.log('❌ Transfer error message added to in-memory messages');
              
              // Show user notification
              alert(`❌ Transfer failed: ${transferResult.error}\n\nNo funds have been transferred. Please check your wallet balance and try again.`);
            }
          } finally {
            setLoading(false);
          }
          
        } else if (originAsset !== 'NEAR') {
          // Handle non-NEAR tokens with manual transfer instructions
          const manualTransferMessage = this.generateManualTransferMessage(
            originAsset, 
            amountIn, 
            depositAddress, 
            tradeModalData
          );
          setInMemoryMessages(prev => [...prev, manualTransferMessage]);
          console.log(`ℹ️ Manual transfer message added for ${originAsset}`);
          
        } else {
          console.log('❌ No valid deposit address found in quote');
        }
        
      } else {
        // Handle trade cancellation
        console.log('❌ User cancelled trade:', tradeModalData.tradeIntent);
        console.log('⏭️ Skipping trade execution, waiting for new user input');
        
        const cancellationMessage = this.generateCancellationMessage(tradeModalData.tradeIntent);
        setInMemoryMessages(prev => [...prev, cancellationMessage]);
        console.log('❌ Trade cancellation message added to in-memory messages');
      }
    } catch (error) {
      console.error('Error in trade confirmation handler:', error);
      setLoading(false);
    }
  }
}

export default NearTransferService; 