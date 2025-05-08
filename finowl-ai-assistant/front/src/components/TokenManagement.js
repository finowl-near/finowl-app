import { useState } from 'react';
import { useWalletSelector } from '@near-wallet-selector/react-hook';
import { utils } from 'near-api-js';

export const TokenManagement = ({ tokenBalance, registrationStep, freeTokensClaimed, loading, refreshBalance }) => {
  const { signedAccountId, callFunction, modal, signIn } = useWalletSelector();
  const [lastBalanceUpdate, setLastBalanceUpdate] = useState(null);
  const [purchaseAmount, setPurchaseAmount] = useState('0.05'); // Default NEAR amount to deposit
  const [purchaseLoading, setPurchaseLoading] = useState(false);

  // Handle buying tokens via NEAR transaction
  const handleBuyTokens = async () => {
    if (!signedAccountId) {
      console.log('Please connect your wallet first');
      if (modal) {
        modal.show();
      } else if (signIn) {
        signIn();
      }
      return;
    }

    try {
      setPurchaseLoading(true);
      
      // Convert NEAR amount to yoctoNEAR
      const depositInYocto = utils.format.parseNearAmount(purchaseAmount);
      
      console.log(`Purchasing tokens with ${purchaseAmount} NEAR (${depositInYocto} yoctoNEAR)`);
      
      // Call the NEAR contract to purchase tokens
      const result = await callFunction({
        contractId: process.env.NEXT_PUBLIC_CONTRACT_NAME || 'finowl.testnet',
        method: "call_js_func",   // Call the dispatcher function
        args: {
          function_name: "buy_tokens_for_near",
          attached_deposit: depositInYocto, // Pass the attached deposit inside args
        },
        gas: "50000000000000", // 50 Tgas
        deposit: depositInYocto, // Also attach it properly for real transfer
      });
      
      console.log('Token purchase result:', result);
      
      // Refresh token balance to show the new tokens
      if (refreshBalance) {
        await refreshBalance();
      }
      
      // Update last balance update time
      setLastBalanceUpdate(new Date());
      
      // Calculate tokens received (assuming 10K tokens per 0.05 NEAR)
      const nearAmount = parseFloat(purchaseAmount);
      const tokensReceived = (nearAmount / 0.05) * 10000;
      
      alert(`Successfully purchased ${tokensReceived.toLocaleString()} tokens with ${purchaseAmount} NEAR! Your balance has been updated.`);
    } catch (error) {
      console.error('Error buying tokens:', error);
      alert(`Failed to purchase tokens: ${error.message}`);
    } finally {
      setPurchaseLoading(false);
    }
  };

  // Calculate how many tokens would be received for the current NEAR amount
  const calculateTokensToReceive = () => {
    const nearAmount = parseFloat(purchaseAmount) || 0;
    // Rate: 10,000 tokens per 0.05 NEAR
    return (nearAmount / 0.05) * 10000;
  };

  return (
    <section className="section">
      <h1 className="section-title">Token Management</h1>
      <div className="two-column-layout">
        <div className="left-column">
          <div className="panel">
            <h2 className="panel-title">Balance Details</h2>
            <div className="balance-card">
              <div className="balance-card-header">
                <div className="balance-title">
                  <span className="balance-icon">💰</span>
                  <span>Current Token Balance</span>
                </div>
                <button 
                  className="refresh-balance-button"
                  onClick={refreshBalance}
                  disabled={loading}
                >
                  {loading ? '...' : '🔄 Refresh'}
                </button>
              </div>
              <div className="balance-amount">
                {tokenBalance}
                <span className="balance-label">tokens</span>
              </div>
              {lastBalanceUpdate && (
                <div className="last-updated">
                  Last updated: {lastBalanceUpdate.toLocaleString()}
                </div>
              )}
              <div className="balance-details-row">
                <div className="balance-detail-item">
                  <span className="detail-label">Internal Units:</span>
                  <span className="detail-value">{tokenBalance * 1_000_000}</span>
                </div>
                <div className="balance-detail-item">
                  <span className="detail-label">Account ID:</span>
                  <span className="detail-value">{signedAccountId}</span>
                </div>
                <div className="balance-detail-item">
                  <span className="detail-label">Status:</span>
                  <span className="detail-value">{freeTokensClaimed ? 'Active' : 'Pending Tokens'}</span>
                </div>
              </div>
              <div className="balance-actions">
                <button 
                  className="primary-button"
                  onClick={refreshBalance}
                  disabled={loading}
                >
                  🔄 Refresh Balance
                </button>
              </div>
            </div>
          </div>
        </div>
        
        <div className="right-column">
          <div className="panel">
            <h2 className="panel-title">Purchase Tokens</h2>
            <div className="token-usage-info">
              <h3>Token Usage Information</h3>
              <ul className="token-info-list">
                <li>Starting a conversation reserves 10 tokens</li>
                <li>Each API call consumes tokens based on the message length</li>
                <li>You can add more tokens to conversations as needed</li>
                <li>Tokens can be purchased using NEAR cryptocurrency</li>
              </ul>
              
              <div className="token-operations-section">
                <h3>Buy Tokens with NEAR</h3>
                <div className="buy-tokens-container">
                  <div className="token-exchange-rate">
                    <span className="rate-label">Rate:</span>
                    <span className="rate-value">10,000 tokens per 0.05 NEAR</span>
                  </div>
                  
                  <div className="buy-amount-selector">
                    <label>NEAR to deposit:</label>
                    <div className="near-input-container">
                      <input
                        type="number"
                        min="0.05"
                        step="0.05"
                        value={purchaseAmount}
                        onChange={(e) => setPurchaseAmount(e.target.value)}
                        className="near-amount-input"
                      />
                      <span className="currency-label">NEAR</span>
                    </div>
                  </div>
                  
                  <div className="tokens-to-receive">
                    You will receive: <span className="token-receive-amount">{calculateTokensToReceive().toLocaleString()}</span> tokens
                  </div>
                  
                  <button 
                    className="buy-tokens-button"
                    onClick={handleBuyTokens}
                    disabled={purchaseLoading || loading || !signedAccountId || parseFloat(purchaseAmount) < 0.05}
                  >
                    {purchaseLoading ? 'Processing...' : '💳 Buy Tokens with NEAR'}
                  </button>
                  
                  <div className="buy-tokens-note">
                    This transaction will transfer NEAR from your wallet to purchase tokens.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <style jsx>{`
        .near-input-container {
          display: flex;
          align-items: center;
          border: 1px solid #ccc;
          border-radius: 4px;
          padding: 0 10px;
          margin-top: 5px;
        }
        
        .near-amount-input {
          border: none;
          padding: 8px 0;
          flex: 1;
          outline: none;
          font-size: 16px;
        }
        
        .currency-label {
          font-weight: bold;
          margin-left: 5px;
          color: #666;
        }
        
        .token-exchange-rate {
          margin-bottom: 15px;
          padding: 10px;
          background-color: #f8f9fa;
          border-radius: 4px;
          text-align: center;
        }
        
        .rate-label {
          font-weight: bold;
          margin-right: 5px;
        }
        
        .tokens-to-receive {
          margin: 15px 0;
          font-size: 15px;
          text-align: center;
        }
        
        .token-receive-amount {
          font-weight: bold;
          font-size: 18px;
          color: #007bff;
        }
        
        .buy-tokens-button {
          background-color: #198754;
          color: white;
          border: none;
          padding: 10px 15px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 16px;
          width: 100%;
          margin-top: 10px;
        }
        
        .buy-tokens-button:hover {
          background-color: #157347;
        }
        
        .buy-tokens-button:disabled {
          background-color: #6c757d;
          cursor: not-allowed;
        }
      `}</style>
    </section>
  );
};

export default TokenManagement; 