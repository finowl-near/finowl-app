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
  const [showWelcomeTokenPopup, setShowWelcomeTokenPopup] = useState(false); // New state for welcome token popup
  const [lastKnownStatus, setLastKnownStatus] = useState({ // Keep track of last known status for fallback
    isRegistered: false,
    registrationStep: 0,
    tokenBalance: 0
  });

  // Check if user has received welcome tokens
  const checkWelcomeTokensStatus = async () => {
    if (!signedAccountId) return;
    
    try {
      console.log(`Checking welcome tokens status for ${signedAccountId}...`);
      
      // First try with localStorage cache if available
      try {
        const cachedTokenStatus = localStorage.getItem(`finowl_tokens_claimed_${signedAccountId}`);
        if (cachedTokenStatus) {
          const parsed = JSON.parse(cachedTokenStatus);
          console.log('Found cached token claim status:', parsed);
          if (parsed.claimed === true) {
            console.log('Using cached token status: tokens already claimed');
            setFreeTokensClaimed(true);
            return; // Exit early if we have cached confirmation
          }
        }
      } catch (cacheError) {
        console.log('Error reading token status from cache:', cacheError);
      }
      
      // Try the direct check with view_js_func
      try {
        const result = await viewFunction({
          contractId: process.env.NEXT_PUBLIC_CONTRACT_NAME || 'finowl.testnet',
          method: "view_js_func",
          args: {
            function_name: "has_received_welcome_tokens",
            account_id: signedAccountId
          }
        });
        
        console.log('Welcome tokens check result:', result);
        
        if (result && result.received === true) {
          console.log('User has already received welcome tokens');
          setFreeTokensClaimed(true);
          // Cache the result
          try {
            localStorage.setItem(`finowl_tokens_claimed_${signedAccountId}`, JSON.stringify({
              claimed: true,
              timestamp: new Date().getTime()
            }));
          } catch (cacheError) {
            console.log('Error caching token status:', cacheError);
          }
          return;
        }
      } catch (viewError) {
        console.log('Welcome tokens direct check failed:', viewError);
        // Continue to fallback checks
      }
      
      // Fallback: Check token balance as indication
      if (tokenBalance > 0) {
        console.log('Assuming tokens claimed based on positive balance:', tokenBalance);
        setFreeTokensClaimed(true);
        return;
      }
      
      // If all checks fail or indicate not claimed
      console.log('Assuming user has not received welcome tokens yet');
      setFreeTokensClaimed(false);
      
      // Show welcome token popup if user has a wallet connected
      // and either appears registered or has a token balance
      if (signedAccountId && (userRegistered || tokenBalance > 0)) {
        setShowWelcomeTokenPopup(true);
      }
    } catch (error) {
      console.error('Error checking welcome tokens status:', error);
      
      // Fallback to token balance check
      if (tokenBalance > 0) {
        console.log('Assuming tokens claimed based on positive balance (error fallback)');
        setFreeTokensClaimed(true);
      }
    }
  };

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
      setShowWelcomeTokenPopup(false);
    }
  }, [signedAccountId]);
  
  // Listen for welcome tokens check events
  useEffect(() => {
    const handleWelcomeTokensChecked = (event) => {
      console.log('UserOnboarding received welcomeTokensChecked event:', event.detail);
      const { result } = event.detail;
      
      if (result && typeof result.received === 'boolean') {
        console.log('Setting freeTokensClaimed based on event:', result.received);
        setFreeTokensClaimed(result.received);
        
        // If tokens have been claimed, close the popup if it's open
        if (result.received) {
          setShowWelcomeTokenPopup(false);
        } else if (userRegistered) {
          // If not claimed and user is registered, show the popup
          setShowWelcomeTokenPopup(true);
        }
      }
    };
    
    window.addEventListener('welcomeTokensChecked', handleWelcomeTokensChecked);
    
    return () => {
      window.removeEventListener('welcomeTokensChecked', handleWelcomeTokensChecked);
    };
  }, [userRegistered]);
  
  // Listen for storage deposit check events
  useEffect(() => {
    const handleStorageDepositChecked = (event) => {
      console.log('UserOnboarding received storageDepositChecked event:', event.detail);
      const { result } = event.detail;
      
      // If storage deposit exists, set storageRegistered to true
      if (result) {
        console.log('Setting storageRegistered based on event:', true);
        setStorageRegistered(true);
        
        // If user is already registered, set registration step to 2
        if (userRegistered) {
          setRegistrationStep(2);
        } else {
          // If storage is registered but user is not, set to step 1
          setRegistrationStep(1);
        }
        
        // Save status to localStorage
        try {
          localStorage.setItem(`finowl_user_status_${signedAccountId}`, JSON.stringify({
            isRegistered: userRegistered,
            registrationStep: userRegistered ? 2 : 1,
            storageRegistered: true,
            tokenBalance: tokenBalance,
            lastUpdated: new Date().getTime()
          }));
        } catch (storageError) {
          console.log('Error saving to localStorage:', storageError);
        }
      } else if (result === null) {
        console.log('Setting storageRegistered based on event:', false);
        setStorageRegistered(false);
        setRegistrationStep(0);
      }
    };
    
    window.addEventListener('storageDepositChecked', handleStorageDepositChecked);
    
    return () => {
      window.removeEventListener('storageDepositChecked', handleStorageDepositChecked);
    };
  }, [signedAccountId, userRegistered, tokenBalance]);

  // Listen for user registration check events
  useEffect(() => {
    const handleUserRegistrationChecked = (event) => {
      console.log('UserOnboarding received userRegistrationChecked event:', event.detail);
      const { result } = event.detail;
      
      if (result && typeof result.registered === 'boolean') {
        console.log('Setting userRegistered based on event:', result.registered);
        setUserRegistered(result.registered);
        
        // Update registration step based on storage status
        if (result.registered) {
          if (storageRegistered) {
            // Both user and storage are registered
            setRegistrationStep(2);
          } else {
            // User registered but not storage (unusual case)
            console.log('Unusual state: User registered but storage not registered');
            setRegistrationStep(1);
          }
        } else {
          // User not registered
          setRegistrationStep(storageRegistered ? 1 : 0);
        }
        
        // Save status to localStorage
        try {
          localStorage.setItem(`finowl_user_status_${signedAccountId}`, JSON.stringify({
            isRegistered: result.registered,
            registrationStep: result.registered && storageRegistered ? 2 : (storageRegistered ? 1 : 0),
            storageRegistered: storageRegistered,
            tokenBalance: tokenBalance,
            lastUpdated: new Date().getTime()
          }));
        } catch (storageError) {
          console.log('Error saving to localStorage:', storageError);
        }
        
        // Set userChecked to true to indicate we have verified the status
        setUserChecked(true);
      }
    };
    
    window.addEventListener('userRegistrationChecked', handleUserRegistrationChecked);
    
    return () => {
      window.removeEventListener('userRegistrationChecked', handleUserRegistrationChecked);
    };
  }, [signedAccountId, storageRegistered, tokenBalance]);

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

    // Don't require registration checks if we know they have a balance
    if (tokenBalance <= 0 && (!userRegistered || !storageRegistered)) {
      alert('Please complete account and storage registration first before claiming tokens.');
      return;
    }

    try {
      setLoading(true);
      
      const gas = "50000000000000"; // 50 TGas
      // Get current timestamp in seconds
      const timestamp = Math.floor(Date.now() / 1000);
      
      const result = await callFunction({
        contractId: process.env.NEXT_PUBLIC_CONTRACT_NAME || 'finowl.testnet',
        method: "call_js_func",
        args: {
          function_name: "grant_free_tokens",
          timestamp: timestamp
        },
        gas
      });
      
      console.log('Free tokens claim result:', result);
      
      // Check token balance to confirm tokens were received
      await checkTokenBalance();
      
      setFreeTokensClaimed(true);
      // Close the welcome token popup if it was showing
      setShowWelcomeTokenPopup(false);
      
      // Cache the token claimed status
      try {
        localStorage.setItem(`finowl_tokens_claimed_${signedAccountId}`, JSON.stringify({
          claimed: true,
          timestamp: new Date().getTime()
        }));
      } catch (cacheError) {
        console.log('Error caching token status:', cacheError);
      }
      
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
        // Close the welcome token popup
        setShowWelcomeTokenPopup(false);
        
        // Cache the token claimed status
        try {
          localStorage.setItem(`finowl_tokens_claimed_${signedAccountId}`, JSON.stringify({
            claimed: true,
            timestamp: new Date().getTime()
          }));
        } catch (cacheError) {
          console.log('Error caching token status:', cacheError);
        }
        
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

  // Determine which onboarding actions are needed
  const determineOnboardingStatus = () => {
    // We need userChecked to be true to avoid flash of UI
    if (!userChecked) return null;
    
    const needsClaim = !freeTokensClaimed;
    const needsStorage = !storageRegistered;
    const needsRegistration = !userRegistered;
    
    // Fully registered - everything is done
    if (!needsClaim && !needsStorage && !needsRegistration) {
      return {
        status: 'complete',
        message: 'Your account is fully set up and ready to use!',
        step: 3
      };
    }
    
    // Only needs to claim tokens
    if (needsClaim && !needsStorage && !needsRegistration) {
      return {
        status: 'claim_only',
        message: 'Your account is registered, but you need to claim your free tokens.',
        step: 2,
        nextAction: 'Claim Free Tokens',
        nextFunction: handleClaimFreeTokens
      };
    }
    
    // Needs to register and claim tokens
    if (needsClaim && !needsStorage && needsRegistration) {
      return {
        status: 'register_and_claim',
        message: 'Storage is set up. You need to register your account and claim tokens.',
        step: 1,
        nextAction: 'Register Account',
        nextFunction: handleRegister
      };
    }
    
    // Needs storage and everything else
    if (needsClaim && needsStorage && needsRegistration) {
      return {
        status: 'full_setup',
        message: 'You need to complete all registration steps to use Finowl.',
        step: 0,
        nextAction: 'Register Storage',
        nextFunction: handleRegisterStorage
      };
    }
    
    // Needs to register storage and claim tokens
    if (needsClaim && needsStorage && !needsRegistration) {
      return {
        status: 'storage_and_claim',
        message: 'Your account is registered but needs storage deposit and tokens.',
        step: 0,
        nextAction: 'Register Storage',
        nextFunction: handleRegisterStorage
      };
    }
    
    // Other unusual combinations
    return {
      status: 'custom',
      message: 'Please continue with the remaining steps below.',
      step: registrationStep
    };
  };

  // Get the onboarding status for use in the component
  const onboardingStatus = userChecked ? determineOnboardingStatus() : null;

  // Helper variables for the status panel
  const isWalletConnected = !!signedAccountId;
  const hasStorageDeposit = storageRegistered;
  const isUserRegistered = userRegistered;

  // Helper functions for the onboarding panel buttons
  const connectWallet = () => {
    if (modal) {
      modal.show();
    } else if (signIn) {
      signIn();
    }
  };

  const handleStorageDeposit = () => {
    handleRegisterStorage();
  };

  const setupAccount = () => {
    handleRegister();
  };

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
          
          // Check if user has received welcome tokens 
          await checkWelcomeTokensStatus();
          
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
          
          // Check if user has received welcome tokens
          await checkWelcomeTokensStatus();
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
        
        // If user has tokens, they must be registered
        if (displayBalance > 0) {
          console.log('User has positive balance, assuming registered:', displayBalance);
          setUserRegistered(true);
          setStorageRegistered(true);
          setRegistrationStep(2);
          
          // Save status to localStorage
          try {
            localStorage.setItem(`finowl_user_status_${signedAccountId}`, JSON.stringify({
              isRegistered: true,
              registrationStep: 2,
              tokenBalance: displayBalance,
              lastUpdated: new Date().getTime()
            }));
          } catch (storageError) {
            console.log('Error saving to localStorage:', storageError);
          }
        }
      }
      
      // Try to check if the user's registration step and free tokens claimed status
      try {
        const getUserData = async (retries = 2, delay = 1000) => {
          for (let attempt = 0; attempt <= retries; attempt++) {
            try {
              const userData = await viewFunction({
                contractId: process.env.NEXT_PUBLIC_CONTRACT_NAME || 'finowl.testnet',
                method: "get_user",
                args: { account_id: signedAccountId }
              });
              
              if (userData) {
                return userData;
              }
            } catch (err) {
              console.log(`Attempt ${attempt + 1}/${retries + 1} failed: ${err.message}`);
              if (attempt < retries) {
                console.log(`Waiting ${delay}ms before retry...`);
                await new Promise(resolve => setTimeout(resolve, delay));
                // Increase delay for exponential backoff
                delay *= 1.5;
              } else {
                throw err;
              }
            }
          }
          return null;
        };
        
        try {
          const userData = await getUserData();
          if (userData) {
            setRegistrationStep(userData.registration_step || 0);
            setFreeTokensClaimed(userData.free_tokens_claimed || false);
            
            // Save user data to localStorage
            try {
              localStorage.setItem(`finowl_user_data_${signedAccountId}`, JSON.stringify({
                registration_step: userData.registration_step || 0,
                free_tokens_claimed: userData.free_tokens_claimed || false,
                lastUpdated: new Date().getTime()
              }));
            } catch (storageError) {
              console.log('Error saving user data to localStorage:', storageError);
            }
          }
        } catch (userDataError) {
          console.error("Error getting user data:", userDataError);
          // Don't show an error to the user for this non-critical issue
          console.log("This is a non-critical error; the app will continue to function");
        }
      } catch (userDataError) {
        console.error("Error in user data retrieval flow:", userDataError);
        // If this fails, try to load from cache
        try {
          const cachedUserData = localStorage.getItem(`finowl_user_data_${signedAccountId}`);
          if (cachedUserData) {
            const parsed = JSON.parse(cachedUserData);
            console.log('Using cached user data:', parsed);
            setRegistrationStep(parsed.registration_step || 0);
            setFreeTokensClaimed(parsed.free_tokens_claimed || false);
          }
        } catch (cacheError) {
          console.log('Error reading cached user data:', cacheError);
        }
      }
      
      // Check specifically if welcome tokens were received - use our more resilient check
      await checkWelcomeTokensStatus();
      
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
      {/* Welcome Token Popup - shows when user is registered but hasn't claimed tokens */}
      {showWelcomeTokenPopup && (
        <div className="modal-overlay">
          <div className="modal-container">
            <div className="modal-header">
              <h2>Welcome to Finowl!</h2>
              <button 
                className="modal-close-button"
                onClick={() => setShowWelcomeTokenPopup(false)}
              >
                ×
              </button>
            </div>
            <div className="modal-content">
              <div className="welcome-tokens-message">
                <div className="welcome-tokens-icon">🎁</div>
                <h3>Claim Your Free Tokens</h3>
                <p>Your account is registered, but you haven't claimed your free welcome tokens yet.</p>
                <p>Claim them now to start using Finowl's AI services!</p>
              </div>
            </div>
            <div className="modal-footer">
              <button 
                className="secondary-button"
                onClick={() => setShowWelcomeTokenPopup(false)}
              >
                Later
              </button>
              <button 
                className="primary-button"
                onClick={handleClaimFreeTokens}
                disabled={loading}
              >
                {loading ? 'Claiming...' : 'Claim Free Tokens'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Onboarding Status Panel */}
      {signedAccountId && onboardingStatus && (
        <section className="section onboarding-status-section">
          <div className={`onboarding-status-panel ${onboardingStatus.status}`}>
            <div className="onboarding-status-content">
              <div className="onboarding-status-icon">
                {onboardingStatus.status === 'complete' ? '🎉' : '🚀'}
              </div>
              <div className="onboarding-status-message">
                <h2>
                  {onboardingStatus.status === 'complete' ? 'All Set!' : 
                   onboardingStatus.status === 'claim_only' ? 'Almost There!' : 
                   'Let\'s Get Started!'}
                </h2>
                <p>{onboardingStatus.message}</p>
                <div className="onboarding-progress">
                  <div className="progress-bar">
                    <div 
                      className="progress-fill" 
                      style={{ 
                        width: 
                          onboardingStatus.status === 'complete' ? '100%' : 
                          onboardingStatus.status === 'claim_only' ? '75%' : 
                          onboardingStatus.status === 'register_and_claim' || onboardingStatus.status === 'storage_and_claim' ? '50%' : 
                          '25%' 
                      }}
                    ></div>
                  </div>
                  <div className="progress-text">
                    {onboardingStatus.status === 'complete' ? 'Complete (100%)' : 
                     onboardingStatus.status === 'claim_only' ? 'Almost there (75%)' : 
                     onboardingStatus.status === 'register_and_claim' || onboardingStatus.status === 'storage_and_claim' ? 'In progress (50%)' : 
                     'Just starting (25%)'}
                  </div>
                </div>
              </div>
              {onboardingStatus.status !== 'complete' && onboardingStatus.nextFunction && (
                <button 
                  className="next-action-button"
                  onClick={onboardingStatus.nextFunction}
                  disabled={loading}
                >
                  {loading ? 'Processing...' : onboardingStatus.nextAction}
                </button>
              )}
            </div>
            <div className="onboarding-status-details">
              <div className={`status-item ${isWalletConnected ? 'completed' : 'pending'}`}>
                <div className="status-marker">{isWalletConnected ? '✓' : '1'}</div>
                <div className="status-label">Wallet Connected</div>
              </div>
              <div className={`status-item ${hasStorageDeposit ? 'completed' : 'pending'}`}>
                <div className="status-marker">{hasStorageDeposit ? '✓' : '2'}</div>
                <div className="status-label">Storage Deposit</div>
              </div>
              <div className={`status-item ${isUserRegistered ? 'completed' : 'pending'}`}>
                <div className="status-marker">{isUserRegistered ? '✓' : '3'}</div>
                <div className="status-label">Account Registered</div>
              </div>
              <div className={`status-item ${freeTokensClaimed ? 'completed' : 'pending'}`}>
                <div className="status-marker">{freeTokensClaimed ? '✓' : '4'}</div>
                <div className="status-label">Free Tokens Claimed</div>
              </div>
            </div>
          </div>
        </section>
      )}

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
      {signedAccountId && (
        <section className="section welcome-section">
          <div className="welcome-panel">
            <div className="welcome-content">
              <div className="welcome-icon">👋</div>
              <div className="welcome-text">
                <h1>Welcome to Finowl, {signedAccountId.split('.')[0]}!</h1>
                {registrationStep === 2 ? (
                  <>
                    <p>Your current token balance: <span className="token-highlight">{tokenBalance}</span></p>
                    {foundInUserList && (
                      <div className="verification-note">
                        <span className="verification-badge">✓</span> Account verified from registered user list
                      </div>
                    )}
                    {!freeTokensClaimed && (
                      <div className="token-warning">
                        <button 
                          className="claim-tokens-button"
                          onClick={handleClaimFreeTokens}
                          disabled={loading}
                        >
                          {loading ? 'Claiming...' : '🎁 Claim Free Tokens'}
                        </button>
                      </div>
                    )}
                  </>
                ) : (
                  <p>Complete the onboarding steps below to access all features.</p>
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