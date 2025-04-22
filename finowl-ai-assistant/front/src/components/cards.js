import Link from 'next/link';
import { useState, useEffect } from 'react';
import styles from '@/styles/app.module.css';
import { useWalletSelector } from '@near-wallet-selector/react-hook';

export const Cards = () => {
  const { signedAccountId, viewFunction, callFunction, modal, signIn } = useWalletSelector();
  const [conversationId, setConversationId] = useState('');
  const [conversations, setConversations] = useState([]);
  const [conversationHistory, setConversationHistory] = useState([]);
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
  const [buyAmount, setBuyAmount] = useState(10); // Default amount of tokens to buy
  
  // Store message state
  const [messageRole, setMessageRole] = useState('user');
  const [messageContent, setMessageContent] = useState('');
  const [storeMessageConvId, setStoreMessageConvId] = useState('');

  // Add tokens state
  const [addTokensConvId, setAddTokensConvId] = useState('');
  const [tokenAmount, setTokenAmount] = useState(5); // Default to 5 tokens
  
  // User list state
  const [userList, setUserList] = useState([]);
  const [showUserList, setShowUserList] = useState(false);

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

  // Placeholder functions for API calls
  const handleUserAction = (action) => {
    console.log(`${action} action triggered`);
    
    // Map actions to actual handlers
    switch(action) {
      case 'Register':
        handleRegister();
        break;
      case 'Register Storage':
        handleRegisterStorage();
        break;
      case 'Check User Status':
        checkUserStatusViewOnly();
        break;
      case 'Grant Free Tokens':
        handleClaimFreeTokens();
        break;
      case 'Get Balance':
        checkTokenBalance();
        break;
      case 'List All Users':
        handleListAllUsers();
        break;
      case 'Grant Paid Tokens':
        handleGrantPaidTokens();
        break;
      case 'Refund Tokens':
        // Implementation needed
        console.log('Refund Tokens action triggered');
        break;
      case 'Get Conversation Metadata':
        // Implementation needed
        console.log('Get Conversation Metadata action triggered');
        break;
      case 'Deduct Tokens':
        // Implementation needed
        console.log('Deduct Tokens action triggered');
        break;
      default:
        console.log(`No implementation for action: ${action}`);
    }
  };

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
      setLoading(true);
      
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
      await checkTokenBalance();
      
      alert(`Successfully purchased ${grantedAmount} tokens! Your balance has been updated.`);
    } catch (error) {
      console.error('Error buying tokens:', error);
      alert(`Failed to purchase tokens: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Handle list all users
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

  const handleListConversations = async () => {
    try {
      if (!signedAccountId) {
        console.log('Please connect your wallet first');
        // Check if modal exists before showing it
        if (modal) {
          modal.show();
        } else if (signIn) {
          // Fallback to direct signIn if modal is not available
          signIn();
        } else {
          console.log('Please sign in to view conversations');
        }
        return;
      }

      setLoading(true);
      // Try to get conversations using view method first
      try {
        const result = await viewFunction({
          contractId: process.env.NEXT_PUBLIC_CONTRACT_NAME || 'finowl.testnet',
          method: "view_js_func",
          args: {
            function_name: "get_user_conversations",
            account_id: signedAccountId
          }
        });
        console.log('Conversations list (view method):', result);
        setConversations(result);
      } catch (viewError) {
        console.log('View method failed, trying call method:', viewError);
        
        // If view method fails, try with call method
        const result = await callFunction({
          contractId: process.env.NEXT_PUBLIC_CONTRACT_NAME || 'finowl.testnet',
          method: "view_js_func",
          args: {
            function_name: "get_user_conversations",
            account_id: signedAccountId
          }
        });
        console.log('Conversations list (call method):', result);
        setConversations(result);
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGetConversationHistory = async () => {
    if (!conversationId) {
      console.log('Please enter a conversation ID');
      return;
    }

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
      // Try to get conversation history using view method
      try {
        const result = await viewFunction({
          contractId: process.env.NEXT_PUBLIC_CONTRACT_NAME || 'finowl.testnet',
          method: "view_js_func",
          args: {
            function_name: "get_conversation_history",
            conversation_id: conversationId
          }
        });
        console.log('Conversation history (view method):', result);
        setConversationHistory(result);
      } catch (viewError) {
        console.log('View method failed, trying call method:', viewError);
        
        // If view method fails, try with call method
        const result = await callFunction({
          contractId: process.env.NEXT_PUBLIC_CONTRACT_NAME || 'finowl.testnet',
          method: "view_js_func",
          args: {
            function_name: "get_conversation_history",
            conversation_id: conversationId
          }
        });
        console.log('Conversation history (call method):', result);
        setConversationHistory(result);
      }
    } catch (error) {
      console.error('Error fetching conversation history:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStoreMessage = async () => {
    if (!storeMessageConvId) {
      console.log('Please enter a conversation ID');
      return;
    }

    if (!messageContent) {
      console.log('Please enter message content');
      return;
    }

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
      // Store message needs to be a call method since it modifies state
      const result = await callFunction({
        contractId: process.env.NEXT_PUBLIC_CONTRACT_NAME || 'finowl.testnet',
        method: "call_js_func",
        args: {
          function_name: "store_message",
          conversation_id: storeMessageConvId,
          role: messageRole,
          content: messageContent
        }
      });
      
      console.log('Message stored successfully:', result);
      // Clear the message content after successful storage
      setMessageContent('');
      
      // If the conversation ID matches the currently viewed one,
      // refresh the conversation history to show the new message
      if (storeMessageConvId === conversationId) {
        handleGetConversationHistory();
      }
      
      // Refresh token balance since storing a message may consume tokens
      await checkTokenBalance();
    } catch (error) {
      console.error('Error storing message:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTokensToConversation = async () => {
    if (!addTokensConvId) {
      console.log('Please enter a conversation ID');
      return;
    }

    if (tokenAmount <= 0) {
      console.log('Please enter a valid token amount');
      return;
    }

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
      // Convert UI token amount (e.g., 5) to internal representation (e.g., 5000000)
      // Multiplying by 1,000,000 to match the contract's internal representation
      const internalAmount = (tokenAmount * 1000000).toString();
      
      const result = await callFunction({
        contractId: process.env.NEXT_PUBLIC_CONTRACT_NAME || 'finowl.testnet',
        method: "call_js_func",
        args: {
          function_name: "add_tokens_to_conversation",
          conversation_id: addTokensConvId,
          amount: internalAmount
        }
      });
      
      console.log('Tokens added successfully:', result);
      // Clear the token amount after successful addition
      setTokenAmount(5); // Reset to default 5 tokens
      
      // Refresh token balance since tokens were transferred
      await checkTokenBalance();
      
      alert(`Successfully added ${tokenAmount} tokens to conversation!`);
    } catch (error) {
      console.error('Error adding tokens to conversation:', error);
      alert(`Error adding tokens: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleStartConversation = async () => {
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
      
      // Generate a conversation ID using the account ID and current timestamp
      const timestamp = Math.floor(Date.now() / 1000);
      const generatedConversationId = `${signedAccountId}_${timestamp}`;
      
      // Reserve amount is 10 tokens (10 * 1000000 internal units)
      const reserveAmount = "10000000";
      
      const result = await callFunction({
        contractId: process.env.NEXT_PUBLIC_CONTRACT_NAME || 'finowl.testnet',
        method: "call_js_func",
        args: {
          function_name: "start_ai_conversation",
          conversation_id: generatedConversationId,
          reserve_amount: reserveAmount
        }
      });
      
      console.log('Conversation started successfully:', result);
      console.log('New conversation ID:', generatedConversationId);
      
      // Auto-fill the conversation ID fields
      setConversationId(generatedConversationId);
      setStoreMessageConvId(generatedConversationId);
      setAddTokensConvId(generatedConversationId);
      
      // Show success message
      alert(`Successfully started new conversation: ${generatedConversationId}`);
      
      // Refresh the conversation list
      handleListConversations();
      
      // Refresh token balance since we just spent tokens
      await checkTokenBalance();
    } catch (error) {
      console.error('Error starting conversation:', error);
      alert(`Error starting conversation: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyConversationId = (id) => {
    setConversationId(id);
    setStoreMessageConvId(id);
    setAddTokensConvId(id);
    console.log(`Copied conversation ID: ${id}`);
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
    <div className="main-container">
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
                  onClick={() => handleUserAction('Grant Free Tokens')}
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
                <button 
                  className="primary-button" 
                  onClick={() => handleUserAction('Grant Paid Tokens')}
                  disabled={loading || registrationStep < 2}
                >
                  💳 Buy Tokens
                </button>
                <button 
                  className="primary-button" 
                  onClick={() => handleUserAction('Refund Tokens')}
                  disabled={loading || registrationStep < 2}
                >
                  ↩️ Refund Tokens
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

      {/* Show the rest of the UI only if user is fully registered */}
      {registrationStep === 2 && (
        <>
          {/* Section 2: Conversation Management */}
          <section className="section">
            <h1 className="section-title">Conversation Management</h1>
            <div className="two-column-layout">
              <div className="left-column">
                <div className="panel-container">
                  {/* Start Conversation Panel */}
                  <div className="panel">
                    <h2 className="panel-title">Start & View Conversations</h2>
                    <div className="start-conversation-container">
                      <button 
                        onClick={handleStartConversation} 
                        disabled={loading || !signedAccountId}
                        className="start-conversation-button"
                      >
                        {loading ? 'Starting...' : '➕ Start New Conversation'}
                      </button>
                      <div className="start-conversation-hint">
                        Creates a new conversation with 10 tokens reserved
                      </div>
                    </div>

                    <button 
                      onClick={handleListConversations} 
                      disabled={loading}
                      className="feature-button"
                    >
                      {loading ? 'Loading...' : '📋 List Conversations'}
                    </button>
                    
                    <div className="conversation-id-input">
                      <input
                        type="text"
                        value={conversationId}
                        onChange={(e) => setConversationId(e.target.value)}
                        placeholder="Enter conversation ID"
                      />
                      <button 
                        onClick={handleGetConversationHistory} 
                        disabled={loading}
                        className="accent-button"
                      >
                        {loading ? 'Loading...' : 'View History'}
                      </button>
                    </div>
                  </div>

                  {/* Store Message Panel */}
                  <div className="panel">
                    <h2 className="panel-title">Store Message</h2>
                    <div className="input-group">
                      <label>Conversation ID</label>
                      <input
                        type="text"
                        value={storeMessageConvId}
                        onChange={(e) => setStoreMessageConvId(e.target.value)}
                        placeholder="Conversation ID"
                      />
                    </div>
                    
                    <div className="input-group">
                      <label>Role</label>
                      <select 
                        value={messageRole}
                        onChange={(e) => setMessageRole(e.target.value)}
                      >
                        <option value="user">User</option>
                        <option value="assistant">Assistant</option>
                        <option value="system">System</option>
                      </select>
                    </div>
                    
                    <div className="input-group">
                      <label>Message Content</label>
                      <textarea
                        value={messageContent}
                        onChange={(e) => setMessageContent(e.target.value)}
                        placeholder="Type your message here..."
                        rows={5}
                      />
                    </div>
                    
                    <button 
                      onClick={handleStoreMessage} 
                      disabled={loading || !storeMessageConvId || !messageContent}
                      className="accent-button full-width"
                    >
                      {loading ? 'Storing...' : '💾 Store Message'}
                    </button>
                  </div>
                </div>
              </div>

              <div className="right-column">
                <div className="panel-container">
                  {/* Add Tokens Panel */}
                  <div className="panel" id="add-tokens-section">
                    <h2 className="panel-title">Add Tokens to Conversation</h2>
                    <div className="input-group">
                      <label>Conversation ID</label>
                      <input
                        type="text"
                        value={addTokensConvId}
                        onChange={(e) => setAddTokensConvId(e.target.value)}
                        placeholder="Conversation ID"
                      />
                    </div>
                    
                    <div className="input-group">
                      <label>Token Amount</label>
                      <div className="token-amount-container">
                        <input
                          type="number"
                          min="1"
                          value={tokenAmount}
                          onChange={(e) => setTokenAmount(Number(e.target.value))}
                          className="token-amount-input"
                        />
                        <span className="token-hint">
                          Sends as {tokenAmount * 1000000} internal units
                        </span>
                      </div>
                    </div>
                    
                    <button 
                      onClick={handleAddTokensToConversation} 
                      disabled={loading || !addTokensConvId || tokenAmount <= 0}
                      className="accent-button full-width"
                    >
                      {loading ? 'Adding...' : '💰 Add Tokens'}
                    </button>
                  </div>

                  {/* Other Actions Panel */}
                  <div className="panel">
                    <h2 className="panel-title">Other Actions</h2>
                    <p className="panel-description">
                      Additional conversation management options.
                    </p>
                    <div className="button-grid">
                      <button className="feature-button" onClick={() => handleUserAction('Get Conversation Metadata')}>
                        📊 View Metadata
                      </button>
                      
                      <button className="feature-button" onClick={() => handleUserAction('Check User Status')}>
                        👤 Check Status
                      </button>
                      
                      <button className="feature-button" onClick={() => handleUserAction('Deduct Tokens')}>
                        📉 Deduct Tokens
                      </button>
                      
                      <button className="feature-button" onClick={() => handleUserAction('List All Users')}>
                        👥 List Users
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Section 3: Conversation Results */}
          <section className="section">
            <h1 className="section-title">Conversation Results</h1>
            <div className="two-column-layout">
              <div className="left-column">
                {/* Display Conversations */}
                {conversations.length > 0 ? (
                  <div className="results-panel">
                    <h2 className="panel-title">Your Conversations</h2>
                    <ul className="conversation-list">
                      {conversations.map((convId, index) => (
                        <li key={index}>
                          <span className="conversation-id">{convId}</span>
                          <button 
                            className="copy-btn" 
                            onClick={() => handleCopyConversationId(convId)}
                          >
                            Use
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <div className="results-panel empty-state">
                    <h2 className="panel-title">No Conversations</h2>
                    <p>You don't have any conversations yet. Start a new conversation to begin.</p>
                    <div className="empty-icon">💬</div>
                  </div>
                )}
              </div>

              <div className="right-column">
                {/* Display Conversation History */}
                {conversationHistory.length > 0 ? (
                  <div className="results-panel">
                    <h2 className="panel-title">Conversation History</h2>
                    <div className="history-container">
                      {conversationHistory.map((message, index) => (
                        <div key={index} className={`message ${message.role}`}>
                          <div className="message-header">
                            <strong>{message.role}</strong>
                            <span className="timestamp">
                              {new Date(message.timestamp / 1000000).toLocaleString()}
                            </span>
                          </div>
                          <div className="message-content">{message.content}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="results-panel empty-state">
                    <h2 className="panel-title">No Message History</h2>
                    <p>Enter a conversation ID and click "View History" to see the message history.</p>
                    <div className="empty-icon">📝</div>
                  </div>
                )}
              </div>
            </div>
          </section>
        </>
      )}
      {registrationStep < 2 && signedAccountId && userChecked && (
        <section className="section">
          <div className="register-prompt">
            <h2>Complete Registration to Continue</h2>
            <p>Please complete both registration steps to access Finowl's conversation features.</p>
          </div>
        </section>
      )}

      {/* Section 4: Token Balance Details */}
      {registrationStep === 2 && (
        <section className="section">
          <h1 className="section-title">Token Balance Details</h1>
          <div className="panel balance-panel">
            <h2 className="panel-title">User Balance Details</h2>
            <div className="balance-details">
              <div className="balance-card">
                <div className="balance-card-header">
                  <div className="balance-title">
                    <span className="balance-icon">💰</span>
                    <span>Current Token Balance</span>
                  </div>
                  <button 
                    className="refresh-balance-button"
                    onClick={refreshTokenBalance}
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
                    className="balance-action-button primary"
                    onClick={() => handleUserAction('Grant Free Tokens')}
                    disabled={loading || freeTokensClaimed}
                  >
                    {freeTokensClaimed ? '✓ Tokens Claimed' : '🎁 Get Free Tokens'}
                  </button>
                  <button 
                    className="balance-action-button"
                    onClick={() => handleUserAction('Grant Paid Tokens')}
                    disabled={loading}
                  >
                    💳 Buy Tokens
                  </button>
                </div>
              </div>

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
                  
                  <h3 className="token-ops-title">Token Operations</h3>
                  <div className="token-operations">
                    <button 
                      className="token-operation-button"
                      onClick={handleStartConversation}
                      disabled={loading}
                    >
                      ➕ Start New Conversation
                    </button>
                    <button 
                      className="token-operation-button"
                      onClick={() => {
                        if (conversationId) {
                          setAddTokensConvId(conversationId);
                          document.getElementById('add-tokens-section').scrollIntoView({ behavior: 'smooth' });
                        } else {
                          alert('Please select a conversation first from the Conversations section');
                        }
                      }}
                      disabled={!conversationId}
                    >
                      💰 Add Tokens to Current Conversation
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* User List Modal */}
      {showUserList && (
        <div className="modal-overlay">
          <div className="modal-container">
            <div className="modal-header">
              <h2>Registered Users</h2>
              <button 
                className="modal-close-button"
                onClick={() => setShowUserList(false)}
              >
                ×
              </button>
            </div>
            <div className="modal-content">
              {userList.length > 0 ? (
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
                  <p>No registered users found.</p>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button 
                className="secondary-button"
                onClick={() => setShowUserList(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .main-container {
          display: flex;
          flex-direction: column;
          width: 100%;
          max-width: 1400px;
          margin: 0 auto;
          gap: 30px;
        }

        /* Welcome section styles */
        .welcome-section {
          margin-bottom: -10px;
        }

        /* Registration Banner styles */
        .register-banner-section {
          margin-bottom: -10px;
        }

        .register-banner {
          background: linear-gradient(135deg, #ed8936 0%, #dd6b20 100%);
          color: white;
          padding: 16px 25px;
          border-radius: 10px;
          box-shadow: 0 8px 30px rgba(0, 0, 0, 0.15);
          display: flex;
          align-items: center;
          animation: pulseAttention 2s infinite;
        }

        @keyframes pulseAttention {
          0% {
            box-shadow: 0 0 0 0 rgba(237, 137, 54, 0.4);
          }
          70% {
            box-shadow: 0 0 0 10px rgba(237, 137, 54, 0);
          }
          100% {
            box-shadow: 0 0 0 0 rgba(237, 137, 54, 0);
          }
        }

        .register-banner-icon {
          font-size: 2rem;
          margin-right: 20px;
          background: rgba(255, 255, 255, 0.2);
          width: 50px;
          height: 50px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
        }

        .register-banner-content {
          flex: 1;
        }

        .register-banner-content h2 {
          margin: 0;
          font-size: 1.4rem;
          font-weight: 600;
        }

        .register-banner-content p {
          margin: 5px 0 0 0;
          opacity: 0.9;
          font-size: 1rem;
        }

        .register-banner-button {
          background: rgba(0, 0, 0, 0.2);
          color: white;
          border: none;
          border-radius: 6px;
          padding: 10px 18px;
          font-weight: 600;
          font-size: 1rem;
          cursor: pointer;
          transition: all 0.2s ease;
          white-space: nowrap;
          margin-left: 20px;
        }

        .register-banner-button:hover {
          background: rgba(0, 0, 0, 0.3);
          transform: translateY(-2px);
        }

        .register-banner-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .welcome-panel {
          background: linear-gradient(135deg, #4c51bf 0%, #6b46c1 100%);
          color: #ffffff;
          padding: 20px;
          border-radius: 10px;
          box-shadow: 0 8px 30px rgba(0, 0, 0, 0.2);
          overflow: hidden;
          position: relative;
          animation: slideIn 0.5s ease-out forwards;
        }

        @keyframes slideIn {
          0% {
            transform: translateY(-20px);
            opacity: 0;
          }
          100% {
            transform: translateY(0);
            opacity: 1;
          }
        }

        .welcome-panel::before {
          content: '';
          position: absolute;
          top: -10px;
          right: -10px;
          width: 120px;
          height: 120px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.1);
          z-index: 0;
        }

        .welcome-content {
          display: flex;
          align-items: center;
          position: relative;
          z-index: 1;
        }

        .welcome-icon {
          font-size: 2.5rem;
          margin-right: 20px;
          background: rgba(255, 255, 255, 0.2);
          width: 60px;
          height: 60px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
        }

        .welcome-text {
          flex: 1;
        }

        .welcome-text h1 {
          margin: 0 0 5px 0;
          font-size: 1.8rem;
          font-weight: 700;
          color: white;
        }

        .welcome-text p {
          margin: 0;
          font-size: 1.1rem;
          opacity: 0.9;
        }

        .token-highlight {
          font-weight: bold;
          color: #a3bffa;
          padding: 2px 8px;
          background: rgba(0, 0, 0, 0.2);
          border-radius: 4px;
          margin-left: 5px;
        }

        .verification-note {
          font-size: 0.85rem;
          margin-top: 10px;
          background: rgba(72, 187, 120, 0.1);
          padding: 6px 10px;
          border-radius: 4px;
          display: inline-flex;
          align-items: center;
          color: #9ae6b4;
        }

        .verification-badge {
          background: rgba(72, 187, 120, 0.3);
          color: #48bb78;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.7rem;
          font-weight: bold;
          margin-right: 6px;
        }

        .refresh-button {
          background: rgba(255, 255, 255, 0.2);
          color: white;
          border: none;
          width: 36px;
          height: 36px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.2rem;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .refresh-button:hover {
          background: rgba(255, 255, 255, 0.3);
          transform: rotate(180deg);
        }

        .refresh-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .welcome-check {
          margin-bottom: -10px;
        }

        .quick-check-panel {
          background-color: #2d3748;
          color: #ffffff;
          padding: 20px;
          border-radius: 8px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }

        .quick-check-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 15px;
          border-bottom: 1px solid #4a5568;
          padding-bottom: 10px;
        }

        .quick-check-header h2 {
          color: #63b3ed;
          margin: 0;
          font-size: 1.4rem;
        }

        .check-button {
          padding: 8px 16px;
        }

        .quick-status {
          display: flex;
          align-items: center;
          gap: 20px;
          padding: 15px;
          background-color: #1a202c;
          border-radius: 6px;
          min-height: 80px;
        }

        .status-icon {
          width: 50px;
          height: 50px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 28px;
          flex-shrink: 0;
        }

        .status-icon.success {
          background-color: rgba(72, 187, 120, 0.2);
          color: #48bb78;
        }

        .status-icon.warning {
          background-color: rgba(237, 137, 54, 0.2);
          color: #ed8936;
        }

        .status-icon.error {
          background-color: rgba(229, 62, 62, 0.2);
          color: #e53e3e;
          font-weight: bold;
        }

        .status-info {
          flex: 1;
        }

        .status-message {
          margin: 0 0 5px 0;
          font-size: 1.1rem;
          font-weight: 500;
        }

        .status-detail {
          margin: 0;
          color: #a0aec0;
          font-size: 0.9rem;
        }

        .loading-container {
          width: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 10px;
        }

        .section {
          display: flex;
          flex-direction: column;
          gap: 15px;
          width: 100%;
        }

        .section-title {
          font-size: 1.8rem;
          color: #90cdf4;
          margin: 0;
          padding-bottom: 5px;
          border-bottom: 2px solid #4a5568;
        }

        .two-column-layout {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          width: 100%;
        }

        .left-column, .right-column {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .panel-container {
          display: flex;
          flex-direction: column;
          gap: 20px;
          width: 100%;
        }

        .panel {
          background-color: #2d3748;
          color: #ffffff;
          padding: 20px;
          border-radius: 8px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          display: flex;
          flex-direction: column;
          gap: 15px;
          height: 100%;
        }

        .panel-title {
          color: #63b3ed;
          margin: 0 0 10px 0;
          font-size: 1.4rem;
          border-bottom: 1px solid #4a5568;
          padding-bottom: 10px;
        }

        .panel-description {
          color: #e2e8f0;
          margin: 0 0 15px 0;
          font-size: 0.95rem;
        }

        .empty-state {
          text-align: center;
          padding: 40px 20px;
          height: 100%;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
        }

        .empty-icon {
          font-size: 4rem;
          margin: 20px 0;
          opacity: 0.5;
        }

        .empty-state p {
          color: #a0aec0;
          margin-bottom: 20px;
        }

        .input-group {
          display: flex;
          flex-direction: column;
          gap: 5px;
        }

        .input-group label {
          font-size: 0.9rem;
          color: #a0aec0;
        }

        input, select, textarea {
          padding: 10px;
          border-radius: 4px;
          border: none;
          background-color: #1a202c;
          color: white;
          font-size: 0.95rem;
        }

        textarea {
          resize: vertical;
          font-family: inherit;
        }

        button {
          padding: 10px 16px;
          border: none;
          border-radius: 6px;
          background-color: #4299e1;
          color: white;
          cursor: pointer;
          transition: all 0.2s;
          font-size: 0.9rem;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 5px;
        }
        
        button:hover {
          background-color: #3182ce;
          transform: translateY(-1px);
        }

        button:disabled {
          background-color: #718096;
          cursor: not-allowed;
          transform: none;
          opacity: 0.7;
        }

        .primary-button {
          background-color: #4c51bf;
          font-weight: 500;
          font-size: 1rem;
          padding: 12px 16px;
        }

        .primary-button:hover:not(:disabled) {
          background-color: #434190;
        }

        .feature-button {
          background-color: #4299e1;
          font-weight: 500;
        }

        .accent-button {
          background-color: #38a169;
          font-weight: 500;
        }

        .accent-button:hover:not(:disabled) {
          background-color: #2f855a;
        }

        .full-width {
          width: 100%;
        }

        .start-conversation-container {
          display: flex;
          flex-direction: column;
          gap: 5px;
        }

        .start-conversation-button {
          background-color: #805ad5;
          padding: 12px;
          font-size: 1rem;
          font-weight: bold;
        }

        .start-conversation-button:hover:not(:disabled) {
          background-color: #6b46c1;
        }

        .start-conversation-hint {
          font-size: 0.8rem;
          color: #a0aec0;
          text-align: center;
        }

        .conversation-id-input {
          display: flex;
          gap: 5px;
        }

        .conversation-id-input input {
          flex: 1;
        }

        .token-amount-container {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 10px;
        }

        .token-amount-input {
          width: 100px;
        }

        .token-hint {
          color: #a0aec0;
          font-size: 0.8rem;
        }

        .button-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
        }

        .results-panel {
          background-color: #2d3748;
          color: #ffffff;
          padding: 20px;
          border-radius: 8px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          width: 100%;
          height: 100%;
        }

        .conversation-list {
          width: 100%;
          padding: 0;
          margin: 0;
          list-style: none;
          display: grid;
          grid-template-columns: 1fr;
          gap: 10px;
          max-height: 300px;
          overflow-y: auto;
        }

        .conversation-list li {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px;
          background-color: #1a202c;
          border-radius: 6px;
          font-family: monospace;
          word-break: break-all;
        }

        .conversation-id {
          font-size: 0.9rem;
          color: #e2e8f0;
        }

        .copy-btn {
          padding: 5px 12px;
          margin-left: 8px;
          font-size: 0.8rem;
          background-color: #38a169;
          white-space: nowrap;
        }

        .history-container {
          width: 100%;
          max-height: 500px;
          overflow-y: auto;
          padding: 10px;
          background-color: #1a202c;
          border-radius: 6px;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .message {
          padding: 15px;
          border-radius: 8px;
          position: relative;
          max-width: 85%;
        }

        .message.user {
          background-color: #2d3748;
          text-align: right;
          align-self: flex-end;
          border-bottom-right-radius: 0;
        }

        .message.assistant {
          background-color: #4a5568;
          text-align: left;
          align-self: flex-start;
          border-bottom-left-radius: 0;
        }

        .message.system {
          background-color: #553c9a;
          text-align: center;
          font-style: italic;
          align-self: center;
          max-width: 95%;
        }

        .message-header {
          display: flex;
          justify-content: space-between;
          margin-bottom: 8px;
          font-size: 0.8rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          padding-bottom: 5px;
        }

        .timestamp {
          color: #a0aec0;
        }

        .message-content {
          white-space: pre-wrap;
          word-break: break-word;
          line-height: 1.5;
        }

        @media (max-width: 900px) {
          .two-column-layout {
            grid-template-columns: 1fr;
          }
          
          .button-grid {
            grid-template-columns: 1fr;
          }
          
          .register-banner {
            flex-direction: column;
            text-align: center;
            padding: 20px;
          }
          
          .register-banner-icon {
            margin-right: 0;
            margin-bottom: 15px;
          }
          
          .register-banner-button {
            margin-left: 0;
            margin-top: 15px;
            width: 100%;
          }
          
          .welcome-content {
            flex-direction: column;
            text-align: center;
          }
          
          .welcome-icon {
            margin-right: 0;
            margin-bottom: 15px;
          }
          
          .refresh-button {
            margin-top: 15px;
          }
        }

        .status-container {
          display: flex;
          flex-direction: column;
          gap: 15px;
          align-items: center;
          justify-content: center;
          text-align: center;
          min-height: 180px;
        }

        .status-success {
          color: #48bb78;
          font-size: 1.2rem;
          font-weight: bold;
        }

        .status-warning {
          color: #ed8936;
          font-size: 1.2rem;
          font-weight: bold;
        }

        .secondary-button {
          background-color: #718096;
          font-weight: 500;
        }

        .secondary-button:hover:not(:disabled) {
          background-color: #4a5568;
        }

        .loading-spinner {
          width: 30px;
          height: 30px;
          border: 3px solid rgba(99, 179, 237, 0.3);
          border-radius: 50%;
          border-top-color: #63b3ed;
          animation: spin 1s ease-in-out infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .register-prompt {
          background-color: #2d3748;
          color: #ffffff;
          padding: 30px;
          border-radius: 8px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          text-align: center;
          border-left: 5px solid #ed8936;
        }

        .register-prompt h2 {
          color: #ed8936;
          margin: 0 0 15px 0;
        }

        .register-prompt p {
          color: #e2e8f0;
          margin: 0;
          font-size: 1.1rem;
        }

        .registration-steps {
          width: 100%;
          display: flex;
          flex-direction: column;
          gap: 15px;
          margin: 10px 0 20px 0;
        }

        .step {
          display: flex;
          align-items: center;
          gap: 15px;
          padding: 15px;
          border-radius: 6px;
          transition: all 0.3s ease;
          position: relative;
          justify-content: space-between;
        }
        
        .step.disabled {
          opacity: 0.6;
          background-color: #1a202c;
          border: 1px dashed #4a5568;
        }

        .step-button {
          padding: 8px 12px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          transition: all 0.2s;
          font-size: 0.85rem;
          font-weight: 500;
        }

        .step-button.pending {
          background-color: #4299e1;
          color: white;
        }

        .step-button.completed {
          background-color: #48bb78;
          color: white;
        }

        .step-button.pending:hover:not(:disabled) {
          background-color: #3182ce;
        }

        .step-button.completed:hover:not(:disabled) {
          background-color: #38a169;
        }

        .step-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .step-number {
          width: 30px;
          height: 30px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
        }

        .step-details {
          display: flex;
          flex-direction: column;
        }

        .step-title {
          font-weight: 500;
        }

        .step-status {
          font-size: 0.8rem;
          color: #a0aec0;
        }

        .step-note {
          margin-top: 15px;
          padding: 10px;
          background-color: rgba(237, 137, 54, 0.1);
          border-radius: 4px;
          font-size: 0.9rem;
          color: #ed8936;
        }

        .token-note {
          margin-top: 15px;
          padding: 10px;
          background-color: rgba(66, 153, 225, 0.1);
          border-radius: 4px;
          font-size: 0.9rem;
          color: #63b3ed;
          text-align: center;
        }

        .token-balance-card {
          display: flex;
          align-items: center;
          padding: 10px 15px;
          background-color: rgba(72, 187, 120, 0.1);
          border-radius: 6px;
          margin-bottom: 15px;
          gap: 10px;
        }

        .balance-label {
          color: #a0aec0;
          font-size: 0.9rem;
        }

        .balance-value {
          color: #48bb78;
          font-size: 1.2rem;
          font-weight: bold;
        }

        .setup-complete {
          margin: 10px 0;
          padding: 15px;
          background-color: rgba(72, 187, 120, 0.1);
          border-radius: 6px;
        }

        .token-balance {
          display: flex;
          align-items: center;
          gap: 10px;
          justify-content: center;
          margin-top: 10px;
        }

        .small-button {
          padding: 5px 10px;
          font-size: 0.8rem;
          margin-left: auto;
        }

        .advanced-options {
          margin-top: 10px;
          padding-top: 10px;
          border-top: 1px dashed rgba(255, 255, 255, 0.1);
          font-size: 0.85rem;
        }

        .text-button {
          background: transparent;
          border: none;
          color: #a0aec0;
          padding: 5px 10px;
          text-decoration: underline;
          font-size: 0.85rem;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .text-button:hover {
          color: #e2e8f0;
          transform: none;
          background: transparent;
        }

        /* Modal styles */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-color: rgba(0, 0, 0, 0.75);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 1000;
          animation: fadeIn 0.3s ease-out;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .modal-container {
          background-color: #2d3748;
          border-radius: 8px;
          width: 90%;
          max-width: 600px;
          max-height: 80vh;
          box-shadow: 0 15px 30px rgba(0, 0, 0, 0.3);
          display: flex;
          flex-direction: column;
          animation: slideUp 0.3s ease-out;
        }

        @keyframes slideUp {
          from { transform: translateY(30px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 15px 20px;
          border-bottom: 1px solid #4a5568;
        }

        .modal-header h2 {
          margin: 0;
          color: #63b3ed;
          font-size: 1.4rem;
        }

        .modal-close-button {
          background: transparent;
          border: none;
          color: #a0aec0;
          font-size: 1.8rem;
          cursor: pointer;
          line-height: 1;
          padding: 0;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          transition: all 0.2s ease;
        }

        .modal-close-button:hover {
          background-color: rgba(255, 255, 255, 0.1);
          color: white;
          transform: none;
        }

        .modal-content {
          padding: 20px;
          overflow-y: auto;
          flex: 1;
        }

        .modal-footer {
          padding: 15px 20px;
          border-top: 1px solid #4a5568;
          display: flex;
          justify-content: flex-end;
        }

        .user-list-intro {
          margin: 0 0 15px 0;
          color: #e2e8f0;
        }

        .user-account-list {
          list-style: none;
          padding: 0;
          margin: 0;
          max-height: 300px;
          overflow-y: auto;
        }

        .user-item {
          padding: 12px 15px;
          background-color: #1a202c;
          border-radius: 6px;
          margin-bottom: 8px;
          font-family: monospace;
          word-break: break-all;
        }

        .user-account-id {
          color: #e2e8f0;
          font-size: 0.95rem;
        }

        .network-warning {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px;
          background-color: rgba(237, 137, 54, 0.1);
          border-radius: 6px;
          margin-bottom: 15px;
        }
        
        .status-icon.warning {
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
        }
        
        .status-message {
          margin: 0 0 5px 0;
          color: #ed892e;
        }
        
        .status-detail {
          margin: 0;
          font-size: 0.85rem;
          color: #777;
        }

        /* Token Balance Details Styles */
        .balance-panel {
          background: linear-gradient(135deg, #2d3748 0%, #1a202c 100%);
        }
        
        .balance-details {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
        }
        
        .balance-card {
          background-color: #2d3748;
          border-radius: 10px;
          padding: 20px;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
          display: flex;
          flex-direction: column;
          gap: 15px;
          border: 1px solid #4a5568;
        }
        
        .balance-card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        
        .balance-title {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 1.1rem;
          font-weight: 500;
        }
        
        .balance-icon {
          font-size: 1.4rem;
        }
        
        .refresh-balance-button {
          background-color: transparent;
          border: 1px solid #4a5568;
          color: #a0aec0;
          padding: 6px 12px;
          border-radius: 6px;
          font-size: 0.8rem;
        }
        
        .refresh-balance-button:hover:not(:disabled) {
          background-color: rgba(255, 255, 255, 0.05);
          color: #e2e8f0;
          transform: none;
        }
        
        .balance-amount {
          font-size: 3rem;
          font-weight: bold;
          color: #48bb78;
          display: flex;
          align-items: baseline;
          gap: 8px;
        }
        
        .balance-label {
          font-size: 1rem;
          color: #a0aec0;
          font-weight: normal;
        }
        
        .balance-details-row {
          display: flex;
          flex-direction: column;
          gap: 8px;
          background-color: rgba(0, 0, 0, 0.2);
          border-radius: J6px;
          padding: 10px;
        }
        
        .balance-detail-item {
          display: flex;
          justify-content: space-between;
          font-size: 0.9rem;
        }
        
        .detail-label {
          color: #a0aec0;
        }
        
        .detail-value {
          color: #e2e8f0;
          font-family: monospace;
        }
        
        .balance-actions {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
          margin-top: 5px;
        }
        
        .balance-action-button {
          padding: 10px;
          border-radius: 6px;
          font-size: 0.9rem;
          background-color: #4a5568;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 5px;
        }
        
        .balance-action-button.primary {
          background-color: #4c51bf;
        }
        
        .balance-action-button.primary:hover:not(:disabled) {
          background-color: #434190;
        }
        
        .balance-action-button:hover:not(:disabled) {
          background-color: #718096;
        }
        
        .token-usage-info {
          background-color: #2d3748;
          border-radius: 10px;
          padding: 20px;
          border: 1px solid #4a5568;
        }
        
        .token-usage-info h3 {
          color: #63b3ed;
          margin: 0 0 15px 0;
          padding-bottom: 10px;
          border-bottom: 1px solid #4a5568;
        }
        
        .token-info-list {
          list-style-type: none;
          padding: 0;
          margin: 0;
        }
        
        .token-info-list li {
          padding: 10px 0;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
          display: flex;
          align-items: center;
          gap: 10px;
        }
        
        .token-info-list li:before {
          content: "•";
          color: #48bb78;
          font-weight: bold;
        }
        
        .token-info-list li:last-child {
          border-bottom: none;
        }
        
        @media (max-width: 900px) {
          .balance-details {
            grid-template-columns: 1fr;
          }
        }

        .token-operations-section {
          margin-top: 20px;
          padding-top: 15px;
          border-top: 1px solid #4a5568;
        }
        
        .token-operations {
          display: flex;
          flex-direction: column;
          gap: 10px;
          margin-top: 15px;
        }
        
        .token-operation-button {
          padding: 12px;
          border-radius: 6px;
          background-color: #4a5568;
          color: white;
          font-size: 0.95rem;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: all 0.2s;
          border: none;
          cursor: pointer;
        }
        
        .token-operation-button:hover:not(:disabled) {
          background-color: #38a169;
          transform: translateY(-2px);
        }
        
        .token-operation-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .last-updated {
          font-size: 0.8rem;
          color: #a0aec0;
          text-align: right;
          font-style: italic;
        }

        .buy-tokens-container {
          display: flex;
          flex-direction: column;
          gap: 12px;
          padding: 15px;
          background-color: rgba(76, 81, 191, 0.1);
          border-radius: 8px;
          margin-bottom: 20px;
        }
        
        .buy-amount-selector {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 10px;
        }
        
        .buy-amount-selector label {
          color: #a0aec0;
          font-size: 0.9rem;
        }
        
        .buy-amount-select {
          padding: 8px 10px;
          background-color: #1a202c;
          border: 1px solid #4a5568;
          border-radius: 4px;
          color: white;
          font-size: 0.9rem;
          min-width: 120px;
        }
        
        .buy-tokens-button {
          background: linear-gradient(135deg, #4c51bf 0%, #6b46c1 100%);
          padding: 12px;
          font-size: 1rem;
          font-weight: 600;
          border-radius: 6px;
          width: 100%;
          transition: all 0.3s;
        }
        
        .buy-tokens-button:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(107, 70, 193, 0.3);
        }
        
        .buy-tokens-note {
          text-align: center;
          font-size: 0.8rem;
          color: #a0aec0;
          font-style: italic;
        }
        
        .token-ops-title {
          margin-top: 10px;
        }
      `}</style>
    </div>
  );
};
