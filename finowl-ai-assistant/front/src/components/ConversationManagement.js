import { useState, useEffect, useRef } from 'react';
import { useWalletSelector } from '@near-wallet-selector/react-hook';
import ReactMarkdown from 'react-markdown';
import { CONTRACT_NAME, validateNetworkConfig } from '../config/network';
import { detectTradeIntent, generateTradeIntentResponse, generateTradeIntentResponseWithQuote } from '../utils/tradeIntentDetector';
import { initializeOneClickService } from '../utils/oneClickQuoteService';

export const ConversationManagement = ({ refreshTokenBalance }) => {
  const { signedAccountId, viewFunction, callFunction, modal, signIn } = useWalletSelector();
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState('');
  const [conversations, setConversations] = useState([]);
  const [conversationHistory, setConversationHistory] = useState([]);
  const [autoListDone, setAutoListDone] = useState(false);
  const [fullyRegistered, setFullyRegistered] = useState(false);
  const [aiAnalyzing, setAiAnalyzing] = useState(false);
  const [showAllMessages, setShowAllMessages] = useState(false);
  
  // Store message state
  const [messageRole, setMessageRole] = useState('user');
  const [messageContent, setMessageContent] = useState('');
  const [storeMessageConvId, setStoreMessageConvId] = useState('');
  const [willTriggerAI, setWillTriggerAI] = useState(false);

  // Add tokens state
  const [addTokensConvId, setAddTokensConvId] = useState('');
  const [tokenAmount, setTokenAmount] = useState(5); // Default to 5 tokens
  
  // Add reference to conversation history container
  const historyContainerRef = useRef(null);

  // Add a new state variable to track in-memory messages
  const [inMemoryMessages, setInMemoryMessages] = useState([]);
  const [showSaveButton, setShowSaveButton] = useState(false);
  const [calculatedTokens, setCalculatedTokens] = useState(0);

  // 1Click service state
  const [oneClickEnabled, setOneClickEnabled] = useState(false);
  const [oneClickJwt, setOneClickJwt] = useState('');

  // Function to calculate tokens based on text length
  const calculateTokens = (text) => {
    return Math.max(1, Math.ceil(text.length / 4));
  };

  // Function to calculate total tokens for all messages
  const calculateTotalTokens = (messages) => {
    return messages.reduce((total, msg) => {
      return total + calculateTokens(msg.content);
    }, 0);
  };

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

  // Scroll to bottom of conversation when history changes
  useEffect(() => {
    if (historyContainerRef.current && conversationHistory.length > 0) {
      historyContainerRef.current.scrollTop = historyContainerRef.current.scrollHeight;
    }
  }, [conversationHistory]);

  // Initialize 1Click service when enabled
  useEffect(() => {
    if (oneClickEnabled && oneClickJwt) {
      try {
        initializeOneClickService(oneClickJwt);
        console.log('1Click service initialized successfully');
      } catch (error) {
        console.error('Failed to initialize 1Click service:', error);
      }
    }
  }, [oneClickEnabled, oneClickJwt]);

  // Function to analyze the market using the AI analyzer service
  const analyzeMarket = async (question) => {
    try {
      setAiAnalyzing(true);
      console.log('Calling AI market analyzer with question:', question);
      
      // Set a longer timeout for the fetch (8 minutes)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 480000); // 8 minutes
      
      const response = await fetch('http://localhost:8080/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ question }),
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId); // Clear the timeout if fetch completes
      
      if (!response.ok) {
        throw new Error(`AI analyzer responded with status: ${response.status}`);
      }
      
      const analysisResult = await response.text(); // Changed from response.json() to response.text()
      console.log('AI market analysis result:', analysisResult);
      return analysisResult;
    } catch (error) {
      console.error('Error calling AI market analyzer:', error);
      
      // Return null to indicate analysis failed
      return null;
    } finally {
      setAiAnalyzing(false);
    }
  };

  // Handle message content change
  const handleMessageContentChange = (e) => {
    const content = e.target.value;
    setMessageContent(content);
    
    // Check if this message will trigger AI analysis
    const willTrigger = messageRole === 'user';
    setWillTriggerAI(willTrigger);
  };

  const handleListConversations = async (showLoading = true) => {
    try {
      if (!signedAccountId) {
        console.log('Please connect your wallet first');
        if (modal) {
          modal.show();
        } else if (signIn) {
          signIn();
        }
        return;
      }

      if (showLoading) {
        setLoading(true);
      }
      
      if (!validateNetworkConfig()) {
        throw new Error('Invalid network configuration');
      }
      
      // Try to get conversations using view method first
      try {
        const result = await viewFunction({
          contractId: CONTRACT_NAME,
          method: "view_js_func",
          args: {
            function_name: "get_user_conversations",
            account_id: signedAccountId
          }
        });
        console.log('Conversations list (view method):', result);
        
        // Fetch metadata for each conversation
        const conversationsWithMetadata = await Promise.all(
          result.map(async (convId) => {
            try {
              const metadata = await viewFunction({
                contractId: CONTRACT_NAME,
                method: "view_js_func",
                args: {
                  function_name: "get_conversation_metadata",
                  conversation_id: convId
                }
              });
              
              // Calculate remaining tokens
              const tokensReserved = BigInt(metadata.tokens_reserved || "0");
              const tokensUsed = BigInt(metadata.tokens_used || "0");
              const tokensRemaining = tokensReserved > tokensUsed ? tokensReserved - tokensUsed : BigInt(0);
              
              // Convert to display format (divide by 1_000_000)
              const displayRemaining = Number(tokensRemaining) / 1_000_000;
              
              return {
                id: convId,
                metadata,
                tokensRemaining: displayRemaining
              };
            } catch (error) {
              console.error(`Error fetching metadata for conversation ${convId}:`, error);
              return {
                id: convId,
                metadata: null,
                tokensRemaining: 0
              };
            }
          })
        );
        
        setConversations(conversationsWithMetadata);
      } catch (viewError) {
        console.log('View method failed, trying call method:', viewError);
        
        const result = await callFunction({
          contractId: CONTRACT_NAME,
          method: "call_js_func",
          args: {
            function_name: "get_user_conversations",
            account_id: signedAccountId
          }
        });
        console.log('Conversations list (call method):', result);
        
        // Fetch metadata for each conversation
        const conversationsWithMetadata = await Promise.all(
          result.map(async (convId) => {
            try {
              const metadata = await callFunction({
                contractId: CONTRACT_NAME,
                method: "call_js_func",
                args: {
                  function_name: "get_conversation_metadata",
                  conversation_id: convId
                }
              });
              
              // Calculate remaining tokens
              const tokensReserved = BigInt(metadata.tokens_reserved || "0");
              const tokensUsed = BigInt(metadata.tokens_used || "0");
              const tokensRemaining = tokensReserved > tokensUsed ? tokensReserved - tokensUsed : BigInt(0);
              
              // Convert to display format (divide by 1_000_000)
              const displayRemaining = Number(tokensRemaining) / 1_000_000;
              
              return {
                id: convId,
                metadata,
                tokensRemaining: displayRemaining
              };
            } catch (error) {
              console.error(`Error fetching metadata for conversation ${convId}:`, error);
              return {
                id: convId,
                metadata: null,
                tokensRemaining: 0
              };
            }
          })
        );
        
        setConversations(conversationsWithMetadata);
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
      
      if (!validateNetworkConfig()) {
        throw new Error('Invalid network configuration');
      }
      
      try {
        const result = await viewFunction({
          contractId: CONTRACT_NAME,
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
        
        const result = await callFunction({
          contractId: CONTRACT_NAME,
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

  // Effect to update conversation history when in-memory messages change
  useEffect(() => {
    if (inMemoryMessages.length > 0) {
      // Deep clone the array to ensure React detects the change
      setConversationHistory([...inMemoryMessages]);
      
      // Calculate and update total tokens whenever messages change
      const totalTokens = calculateTotalTokens(inMemoryMessages);
      setCalculatedTokens(totalTokens);
      
      // Scroll to bottom after a short delay to allow rendering
      setTimeout(() => {
        if (historyContainerRef.current) {
          historyContainerRef.current.scrollTop = historyContainerRef.current.scrollHeight;
        }
      }, 100);
    }
  }, [inMemoryMessages]);

  // Function to send message to AI without storing on blockchain
  const handleSendMessage = async () => {
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
      // Get current timestamp in seconds
      const timestamp = Math.floor(Date.now() / 1000);
      
      // Create user message object
      const userMessage = {
        role: messageRole,
        content: messageContent,
        timestamp: timestamp
      };
      
      // Add to in-memory messages
      setInMemoryMessages(prev => [...prev, userMessage]);
      
      // Calculate tokens for this message
      const userMessageTokens = calculateTokens(messageContent);
      console.log(`User message uses ${userMessageTokens} tokens`);
      
      // If this is a user message that looks like a market analysis question,
      // call the AI analyzer without storing its response on blockchain
      if (messageRole === 'user') {
        try {
          // FIRST: Check if the message matches a trade intent template
          const tradeIntentResult = detectTradeIntent(messageContent);
          
          if (tradeIntentResult.isTradeIntent) {
            // WORKFLOW 1: Template matched - handle front-side only with JSON response
            console.log('Trade intent detected:', tradeIntentResult.data);
            
            let tradeResponse;
            
            // Use quote-enabled response if 1Click service is available
            if (oneClickEnabled && oneClickJwt) {
              console.log('Using 1Click service for enhanced trade response');
              try {
                tradeResponse = await generateTradeIntentResponseWithQuote(
                  tradeIntentResult.data, 
                  { 
                    slippageTolerance: 100, // 1% default slippage
                    connectedWallet: signedAccountId // Pass connected wallet
                  }
                );
              } catch (quoteError) {
                console.error('Quote generation failed, falling back to basic response:', quoteError);
                tradeResponse = generateTradeIntentResponse(tradeIntentResult.data);
              }
            } else {
              console.log('Using basic trade intent response (1Click not enabled)');
              tradeResponse = generateTradeIntentResponse(tradeIntentResult.data);
            }
            
            // Calculate tokens for trade response
            const tradeResponseTokens = calculateTokens(tradeResponse);
            console.log(`Trade intent response uses ${tradeResponseTokens} tokens`);
            
            // Create system message for the trade intent response
            const tradeSystemMessage = {
              role: "system",
              content: tradeResponse,
              timestamp: Math.floor(Date.now() / 1000)
            };
            
            // Add to in-memory messages (no token deduction needed for template responses)
            setInMemoryMessages(prev => [...prev, tradeSystemMessage]);
            console.log('Trade intent response added to in-memory messages');
            
          } else {
            // WORKFLOW 2: Template not matched - use existing AI analyzer process
            console.log('No trade intent detected, proceeding with AI analysis');
            
            const aiResponse = await analyzeMarket(messageContent);
            
            if (aiResponse) {
              // Format the AI response for display with better structure
              const formattedResponse = aiResponse; // Use the Markdown response directly
              
              // Calculate tokens for AI response
              const aiMessageTokens = calculateTokens(formattedResponse);
              console.log(`AI response uses ${aiMessageTokens} tokens`);
              
              // Call the backend to deduct tokens before showing AI response
              try {
                // Calculate the total tokens needed for this AI response
                const tokensToDeduct = (aiMessageTokens * 1_000_000).toFixed(0);
                
                console.log(`Deducting ${tokensToDeduct} tokens for AI response`);
                
                // Call the backend API to deduct tokens
                const deductResponse = await fetch('http://localhost:8080/api/deduct-tokens', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    conversation_id: storeMessageConvId,
                    amount: tokensToDeduct,
                    timestamp: Math.floor(Date.now() / 1000)
                  }),
                });
                
                if (!deductResponse.ok) {
                  throw new Error(`Failed to deduct tokens: ${deductResponse.status}`);
                }
                
                const deductResult = await deductResponse.json();
                console.log('Token deduction result:', deductResult);
                
                if (!deductResult.success) {
                  throw new Error('Token deduction failed');
                }
                
                // If we're here, token deduction succeeded, so show the AI response
                console.log(`Successfully deducted tokens. Remaining: ${deductResult.remaining}`);
                
                // Create system message for the AI response
                const systemMessage = {
                  role: "system",
                  content: formattedResponse,
                  timestamp: Math.floor(Date.now() / 1000)
                };
                
                // Add to in-memory messages
                setInMemoryMessages(prev => [...prev, systemMessage]);
                console.log('AI response added to in-memory messages');
                
                // Refresh conversations list to update token balances
                handleListConversations(false);
                
              } catch (deductError) {
                console.error('Token deduction failed:', deductError);
                
                // Create an error message for insufficient tokens
                const tokenErrorMessage = {
                  role: "system",
                  content: `# Insufficient Tokens\n\n` +
                    `I cannot provide a response because there are insufficient tokens in this conversation.\n\n` +
                    `**Please add more tokens to continue.** You can do this by using the "Add Tokens to Conversation" panel.`,
                  timestamp: Math.floor(Date.now() / 1000)
                };
                
                // Add the error message to in-memory messages
                setInMemoryMessages(prev => [...prev, tokenErrorMessage]);
                console.log('Token error message added to in-memory messages');
              }
              
            } else {
              // If AI analysis failed, create an error message
              const errorMessage = {
                role: "system",
                content: `# Analysis Request Failed\n\n` +
                  `I wasn't able to analyze your request due to a server connection issue.\n\n` +
                  `**Please try again in a few minutes.** The market analysis server might be busy or temporarily unavailable.`,
                timestamp: Math.floor(Date.now() / 1000)
              };
              
              // Calculate tokens for error message
              const errorMessageTokens = calculateTokens(errorMessage.content);
              console.log(`Error message uses ${errorMessageTokens} tokens`);
              
              // Add to in-memory messages
              setInMemoryMessages(prev => [...prev, errorMessage]);
              
              console.log('AI error message added to in-memory messages');
            }
          }
        } catch (aiError) {
          console.error('Error processing AI response:', aiError);
          
          // Add error message to in-memory messages
          const criticalErrorMessage = {
            role: "system",
            content: `# Analysis Error\n\n` +
              `There was an error processing your market analysis request.\n\n` +
              `**Please try again later.** If the problem persists, contact support.`,
            timestamp: Math.floor(Date.now() / 1000)
          };
          
          setInMemoryMessages(prev => [...prev, criticalErrorMessage]);
        }
      }
      
      // Clear the message content after sending
      setMessageContent('');
      
      // Show the save button once we have messages
      setShowSaveButton(true);
      
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Function to save the full conversation to the blockchain
  const handleSaveFullConversation = async () => {
    if (!storeMessageConvId) {
      console.log('Please enter a conversation ID');
      return;
    }

    if (inMemoryMessages.length === 0) {
      console.log('No messages to save');
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
      
      // Get current timestamp
      const timestamp = Math.floor(Date.now() / 1000);
      
      // Calculate total tokens for all messages
      const totalTokens = calculateTotalTokens(inMemoryMessages);
      console.log(`Total tokens used for conversation: ${totalTokens}`);
      
      // Convert to internal token format (multiply by 1,000,000)
      const internalTokens = (totalTokens * 1_000_000).toFixed(0);
      
      // Prepare metadata
      const metadata = {
        tokens_reserved: "10000000", // 10 tokens reserved in internal units
        tokens_used: internalTokens
      };
      
      console.log(`Saving conversation with ${inMemoryMessages.length} messages using ${internalTokens} tokens`);
      
      // Call the contract method to save full conversation
      const result = await callFunction({
        contractId: CONTRACT_NAME,
        method: "call_js_func",
        args: {
          function_name: "save_full_conversation",
          conversation_id: storeMessageConvId,
          messages: inMemoryMessages,
          metadata: metadata,
          timestamp: timestamp
        }
      });
      
      console.log('Full conversation saved successfully:', result);
      
      // Clear in-memory messages after saving
      setInMemoryMessages([]);
      setShowSaveButton(false);
      setCalculatedTokens(0);
      
      // Refresh conversation history
      handleGetConversationHistory();
      
      // Refresh token balance
      if (refreshTokenBalance) {
        await refreshTokenBalance();
      }
      
      // Refresh conversations list to update token balances
      handleListConversations(false);
      
      alert('Conversation saved successfully!');
    } catch (error) {
      console.error('Error saving full conversation:', error);
      alert(`Error saving conversation: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Original function to store a single message on the blockchain
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
      
      if (!validateNetworkConfig()) {
        throw new Error('Invalid network configuration');
      }
      
      const timestamp = Math.floor(Date.now() / 1000);
      
      const result = await callFunction({
        contractId: CONTRACT_NAME,
        method: "call_js_func",
        args: {
          function_name: "store_message",
          conversation_id: storeMessageConvId,
          role: messageRole,
          content: messageContent,
          timestamp: timestamp
        }
      });
      
      console.log('Message stored successfully:', result);
      
      // If this is a user message that looks like a market analysis question,
      // call the AI analyzer and store its response
      if (messageRole === 'user') {
        try {
          // FIRST: Check if the message matches a trade intent template
          const tradeIntentResult = detectTradeIntent(messageContent);
          
          if (tradeIntentResult.isTradeIntent) {
            // WORKFLOW 1: Template matched - handle front-side only with JSON response and store
            console.log('Trade intent detected for storage:', tradeIntentResult.data);
            
            const tradeResponse = generateTradeIntentResponse(tradeIntentResult.data);
            
            // Store the trade intent response as a system message
            await callFunction({
              contractId: CONTRACT_NAME,
              method: "call_js_func",
              args: {
                function_name: "store_message",
                conversation_id: storeMessageConvId,
                role: "system",
                content: tradeResponse,
                timestamp: Math.floor(Date.now() / 1000)
              }
            });
            
            console.log('Trade intent response stored successfully');
            
          } else {
            // WORKFLOW 2: Template not matched - use existing AI analyzer process
            console.log('No trade intent detected, proceeding with AI analysis for storage');
            
            const aiResponse = await analyzeMarket(messageContent);
            
            if (aiResponse) {
              // Format the AI response for display with better structure
              const formattedResponse = aiResponse; // Use the Markdown response directly
              
              // Store the AI response as a system message
              await callFunction({
                contractId: CONTRACT_NAME,
                method: "call_js_func",
                args: {
                  function_name: "store_message",
                  conversation_id: storeMessageConvId,
                  role: "system",
                  content: formattedResponse,
                  timestamp: Math.floor(Date.now() / 1000)
                }
              });
              
              console.log('AI response stored successfully');
            } else {
              // If AI analysis failed, store an error message as system message with retry button
              const errorResponse = 
                `# Analysis Request Failed\n\n` +
                `I wasn't able to analyze your request due to a server connection issue.\n\n` +
                `**Please try again in a few minutes.** The market analysis server might be busy or temporarily unavailable.\n\n` +
                `Click the "Retry Analysis" button in the conversation when you want to try again.`;
              
              await callFunction({
                contractId: CONTRACT_NAME,
                method: "call_js_func",
                args: {
                  function_name: "store_message",
                  conversation_id: storeMessageConvId,
                  role: "system",
                  content: errorResponse,
                  timestamp: Math.floor(Date.now() / 1000)
                }
              });
              
              console.log('AI error message stored');
            }
          }
        } catch (aiError) {
          console.error('Error processing AI response:', aiError);
          
          // Store an error message even if the analysis process fails
          try {
            const criticalErrorResponse = 
              `# Analysis Error\n\n` +
              `There was an error processing your market analysis request.\n\n` +
              `**Please try again later.** If the problem persists, contact support.`;
            
            await callFunction({
              contractId: CONTRACT_NAME,
              method: "call_js_func",
              args: {
                function_name: "store_message",
                conversation_id: storeMessageConvId,
                role: "system",
                content: criticalErrorResponse,
                timestamp: Math.floor(Date.now() / 1000)
              }
            });
          } catch (storeError) {
            console.error('Failed to store error message:', storeError);
          }
        }
      }
      
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
      
      if (!validateNetworkConfig()) {
        throw new Error('Invalid network configuration');
      }
      
      const internalAmount = (tokenAmount * 1_000_000).toFixed(0);
      
      const result = await callFunction({
        contractId: CONTRACT_NAME,
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
      
      // Refresh conversations list to update token balances
      handleListConversations(false);
      
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
      
      if (!validateNetworkConfig()) {
        throw new Error('Invalid network configuration');
      }
      
      const timestamp = Math.floor(Date.now() / 1000);
      const generatedConversationId = `${signedAccountId}_${timestamp}`;
      const reserveAmount = "1000000000";
      
      const result = await callFunction({
        contractId: CONTRACT_NAME,
        method: "call_js_func",
        args: {
          function_name: "start_ai_conversation",
          conversation_id: generatedConversationId,
          reserve_amount: reserveAmount,
          timestamp: timestamp
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

  // Function to retry a failed analysis
  const retryAnalysis = async (questionContent) => {
    try {
      if (!storeMessageConvId) {
        console.log('Cannot retry without a conversation ID');
        return;
      }
      
      setLoading(true);
      
      // Call the AI analyzer again
      const aiResponse = await analyzeMarket(questionContent);
      
      if (aiResponse) {
        // Format the AI response for display with better structure
        const formattedResponse = aiResponse; // Use the Markdown response directly
        
        // Calculate tokens for AI response
        const aiMessageTokens = calculateTokens(formattedResponse);
        console.log(`Retry AI response uses ${aiMessageTokens} tokens`);
        
        // Call the backend to deduct tokens before showing AI response
        try {
          // Calculate the total tokens needed for this AI response
          const tokensToDeduct = (aiMessageTokens * 1_000_000).toFixed(0);
          
          console.log(`Deducting ${tokensToDeduct} tokens for retry AI response`);
          
          // Call the backend API to deduct tokens
          const deductResponse = await fetch('http://localhost:8080/api/deduct-tokens', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              conversation_id: storeMessageConvId,
              amount: tokensToDeduct,
              timestamp: Math.floor(Date.now() / 1000)
            }),
          });
          
          if (!deductResponse.ok) {
            throw new Error(`Failed to deduct tokens: ${deductResponse.status}`);
          }
          
          const deductResult = await deductResponse.json();
          console.log('Token deduction result for retry:', deductResult);
          
          if (!deductResult.success) {
            throw new Error('Token deduction failed for retry');
          }
          
          // If token deduction succeeded, store the AI response
          console.log(`Successfully deducted tokens for retry. Remaining: ${deductResult.remaining}`);
          
          // Store the AI response as a system message
          await callFunction({
            contractId: CONTRACT_NAME,
            method: "call_js_func",
            args: {
              function_name: "store_message",
              conversation_id: storeMessageConvId,
              role: "system",
              content: formattedResponse,
              timestamp: Math.floor(Date.now() / 1000)
            }
          });
          
          console.log('Retry successful, AI response stored');
          
          // Refresh conversation history if needed
          if (storeMessageConvId === conversationId) {
            handleGetConversationHistory();
          }
          
          // Refresh conversations list to update token balances
          handleListConversations(false);
          
        } catch (deductError) {
          console.error('Token deduction failed for retry:', deductError);
          
          // Store an error message for insufficient tokens
          const tokenErrorResponse = 
            `# Insufficient Tokens\n\n` +
            `I cannot provide a response because there are insufficient tokens in this conversation.\n\n` +
            `**Please add more tokens to continue.** You can do this by using the "Add Tokens to Conversation" panel.`;
          
          await callFunction({
            contractId: CONTRACT_NAME,
            method: "call_js_func",
            args: {
              function_name: "store_message",
              conversation_id: storeMessageConvId,
              role: "system",
              content: tokenErrorResponse,
              timestamp: Math.floor(Date.now() / 1000)
            }
          });
          
          // Refresh conversation history if needed
          if (storeMessageConvId === conversationId) {
            handleGetConversationHistory();
          }
          
          // Refresh conversations list to update token balances
          handleListConversations(false);
        }
      } else {
        // If retry still fails, store another error message
        const errorResponse = 
          `# Retry Failed\n\n` +
          `I'm still unable to analyze your request. The analysis server might be down for maintenance.\n\n` +
          `Please try again later or contact support if the issue persists.`;
        
        await callFunction({
          contractId: CONTRACT_NAME,
          method: "call_js_func",
          args: {
            function_name: "store_message",
            conversation_id: storeMessageConvId,
            role: "system",
            content: errorResponse,
            timestamp: Math.floor(Date.now() / 1000)
          }
        });
        
        // Refresh conversation history if needed
        if (storeMessageConvId === conversationId) {
          handleGetConversationHistory();
        }
        
        // Refresh conversations list to update token balances
        handleListConversations(false);
      }
    } catch (error) {
      console.error('Error during retry:', error);
    } finally {
      setLoading(false);
    }
  };

  // Function to get filtered conversation history
  // Show only recent messages if there are many, unless showAllMessages is true
  const getFilteredHistory = () => {
    const DEFAULT_VISIBLE_MESSAGES = 4; // Show last 4 messages by default
    
    if (showAllMessages || conversationHistory.length <= DEFAULT_VISIBLE_MESSAGES) {
      return conversationHistory;
    }
    
    return conversationHistory.slice(-DEFAULT_VISIBLE_MESSAGES);
  };

  // Add a new function for refunding tokens
  const handleRefundTokens = async (conversationId) => {
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
      
      console.log(`Refunding tokens from conversation: ${conversationId}`);
      
      const result = await callFunction({
        contractId: CONTRACT_NAME,
        method: "call_js_func",
        args: {
          function_name: "refund_reserved_tokens",
          conversation_id: conversationId
        }
      });
      
      console.log('Tokens refunded successfully:', result);
      
      // Refresh token balance since tokens were transferred back to wallet
      if (refreshTokenBalance) {
        await refreshTokenBalance();
      }
      
      // Refresh conversations list to update token balances
      handleListConversations(false);
      
      alert(`Successfully refunded tokens from conversation: ${conversationId}`);
    } catch (error) {
      console.error('Error refunding tokens:', error);
      alert(`Error refunding tokens: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Add a new function for clearing conversation history
  const handleClearHistory = async (conversationId) => {
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
      
      if (!validateNetworkConfig()) {
        throw new Error('Invalid network configuration');
      }
      
      console.log(`Clearing history for conversation: ${conversationId}`);
      
      const result = await callFunction({
        contractId: CONTRACT_NAME,
        method: "call_js_func",
        args: {
          function_name: "clear_conversation_history",
          conversation_id: conversationId
        }
      });
      
      console.log('Conversation history cleared successfully:', result);
      
      // Refresh conversation history if this is the currently viewed conversation
      if (conversationId === conversationId) {
        handleGetConversationHistory();
      }
      
      // Refresh conversations list
      handleListConversations(false);
      
      alert(`Successfully cleared history for conversation: ${conversationId}`);
    } catch (error) {
      console.error('Error clearing conversation history:', error);
      alert(`Error clearing history: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style jsx>{`
        .conversation-details {
          display: flex;
          flex-direction: column;
          flex: 1;
          overflow: hidden;
        }
        
        .tokens-remaining {
          font-size: 0.85rem;
          color: #6c757d;
          margin-top: 2px;
          display: flex;
          align-items: center;
        }
        
        .tokens-remaining::before {
          content: '💰';
          margin-right: 4px;
          font-size: 0.8rem;
        }
        
        .conversation-list li {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        
        .conversation-actions {
          display: flex;
          gap: 5px;
        }
        
        .refund-btn {
          padding: 3px 8px;
          background-color: #28a745;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 0.8rem;
          display: flex;
          align-items: center;
        }
        
        .refund-btn:hover {
          background-color: #218838;
        }
        
        .refund-btn:disabled {
          background-color: #6c757d;
          cursor: not-allowed;
        }
        
        .refund-btn::before {
          content: '↩️';
          margin-right: 2px;
          font-size: 0.8rem;
        }
        
        .markdown-table-container {
          overflow-x: auto;
          margin: 1rem 0;
        }
        
        .markdown-table-container table {
          border-collapse: collapse;
          width: 100%;
          margin: 1rem 0;
        }
        
        .markdown-table-container th,
        .markdown-table-container td {
          border: 1px solid #ddd;
          padding: 8px;
          text-align: left;
        }
        
        .markdown-table-container th {
          background-color: #f5f5f5;
          font-weight: bold;
        }
        
        .markdown-table-container tr:nth-child(even) {
          background-color: #f9f9f9;
        }
        
        .message-content {
          white-space: pre-wrap;
          word-wrap: break-word;
        }
        
        .message-content p {
          margin: 1rem 0;
          line-height: 1.5;
        }
        
        .message-content strong {
          font-weight: 600;
        }
        
        .clear-btn {
          padding: 3px 8px;
          background-color: #dc3545;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 0.8rem;
          display: flex;
          align-items: center;
        }
        
        .clear-btn:hover {
          background-color: #c82333;
        }
        
        .clear-btn:disabled {
          background-color: #6c757d;
          cursor: not-allowed;
        }
        
        .clear-btn::before {
          content: '🗑️';
          margin-right: 2px;
          font-size: 0.8rem;
        }

        .service-status {
          margin-bottom: 15px;
          display: flex;
          gap: 10px;
          align-items: center;
        }

        .status-indicator {
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 0.85rem;
          font-weight: 500;
        }

        .status-indicator.enabled {
          background-color: #d4edda;
          color: #155724;
        }

        .status-indicator.disabled {
          background-color: #f8d7da;
          color: #721c24;
        }

        .jwt-status {
          padding: 4px 8px;
          background-color: #e7f3ff;
          color: #0c5460;
          border-radius: 4px;
          font-size: 0.8rem;
        }

        .service-description {
          font-size: 0.85rem;
          color: #666;
          margin-top: 5px;
          font-style: italic;
        }

        .jwt-hint {
          font-size: 0.8rem;
          color: #666;
          margin-top: 5px;
        }

        .service-info {
          margin-top: 20px;
          padding: 15px;
          background-color: #f8f9fa;
          border-radius: 6px;
        }

        .service-info h4 {
          margin: 0 0 10px 0;
          font-size: 0.9rem;
          color: #333;
        }

        .service-info ul {
          margin: 0 0 15px 0;
          padding-left: 20px;
        }

        .service-info li {
          font-size: 0.85rem;
          margin: 5px 0;
          color: #555;
        }

        .supported-tokens {
          font-size: 0.85rem;
          color: #666;
          font-style: italic;
        }
      `}</style>
      
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
                    onChange={handleMessageContentChange}
                    placeholder="Type your message here..."
                    rows={5}
                    className={willTriggerAI ? 'will-trigger-ai' : ''}
                  />
                  {willTriggerAI && (
                    <div className="ai-trigger-note">
                      <span>🤖</span> This message will trigger AI market analysis
                    </div>
                  )}
                </div>
                
                <div className="button-group">
                  <button 
                    onClick={handleSendMessage} 
                    disabled={loading || !storeMessageConvId || !messageContent}
                    className="primary-button"
                    style={{ flex: 2 }}
                  >
                    {loading ? 'Sending...' : '📤 Send Message'}
                  </button>
                  
                  <button 
                    onClick={handleStoreMessage} 
                    disabled={loading || !storeMessageConvId || !messageContent}
                    className="accent-button"
                    style={{ flex: 1 }}
                  >
                    {loading ? 'Storing...' : '💾 Store'}
                  </button>
                </div>
                
                {showSaveButton && (
                  <button 
                    onClick={handleSaveFullConversation} 
                    disabled={loading || inMemoryMessages.length === 0}
                    className="feature-button full-width"
                    style={{ marginTop: '15px' }}
                  >
                    {loading ? 'Saving...' : `📥 Save Full Conversation (${calculatedTokens} tokens)`}
                  </button>
                )}
                
                {aiAnalyzing && (
                  <div className="ai-analyzing-indicator">
                    <div className="spinner"></div>
                    <span>AI analyzing market data...</span>
                  </div>
                )}
                
                {inMemoryMessages.length > 0 && (
                  <div className="memory-message-indicator">
                    <div className="memory-icon">💬</div>
                    <span>{inMemoryMessages.length} messages in memory • {calculatedTokens} tokens used</span>
                  </div>
                )}
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
                      Sends as {tokenAmount * 1_000_000} internal units
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

              {/* 1Click Quote Service Configuration Panel */}
              <div className="panel">
                <h2 className="panel-title">🔄 1Click Quote Service</h2>
                <div className="service-status">
                  <span className={`status-indicator ${oneClickEnabled ? 'enabled' : 'disabled'}`}>
                    {oneClickEnabled ? '✅ Enabled' : '❌ Disabled'}
                  </span>
                  {oneClickEnabled && oneClickJwt && (
                    <span className="jwt-status">🔑 JWT Configured</span>
                  )}
                </div>

                <div className="input-group">
                  <label>
                    <input
                      type="checkbox"
                      checked={oneClickEnabled}
                      onChange={(e) => setOneClickEnabled(e.target.checked)}
                    />
                    Enable 1Click Live Quotes
                  </label>
                  <div className="service-description">
                    When enabled, trade intent templates will include live quotes from 1Click API
                  </div>
                </div>

                {oneClickEnabled && (
                  <div className="input-group">
                    <label>JWT Token (Optional)</label>
                    <input
                      type="password"
                      value={oneClickJwt}
                      onChange={(e) => setOneClickJwt(e.target.value)}
                      placeholder="Enter your 1Click JWT token..."
                    />
                    <div className="jwt-hint">
                      JWT token is required for authenticated endpoints. Leave empty for basic functionality.
                    </div>
                  </div>
                )}

                <div className="service-info">
                  <h4>🚀 Features when enabled:</h4>
                  <ul>
                    <li>✅ Live cross-chain swap quotes</li>
                    <li>✅ Real deposit addresses</li>
                    <li>✅ Estimated gas and fees</li>
                    <li>✅ Route information</li>
                    <li>✅ Time estimates</li>
                  </ul>
                  
                  <h4>🔧 Supported tokens:</h4>
                  <div className="supported-tokens">
                    ETH, BTC, USDT, USDC, SOL, NEAR, and more
                  </div>
                </div>
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
                  {conversations.map((conv, index) => (
                    <li key={index}>
                      <div className="conversation-details">
                        <span className="conversation-id">{conv.id}</span>
                        {conv.tokensRemaining !== undefined && (
                          <span className="tokens-remaining">
                            {conv.tokensRemaining.toFixed(2)} tokens left
                          </span>
                        )}
                      </div>
                      <div className="conversation-actions">
                        <button 
                          className="copy-btn" 
                          onClick={() => handleCopyConversationId(conv.id)}
                        >
                          Use
                        </button>
                        <button
                          className="clear-btn"
                          onClick={() => handleClearHistory(conv.id)}
                          disabled={loading}
                          title="Clear conversation history"
                        >
                          Clear
                        </button>
                        {conv.tokensRemaining > 0 && (
                          <button
                            className="refund-btn"
                            onClick={() => handleRefundTokens(conv.id)}
                            disabled={loading}
                            title="Refund remaining tokens back to your wallet"
                          >
                            Refund
                          </button>
                        )}
                      </div>
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
              <h2 className="panel-title">
                Conversation History
                {conversationHistory.length > 0 && (
                  <span className="message-count">{conversationHistory.length} messages</span>
                )}
              </h2>
              {conversationHistory.length > 0 ? (
                <>
                  {conversationHistory.length > 4 && (
                    <div className="history-controls">
                      <button 
                        onClick={() => setShowAllMessages(!showAllMessages)}
                        className="history-toggle-button"
                      >
                        {showAllMessages ? 'Show Recent Messages' : 'Show All Messages'}
                      </button>
                      {!showAllMessages && (
                        <div className="message-note">Showing {getFilteredHistory().length} of {conversationHistory.length} messages</div>
                      )}
                    </div>
                  )}
                  <div className="history-container" ref={historyContainerRef}>
                    {getFilteredHistory().map((message, index) => (
                      <div key={index} className={`message ${message.role}`}>
                        <div className="message-header">
                          <strong>{message.role}</strong>
                          <span className="timestamp">
                            {new Date(message.timestamp * 1000).toLocaleString()}
                          </span>
                        </div>
                        <div className="message-content">
                          {message.role === 'system' ? (
                            <>
                              <ReactMarkdown
                                components={{
                                  table: ({node, ...props}) => (
                                    <div className="markdown-table-container">
                                      <table {...props} />
                                    </div>
                                  ),
                                  p: ({node, ...props}) => (
                                    <p style={{ whiteSpace: 'pre-wrap' }} {...props} />
                                  )
                                }}
                              >
                                {message.content}
                              </ReactMarkdown>
                              {message.content.includes('Analysis Request Failed') && (
                                <button 
                                  onClick={() => {
                                    // Find the most recent user message before this error message
                                    const userMsgIndex = conversationHistory
                                      .slice(0, index)
                                      .reverse()
                                      .findIndex(msg => msg.role === 'user');
                                    
                                    if (userMsgIndex !== -1) {
                                      const userMsg = conversationHistory[index - userMsgIndex - 1];
                                      retryAnalysis(userMsg.content);
                                    } else {
                                      console.error('Could not find user message to retry');
                                    }
                                  }}
                                  className="retry-button"
                                  disabled={loading || aiAnalyzing}
                                >
                                  {loading ? 'Retrying...' : '🔄 Retry Analysis'}
                                </button>
                              )}
                            </>
                          ) : (
                            message.content
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
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