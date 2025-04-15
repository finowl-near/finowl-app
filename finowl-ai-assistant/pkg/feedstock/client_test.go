package feedstock_test

import (
	"finowl-ai-assistant/pkg/feedstock"
	"fmt"
	"net/http"
	"net/http/httptest"
	"strconv"
	"testing"
	"time"
)

func TestGetSummary(t *testing.T) {
	// Setup mock server
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Check request path and method
		if r.URL.Path != "/summary" {
			t.Errorf("Expected request to '/summary', got '%s'", r.URL.Path)
		}

		// Check for expected query parameters
		id := r.URL.Query().Get("id")
		if id != "123" {
			t.Errorf("Expected id=123, got id=%s", id)
		}

		// Return mock response
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		w.Write([]byte(`{
			"summary": {
				"id": 123,
				"timestamp": "2023-05-15T14:30:00Z",
				"content": "Bitcoin reached a new all-time high today."
			},
			"total": 1
		}`))
	}))
	defer server.Close()

	// Create client with the mock server URL
	client := feedstock.NewClient(server.URL, "/summary", 60*time.Second)

	// Call the method being tested
	summary, err := client.GetSummary(123)
	if err != nil {
		t.Fatalf("Expected no error, got %v", err)
	}

	// Check each field is populated correctly
	if summary.ID != 123 {
		t.Errorf("Expected ID 123, got %d", summary.ID)
	}

	expectedTime, _ := time.Parse(time.RFC3339, "2023-05-15T14:30:00Z")
	if !summary.Timestamp.Equal(expectedTime) {
		t.Errorf("Expected timestamp %v, got %v", expectedTime, summary.Timestamp)
	}

	expectedContent := "Bitcoin reached a new all-time high today."
	if summary.Content != expectedContent {
		t.Errorf("Expected content '%s', got '%s'", expectedContent, summary.Content)
	}
}

func TestFetchSummaries(t *testing.T) {
	// Track requested IDs to verify all were requested
	requestedIDs := make(map[int]bool)

	// Setup mock server
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Extract ID from query parameters
		idStr := r.URL.Query().Get("id")
		id, err := strconv.Atoi(idStr)
		if err != nil {
			t.Errorf("Invalid ID parameter: %s", idStr)
			w.WriteHeader(http.StatusBadRequest)
			return
		}

		// Record that this ID was requested
		requestedIDs[id] = true

		// Return different mock responses based on the ID
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)

		// Create a response with the ID embedded in the content
		response := fmt.Sprintf(`{
			"summary": {
				"id": %d,
				"timestamp": "2023-05-15T14:30:00Z",
				"content": "Summary content for ID %d"
			},
			"total": 1
		}`, id, id)

		w.Write([]byte(response))
	}))
	defer server.Close()

	// Create client with the mock server URL
	client := feedstock.NewClient(server.URL, "/summary", 60*time.Second)

	// Define test parameters
	startID := 200
	count := 5

	// Call the method being tested
	summaries, err := client.FetchSummaries(startID, count)
	if err != nil {
		t.Fatalf("Expected no error, got %v", err)
	}

	// Check we got the expected number of summaries
	if len(summaries) != count {
		t.Errorf("Expected %d summaries, got %d", count, len(summaries))
	}

	// Check each expected ID was requested
	for i := 0; i < count; i++ {
		id := startID - i
		if !requestedIDs[id] {
			t.Errorf("ID %d was not requested", id)
		}
	}

	// Create a map for easier lookup
	summaryMap := make(map[int]feedstock.Summary)
	for _, summary := range summaries {
		summaryMap[summary.ID] = summary
	}

	// Check each summary has the correct data
	for i := 0; i < count; i++ {
		id := startID - i

		summary, exists := summaryMap[id]
		if !exists {
			t.Errorf("Summary with ID %d not found in results", id)
			continue
		}

		// Check ID
		if summary.ID != id {
			t.Errorf("Expected ID %d, got %d", id, summary.ID)
		}

		// Check timestamp
		expectedTime, _ := time.Parse(time.RFC3339, "2023-05-15T14:30:00Z")
		if !summary.Timestamp.Equal(expectedTime) {
			t.Errorf("For ID %d: Expected timestamp %v, got %v", id, expectedTime, summary.Timestamp)
		}

		// Check content
		expectedContent := fmt.Sprintf("Summary content for ID %d", id)
		if summary.Content != expectedContent {
			t.Errorf("For ID %d: Expected content '%s', got '%s'", id, expectedContent, summary.Content)
		}
	}
}

func TestGetLastSummaryID(t *testing.T) {
	// Create a mock server
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Check request path
		if r.URL.Path != "/summary" {
			t.Errorf("Expected request to '/summary', got '%s'", r.URL.Path)
		}

		// Return mock response with total field set to 500
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		w.Write([]byte(`{
			"summary": {
				"id": 500,
				"timestamp": "2023-05-15T14:30:00Z",
				"content": "Latest summary content"
			},
			"total": 500
		}`))
	}))
	defer server.Close()

	// Create a client with the mock server URL
	client := feedstock.NewClient(server.URL, "/summary", 60*time.Second)

	// Call the client method being tested
	lastID, err := client.GetLastSummaryID()
	if err != nil {
		t.Fatalf("Expected no error, got %v", err)
	}

	// Check the returned ID matches the expected value
	expectedID := 500
	if lastID != expectedID {
		t.Errorf("Expected last summary ID to be %d, got %d", expectedID, lastID)
	}

	// Note: Testing the global function GetLastSummaryID() would require
	// changing environment variables or mocking the HTTP client, which is
	// beyond the scope of this test. The client.GetLastSummaryID() method
	// is effectively the same implementation.
}
