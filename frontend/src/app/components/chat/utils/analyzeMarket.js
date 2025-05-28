// Function to analyze the market using the AI analyzer service
export async function analyzeMarket(question) {
    try {
      console.log("Calling AI market analyzer with question:", question);
  
      // Set a longer timeout for the fetch (8 minutes)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 480000); // 8 minutes
  
      const response = await fetch("http://localhost:3001/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ question }),
        signal: controller.signal,
      });
  
      clearTimeout(timeoutId); // Clear the timeout if fetch completes
  
      if (!response.ok) {
        throw new Error(`AI analyzer responded with status: ${response.status}`);
      }
  
      const analysisResult = await response.text(); // Changed from response.json() to response.text()
      console.log("AI market analysis result:", analysisResult);
      return analysisResult;
    } catch (error) {
      alert("Error calling AI market analyzer:", error);
  
      // Return null to indicate analysis failed
      return null;
    }
  }