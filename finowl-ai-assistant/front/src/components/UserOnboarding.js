import { useState, useEffect } from 'react';
import { useWalletSelector } from '@near-wallet-selector/react-hook';

export const UserOnboarding = () => {
  const { signedAccountId, viewFunction, callFunction, modal, signIn } = useWalletSelector();
  const [loading, setLoading] = useState(false);
  
  // User status state
  const [userRegistered, setUserRegistered] = useState(false);
  const [userChecked, setUserChecked] = useState(false);
  const [storageRegistered, setStorageRegistered] = useState(false);
  const [registrationStep, setRegistrationStep] = useState(0); // 0: none, 1: storage registered, 2: account registered
  const [freeTokensClaimed, setFreeTokensClaimed] = useState(false);
  const [tokenBalance, setTokenBalance] = useState(0);
  const [lastBalanceUpdate, setLastBalanceUpdate] = useState(null);
  const [foundInUserList, setFoundInUserList] = useState(false); // Track if user was found in user list
  const [networkIssue, setNetworkIssue] = useState(false); // Track if there's a network issue
  const [lastKnownStatus, setLastKnownStatus] = useState({ // Keep track of last known status for fallback
    isRegistered: false,
    registrationStep: 0,
    tokenBalance: 0
  });

  // Check if user is registered when wallet connects
  useEffect(() => {
    if (signedAccountId) {
      checkUserStatusViewOnly();
    } else {
      setUserRegistered(false);
      setStorageRegistered(false);
      setUserChecked(false);
      setRegistrationStep(0);
      setFreeTokensClaimed(false);
      setTokenBalance(0);
      setFoundInUserList(false);
    }
  }, [signedAccountId]);

  // Check user registration status (view-only method)
  const checkUserStatusViewOnly = async () => {
    if (!signedAccountId) {
      return;
    }

    try {
      setLoading(true);
      setNetworkIssue(false); // Reset network issue state
      
      // Try to load previously saved status from localStorage
      try {
        const savedStatus = localStorage.getItem(`finowl_user_status_${signedAccountId}`);
        if (savedStatus) {
          const parsedStatus = JSON.parse(savedStatus);
          console.log('Found cached user status:', parsedStatus);
          
          // Use the saved status as fallback
          setLastKnownStatus({
            isRegistered: parsedStatus.isRegistered || false,
            registrationStep: parsedStatus.registrationStep || 0,
            tokenBalance: parsedStatus.tokenBalance || 0
          });
          
          // If we have a previously saved status that shows the user is registered,
          // we can show that while we try to get fresh data
          if (parsedStatus.isRegistered) {
            setUserRegistered(true);
            setStorageRegistered(true);
            setRegistrationStep(parsedStatus.registrationStep || 2);
            setTokenBalance(parsedStatus.tokenBalance || 0);
            setUserChecked(true);
          }
        }
      } catch (storageError) {
        console.log('Error reading from localStorage:', storageError);
      }
      
      // First try with view function to get all users
      try {
        // Get list of all registered users
        const allUsers = await viewFunction({
          contractId: process.env.NEXT_PUBLIC_CONTRACT_NAME || 'finowl.testnet',
          method: "list_all_users",
          args: {}
        });
        
        console.log('All registered users:', allUsers);
        
        // Check if current user is in the list
        if (allUsers && Array.isArray(allUsers) && allUsers.includes(signedAccountId)) {
          console.log('User found in registered users list');
          setUserRegistered(true);
          setStorageRegistered(true);
          setRegistrationStep(2); // Both registration steps completed
          setFoundInUserList(true);
          
          // Check token balance to determine if free tokens were claimed
          await checkTokenBalance();
          
          // Save status to localStorage
          try {
            localStorage.setItem(`finowl_user_status_${signedAccountId}`, JSON.stringify({
              isRegistered: true,
              registrationStep: 2,
              tokenBalance: tokenBalance
            }));
          } catch (storageError) {
            console.log('Error saving to localStorage:', storageError);
          }
          
          setUserChecked(true);
          return; // Exit early
        } else {
          console.log('User not found in registered users list');
          setFoundInUserList(false);
        }
      } catch (listError) {
        console.log('List all users check failed:', listError);
        setNetworkIssue(true);
        
        // If we have a fallback from localStorage and it shows registered, use that
        if (lastKnownStatus.isRegistered) {
          console.log('Using cached status due to network error');
          setUserChecked(true);
          return;
        }
      }
      
      // If list check fails or user not found, try direct check
      try {
        const isRegistered = await viewFunction({
          contractId: process.env.NEXT_PUBLIC_CONTRACT_NAME || 'finowl.testnet',
          method: "is_user_registered",
          args: { account_id: signedAccountId }
        });
        
        console.log('User registration status (view-only check):', isRegistered);
        
        if (isRegistered && isRegistered.registered === true) {
          setUserRegistered(true);
          setStorageRegistered(true);
          setRegistrationStep(2); // Both registration steps completed
          
          // Save status to localStorage
          try {
            localStorage.setItem(`finowl_user_status_${signedAccountId}`, JSON.stringify({
              isRegistered: true,
              registrationStep: 2,
              tokenBalance: tokenBalance // Use current balance until we check again
            }));
          } catch (storageError) {
            console.log('Error saving to localStorage:', storageError);
          }
          
          // Check token balance to determine if free tokens were claimed
          await checkTokenBalance();
        } else {
          // User is not registered
          setUserRegistered(false);
          setStorageRegistered(false);
          setRegistrationStep(0);
          setFreeTokensClaimed(false);
          setTokenBalance(0);
          setFoundInUserList(false);
          
          // Clear localStorage status
          try {
            localStorage.removeItem(`finowl_user_status_${signedAccountId}`);
          } catch (storageError) {
            console.log('Error clearing localStorage:', storageError);
          }
        }
      } catch (viewError) {
        console.log('View-only check failed:', viewError);
        setNetworkIssue(true);
        
        // If we have a fallback from localStorage, use that
        if (lastKnownStatus.isRegistered) {
          console.log('Using cached status due to network error');
          setUserRegistered(lastKnownStatus.isRegistered);
          setStorageRegistered(true);
          setRegistrationStep(lastKnownStatus.registrationStep);
          setTokenBalance(lastKnownStatus.tokenBalance);
        } else {
          // Don't automatically fall back to call method
          setUserRegistered(false);
          setStorageRegistered(false);
          setRegistrationStep(0);
          setFreeTokensClaimed(false);
          setTokenBalance(0);
          setFoundInUserList(false);
        }
      }
      
      setUserChecked(true);
    } catch (error) {
      console.error('Error in view-only status check:', error);
      setNetworkIssue(true);
    } finally {
      setLoading(false);
    }
  };

  // Check token balance
  const checkTokenBalance = async () => {
    try {
      setLoading(true);
      
      if (!signedAccountId) {
        console.log('Please connect your wallet first');
        return;
      }
      
      // Call the dedicated function to get user token balance
      const balance = await getUserTokenBalance();
      
      // If we got a balance, update the state
      if (balance !== null) {
        const displayBalance = parseInt(balance) / 1000000;
        setTokenBalance(displayBalance);
        // Set the last update timestamp
        setLastBalanceUpdate(new Date());
      }
      
      // Also check if the user's registration step and free tokens claimed status
      try {
        const userData = await viewFunction({
          contractId: process.env.NEXT_PUBLIC_CONTRACT_NAME || 'finowl.testnet',
          method: "get_user",
          args: { account_id: signedAccountId }
        });
        
        if (userData) {
          setRegistrationStep(userData.registration_step || 0);
          setFreeTokensClaimed(userData.free_tokens_claimed || false);
        }
      } catch (userDataError) {
        console.error("Error getting user data:", userDataError);
      }
      
      setUserChecked(true);
    } catch (error) {
      console.error("Error checking token balance:", error);
      alert("Error checking your token status. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Dedicated function to get user token balance, similar to the Go implementation
  const getUserTokenBalance = async () => {
    try {
      if (!signedAccountId) {
        return null;
      }
      
      // First try with view_js_func
      try {
        const result = await viewFunction({
          contractId: process.env.NEXT_PUBLIC_CONTRACT_NAME || 'finowl.testnet',
          method: "view_js_func",
          args: {
            function_name: "get_user_token_balance",
            account_id: signedAccountId
          }
        });
        
        console.log("User token balance (view_js_func):", result);
        
        // The result might be an object with a balance property or just a string
        if (typeof result === 'object' && result !== null && result.balance) {
          return result.balance;
        } else if (typeof result === 'string') {
          return result;
        } else {
          return "0"; // Default to 0 if we can't parse the result
        }
      } catch (viewError) {
        console.log('Error with view_js_func:', viewError);
        
        // Try with get_user as fallback
        const userData = await viewFunction({
          contractId: process.env.NEXT_PUBLIC_CONTRACT_NAME || 'finowl.testnet',
          method: "get_user",
          args: { account_id: signedAccountId }
        });
        
        if (userData && userData.token_balance) {
          return userData.token_balance;
        }
      }
      
      return "0"; // Default to 0 if all attempts fail
    } catch (error) {
      console.error("Error getting user token balance:", error);
      return null;
    }
  };

  // Manual check of user status (may require transaction signing)
  const checkUserStatus = async () => {
    if (!signedAccountId) {
      console.log('Please connect your wallet first');
      return;
    }

    try {
      setLoading(true);
      const result = await callFunction({
        contractId: process.env.NEXT_PUBLIC_CONTRACT_NAME || 'finowl.testnet',
        method: "call_js_func",
        args: {
          function_name: "check_user_status"
        }
      });
      
      console.log('User status result (call method):', result);
      
      // Check if the user is registered based on the response format
      // Status "existing_user" means registered
      const isRegistered = 
        (result.registered === true) || 
        (result.status === "existing_user") ||
        (typeof result === 'string' && result.includes('existing_user'));
      
      setUserRegistered(isRegistered);
      
      // Check storage registration status if user is registered
      if (isRegistered) {
        // We could add a specific check for storage here if the API provides it
        // For now, assume storage is registered if the user is registered
        setStorageRegistered(true);
        setRegistrationStep(2); // Both registration steps completed
        
        // Check token balance to determine if free tokens were claimed
        checkTokenBalance();
      } else {
        setStorageRegistered(false);
        setRegistrationStep(0);
        setFreeTokensClaimed(false);
        setTokenBalance(0);
      }
      
      setUserChecked(true);
    } catch (error) {
      console.error('Error checking user status:', error);
      setUserRegistered(false);
      setStorageRegistered(false);
      setRegistrationStep(0);
      setFreeTokensClaimed(false);
    } finally {
      setLoading(false);
    }
  };

  // Claim free tokens
  const handleClaimFreeTokens = async () => {
    if (!signedAccountId) {
      console.log('Please connect your wallet first');
      if (modal) {
        modal.show();
      } else if (signIn) {
        signIn();
      }
      return;
    }

    if (!userRegistered || !storageRegistered) {
      alert('Please complete account and storage registration first before claiming tokens.');
      return;
    }

    try {
      setLoading(true);
      
      const gas = "50000000000000"; // 50 TGas
      
      const result = await callFunction({
        contractId: process.env.NEXT_PUBLIC_CONTRACT_NAME || 'finowl.testnet',
        method: "call_js_func",
        args: {
          function_name: "grant_free_tokens"
        },
        gas
      });
      
      console.log('Free tokens claim result:', result);
      
      // Check token balance to confirm tokens were received
      await checkTokenBalance();
      
      setFreeTokensClaimed(true);
      alert('Free tokens successfully claimed! You can now start using Finowl services.');
    } catch (error) {
      console.error('Error claiming free tokens:', error);
      
      // Check if the error message indicates tokens were already claimed
      if (error.message && (
          error.message.includes('already claimed') || 
          error.message.includes('already received') ||
          error.message.includes('once per account')
        )) {
        setFreeTokensClaimed(true);
        alert('You have already claimed your free tokens.');
      } else {
        alert(`Failed to claim free tokens: ${error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  // Register storage (now step 1)
  const handleRegisterStorage = async () => {
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
      setLoading(true);
      
      // Need to call storage_deposit with account_id and deposit amount
      // The deposit amount should be 0.00125 NEAR (1250000000000000000000 yoctoNEAR)
      const depositAmount = "1250000000000000000000"; // 0.00125 NEAR in yoctoNEAR
      const gas = "100000000000000"; // 100 Tgas
      
      const result = await callFunction({
        contractId: process.env.NEXT_PUBLIC_CONTRACT_NAME || 'finowl.testnet',
        method: "storage_deposit",
        args: {
          account_id: signedAccountId
        },
        gas,
        deposit: depositAmount
      });
      
      console.log('Storage registration result:', result);
      setStorageRegistered(true);
      setRegistrationStep(1); // Step 1 completed (storage registered)
      alert('Storage registration successful! Now please register your account to complete setup.');
    } catch (error) {
      console.error('Error registering storage:', error);
      alert(`Storage registration failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Register user (now step 2)
  const handleRegister = async () => {
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
      setLoading(true);
      const result = await callFunction({
        contractId: process.env.NEXT_PUBLIC_CONTRACT_NAME || 'finowl.testnet',
        method: "call_js_func",
        args: {
          function_name: "register_user"
        }
      });
      
      console.log('User registration result:', result);
      setUserRegistered(true);
      setRegistrationStep(2); // Both steps completed
      alert('Account registration successful! Your account is now fully set up to use Finowl.');
    } catch (error) {
      console.error('Error registering user:', error);
      alert(`Registration failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Function to refresh only the token balance
  const refreshTokenBalance = async () => {
    if (!signedAccountId) {
      console.log('Please connect your wallet first');
      return;
    }

    try {
      setLoading(true);
      
      // Get the token balance using our dedicated function
      const balance = await getUserTokenBalance();
      
      if (balance !== null) {
        const displayBalance = parseInt(balance) / 1000000;
        setTokenBalance(displayBalance);
        // Set the last update timestamp
        setLastBalanceUpdate(new Date());
        console.log(`Token balance refreshed: ${displayBalance} tokens`);
      } else {
        console.log('Failed to get token balance');
      }
    } catch (error) {
      console.error('Error refreshing token balance:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Registration Banner - shows when wallet is connected but user is not registered */}
      {signedAccountId && !loading && userChecked && registrationStep < 2 && (
        <section className="section register-banner-section">
          <div className="register-banner">
            <div className="register-banner-icon">🔔</div>
            <div className="register-banner-content">
              <h2>Account Registration Required</h2>
              <p>Please complete the registration process to use Finowl's features.</p>
            </div>
            <button 
              className="register-banner-button"
              onClick={() => document.getElementById('registration-section').scrollIntoView({ behavior: 'smooth' })}
            >
              Register Now
            </button>
          </div>
        </section>
      )}
      
      {/* Welcome Header Section */}
      {signedAccountId && registrationStep === 2 && (
        <section className="section welcome-section">
          <div className="welcome-panel">
            <div className="welcome-content">
              <div className="welcome-icon">👋</div>
              <div className="welcome-text">
                <h1>Welcome to Finowl, {signedAccountId.split('.')[0]}!</h1>
                <p>Your current token balance: <span className="token-highlight">{tokenBalance}</span></p>
                {foundInUserList && (
                  <div className="verification-note">
                    <span className="verification-badge">✓</span> Account verified from registered user list
                  </div>
                )}
              </div>
              <button 
                className="refresh-button"
                onClick={checkTokenBalance}
                disabled={loading}
              >
                {loading ? '...' : '🔄'}
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Initial Welcome Token Check Section */}
      {signedAccountId && (
        <section className="section welcome-check">
          <div className="quick-check-panel">
            <div className="quick-check-header">
              <h2>Welcome to Finowl</h2>
              <button 
                className="secondary-button check-button" 
                onClick={checkTokenBalance}
                disabled={loading}
              >
                {loading ? 'Checking...' : '🔄 Check Status'}
              </button>
            </div>
            
            {userChecked ? (
              <div className="quick-status">
                {networkIssue && (
                  <div className="network-warning">
                    <div className="status-icon warning">⚠️</div>
                    <div className="status-info">
                      <p className="status-message"><strong>Network Issue Detected</strong></p>
                      <p className="status-detail">
                        {userRegistered 
                          ? "Showing cached data. Some features may be limited until connection is restored." 
                          : "Unable to verify your account. Please try again later."}
                      </p>
                    </div>
                  </div>
                )}
                {registrationStep === 2 && freeTokensClaimed ? (
                  <>
                    <div className="status-icon success">✓</div>
                    <div className="status-info">
                      <p className="status-message">Your account is fully set up!</p>
                      <p className="status-detail">You have {tokenBalance} tokens available.</p>
                    </div>
                  </>
                ) : registrationStep === 2 ? (
                  <>
                    <div className="status-icon warning">⚠️</div>
                    <div className="status-info">
                      <p className="status-message">Registration complete, tokens needed</p>
                      <p className="status-detail">You are registered but haven't claimed tokens yet.</p>
                    </div>
                  </>
                ) : registrationStep === 1 ? (
                  <>
                    <div className="status-icon warning">⚠️</div>
                    <div className="status-info">
                      <p className="status-message">Storage registered, account registration needed</p>
                      <p className="status-detail">Complete step 2 in the onboarding section below.</p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="status-icon error">!</div>
                    <div className="status-info">
                      <p className="status-message">Account setup required</p>
                      <p className="status-detail">Please follow the onboarding steps below.</p>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="quick-status">
                <div className="loading-container">
                  <div className="loading-spinner"></div>
                  <p>Checking account status...</p>
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Section 1: User Onboarding */}
      <section className="section" id="registration-section">
        <h1 className="section-title">User Onboarding</h1>
        <div className="two-column-layout">
          <div className="left-column">
            <div className="panel">
              <h2 className="panel-title">Account Registration</h2>
              
              {!signedAccountId ? (
                <div className="status-container">
                  <p className="panel-description">
                    Please connect your NEAR wallet to continue.
                  </p>
                  <button className="primary-button" onClick={signIn}>
                    🔑 Connect Wallet
                  </button>
                </div>
              ) : !userChecked ? (
                <div className="status-container">
                  <p className="panel-description">
                    Checking account status...
                  </p>
                  <div className="loading-spinner"></div>
                </div>
              ) : (
                <div className="status-container">
                  {registrationStep === 2 && freeTokensClaimed ? (
                    <p className="panel-description status-success">
                      ✅ Welcome back, {signedAccountId}!
                    </p>
                  ) : (
                    <p className="panel-description status-warning">
                      ⚠️ Setup Required
                    </p>
                  )}
                  
                  <div className="registration-steps">
                    <div className={`step ${registrationStep >= 1 ? 'completed' : 'pending'}`}>
                      <div className="step-number">1</div>
                      <div className="step-details">
                        <span className="step-title">Storage Registration</span>
                        <span className="step-status">
                          {registrationStep >= 1 ? 'Completed' : 'Pending'}
                        </span>
                      </div>
                      <button 
                        className={`step-button ${registrationStep >= 1 ? 'completed' : 'pending'}`}
                        onClick={handleRegisterStorage}
                        disabled={loading}
                      >
                        {loading ? '...' : 'Register'}
                      </button>
                    </div>
                    <div className={`step ${registrationStep >= 2 ? 'completed' : 'pending'}`}>
                      <div className="step-number">2</div>
                      <div className="step-details">
                        <span className="step-title">Account Registration</span>
                        <span className="step-status">
                          {registrationStep >= 2 ? 'Completed' : 'Pending'}
                        </span>
                      </div>
                      <button 
                        className={`step-button ${registrationStep >= 2 ? 'completed' : 'pending'}`}
                        onClick={handleRegister}
                        disabled={loading}
                      >
                        {loading ? '...' : 'Register'}
                      </button>
                    </div>
                    <div className={`step ${freeTokensClaimed ? 'completed' : (registrationStep >= 2 ? 'pending' : 'disabled')}`}>
                      <div className="step-number">3</div>
                      <div className="step-details">
                        <span className="step-title">Claim Free Tokens</span>
                        <span className="step-status">
                          {freeTokensClaimed ? 'Completed' : (registrationStep >= 2 ? 'Pending' : 'Requires Registration')}
                        </span>
                      </div>
                      <button 
                        className={`step-button ${freeTokensClaimed ? 'completed' : 'pending'}`}
                        onClick={handleClaimFreeTokens}
                        disabled={loading || registrationStep < 2}
                      >
                        {loading ? '...' : 'Claim'}
                      </button>
                    </div>
                  </div>
                  
                  {registrationStep === 2 && freeTokensClaimed ? (
                    <div className="setup-complete">
                      <p>
                        Your account is fully set up with {tokenBalance > 0 ? `${tokenBalance} tokens` : 'tokens'}.
                      </p>
                      <div className="token-balance">
                        <span className="balance-label">Token Balance:</span>
                        <span className="balance-value">{tokenBalance}</span>
                      </div>
                    </div>
                  ) : (
                    <p className="registration-info">
                      Please complete all steps to start using Finowl.
                    </p>
                  )}
                  
                  <button 
                    className="secondary-button" 
                    onClick={checkUserStatusViewOnly}
                  >
                    🔄 Refresh Status
                  </button>
                  
                  <div className="advanced-options">
                    <button 
                      className="text-button" 
                      onClick={checkUserStatus}
                    >
                      Advanced: Full Status Check (requires signing)
                    </button>
                  </div>
                  
                  {registrationStep === 0 && (
                    <div className="step-note">
                      <strong>Note:</strong> Both registration steps are required for full functionality
                    </div>
                  )}
                  {registrationStep === 0 && (
                    <div className="step-note">
                      <strong>Note:</strong> Storage registration requires a small NEAR deposit (~0.00125 NEAR)
                    </div>
                  )}
                  {registrationStep === 2 && !freeTokensClaimed && (
                    <div className="step-note">
                      <strong>Note:</strong> Free tokens can only be claimed once per account
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
          
          <div className="right-column">
            <div className="panel">
              <h2 className="panel-title">Token Management</h2>
              <p className="panel-description">
                Manage your tokens to use Finowl's AI services.
              </p>
              
              {registrationStep >= 2 && (
                <div className="token-balance-card">
                  <span className="balance-label">Current Balance:</span>
                  <span className="balance-value">{tokenBalance}</span>
                  <button 
                    className="secondary-button small-button" 
                    onClick={checkTokenBalance}
                    disabled={loading}
                  >
                    {loading ? '...' : '🔄 Refresh'}
                  </button>
                </div>
              )}
              
              <div className="button-grid">
                <button 
                  className="primary-button" 
                  onClick={handleClaimFreeTokens}
                  disabled={loading || registrationStep < 2 || freeTokensClaimed}
                >
                  {freeTokensClaimed ? '✓ Tokens Claimed' : '🎁 Get Free Tokens'}
                </button>
                <button 
                  className="primary-button" 
                  onClick={checkTokenBalance}
                  disabled={loading}
                >
                  {loading ? 'Checking...' : '💰 Check Balance'}
                </button>
              </div>
              {registrationStep < 2 && (
                <div className="token-note">
                  Token operations will be available after completing registration.
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default UserOnboarding; 