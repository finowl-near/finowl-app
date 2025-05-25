export async function deductAiTokens(aiMessageTokens, convId) {
    try {
        // Calculate the total tokens needed for this AI response
        const tokensToDeduct = (aiMessageTokens * 1_000_000).toFixed(0);
              
        console.log(`Deducting ${tokensToDeduct} tokens for AI response and conv ${convId}`);
        
        // Call the backend API to deduct tokens
        const deductResponse = await fetch('http://localhost:8080/api/deduct-tokens', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
              conversation_id: convId,
              amount: tokensToDeduct,
              timestamp: Math.floor(Date.now() / 1000)
            }),
        });
        
        if (!deductResponse.ok) {
            console.log("here1");
            throw new Error(`Failed to deduct tokens: ${deductResponse.status}`);
        }
        const deductResult = await deductResponse.json();
        if (!deductResult) {
            console.log("here2");
            throw new Error(`Insufficient Tokens`);
        }
        console.log('Token deduction result:', deductResult);
        return deductResult;
    } catch (error) {
        const tokenErrorMessage = {
            role: "system",
            content: `# Insufficient Tokens\n\n` +
              `I cannot provide a response because there are insufficient tokens in this conversation.\n\n` +
              `**Please add more tokens to continue.** You can do this by using the "Add Tokens to Conversation" panel.`,
            timestamp: Math.floor(Date.now() / 1000)
          };
        alert(`Error in deduct token ${error}`);
        return null;
    }
}