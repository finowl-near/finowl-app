import { useState, useEffect } from 'react';
import { useWalletSelector } from '@near-wallet-selector/react-hook';
import UserOnboarding from './UserOnboarding';
import ConversationManagement from './ConversationManagement';
import TokenManagement from './TokenManagement';
import UserList from './UserList';
import AppStyles from './AppStyles';

export const MainApp = () => {
  const { signedAccountId, viewFunction } = useWalletSelector();
  const [loading, setLoading] = useState(false);
  const [tokenBalance, setTokenBalance] = useState(0);
  const [freeTokensClaimed, setFreeTokensClaimed] = useState(false);
  
  // Function to refresh token balance that can be passed to child components
  const refreshTokenBalance = async () => {
    if (!signedAccountId) return;
    
    try {
      setLoading(true);
      
      // Try to get user token balance
      try {
        const result = await viewFunction({
          contractId: process.env.NEXT_PUBLIC_CONTRACT_NAME || 'finowl.testnet',
          method: "view_js_func",
          args: {
            function_name: "get_user_token_balance",
            account_id: signedAccountId
          }
        });
        
        // Convert to display format (divided by 1,000,000)
        if (result) {
          const displayBalance = typeof result === 'string' 
            ? parseInt(result) / 1000000 
            : (result.balance ? parseInt(result.balance) / 1000000 : 0);
          
          setTokenBalance(displayBalance);
          console.log(`Token balance refreshed: ${displayBalance}`);
        }
      } catch (error) {
        console.log('Error fetching token balance:', error);
      }
    } finally {
      setLoading(false);
    }
  };
  
  // Check token balance when wallet connects
  useEffect(() => {
    if (signedAccountId) {
      refreshTokenBalance();
    } else {
      setTokenBalance(0);
    }
  }, [signedAccountId]);

  return (
    <div className="main-container">
      {/* Include the global styles */}
      <style jsx global>{AppStyles}</style>
      
      {/* Welcome Header Section */}
      {signedAccountId && (
        <section className="section welcome-section">
          <div className="welcome-panel">
            <div className="welcome-content">
              <div className="welcome-icon">👋</div>
              <div className="welcome-text">
                <h1>Welcome to Finowl Test App, {signedAccountId.split('.')[0]}!</h1>
                <p>Your current token balance: <span className="token-highlight">{tokenBalance}</span></p>
                <p><small>All features are enabled for testing. No registration required.</small></p>
              </div>
              <button 
                className="refresh-button"
                onClick={refreshTokenBalance}
                disabled={loading}
              >
                {loading ? '...' : '🔄'}
              </button>
            </div>
          </div>
        </section>
      )}
      
      {/* User Onboarding Section (visible always) */}
      <UserOnboarding />
      
      {/* Conversation Management (visible always) */}
      <ConversationManagement refreshTokenBalance={refreshTokenBalance} />
      
      {/* Token Management (visible always) */}
      <TokenManagement 
        tokenBalance={tokenBalance}
        registrationStep={2} // Always act as if fully registered
        freeTokensClaimed={freeTokensClaimed}
        loading={loading}
        refreshBalance={refreshTokenBalance}
      />
      
      {/* Admin Tools Section (visible always) */}
      <section className="section">
        <h1 className="section-title">Admin Tools</h1>
        <UserList />
      </section>
    </div>
  );
};

export default MainApp; 