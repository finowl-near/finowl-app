package feedstock

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"
	"sync"
	"time"
)

// Client handles interactions with the Finowl API
type Client struct {
	httpClient  *http.Client
	baseURL     string
	summaryPath string
}

// NewClient creates a new Finowl API client with explicit parameters
func NewClient(baseURL, summaryPath string, timeout time.Duration) *Client {
	return &Client{
		httpClient: &http.Client{
			Timeout: timeout,
		},
		baseURL:     baseURL,
		summaryPath: summaryPath,
	}
}

// GetSummary fetches a summary by ID
func (c *Client) GetSummary(id int) (*Summary, error) {
	url := fmt.Sprintf("%s%s?id=%d", c.baseURL, c.summaryPath, id)

	resp, err := c.httpClient.Get(url)
	if err != nil {
		return nil, fmt.Errorf("API request failed: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode == http.StatusNotFound {
		return nil, fmt.Errorf("summary with ID %d not found", id)
	}

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("unexpected status code: %d", resp.StatusCode)
	}

	var apiResponse Response
	if err := json.NewDecoder(resp.Body).Decode(&apiResponse); err != nil {
		return nil, fmt.Errorf("failed to decode response: %w", err)
	}

	return &apiResponse.Summary, nil
}

// FetchSummaries fetches multiple summaries concurrently
func (c *Client) FetchSummaries(startID, count int) ([]Summary, error) {
	var wg sync.WaitGroup
	summaries := make([]Summary, 0, count)
	errors := make(chan error, count)
	resultChan := make(chan Summary, count)

	for i := 0; i < count; i++ {
		wg.Add(1)
		go func(id int) {
			defer wg.Done()
			summary, err := c.GetSummary(id)
			if err != nil {
				errors <- fmt.Errorf("error fetching summary %d: %w", id, err)
				return
			}
			resultChan <- *summary
		}(startID - i)
	}

	go func() {
		wg.Wait()
		close(resultChan)
		close(errors)
	}()

	for summary := range resultChan {
		summaries = append(summaries, summary)
	}

	if len(errors) > 0 {
		var errorStrings []string
		for err := range errors {
			errorStrings = append(errorStrings, err.Error())
		}
		return nil, fmt.Errorf("encountered %d errors: %s", len(errorStrings), strings.Join(errorStrings, "; "))
	}

	return summaries, nil
}

// GetLastSummaryID retrieves the ID of the last available summary
// by checking the total field from the summary endpoint
func (c *Client) GetLastSummaryID() (int, error) {
	summaryURL := c.getSummaryURL()

	resp, err := c.httpClient.Get(summaryURL)
	if err != nil {
		return 0, fmt.Errorf("failed to retrieve summary from %s: %w", summaryURL, err)
	}
	defer resp.Body.Close()

	// Check if status code is OK
	if resp.StatusCode != http.StatusOK {
		return 0, fmt.Errorf("unexpected status code: %d from %s", resp.StatusCode, summaryURL)
	}

	// Read the body
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return 0, fmt.Errorf("failed to read response body: %w", err)
	}

	// Try to decode the response
	var response Response
	if err := json.Unmarshal(body, &response); err != nil {
		// If decoding fails, include part of the response to help debugging
		preview := string(body)
		if len(preview) > 100 {
			preview = preview[:100] + "..." // Truncate to avoid huge error messages
		}
		return 0, fmt.Errorf("failed to decode response (content: %s): %w", preview, err)
	}

	return response.Total, nil
}

// Helper method to get the summary endpoint URL
func (c *Client) getSummaryURL() string {
	return c.baseURL + c.summaryPath
}
