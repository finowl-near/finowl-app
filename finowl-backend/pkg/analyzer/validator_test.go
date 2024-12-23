package analyzer

import (
	"strings"
	"testing"
)

func TestValidateTweetContent(t *testing.T) {
	tests := []struct {
		name    string
		content string
		want    bool
	}{
		{
			name:    "Valid content",
			content: "This is a valid tweet content",
			want:    true,
		},
		{
			name:    "Empty content",
			content: "",
			want:    false,
		},
		{
			name:    "Only whitespace",
			content: "    ",
			want:    false,
		},
		{
			name:    "Content too short",
			content: "hi",
			want:    false,
		},
		{
			name:    "Content with special characters",
			content: "Valid content with @#$% special chars!",
			want:    true,
		},
		{
			name:    "Content with multiple spaces",
			content: "Valid    content    with    spaces",
			want:    true,
		},
		{
			name:    "Content exactly minimum length",
			content: strings.Repeat("a", MinContentLength),
			want:    true,
		},
		{
			name:    "Content one character below minimum",
			content: strings.Repeat("a", MinContentLength-1),
			want:    false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := ValidateTweetContent(tt.content)
			if got != tt.want {
				t.Errorf("ValidateTweetContent() = %v, want %v", got, tt.want)
			}
		})
	}
}
