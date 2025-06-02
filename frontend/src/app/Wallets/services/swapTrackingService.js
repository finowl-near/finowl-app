/**
 * Service for tracking 1Click swap execution progress
 * Uses the 1Click API to monitor swap status and provide user-friendly updates
 */
export class SwapTrackingService {
  
    // Execution status constants from 1Click API
    static STATUS = {
      PENDING: 'pending',
      PROCESSING: 'processing', 
      COMPLETE: 'complete',
      FAILED: 'failed',
      REFUNDED: 'refunded'
    };
  
    // User-friendly status messages
    static STATUS_MESSAGES = {
      [SwapTrackingService.STATUS.PENDING]: {
        title: '⏳ Swap Initiated',
        message: 'Your deposit has been received and the swap is being processed...',
        description: 'Please wait while we process your transaction',
        color: '#3b82f6' // blue
      },
      [SwapTrackingService.STATUS.PROCESSING]: {
        title: '🔄 Swap in Progress', 
        message: 'Your tokens are being swapped across the blockchain networks...',
        description: 'This usually takes 1-3 minutes depending on network conditions',
        color: '#8b5cf6' // purple
      },
      [SwapTrackingService.STATUS.COMPLETE]: {
        title: '✅ Swap Complete!',
        message: 'Your tokens have been successfully swapped and delivered!',
        description: 'Check your wallet to see the new tokens',
        color: '#10b981' // green
      },
      [SwapTrackingService.STATUS.FAILED]: {
        title: '❌ Swap Failed',
        message: 'The swap could not be completed. Your funds will be refunded.',
        description: 'If you don\'t receive a refund within 24 hours, please contact support',
        color: '#ef4444' // red
      },
      [SwapTrackingService.STATUS.REFUNDED]: {
        title: '🔄 Refund Processed',
        message: 'Your original tokens have been refunded to your wallet.',
        description: 'The swap was reversed and your funds are safe',
        color: '#f59e0b' // yellow
      }
    };
  
    /**
     * Track swap progress by polling the execution status
     * @param {string} depositAddress - The deposit address from the quote
     * @param {Function} onStatusUpdate - Callback function called with status updates
     * @param {Object} options - Tracking options
     * @returns {Object} Tracking controller with stop method
     */
    static startTracking(depositAddress, onStatusUpdate, options = {}) {
      const {
        pollInterval = 5000, // Poll every 5 seconds
        maxAttempts = 120,   // Max 10 minutes of polling (120 * 5s)
        timeout = 600000     // 10 minute timeout
      } = options;
  
      let attempts = 0;
      let isTracking = true;
      let pollTimer = null;
      let timeoutTimer = null;
  
      const stopTracking = () => {
        isTracking = false;
        if (pollTimer) clearInterval(pollTimer);
        if (timeoutTimer) clearTimeout(timeoutTimer);
      };
  
      const pollStatus = async () => {
        if (!isTracking || attempts >= maxAttempts) {
          stopTracking();
          onStatusUpdate({
            status: 'timeout',
            error: 'Tracking timeout - please check manually',
            attempts
          });
          return;
        }
  
        attempts++;
  
        try {
          // NOTE: This would use the actual 1Click SDK
          // For now, we'll simulate the API call structure
          const response = await this.checkExecutionStatus(depositAddress);
          
  
          const statusInfo = this.STATUS_MESSAGES[response.status] || {
            title: '📊 Status Update',
            message: `Current status: ${response.status}`,
            description: 'Monitoring progress...',
            color: '#6b7280'
          };
  
          // Check if swap is complete or failed BEFORE calling onStatusUpdate
          const isCompleted = [this.STATUS.COMPLETE, this.STATUS.FAILED, this.STATUS.REFUNDED].includes(response.status);
          
          // Stop tracking immediately if completed to prevent duplicate calls
          if (isCompleted) {
            stopTracking();
          }
  
          onStatusUpdate({
            status: response.status,
            statusInfo,
            executionData: response,
            attempts,
            timestamp: new Date().toISOString()
          });
  
        } catch (error) {
          
          onStatusUpdate({
            status: 'error',
            error: error.message || 'Failed to check swap status',
            attempts,
            timestamp: new Date().toISOString()
          });
  
          // Continue polling unless it's a critical error
          if (error.message?.includes('unauthorized') || error.message?.includes('not found')) {
            stopTracking();
          }
        }
      };
  
      // Set up timeout
      timeoutTimer = setTimeout(() => {
        stopTracking();
        onStatusUpdate({
          status: 'timeout',
          error: 'Tracking timeout exceeded',
          attempts
        });
      }, timeout);
  
      // Start polling immediately, then at intervals
      pollStatus();
      pollTimer = setInterval(pollStatus, pollInterval);
  
      // Return controller
      return {
        stop: stopTracking,
        getAttempts: () => attempts,
        isActive: () => isTracking
      };
    }
  
