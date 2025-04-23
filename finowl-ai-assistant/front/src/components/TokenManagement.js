import { useState } from 'react';
import { useWalletSelector } from '@near-wallet-selector/react-hook';

export const TokenManagement = ({ tokenBalance, registrationStep, freeTokensClaimed, loading, refreshBalance }) => {
  const { signedAccountId, callFunction, modal, signIn } = useWalletSelector();
  const [buyAmount, setBuyAmount] = useState(10); // Default amount of tokens to buy
  const [lastBalanceUpdate, setLastBalanceUpdate] = useState(null);

  // Handle buying tokens via API call
  const handleGrantPaidTokens = async () => {
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
      // Call the API to grant paid tokens - backend has hardcoded recipient
      const response = await fetch('http://localhost:8080/api/grant-paid-tokens', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
        // No body needed - backend has hardcoded wallet
      });
      
      if (!response.ok) {
        throw new Error(`API call failed with status: ${response.status}`);
      }
      
      const result = await response.json();
      console.log('Grant paid tokens result:', result);
      
      // Get the granted amount from the response if available
      let grantedAmount = buyAmount;
      if (result && result.granted && result.granted.granted) {
        // Convert internal units to UI display (divide by 1,000,000)
        grantedAmount = parseInt(result.granted.granted) / 1000000;
      }
      
      // Refresh token balance to show the new tokens
      if (refreshBalance) {
        await refreshBalance();
      }
      
      // Update last balance update time
      setLastBalanceUpdate(new Date());
      
      alert(`Successfully purchased ${grantedAmount} tokens! Your balance has been updated.`);
    } catch (error) {
      console.error('Error buying tokens:', error);
      alert(`Failed to purchase tokens: ${error.message}`);
    }
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
                  <span className="detail-value">{tokenBalance * 1000000}</span>
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
                <li>Free tokens can only be claimed once per account</li>
              </ul>
              
              <div className="token-operations-section">
                <h3>Buy More Tokens</h3>
                <div className="buy-tokens-container">
                  <div className="buy-amount-selector">
                    <label>Amount to buy:</label>
                    <select 
                      value={buyAmount}
                      onChange={(e) => setBuyAmount(Number(e.target.value))}
                      className="buy-amount-select"
                    >
                      <option value={10}>10 tokens</option>
                      <option value={25}>25 tokens</option>
                      <option value={50}>50 tokens</option>
                      <option value={100}>100 tokens</option>
                    </select>
                  </div>
                  <button 
                    className="buy-tokens-button"
                    onClick={handleGrantPaidTokens}
                    disabled={loading}
                  >
                    {loading ? 'Processing...' : '💳 Buy Tokens (Simulation)'}
                  </button>
                  <div className="buy-tokens-note">
                    This is a simulation. No actual payment is processed.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TokenManagement; 