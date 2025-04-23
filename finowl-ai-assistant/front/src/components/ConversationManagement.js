import { useState, useEffect } from 'react';
import { useWalletSelector } from '@near-wallet-selector/react-hook';

export const ConversationManagement = ({ refreshTokenBalance }) => {
  const { signedAccountId, viewFunction, callFunction, modal, signIn } = useWalletSelector();
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState('');
  const [conversations, setConversations] = useState([]);
  const [conversationHistory, setConversationHistory] = useState([]);
  const [autoListDone, setAutoListDone] = useState(false);
  const [fullyRegistered, setFullyRegistered] = useState(false);
  
  // Store message state
  const [messageRole, setMessageRole] = useState('user');
  const [messageContent, setMessageContent] = useState('');
  const [storeMessageConvId, setStoreMessageConvId] = useState('');

  // Add tokens state
  const [addTokensConvId, setAddTokensConvId] = useState('');
  const [tokenAmount, setTokenAmount] = useState(5); // Default to 5 tokens
  
  // Listen for registration, storage and token status events to determine full registration
  useEffect(() => {
    let claimStatus = false;
    let storageStatus = false;
    let registrationStatus = false;
    
    const updateFullyRegistered = () => {
      const isFullyRegistered = claimStatus && storageStatus && registrationStatus;
      console.log('Checking fully registered status:', { 
        claimStatus, storageStatus, registrationStatus, isFullyRegistered 
      });
      setFullyRegistered(isFullyRegistered);
      
      // If fully registered and conversations not loaded, load them
      if (isFullyRegistered && !autoListDone && signedAccountId) {
        console.log('User is fully registered. Auto-listing conversations...');
        setTimeout(() => {
          handleListConversations(false); // false means don't show loading indicator
          setAutoListDone(true);
        }, 500); // Small delay to prevent too many simultaneous calls
      }
    };
    
    // Event handlers
    const handleWelcomeTokensChecked = (event) => {
      console.log('ConversationManagement received welcomeTokensChecked event:', event.detail);
      const { result } = event.detail;
      
      if (result && typeof result.received === 'boolean') {
        claimStatus = result.received;
        updateFullyRegistered();
      }
    };
    
    const handleStorageDepositChecked = (event) => {
      console.log('ConversationManagement received storageDepositChecked event:', event.detail);
      const { result } = event.detail;
      
      storageStatus = result !== null;
      updateFullyRegistered();
    };
    
    const handleUserRegistrationChecked = (event) => {
      console.log('ConversationManagement received userRegistrationChecked event:', event.detail);
      const { result } = event.detail;
      
      if (result && typeof result.registered === 'boolean') {
        registrationStatus = result.registered;
        updateFullyRegistered();
      }
    };
    
    // Add event listeners
    window.addEventListener('welcomeTokensChecked', handleWelcomeTokensChecked);
    window.addEventListener('storageDepositChecked', handleStorageDepositChecked);
    window.addEventListener('userRegistrationChecked', handleUserRegistrationChecked);
    
    // Try to load from localStorage if available
    try {
      // Check claim status
      const cachedTokenStatus = localStorage.getItem(`finowl_tokens_claimed_${signedAccountId}`);
      if (cachedTokenStatus) {
        const parsed = JSON.parse(cachedTokenStatus);
        claimStatus = parsed.claimed === true;
      }
      
      // Check storage status
      const cachedStorageStatus = localStorage.getItem(`finowl_storage_deposit_${signedAccountId}`);
      if (cachedStorageStatus) {
        const parsed = JSON.parse(cachedStorageStatus);
        storageStatus = parsed.hasDeposit === true;
      }
      
      // Check registration status
      const cachedRegistrationStatus = localStorage.getItem(`finowl_registration_${signedAccountId}`);
      if (cachedRegistrationStatus) {
        const parsed = JSON.parse(cachedRegistrationStatus);
        registrationStatus = parsed.registered === true;
      }
      
      // Update fully registered status based on cached values
      updateFullyRegistered();
    } catch (error) {
      console.error('Error loading registration status from cache:', error);
    }
    
    return () => {
      // Remove event listeners on cleanup
      window.removeEventListener('welcomeTokensChecked', handleWelcomeTokensChecked);
      window.removeEventListener('storageDepositChecked', handleStorageDepositChecked);
      window.removeEventListener('userRegistrationChecked', handleUserRegistrationChecked);
    };
  }, [signedAccountId, autoListDone]);

  const handleListConversations = async (showLoading = true) => {
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

      if (showLoading) {
        setLoading(true);
      }
      
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
          method: "call_js_func",
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
      if (showLoading) {
        setLoading(false);
      } else {
        setTimeout(() => setLoading(false), 200); // Slight delay to avoid UI flash
      }
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
      if (refreshTokenBalance) {
        await refreshTokenBalance();
      }
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
      if (refreshTokenBalance) {
        await refreshTokenBalance();
      }
      
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
      if (refreshTokenBalance) {
        await refreshTokenBalance();
      }
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

  return (
    <>
      <section className="section">
        <h1 className="section-title">Conversation Management</h1>
        <div className="two-column-layout">
          <div className="left-column">
            <div className="panel-container">
              {/* Start Conversation Panel */}
              <div className="panel">
                <h2 className="panel-title">Start & View Conversations</h2>
                
                {fullyRegistered && (
                  <div className="registration-notice success">
                    <span className="registration-icon">✅</span>
                    <span>You are fully registered and can use all conversation features</span>
                  </div>
                )}
                
                <div className="start-conversation-container">
                  <button 
                    onClick={handleStartConversation} 
                    disabled={loading || !signedAccountId}
                    className="primary-button full-width"
                  >
                    {loading ? 'Starting...' : '➕ Start New Conversation'}
                  </button>
                  <div className="start-conversation-hint">
                    Creates a new conversation with 10 tokens reserved
                  </div>
                </div>

                <button 
                  onClick={() => handleListConversations(true)} 
                  disabled={loading}
                  className="feature-button"
                >
                  {loading ? 'Loading...' : '📋 List Conversations'}
                  {autoListDone && conversations.length > 0 && (
                    <span className="count-badge">{conversations.length}</span>
                  )}
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
            </div>
          </div>
        </div>
      </section>

      {/* Section: Conversation Results */}
      <section className="section">
        <h1 className="section-title">Conversation Results</h1>
        <div className="two-column-layout">
          <div className="left-column">
            {/* Display Conversations */}
            <div className="panel results-panel">
              <h2 className="panel-title">Your Conversations</h2>
              {conversations.length > 0 ? (
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
              ) : (
                <div className="empty-state">
                  <p>You don't have any conversations yet. Start a new conversation to begin.</p>
                  <div className="empty-icon">💬</div>
                  <button 
                    onClick={handleStartConversation} 
                    disabled={loading || !signedAccountId}
                    className="primary-button"
                  >
                    Start New Conversation
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="right-column">
            {/* Display Conversation History */}
            <div className="panel results-panel">
              <h2 className="panel-title">Conversation History</h2>
              {conversationHistory.length > 0 ? (
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
              ) : (
                <div className="empty-state">
                  <p>Enter a conversation ID and click "View History" to see the message history.</p>
                  <div className="empty-icon">📝</div>
                  {conversationId && (
                    <button 
                      onClick={handleGetConversationHistory} 
                      disabled={loading}
                      className="accent-button"
                    >
                      View History
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default ConversationManagement; 