    /**
     * Check execution status using 1Click API
     * @param {string} depositAddress - The deposit address to check
     * @returns {Promise<Object>} Execution status response
     */
    static async checkExecutionStatus(depositAddress) {
      
      // For now, simulate the API response structure
      // In production, this would use:
      // import { OneClickService } from '@defuse-protocol/one-click-sdk-typescript';
      // return await OneClickService.oneClickControllerGetExecutionStatus(depositAddress);
      
      // This is demo simulation - replace with actual API call
      // Create a more realistic progression based on when tracking started
      const trackingStartKey = `swap_tracking_${depositAddress}`;
      let trackingStartTime = localStorage.getItem(trackingStartKey);
      
      if (!trackingStartTime) {
        trackingStartTime = Date.now();
        localStorage.setItem(trackingStartKey, trackingStartTime.toString());
      } else {
        trackingStartTime = parseInt(trackingStartTime);
      }
      
      const elapsedSeconds = Math.floor((Date.now() - trackingStartTime) / 1000);
      
      // Realistic progression: pending (0-10s) → processing (10-25s) → complete (25s+)
      if (elapsedSeconds < 10) {
        return {
          status: this.STATUS.PENDING,
          executionDetails: {
            depositReceived: true,
            swapInitiated: false,
            estimatedCompletion: new Date(trackingStartTime + 25000).toISOString()
          }
        };
      } else if (elapsedSeconds < 25) {
        return {
          status: this.STATUS.PROCESSING,
          executionDetails: {
            depositReceived: true,
            swapInitiated: true,
            crossChainTransfer: true,
            estimatedCompletion: new Date(trackingStartTime + 25000).toISOString()
          }
        };
      } else {
        // Clean up tracking data when complete
        localStorage.removeItem(trackingStartKey);
        
        return {
          status: this.STATUS.COMPLETE,
          executionDetails: {
            depositReceived: true,
            swapInitiated: true,
            crossChainTransfer: true,
            tokensDelivered: true,
            completedAt: new Date().toISOString(),
            transactionHash: '0x' + Math.random().toString(16).substr(2, 40)
          }
        };
      }
    }
  
    /**
     * Generate a user-friendly progress message
     * @param {Object} statusUpdate - Status update from tracking
     * @returns {string} User-friendly message
     */
    static generateProgressMessage(statusUpdate) {
      const { status, statusInfo, executionData, attempts } = statusUpdate;
      
      let message = statusInfo?.message || 'Checking swap progress...';
      
      if (executionData?.executionDetails?.estimatedCompletion) {
        const eta = new Date(executionData.executionDetails.estimatedCompletion);
        const timeLeft = Math.max(0, eta.getTime() - Date.now());
        if (timeLeft > 0) {
          const minutes = Math.ceil(timeLeft / 60000);
          message += ` (ETA: ${minutes} ${minutes === 1 ? 'minute' : 'minutes'})`;
        }
      }
      
      return message;
    }
  
    /**
     * Create a complete user message for the chat
     * @param {Object} statusUpdate - Status update from tracking
     * @returns {Object} Chat message object
     */
    static createChatMessage(statusUpdate) {
      const { status, statusInfo, executionData } = statusUpdate;
      
      let content = `## ${statusInfo.title}\n\n${statusInfo.message}\n\n*${statusInfo.description}*`;
      
      if (executionData?.executionDetails) {
        const details = executionData.executionDetails;
        content += '\n\n**Progress:**\n';
        content += details.depositReceived ? '✅ Deposit received\n' : '⏳ Waiting for deposit\n';
        content += details.swapInitiated ? '✅ Swap initiated\n' : '⏳ Initiating swap\n';
        content += details.crossChainTransfer ? '✅ Cross-chain transfer\n' : '⏳ Processing transfer\n';
        content += details.tokensDelivered ? '✅ Tokens delivered\n' : '⏳ Delivering tokens\n';
      }
      
      if (status === this.STATUS.COMPLETE && executionData?.executionDetails?.transactionHash) {
        content += `\n\n**Transaction Hash:** \`${executionData.executionDetails.transactionHash}\``;
      }
      
      return {
        role: 'assistant',
        content,
        timestamp: new Date().toISOString(),
        swapStatus: status,
        metadata: {
          type: 'swap_progress',
          status,
          depositAddress: executionData?.depositAddress
        }
      };
    }
  } 