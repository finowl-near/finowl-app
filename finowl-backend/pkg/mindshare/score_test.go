package mindshare

import (
	"encoding/json"
	"finowl-backend/pkg/ticker"
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestMergeMentionDetails(t *testing.T) {
	// Test input data
	existingJSON := `{
        "influencers": {
            "moneyl0rd": {
                "tier": 2,
                "content": "One of my high conviction play on ETH $HASHAI Hashai one of the top AI/DePIN projects Millions of $ has been invested in facilities and more than $1 million rewards paid out from the community share pool so far",
                "tweet_link": "https://twitter.com/moneyl0rd/status/1875921776129216582"
            }
        }
    }`

	newJSON := `{
        "influencers": {
            "prim 🪠": {
                "tier": 3,
                "content": "an update on the past 7 days with $HASHAI",
                "tweet_link": "https://twitter.com/0xprimdotfun/status/1875901000697159985"
            }
        }
    }`

	expectedJSON := `{
        "influencers": {
            "moneyl0rd": {
                "tier": 2,
                "content": "One of my high conviction play on ETH $HASHAI Hashai one of the top AI/DePIN projects Millions of $ has been invested in facilities and more than $1 million rewards paid out from the community share pool so far",
                "tweet_link": "https://twitter.com/moneyl0rd/status/1875921776129216582"
            },
            "prim 🪠": {
                "tier": 3,
                "content": "an update on the past 7 days with $HASHAI",
                "tweet_link": "https://twitter.com/0xprimdotfun/status/1875901000697159985"
            }
        }
    }`

	// Parse JSON into MentionDetails
	var existing, new, expected ticker.MentionDetails
	err := json.Unmarshal([]byte(existingJSON), &existing)
	assert.NoError(t, err)

	err = json.Unmarshal([]byte(newJSON), &new)
	assert.NoError(t, err)

	err = json.Unmarshal([]byte(expectedJSON), &expected)
	assert.NoError(t, err)

	// Merge the details
	merged := MergeMentionDetails(existing, new)

	// Convert merged result back to JSON for comparison
	mergedJSON, err := json.Marshal(merged)
	assert.NoError(t, err)

	expectedJSONBytes, err := json.Marshal(expected)
	assert.NoError(t, err)

	// Assert JSONs are equal
	assert.JSONEq(t, string(expectedJSONBytes), string(mergedJSON))
}

// TestCalculateScore tests various scenarios for mindshare score calculation
// It covers different combinations of influencer tiers and validates the scoring algorithm
// including edge cases and bonus multipliers.
func TestCalculateScore(t *testing.T) {
	tests := []struct {
		name          string
		mentionsJSON  string
		expectedScore float64
		shouldError   bool
		description   string
	}{
		{
			name: "Single Tier 1 Influencer", // 1 influencer should be high alpha  : 2 tier2 should be high alpha
			mentionsJSON: `{
                "influencers": {
                    "whale1": {"tier": 1, "content": "test", "tweet_link": "link"}
                }
            }`,
			expectedScore: 614.0, // 95 * 1.2 (single T1 bonus)
			description:   "Single top-tier influencer should get base score with T1 bonus",
		},
		{
			name: "Multiple Tier 1 Influencers",
			mentionsJSON: `{
		        "influencers": {
		            "whale1": {"tier": 1, "content": "test", "tweet_link": "link"},
		            "whale2": {"tier": 1, "content": "test", "tweet_link": "link"}
		        }
		    }`,
			expectedScore: 1597, // (95 * 2) * 1.2 * 1.3 (multiple T1 bonus)
			description:   "Multiple top-tier influencers should get both T1 bonuses",
		},
		// {
		// 	name: "Single Tier 2 Influencer", // 1 influencer should be high alpha  : 2 tier2 should be high alpha
		// 	mentionsJSON: `{
		//         "influencers": {
		//             "mid1": {"tier": 2, "content": "test", "tweet_link": "link"}
		//         }
		//     }`,
		// 	expectedScore: 614.0, // 95 * 1.2 (single T1 bonus)
		// 	description:   "Single top-tier influencer should get base score with T1 bonus",
		// },
		{
			name: "Multiple Tier 2 Influencers",
			mentionsJSON: `{
		        "influencers": {
		            "mid1": {"tier": 2, "content": "test", "tweet_link": "link"},
		            "mid2": {"tier": 2, "content": "test", "tweet_link": "link"}
		        }
		    }`,
			expectedScore: 807, // (95 * 2) * 1.2 * 1.3 (multiple T1 bonus)
			description:   "Multiple top-tier influencers should get both T1 bonuses",
		},
		// {
		// 	name: "Multiple Tier 1 Influencers",
		// 	mentionsJSON: `{
		//         "influencers": {
		//             "whale1": {"tier": 1, "content": "test", "tweet_link": "link"},
		//             "whale2": {"tier": 1, "content": "test", "tweet_link": "link"},
		// 			"whale3": {"tier": 1, "content": "test", "tweet_link": "link"},
		//             "whale4": {"tier": 1, "content": "test", "tweet_link": "link"},
		// 			"whale5": {"tier": 1, "content": "test", "tweet_link": "link"}

		//         }
		//     }`,
		// 	expectedScore: 871.5, // (95 * 2) * 1.2 * 1.3 (multiple T1 bonus)
		// 	description:   "Multiple top-tier influencers should get both T1 bonuses",
		// },
		// {
		// 	name: "Mixed Tiers",
		// 	mentionsJSON: `{
		//         "influencers": {
		//             "whale1": {"tier": 1, "content": "test", "tweet_link": "link"},
		//             "mid1": {"tier": 2, "content": "test", "tweet_link": "link"},
		//             "small1": {"tier": 3, "content": "test", "tweet_link": "link"}
		//         }
		//     }`,
		// 	expectedScore: 232.8, // (95 + 55 + 15) * 1.2 (single T1 bonus)
		// 	description:   "Mix of all tiers should combine weights with T1 bonus",
		// },
		// {
		// 	name: "Only Tier 2 and 3",
		// 	mentionsJSON: `{
		//         "influencers": {
		//             "mid1": {"tier": 2, "content": "test", "tweet_link": "link"},
		//             "small1": {"tier": 3, "content": "test", "tweet_link": "link"}
		//         }
		//     }`,
		// 	expectedScore: 82.2, // 55 + 15 (no bonus)
		// 	description:   "Lower tiers should not receive any bonus multipliers",
		// },
		// {
		// 	name: "High Volume Mixed",
		// 	mentionsJSON: `{
		//         "influencers": {
		//             "whale1": {"tier": 1, "content": "test", "tweet_link": "link"},
		//             "whale2": {"tier": 1, "content": "test", "tweet_link": "link"},
		//             "mid1": {"tier": 2, "content": "test", "tweet_link": "link"},
		//             "mid2": {"tier": 2, "content": "test", "tweet_link": "link"},
		//             "small1": {"tier": 3, "content": "test", "tweet_link": "link"},
		//             "small2": {"tier": 3, "content": "test", "tweet_link": "link"}
		//         }
		//     }`,
		// 	expectedScore: 605, // ((95*2 + 55*2 + 15*2) * 1.2 * 1.3)
		// 	description:   "High volume of mentions across tiers should scale appropriately",
		// },
		// {
		// 	name:          "Empty Mentions",
		// 	mentionsJSON:  `{"influencers": {}}`,
		// 	expectedScore: 0,
		// 	shouldError:   true,
		// 	description:   "Empty mentions should return error",
		// },
		// {
		// 	name: "Invalid Tier",
		// 	mentionsJSON: `{
		//         "influencers": {
		//             "invalid": {"tier": 4, "content": "test", "tweet_link": "link"}
		//         }
		//     }`,
		// 	expectedScore: 0,
		// 	shouldError:   true,
		// 	description:   "Invalid tier should return error",
		// },
		// {
		// 	name: "Maximum Score Test",
		// 	mentionsJSON: `{
		//         "influencers": {
		//             "whale1": {"tier": 1, "content": "test", "tweet_link": "link"},
		//             "whale2": {"tier": 1, "content": "test", "tweet_link": "link"},
		//             "whale3": {"tier": 1, "content": "test", "tweet_link": "link"},
		//             "whale4": {"tier": 1, "content": "test", "tweet_link": "link"},
		//             "whale5": {"tier": 1, "content": "test", "tweet_link": "link"},
		//             "whale6": {"tier": 1, "content": "test", "tweet_link": "link"}
		//         }
		//     }`,
		// 	expectedScore: 1000.0, // Should cap at MaxScore
		// 	description:   "Should cap at maximum score",
		// },
		// {
		// 	name: "multiple Tier 2",
		// 	mentionsJSON: `{
		//         "influencers": {
		//             "mid1": {"tier": 2, "content": "test", "tweet_link": "link"},
		// 			 "mid2": {"tier": 2, "content": "test", "tweet_link": "link"},
		// 			  "mid3": {"tier": 2, "content": "test", "tweet_link": "link"},
		// 			   "mid4": {"tier": 2, "content": "test", "tweet_link": "link"},
		// 			    "mid5": {"tier": 2, "content": "test", "tweet_link": "link"},
		// 				 "mid6": {"tier": 2, "content": "test", "tweet_link": "link"},
		// 				  "mid7": {"tier": 2, "content": "test", "tweet_link": "link"},
		// 				   "mid8": {"tier": 2, "content": "test", "tweet_link": "link"}

		//         }
		//     }`,
		// 	expectedScore: 64.0,
		// 	description:   "Single mid-tier influencer base score",
		// },
		// {
		// 	name: "Single Tier 3",
		// 	mentionsJSON: `{
		//         "influencers": {
		//             "small1": {"tier": 3, "content": "test", "tweet_link": "link"}
		//         }
		//     }`,
		// 	expectedScore: 18.0,
		// 	description:   "Single low-tier influencer base score",
		// },
		// {
		// 	name: "multiple Tier 3",
		// 	mentionsJSON: `{
		//         "influencers": {
		//             "small1": {"tier": 3, "content": "test", "tweet_link": "link"},
		// 			"small2": {"tier": 3, "content": "test", "tweet_link": "link"},
		//             "small3": {"tier": 3, "content": "test", "tweet_link": "link"},
		// 			"small4": {"tier": 3, "content": "test", "tweet_link": "link"},
		//             "small5": {"tier": 3, "content": "test", "tweet_link": "link"},
		// 			"small6": {"tier": 3, "content": "test", "tweet_link": "link"}

		//         }
		//     }`,
		// 	expectedScore: 105.0,
		// 	description:   "Single low-tier influencer base score",
		// },
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			var mentions ticker.MentionDetails
			err := json.Unmarshal([]byte(tt.mentionsJSON), &mentions)
			assert.NoError(t, err, "Failed to unmarshal test JSON")

			score, err := CalculateScore(mentions, TotalTierCounts)

			if tt.shouldError {
				assert.Error(t, err)
				return
			}

			assert.NoError(t, err)
			assert.InDelta(t, tt.expectedScore, score, 2.1,
				"Score calculation failed for %s: expected %f, got %f",
				tt.description, tt.expectedScore, score)

		})
	}
}
