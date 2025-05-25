import React from 'react';

const TradeConfirmationModal = ({ 
  isVisible, 
  tradeData, 
  messageContent, 
  onConfirm, 
  onCancel 
}) => {
  if (!isVisible || !tradeData) return null;

  return (
    <>
      <style jsx>{`
        /* Trade Confirmation Modal Styles */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.7);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 1000;
          padding: 20px;
        }

        .trade-modal {
          background: white;
          border-radius: 12px;
          max-width: 600px;
          width: 100%;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
          animation: modalFadeIn 0.3s ease-out;
        }

        @keyframes modalFadeIn {
          from {
            opacity: 0;
            transform: scale(0.9) translateY(20px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px 25px;
          border-bottom: 1px solid #e9ecef;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border-radius: 12px 12px 0 0;
        }

        .modal-header h2 {
          margin: 0;
          font-size: 1.4rem;
          font-weight: 600;
        }

        .modal-close {
          background: rgba(255, 255, 255, 0.2);
          border: none;
          color: white;
          font-size: 1.2rem;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background-color 0.2s;
        }

        .modal-close:hover {
          background: rgba(255, 255, 255, 0.3);
        }

        .modal-body {
          padding: 25px;
        }

        .trade-summary, .execution-details, .ai-explanation {
          margin-bottom: 25px;
        }

        .trade-summary h3, .execution-details h3, .ai-explanation h3 {
          margin: 0 0 15px 0;
          font-size: 1.1rem;
          color: #495057;
          border-bottom: 2px solid #e9ecef;
          padding-bottom: 8px;
        }

        .trade-details {
          background: #f8f9fa;
          border-radius: 8px;
          padding: 15px;
        }

        .detail-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
          padding: 8px 0;
        }

        .detail-row:last-child {
          margin-bottom: 0;
        }

        .detail-row .label {
          font-weight: 500;
          color: #6c757d;
          font-size: 0.9rem;
        }

        .detail-row .value {
          font-weight: 600;
          color: #212529;
          text-align: right;
          flex: 1;
          margin-left: 15px;
        }

        .deposit-address {
          font-family: 'Courier New', monospace;
          font-size: 0.8rem;
          background: #e9ecef;
          padding: 4px 8px;
          border-radius: 4px;
          word-break: break-all;
        }

        .ai-explanation p {
          margin: 10px 0;
          line-height: 1.6;
          color: #495057;
        }

        .warning-notice {
          display: flex;
          align-items: flex-start;
          background: #fff3cd;
          border: 1px solid #ffeaa7;
          border-radius: 8px;
          padding: 15px;
          margin-bottom: 25px;
        }

        .warning-icon {
          font-size: 1.2rem;
          margin-right: 12px;
          flex-shrink: 0;
        }

        .warning-text {
          color: #856404;
          line-height: 1.5;
        }

        .modal-actions {
          display: flex;
          gap: 15px;
          padding: 20px 25px;
          border-top: 1px solid #e9ecef;
          background: #f8f9fa;
          border-radius: 0 0 12px 12px;
        }

        .cancel-button, .confirm-button {
          flex: 1;
          padding: 12px 24px;
          border: none;
          border-radius: 8px;
          font-size: 1rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }

        .cancel-button {
          background: #6c757d;
          color: white;
        }

        .cancel-button:hover {
          background: #5a6268;
          transform: translateY(-1px);
        }

        .confirm-button {
          background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
          color: white;
        }

        .confirm-button:hover {
          background: linear-gradient(135deg, #218838 0%, #1ea97c 100%);
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(40, 167, 69, 0.3);
        }
      `}</style>
      
      <div className="modal-overlay">
        <div className="trade-modal">
          <div className="modal-header">
            <h2>🔄 Confirm Token Purchase</h2>
            <button 
              className="modal-close" 
              onClick={onCancel}
            >
              ✕
            </button>
          </div>
          
          <div className="modal-body">
            <div className="trade-summary">
              <h3>📋 Trade Summary</h3>
              <div className="trade-details">
                <div className="detail-row">
                  <span className="label">Token to Buy:</span>
                  <span className="value">{tradeData.tradeIntent.destinationAsset}</span>
                </div>
                <div className="detail-row">
                  <span className="label">Amount to Send:</span>
                  <span className="value">{tradeData.quote.amountIn} {tradeData.tradeIntent.originAsset}</span>
                </div>
                <div className="detail-row">
                  <span className="label">Estimated Receive:</span>
                  <span className="value">{tradeData.quote.amountOut} {tradeData.tradeIntent.destinationAsset}</span>
                </div>
                <div className="detail-row">
                  <span className="label">USD Value:</span>
                  <span className="value">~${tradeData.quote.amountOutUsd}</span>
                </div>
              </div>
            </div>
            
            <div className="execution-details">
              <h3>🏦 Execution Details</h3>
              <div className="detail-row">
                <span className="label">Deposit Address:</span>
                <span className="value deposit-address">{tradeData.quote.depositAddress}</span>
              </div>
              <div className="detail-row">
                <span className="label">Quote Valid Until:</span>
                <span className="value">{tradeData.quote.deadline}</span>
              </div>
              <div className="detail-row">
                <span className="label">Estimated Time:</span>
                <span className="value">{tradeData.quote.timeEstimate}</span>
              </div>
              <div className="detail-row">
                <span className="label">Slippage:</span>
                <span className="value">{tradeData.quote.slippageTolerance}</span>
              </div>
            </div>
            
            <div className="ai-explanation">
              <h3>🤖 AI Analysis</h3>
              <p>
                This trade was detected from your message: <strong>"{messageContent}"</strong>
              </p>
              <p>
                The system has generated a live quote with real deposit addresses and amounts. 
                If you confirm, you'll receive detailed instructions on how to execute this trade.
              </p>
            </div>
            
            <div className="warning-notice">
              <div className="warning-icon">⚠️</div>
              <div className="warning-text">
                <strong>Important:</strong> Only send the exact amount ({tradeData.quote.amountIn} {tradeData.tradeIntent.originAsset}) 
                to the deposit address. Any other amount or token will be lost.
              </div>
            </div>
          </div>
          
          <div className="modal-actions">
            <button 
              className="cancel-button"
              onClick={onCancel}
            >
              ❌ Cancel Trade
            </button>
            <button 
              className="confirm-button"
              onClick={onConfirm}
            >
              ✅ Confirm & Get Instructions
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default TradeConfirmationModal; 