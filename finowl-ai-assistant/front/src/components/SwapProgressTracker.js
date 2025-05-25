import React, { useState, useEffect, useRef } from 'react';
import { SwapTrackingService } from '../services/swapTrackingService';

const SwapProgressTracker = ({
  depositAddress,
  isVisible,
  onClose,
  onStatusUpdate,
  tradeData
}) => {
  const [trackingState, setTrackingState] = useState({
    status: 'initializing',
    statusInfo: null,
    attempts: 0,
    isActive: false,
    error: null
  });

  const trackingController = useRef(null);

  useEffect(() => {
    if (isVisible && depositAddress && !trackingController.current) {
      console.log('🚀 Starting swap tracking for:', depositAddress);

      const handleStatusUpdate = (update) => {
        console.log('📡 Tracking update:', update);
        setTrackingState(prevState => ({ ...prevState, ...update }));

        // Forward status updates to parent
        if (onStatusUpdate) {
          onStatusUpdate(update);
        }
      };

      trackingController.current = SwapTrackingService.startTracking(
        depositAddress,
        handleStatusUpdate,
        {
          pollInterval: 5000,   // Poll every 5 seconds
          maxAttempts: 120,     // 10 minutes max
          timeout: 600000       // 10 minute timeout
        }
      );

      setTrackingState(prev => ({ ...prev, isActive: true }));
    }

    return () => {
      if (trackingController.current) {
        console.log('🛑 Stopping swap tracking');
        trackingController.current.stop();
        trackingController.current = null;
      }
    };
  }, [isVisible, depositAddress, onStatusUpdate]);

  const handleClose = () => {
    if (trackingController.current) {
      trackingController.current.stop();
      trackingController.current = null;
    }
    setTrackingState({
      status: 'initializing',
      statusInfo: null,
      attempts: 0,
      isActive: false,
      error: null
    });
    if (onClose) onClose();
  };

  const getProgressPercentage = () => {
    const { status } = trackingState;
    switch (status) {
      case 'pending': return 25;
      case 'processing': return 75;
      case 'complete': return 100;
      case 'failed': case 'refunded': return 100;
      default: return 10;
    }
  };

  const getProgressColor = () => {
    const { status } = trackingState;
    switch (status) {
      case 'pending': return '#3b82f6';
      case 'processing': return '#8b5cf6';
      case 'complete': return '#10b981';
      case 'failed': return '#ef4444';
      case 'refunded': return '#f59e0b';
      default: return '#6b7280';
    }
  };

  if (!isVisible) return null;

  const { statusInfo, executionData, attempts, error, status } = trackingState;

  return (
    <div className="swap-progress-overlay">
      <div className="swap-progress-modal">
        <div className="swap-progress-header">
          <h3>🔄 Swap Progress</h3>
          {status !== 'complete' && (
            <button className="close-button" onClick={handleClose}>
              ✕
            </button>
          )}
        </div>

        <div className="swap-progress-content">
          {/* Status Info */}
          {statusInfo && (
            <div className="status-section">
              <div className="status-title" style={{ color: statusInfo.color }}>
                {statusInfo.title}
              </div>
              <div className="status-message">
                {statusInfo.message}
              </div>
              <div className="status-description">
                {statusInfo.description}
              </div>
            </div>
          )}

          {/* Progress Bar */}
          <div className="progress-section">
            <div className="progress-bar-container">
              <div
                className="progress-bar-fill"
                style={{
                  width: `${getProgressPercentage()}%`,
                  backgroundColor: getProgressColor()
                }}
              >
                <div className="progress-shimmer"></div>
              </div>
            </div>
            <div className="progress-percentage">
              {getProgressPercentage()}%
            </div>
          </div>

          {/* Progress Details */}
          {executionData?.executionDetails && (
            <div className="progress-details">
              <div className="detail-item">
                <span className={executionData.executionDetails.depositReceived ? 'completed' : 'pending'}>
                  {executionData.executionDetails.depositReceived ? '✅' : '⏳'}
                </span>
                <span>Deposit Received</span>
              </div>
              <div className="detail-item">
                <span className={executionData.executionDetails.swapInitiated ? 'completed' : 'pending'}>
                  {executionData.executionDetails.swapInitiated ? '✅' : '⏳'}
                </span>
                <span>Swap Initiated</span>
              </div>
              <div className="detail-item">
                <span className={executionData.executionDetails.crossChainTransfer ? 'completed' : 'pending'}>
                  {executionData.executionDetails.crossChainTransfer ? '✅' : '⏳'}
                </span>
                <span>Cross-Chain Transfer</span>
              </div>
              <div className="detail-item">
                <span className={executionData.executionDetails.tokensDelivered ? 'completed' : 'pending'}>
                  {executionData.executionDetails.tokensDelivered ? '✅' : '⏳'}
                </span>
                <span>Tokens Delivered</span>
              </div>
            </div>
          )}

          {/* Trade Summary */}
          {tradeData && (
            <div className="trade-summary">
              <h4>Trade Summary</h4>
              <div className="trade-info">
                <div>From: {tradeData.tokenFrom} ({tradeData.amountFrom})</div>
                <div>To: {tradeData.tokenTo} ({tradeData.amountTo})</div>
                <div>Deposit Address: <code>{depositAddress}</code></div>
              </div>
            </div>
          )}

          {/* Transaction Hash */}
          {status === 'complete' && executionData?.executionDetails?.transactionHash && (
            <div className="transaction-hash">
              <h4>Transaction Complete!</h4>
              <div className="hash-container">
                <span>TX Hash: </span>
                <code>{executionData.executionDetails.transactionHash}</code>
              </div>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="error-section">
              <div className="error-title">⚠️ Error</div>
              <div className="error-message">{error}</div>
            </div>
          )}

          {/* Debug Info */}
          <div className="debug-info">
            <small>Attempts: {attempts} | Status: {status}</small>
          </div>
        </div>

        {/* Actions */}
        <div className="swap-progress-actions">
          {status === 'complete' && (
            <button className="action-button primary" onClick={handleClose}>
              ✅ Close
            </button>
          )}
          {status === 'failed' && (
            <button className="action-button secondary" onClick={handleClose}>
              🔄 Try Again
            </button>
          )}
          {['pending', 'processing'].includes(status) && (
            <button className="action-button secondary" onClick={handleClose}>
              📱 Minimize
            </button>
          )}
        </div>
      </div>

      <style jsx>{`
        .swap-progress-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.7);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          backdrop-filter: blur(5px);
        }

        .swap-progress-modal {
          background: white;
          border-radius: 16px;
          width: 90%;
          max-width: 500px;
          max-height: 80vh;
          overflow-y: auto;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
          animation: slideIn 0.3s ease-out;
        }

        .swap-progress-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px;
          border-bottom: 1px solid #e5e7eb;
        }

        .swap-progress-header h3 {
          margin: 0;
          font-size: 1.25rem;
          font-weight: 600;
          color: #1f2937;
        }

        .close-button {
          background: none;
          border: none;
          font-size: 1.25rem;
          cursor: pointer;
          color: #6b7280;
          padding: 4px;
          border-radius: 4px;
          transition: all 0.2s;
        }

        .close-button:hover {
          background: #f3f4f6;
          color: #374151;
        }

        .swap-progress-content {
          padding: 20px;
        }

        .status-section {
          text-align: center;
          margin-bottom: 24px;
        }

        .status-title {
          font-size: 1.5rem;
          font-weight: 600;
          margin-bottom: 8px;
        }

        .status-message {
          font-size: 1.1rem;
          color: #374151;
          margin-bottom: 8px;
        }

        .status-description {
          font-size: 0.9rem;
          color: #6b7280;
          font-style: italic;
        }

        .progress-section {
          margin-bottom: 24px;
        }

        .progress-bar-container {
          background: #f3f4f6;
          border-radius: 12px;
          height: 24px;
          overflow: hidden;
          position: relative;
          margin-bottom: 8px;
        }

        .progress-bar-fill {
          height: 100%;
          border-radius: 12px;
          position: relative;
          transition: width 0.5s ease;
          overflow: hidden;
        }

        .progress-shimmer {
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(
            90deg,
            transparent,
            rgba(255, 255, 255, 0.4),
            transparent
          );
          animation: shimmer 2s infinite;
        }

        .progress-percentage {
          text-align: center;
          font-weight: 600;
          color: #374151;
        }

        .progress-details {
          margin-bottom: 24px;
        }

        .detail-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 8px 0;
          font-size: 0.95rem;
        }

        .detail-item .completed {
          color: #10b981;
        }

        .detail-item .pending {
          color: #6b7280;
        }

        .trade-summary {
          background: #f9fafb;
          border-radius: 8px;
          padding: 16px;
          margin-bottom: 16px;
        }

        .trade-summary h4 {
          margin: 0 0 12px 0;
          font-size: 1rem;
          color: #374151;
        }

        .trade-info {
          font-size: 0.9rem;
          color: #6b7280;
        }

        .trade-info > div {
          margin-bottom: 4px;
        }

        .trade-info code {
          background: #e5e7eb;
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 0.8rem;
          word-break: break-all;
        }

        .transaction-hash {
          background: #ecfdf5;
          border: 1px solid #d1fae5;
          border-radius: 8px;
          padding: 16px;
          margin-bottom: 16px;
        }

        .transaction-hash h4 {
          margin: 0 0 12px 0;
          color: #065f46;
        }

        .hash-container code {
          background: #d1fae5;
          padding: 8px;
          border-radius: 4px;
          display: block;
          word-break: break-all;
          font-size: 0.85rem;
          margin-top: 8px;
        }

        .error-section {
          background: #fef2f2;
          border: 1px solid #fecaca;
          border-radius: 8px;
          padding: 16px;
          margin-bottom: 16px;
        }

        .error-title {
          font-weight: 600;
          color: #dc2626;
          margin-bottom: 8px;
        }

        .error-message {
          color: #991b1b;
        }

        .debug-info {
          text-align: center;
          color: #9ca3af;
          font-size: 0.8rem;
          margin-top: 16px;
        }

        .swap-progress-actions {
          padding: 20px;
          border-top: 1px solid #e5e7eb;
          display: flex;
          gap: 12px;
          justify-content: center;
        }

        .action-button {
          padding: 10px 20px;
          border-radius: 8px;
          border: none;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }

        .action-button.primary {
          background: #10b981;
          color: white;
        }

        .action-button.primary:hover {
          background: #059669;
        }

        .action-button.secondary {
          background: #f3f4f6;
          color: #374151;
        }

        .action-button.secondary:hover {
          background: #e5e7eb;
        }

        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(-20px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @keyframes shimmer {
          0% { left: -100%; }
          100% { left: 100%; }
        }
      `}</style>
    </div>
  );
};

export default SwapProgressTracker; 