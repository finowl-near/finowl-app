import { utils } from 'near-api-js';

/**
 * Service for handling NEAR token transfers to 1Click deposit addresses
 */
export default class NearTransferService {
  
  /**
   * Execute a NEAR transfer to a deposit address
   * @param {Object} params - Transfer parameters
   * @param {string} params.amountIn - Amount with token symbol (e.g., "1.2 NEAR")
   * @param {string} params.depositAddress - Target deposit address
   * @param {Object} params.walletSelector - Wallet selector instance from useWalletSelector hook
   * @returns {Promise<Object>} Transfer result with success/error status and transaction details
   */
  static async executeTransfer({ amountIn, depositAddress, walletSelector }) {
    console.log('🚀 Starting NEAR transfer with params:', { amountIn, depositAddress, walletSelector: !!walletSelector });

    try {
      // Parse NEAR amount from quote (e.g., "1.2 NEAR" -> "1.2")
      const nearAmount = this.parseNearAmount(amountIn);
      console.log('💰 Parsed NEAR amount:', nearAmount);

      if (!nearAmount || isNaN(nearAmount) || parseFloat(nearAmount) <= 0) {
        console.error('❌ Invalid NEAR amount. Original amountIn:', amountIn, 'Parsed nearAmount:', nearAmount);
        throw new Error('Invalid NEAR amount in quote');
      }

      // Convert to yoctoNEAR (smallest unit)
      const amountInYocto = utils.format.parseNearAmount(nearAmount);
      console.log('🔢 Amount in yoctoNEAR:', amountInYocto);

      if (!amountInYocto) {
        throw new Error('Failed to convert NEAR amount to yoctoNEAR');
      }

      // Execute wallet transfer using signAndSendTransactions
      console.log('💸 Executing wallet transfer...');
      const transactions = [{
        receiverId: depositAddress,
        actions: [{
          type: 'Transfer',
          params: {
            deposit: amountInYocto
          }
        }]
      }];

      const result = await walletSelector.signAndSendTransactions({ transactions });
      console.log('✅ Transfer successful:', result);

      // Return success result with all necessary data for tracking
      return {
        success: true,
        transactionHash: result?.[0]?.transaction?.hash || 'unknown',
        depositAddress,
        amountTransferred: nearAmount,
        amountInYocto,
        result,
        message: 'Transfer completed successfully! Starting swap tracking...',
        chatMessage: this.createSuccessMessage({
          nearAmount,
          depositAddress,
          transactionHash: result?.[0]?.transaction?.hash
        })
      };

    } catch (error) {
      console.error('❌ Transfer failed:', error);
      
      return {
        success: false,
        error: error.message || 'Transfer failed',
        depositAddress,
        amountRequested: amountIn,
        message: `Transfer failed: ${error.message}`,
        chatMessage: this.createErrorMessage({
          error: error.message,
          amountIn,
          depositAddress
        })
      };
    }
  }
  
  /**
   * Parse NEAR amount from quote text
   * @param {string} amountText - Amount text like "1.2 NEAR" or "0.5 N"
   * @returns {string|null} Parsed amount or null if invalid
   */
  static parseNearAmount(amountText) {
    console.log('🔍 Parsing NEAR amount from:', amountText, 'Type:', typeof amountText);
    
    if (!amountText || typeof amountText !== 'string') {
      console.warn('⚠️ Invalid input - not a string:', amountText);
      return null;
    }

    // Handle different NEAR token formats
    const nearPatterns = [
      /([0-9]*\.?[0-9]+)\s*NEAR/i,
      /([0-9]*\.?[0-9]+)\s*N$/i,
      /^([0-9]*\.?[0-9]+)$/  // Just a number
    ];

    for (const pattern of nearPatterns) {
      console.log('🔎 Trying pattern:', pattern.toString());
      const match = amountText.match(pattern);
      console.log('🎯 Match result:', match);
      
      if (match && match[1]) {
        const amount = match[1].trim();
        console.log('✅ Extracted amount:', amount);
        
        if (!isNaN(amount) && parseFloat(amount) > 0) {
          console.log('✅ Valid NEAR amount found:', amount);
          return amount;
        } else {
          console.warn('⚠️ Amount is not a valid number or is <= 0:', amount);
        }
      }
    }

    console.warn('⚠️ Could not parse NEAR amount from:', amountText);
    return null;
  }
  
  /**
   * Create success message for chat
   */
  static createSuccessMessage({ nearAmount, depositAddress, transactionHash }) {
    return {
      role: 'assistant',
      content: `## ✅ Transfer Successful!

**${nearAmount} NEAR** has been sent to the deposit address.

**Deposit Address:** \`${depositAddress}\`
${
  transactionHash ? `**Transaction Hash:** \`${transactionHash}\`` : ''
}

🔄 **Starting swap tracking...** Your tokens are now being processed through the 1Click protocol. You'll see live progress updates as your swap progresses through each stage.

*The swap typically completes within 1-3 minutes depending on network conditions.*`,
      timestamp: new Date().toISOString(),
      metadata: {
        type: 'transfer_success',
        nearAmount,
        depositAddress,
        transactionHash
      }
    };
  }
  
  /**
   * Create error message for chat
   */
  static createErrorMessage({ error, amountIn, depositAddress }) {
    let troubleshooting = '';
    
    if (error.includes('insufficient')) {
      troubleshooting = '\n\n**Troubleshooting:**\n- Check your NEAR balance\n- Make sure you have enough for transaction fees';
    } else if (error.includes('rejected') || error.includes('cancelled')) {
      troubleshooting = '\n\n**What happened:**\nThe transaction was cancelled in your wallet.';
    } else if (error.includes('network') || error.includes('timeout')) {
      troubleshooting = '\n\n**Troubleshooting:**\n- Check your internet connection\n- Try again in a few moments';
    }

    return {
      role: 'assistant',
      content: `## ❌ Transfer Failed

**Error:** ${error}

**Attempted Transfer:** ${amountIn}\n**Deposit Address:** \`${depositAddress}\`${troubleshooting}

*You can try the transaction again or contact support if the problem persists.*`,
      timestamp: new Date().toISOString(),
      metadata: {
        type: 'transfer_error',
        error,
        amountIn,
        depositAddress
      }
    };
  }
  
  /**
   * Validate transfer parameters
   */
  static validateTransferParams({ amountIn, depositAddress, walletSelector }) {
    const errors = [];

    if (!amountIn) {
      errors.push('Amount is required');
    }

    if (!depositAddress) {
      errors.push('Deposit address is required');
    }

    if (!walletSelector) {
      errors.push('Wallet selector is required');
    }

    if (!walletSelector?.signAndSendTransactions) {
      errors.push('Wallet selector does not support transactions');
    }

    if (errors.length > 0) {
      throw new Error(`Validation failed: ${errors.join(', ')}`);
    }
  }
} 