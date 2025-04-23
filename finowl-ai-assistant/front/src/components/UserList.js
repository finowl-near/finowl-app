import { useState, useEffect } from 'react';
import { useWalletSelector } from '@near-wallet-selector/react-hook';

export const UserList = () => {
  const { signedAccountId, viewFunction, callFunction, modal, signIn } = useWalletSelector();
  const [loading, setLoading] = useState(false);
  const [userList, setUserList] = useState([]);
  const [showUserList, setShowUserList] = useState(false);
  const [claimStatus, setClaimStatus] = useState(null); // Store the claim status result
  const [storageStatus, setStorageStatus] = useState(null); // Store the storage balance result
  const [registrationStatus, setRegistrationStatus] = useState(null); // Store the registration status
  const [debugResults, setDebugResults] = useState([]); // Store debug results
  const [autoCheckDone, setAutoCheckDone] = useState(false); // Track if auto-check was performed
  const [activeCheck, setActiveCheck] = useState('tokens'); // 'tokens', 'storage', or 'registration'

  // Auto-check statuses when component mounts and wallet is connected
  useEffect(() => {
    if (signedAccountId && !autoCheckDone) {
      // Small delay to ensure everything is initialized
      const timer = setTimeout(() => {
        console.log('Auto-checking user statuses...');
        checkHasClaimedTokens(false); // Pass false to not show the modal for auto-check
        checkStorageDeposit(false); // Also check storage deposit without showing modal
        checkUserRegistration(false); // Also check user registration without showing modal
        setAutoCheckDone(true);
      }, 1500); // 1.5 second delay
      
      return () => clearTimeout(timer);
    }
  }, [signedAccountId, autoCheckDone]);

  const handleListAllUsers = async () => {
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
      console.log('Attempting to list all users...');
      
      // Try with view method first
      try {
        const result = await viewFunction({
          contractId: process.env.NEXT_PUBLIC_CONTRACT_NAME || 'finowl.testnet',
          method: "list_all_users",
          args: {}
        });
        
        console.log('List all users result (view method):', result);
        setUserList(result);
        setShowUserList(true);
      } catch (viewError) {
        console.log('View method failed for list_all_users:', viewError);
        
        // Try with view_js_func as fallback
        try {
          const result = await viewFunction({
            contractId: process.env.NEXT_PUBLIC_CONTRACT_NAME || 'finowl.testnet',
            method: "view_js_func",
            args: {
              function_name: "list_all_users"
            }
          });
          
          console.log('List all users result (view_js_func):', result);
          setUserList(result);
          setShowUserList(true);
        } catch (viewJsError) {
          console.log('view_js_func method also failed:', viewJsError);
          
          // Last resort: Try call method (which might require signing)
          const result = await callFunction({
            contractId: process.env.NEXT_PUBLIC_CONTRACT_NAME || 'finowl.testnet',
            method: "call_js_func",
            args: {
              function_name: "list_all_users"
            }
          });
          
          console.log('List all users result (call method):', result);
          setUserList(result);
          setShowUserList(true);
        }
      }
    } catch (error) {
      console.error('Error listing all users:', error);
      alert('Failed to list users: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Function to check if user has claimed welcome tokens
  const checkHasClaimedTokens = async (showModal = true) => {
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
      setDebugResults([]);
      
      const debugLog = (message, data = null) => {
        console.log(message, data);
        setDebugResults(prev => [...prev, { message, data: data ? JSON.stringify(data) : null }]);
      };
      
      debugLog(`Checking welcome tokens status for ${signedAccountId}...`);
      
      // Try with localStorage cache first
      try {
        const cachedTokenStatus = localStorage.getItem(`finowl_tokens_claimed_${signedAccountId}`);
        if (cachedTokenStatus) {
          const parsed = JSON.parse(cachedTokenStatus);
          debugLog('Found cached token claim status:', parsed);
        }
      } catch (cacheError) {
        debugLog('Error reading token status from cache:', cacheError);
      }
      
      // Try direct check with view_js_func
      try {
        const result = await viewFunction({
          contractId: process.env.NEXT_PUBLIC_CONTRACT_NAME || 'finowl.testnet',
          method: "view_js_func",
          args: {
            function_name: "has_received_welcome_tokens",
            account_id: signedAccountId
          }
        });
        
        debugLog('Welcome tokens check result:', result);
        setClaimStatus(result);
        
        // Broadcast the result to all components that might need it
        const claimEvent = new CustomEvent('welcomeTokensChecked', { 
          detail: { result, timestamp: new Date().getTime() } 
        });
        window.dispatchEvent(claimEvent);
        
        // Show the result in a modal only if requested
        if (showModal) {
          setShowUserList(true);
        }
      } catch (viewError) {
        debugLog('Welcome tokens check failed with view_js_func:', viewError);
        
        // Try with call method as fallback (requires signing)
        try {
          debugLog('Trying with call method instead...');
          const result = await callFunction({
            contractId: process.env.NEXT_PUBLIC_CONTRACT_NAME || 'finowl.testnet',
            method: "call_js_func",
            args: {
              function_name: "has_received_welcome_tokens",
              account_id: signedAccountId
            }
          });
          
          debugLog('Welcome tokens check result (call method):', result);
          setClaimStatus(result);
          
          // Broadcast the result
          const claimEvent = new CustomEvent('welcomeTokensChecked', { 
            detail: { result, timestamp: new Date().getTime() } 
          });
          window.dispatchEvent(claimEvent);
          
          // Show the result in a modal only if requested
          if (showModal) {
            setShowUserList(true);
          }
        } catch (callError) {
          debugLog('Call method also failed:', callError);
          if (showModal) {
            alert('Both view and call methods failed to check welcome tokens status.');
          }
        }
      }
    } catch (error) {
      console.error('Error checking welcome tokens status:', error);
      if (showModal) {
        alert('Failed to check welcome tokens status: ' + error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  // Function to check storage deposit status
  const checkStorageDeposit = async (showModal = true) => {
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
      setDebugResults([]);
      setActiveCheck('storage');
      
      const debugLog = (message, data = null) => {
        console.log(message, data);
        setDebugResults(prev => [...prev, { message, data: data ? JSON.stringify(data) : null }]);
      };
      
      debugLog(`Checking storage deposit status for ${signedAccountId}...`);
      
      // Try with localStorage cache first
      try {
        const cachedStorageStatus = localStorage.getItem(`finowl_storage_deposit_${signedAccountId}`);
        if (cachedStorageStatus) {
          const parsed = JSON.parse(cachedStorageStatus);
          debugLog('Found cached storage deposit status:', parsed);
        }
      } catch (cacheError) {
        debugLog('Error reading storage deposit status from cache:', cacheError);
      }
      
      // Direct check with storage_balance_of
      try {
        const result = await viewFunction({
          contractId: process.env.NEXT_PUBLIC_CONTRACT_NAME || 'finowl.testnet',
          method: "storage_balance_of",
          args: {
            account_id: signedAccountId
          }
        });
        
        debugLog('Storage deposit check result:', result);
        setStorageStatus(result);
        
        // Broadcast the result to all components that might need it
        const storageEvent = new CustomEvent('storageDepositChecked', { 
          detail: { result, timestamp: new Date().getTime() } 
        });
        window.dispatchEvent(storageEvent);
        
        // Cache the result
        try {
          localStorage.setItem(`finowl_storage_deposit_${signedAccountId}`, JSON.stringify({
            hasDeposit: result !== null,
            amount: result ? result.total : null,
            timestamp: new Date().getTime()
          }));
        } catch (cacheError) {
          debugLog('Error caching storage deposit status:', cacheError);
        }
        
        // Show the result in a modal only if requested
        if (showModal) {
          setShowUserList(true);
        }
      } catch (viewError) {
        debugLog('Storage deposit check failed with view method:', viewError);
        
        // If view method fails, try with call method (requires signing)
        try {
          debugLog('Trying with call method instead...');
          const result = await callFunction({
            contractId: process.env.NEXT_PUBLIC_CONTRACT_NAME || 'finowl.testnet',
            method: "storage_balance_of",
            args: {
              account_id: signedAccountId
            }
          });
          
          debugLog('Storage deposit check result (call method):', result);
          setStorageStatus(result);
          
          // Broadcast the result
          const storageEvent = new CustomEvent('storageDepositChecked', { 
            detail: { result, timestamp: new Date().getTime() } 
          });
          window.dispatchEvent(storageEvent);
          
          // Cache the result
          try {
            localStorage.setItem(`finowl_storage_deposit_${signedAccountId}`, JSON.stringify({
              hasDeposit: result !== null,
              amount: result ? result.total : null,
              timestamp: new Date().getTime()
            }));
          } catch (cacheError) {
            debugLog('Error caching storage deposit status:', cacheError);
          }
          
          // Show the result in a modal only if requested
          if (showModal) {
            setShowUserList(true);
          }
        } catch (callError) {
          debugLog('Call method also failed:', callError);
          if (showModal) {
            alert('Both view and call methods failed to check storage deposit status.');
          }
        }
      }
    } catch (error) {
      console.error('Error checking storage deposit status:', error);
      if (showModal) {
        alert('Failed to check storage deposit status: ' + error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  // Function to check user registration status
  const checkUserRegistration = async (showModal = true) => {
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
      setDebugResults([]);
      setActiveCheck('registration');
      
      const debugLog = (message, data = null) => {
        console.log(message, data);
        setDebugResults(prev => [...prev, { message, data: data ? JSON.stringify(data) : null }]);
      };
      
      debugLog(`Checking registration status for ${signedAccountId}...`);
      
      // Try with localStorage cache first
      try {
        const cachedRegistrationStatus = localStorage.getItem(`finowl_registration_${signedAccountId}`);
        if (cachedRegistrationStatus) {
          const parsed = JSON.parse(cachedRegistrationStatus);
          debugLog('Found cached registration status:', parsed);
        }
      } catch (cacheError) {
        debugLog('Error reading registration status from cache:', cacheError);
      }
      
      // Direct check with is_user_registered
      try {
        const result = await viewFunction({
          contractId: process.env.NEXT_PUBLIC_CONTRACT_NAME || 'finowl.testnet',
          method: "is_user_registered",
          args: { 
            account_id: signedAccountId 
          }
        });
        
        debugLog('Registration check result:', result);
        setRegistrationStatus(result);
        
        // Broadcast the result to all components that might need it
        const registrationEvent = new CustomEvent('userRegistrationChecked', { 
          detail: { result, timestamp: new Date().getTime() } 
        });
        window.dispatchEvent(registrationEvent);
        
        // Cache the result
        try {
          localStorage.setItem(`finowl_registration_${signedAccountId}`, JSON.stringify({
            registered: result && result.registered === true,
            timestamp: new Date().getTime()
          }));
        } catch (cacheError) {
          debugLog('Error caching registration status:', cacheError);
        }
        
        // Show the result in a modal only if requested
        if (showModal) {
          setShowUserList(true);
        }
      } catch (viewError) {
        debugLog('Registration check failed with is_user_registered:', viewError);
        
        // Try with view_js_func as fallback
        try {
          debugLog('Trying with view_js_func instead...');
          const result = await viewFunction({
            contractId: process.env.NEXT_PUBLIC_CONTRACT_NAME || 'finowl.testnet',
            method: "view_js_func",
            args: {
              function_name: "is_user_registered",
              account_id: signedAccountId
            }
          });
          
          debugLog('Registration check result (view_js_func):', result);
          setRegistrationStatus(result);
          
          // Broadcast the result
          const registrationEvent = new CustomEvent('userRegistrationChecked', { 
            detail: { result, timestamp: new Date().getTime() } 
          });
          window.dispatchEvent(registrationEvent);
          
          // Cache the result
          try {
            localStorage.setItem(`finowl_registration_${signedAccountId}`, JSON.stringify({
              registered: result && result.registered === true,
              timestamp: new Date().getTime()
            }));
          } catch (cacheError) {
            debugLog('Error caching registration status:', cacheError);
          }
          
          // Show the result in a modal only if requested
          if (showModal) {
            setShowUserList(true);
          }
        } catch (viewJsFuncError) {
          debugLog('view_js_func also failed:', viewJsFuncError);
          
          // Try with call method as last resort (requires signing)
          try {
            debugLog('Trying with call method instead...');
            const result = await callFunction({
              contractId: process.env.NEXT_PUBLIC_CONTRACT_NAME || 'finowl.testnet',
              method: "call_js_func",
              args: {
                function_name: "is_user_registered",
                account_id: signedAccountId
              }
            });
            
            debugLog('Registration check result (call method):', result);
            setRegistrationStatus(result);
            
            // Broadcast the result
            const registrationEvent = new CustomEvent('userRegistrationChecked', { 
              detail: { result, timestamp: new Date().getTime() } 
            });
            window.dispatchEvent(registrationEvent);
            
            // Cache the result
            try {
              localStorage.setItem(`finowl_registration_${signedAccountId}`, JSON.stringify({
                registered: result && result.registered === true,
                timestamp: new Date().getTime()
              }));
            } catch (cacheError) {
              debugLog('Error caching registration status:', cacheError);
            }
            
            // Show the result in a modal only if requested
            if (showModal) {
              setShowUserList(true);
            }
          } catch (callError) {
            debugLog('Call method also failed:', callError);
            if (showModal) {
              alert('All methods failed to check registration status.');
            }
          }
        }
      }
    } catch (error) {
      console.error('Error checking registration status:', error);
      if (showModal) {
        alert('Failed to check registration status: ' + error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  // Check if we have all three statuses (full registration)
  const isFullyRegistered = () => {
    return (
      claimStatus && claimStatus.received === true && 
      storageStatus !== null && 
      registrationStatus && registrationStatus.registered === true
    );
  };

  // Helper function to format NEAR amount from yoctoNEAR
  const formatNearAmount = (yoctoAmount) => {
    if (!yoctoAmount) return '0';
    const nearAmount = parseFloat(yoctoAmount) / 1e24;
    return nearAmount.toFixed(5);
  };

  return (
    <div className="panel">
      <h2 className="panel-title">User Management</h2>
      <p className="panel-description">
        View all registered users on the Finowl platform.
      </p>
      
      <div className="debug-buttons">
        <button 
          className="primary-button"
          onClick={handleListAllUsers}
          disabled={loading}
        >
          {loading ? 'Loading Users...' : '👥 List All Users'}
        </button>
        
        <div className="status-check-buttons">
          <button 
            className={`accent-button ${activeCheck === 'tokens' ? 'active' : ''}`}
            onClick={() => checkHasClaimedTokens(true)}
            disabled={loading}
          >
            {loading && activeCheck === 'tokens' ? 'Checking...' : '🔍 Check Tokens'}
          </button>
          
          <button 
            className={`accent-button ${activeCheck === 'storage' ? 'active' : ''}`}
            onClick={() => checkStorageDeposit(true)}
            disabled={loading}
          >
            {loading && activeCheck === 'storage' ? 'Checking...' : '💾 Check Storage'}
          </button>
          
          <button 
            className={`accent-button ${activeCheck === 'registration' ? 'active' : ''}`}
            onClick={() => checkUserRegistration(true)}
            disabled={loading}
          >
            {loading && activeCheck === 'registration' ? 'Checking...' : '👤 Check Registration'}
          </button>
        </div>
        
        <div className="status-badges">
          {claimStatus && (
            <div className={`status-badge-mini ${claimStatus.received ? 'success' : 'warning'}`}>
              {claimStatus.received ? 'Tokens ✓' : 'No Tokens'} 
            </div>
          )}
          
          {storageStatus && (
            <div className={`status-badge-mini ${storageStatus ? 'success' : 'warning'}`}>
              {storageStatus ? `Storage ✓` : 'No Storage'} 
            </div>
          )}
          
          {registrationStatus && (
            <div className={`status-badge-mini ${registrationStatus.registered ? 'success' : 'warning'}`}>
              {registrationStatus.registered ? 'Registered ✓' : 'Not Registered'} 
            </div>
          )}
          
          {isFullyRegistered() && (
            <div className="status-badge-mini success fully-registered">
              ✅ Fully Registered
            </div>
          )}
        </div>
      </div>

      {/* User List Modal */}
      {showUserList && (
        <div className="modal-overlay">
          <div className="modal-container">
            <div className="modal-header">
              <h2>
                {activeCheck === 'tokens' && claimStatus 
                  ? 'Welcome Tokens Status' 
                  : activeCheck === 'storage' && storageStatus !== null
                    ? 'Storage Deposit Status'
                    : activeCheck === 'registration' && registrationStatus
                      ? 'User Registration Status'
                      : 'Registered Users'}
              </h2>
              <button 
                className="modal-close-button"
                onClick={() => {
                  setShowUserList(false);
                }}
              >
                ×
              </button>
            </div>
            <div className="modal-content">
              {activeCheck === 'tokens' && claimStatus ? (
                <div className="debug-results">
                  <div className="token-check-result">
                    <h3>Welcome Tokens Check Result:</h3>
                    <pre className="json-result">{JSON.stringify(claimStatus, null, 2)}</pre>
                    
                    <div className={`status-badge ${claimStatus.received ? 'success' : 'warning'}`}>
                      {claimStatus.received ? 'Tokens Claimed' : 'Tokens Not Claimed'}
                    </div>
                  </div>
                  
                  {debugResults.length > 0 && (
                    <div className="debug-log">
                      <h3>Debug Log:</h3>
                      <div className="log-entries">
                        {debugResults.map((entry, index) => (
                          <div key={index} className="log-entry">
                            <div className="log-message">{entry.message}</div>
                            {entry.data && <pre className="log-data">{entry.data}</pre>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : activeCheck === 'storage' && storageStatus !== null ? (
                <div className="debug-results">
                  <div className="token-check-result">
                    <h3>Storage Deposit Check Result:</h3>
                    <pre className="json-result">{JSON.stringify(storageStatus, null, 2)}</pre>
                    
                    <div className={`status-badge ${storageStatus ? 'success' : 'warning'}`}>
                      {storageStatus 
                        ? `Storage Deposit Found: ${formatNearAmount(storageStatus.total)} NEAR` 
                        : 'No Storage Deposit'}
                    </div>
                  </div>
                  
                  {debugResults.length > 0 && (
                    <div className="debug-log">
                      <h3>Debug Log:</h3>
                      <div className="log-entries">
                        {debugResults.map((entry, index) => (
                          <div key={index} className="log-entry">
                            <div className="log-message">{entry.message}</div>
                            {entry.data && <pre className="log-data">{entry.data}</pre>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : activeCheck === 'registration' && registrationStatus ? (
                <div className="debug-results">
                  <div className="token-check-result">
                    <h3>User Registration Check Result:</h3>
                    <pre className="json-result">{JSON.stringify(registrationStatus, null, 2)}</pre>
                    
                    <div className={`status-badge ${registrationStatus.registered ? 'success' : 'warning'}`}>
                      {registrationStatus.registered 
                        ? 'User is Registered' 
                        : 'User is Not Registered'}
                    </div>
                    
                    {isFullyRegistered() && (
                      <div className="registration-summary">
                        <h3>Complete Registration Status:</h3>
                        <div className="status-badge success">
                          ✅ Fully Registered (Storage + User + Tokens)
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {debugResults.length > 0 && (
                    <div className="debug-log">
                      <h3>Debug Log:</h3>
                      <div className="log-entries">
                        {debugResults.map((entry, index) => (
                          <div key={index} className="log-entry">
                            <div className="log-message">{entry.message}</div>
                            {entry.data && <pre className="log-data">{entry.data}</pre>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : userList.length > 0 ? (
                <div className="user-list">
                  <p className="user-list-intro">Found {userList.length} registered users:</p>
                  <ul className="user-account-list">
                    {userList.map((user, index) => (
                      <li key={index} className="user-item">
                        <span className="user-account-id">{user}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <div className="empty-state">
                  <div className="empty-icon">👤</div>
                  <p>No registered users found.</p>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button 
                className="secondary-button"
                onClick={() => {
                  setShowUserList(false);
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserList; 