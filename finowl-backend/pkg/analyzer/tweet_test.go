package analyzer

import (
	"testing"
	"time"
)

func TestTweetAnalyzer_ProcessMessage(t *testing.T) {
	tests := []struct {
		name        string
		content     string
		authorName  string
		timestamp   time.Time
		want        Tweet
		wantValid   int // expected number of valid tweets after processing
		wantInvalid int // expected number of invalid tweets after processing
	}{
		{
			name:       "Valid tweet",
			content:    "This is a valid tweet with sufficient length",
			authorName: "User123 • Discord",
			timestamp:  time.Date(2024, 1, 1, 12, 0, 0, 0, time.UTC),
			want: Tweet{
				Content:   "This is a valid tweet with sufficient length",
				RawAuthor: "User123 • Discord",
				Author:    "User123",
				IsValid:   true,
			},
			wantValid:   1,
			wantInvalid: 0,
		},
		{
			name:       "Invalid tweet - too short",
			content:    "too short",
			authorName: "User456#1234",
			timestamp:  time.Date(2024, 1, 1, 12, 0, 0, 0, time.UTC),
			want: Tweet{
				Content:   "too short",
				RawAuthor: "User456#1234",
				Author:    "User456#1234",
				IsValid:   false,
			},
			wantValid:   0,
			wantInvalid: 1,
		},
		{
			name:       "Valid tweet with URLs and mentions",
			content:    "Valid tweet with @mention and https://example.com link that should be cleaned",
			authorName: "User789",
			timestamp:  time.Date(2024, 1, 1, 12, 0, 0, 0, time.UTC),
			want: Tweet{
				Content:   "Valid tweet with @mention and link that should be cleaned",
				RawAuthor: "User789",
				Author:    "User789",
				IsValid:   true,
			},
			wantValid:   1,
			wantInvalid: 0,
		},
		{
			name:       "Tweet with [Tweeted] pattern",
			content:    "This is a valid tweet [Tweeted] with extra content",
			authorName: "User101",
			timestamp:  time.Date(2024, 1, 1, 12, 0, 0, 0, time.UTC),
			want: Tweet{
				Content:   "This is a valid tweet",
				RawAuthor: "User101",
				Author:    "User101",
				IsValid:   true,
			},
			wantValid:   1,
			wantInvalid: 0,
		},
		{
			name:       "Empty content",
			content:    "",
			authorName: "EmptyUser",
			timestamp:  time.Date(2024, 1, 1, 12, 0, 0, 0, time.UTC),
			want: Tweet{
				Content:   "",
				RawAuthor: "EmptyUser",
				Author:    "EmptyUser",
				IsValid:   false,
			},
			wantValid:   0,
			wantInvalid: 1,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			ta := NewTweetAnalyzer()
			got := ta.ProcessMessage(tt.content, tt.authorName, tt.timestamp)

			// Check tweet content
			if got.Content != tt.want.Content {
				t.Errorf("Content = %v, want %v", got.Content, tt.want.Content)
			}

			// Check author
			if got.Author != tt.want.Author {
				t.Errorf("Author = %v, want %v", got.Author, tt.want.Author)
			}

			// Check validity
			if got.IsValid != tt.want.IsValid {
				t.Errorf("IsValid = %v, want %v", got.IsValid, tt.want.IsValid)
			}

			// Check timestamp
			if !got.Timestamp.Equal(tt.timestamp) {
				t.Errorf("Timestamp = %v, want %v", got.Timestamp, tt.timestamp)
			}

			// Check valid/invalid tweet counts
			if len(ta.validTweets) != tt.wantValid {
				t.Errorf("Valid tweets count = %v, want %v", len(ta.validTweets), tt.wantValid)
			}
			if len(ta.invalidTweets) != tt.wantInvalid {
				t.Errorf("Invalid tweets count = %v, want %v", len(ta.invalidTweets), tt.wantInvalid)
			}
		})
	}
}
