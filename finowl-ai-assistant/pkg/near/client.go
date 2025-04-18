package near

import (
	"encoding/json"
	"fmt"
	"math/big"

	near "github.com/aurora-is-near/near-api-go"
	"github.com/aurora-is-near/near-api-go/utils"
)

// Client handles interactions with the NEAR blockchain
type Client struct {
	conn         *near.Connection
	userAccount  *near.Account
	ownerAccount *near.Account
	contractID   string
}

// NewClient creates a new NEAR blockchain client
func NewClient(userAccountID, userPrivateKey, ownerAccountID, ownerPrivateKey, contractID, rpcURL string) (*Client, error) {
	userKey, err := utils.Ed25519PrivateKeyFromString(userPrivateKey)
	if err != nil {
		return nil, fmt.Errorf("invalid user private key: %w", err)
	}

	ownerKey, err := utils.Ed25519PrivateKeyFromString(ownerPrivateKey)
	if err != nil {
		return nil, fmt.Errorf("invalid owner private key: %w", err)
	}

	conn := near.NewConnection(rpcURL)
	userAccount := near.LoadAccountWithPrivateKey(conn, userAccountID, userKey)
	ownerAccount := near.LoadAccountWithPrivateKey(conn, ownerAccountID, ownerKey)

	return &Client{
		conn:         conn,
		userAccount:  userAccount,
		ownerAccount: ownerAccount,
		contractID:   contractID,
	}, nil
}

// GetUserBalance returns the token balance for a given account
func (c *Client) GetUserBalance(accountID string) (*big.Int, error) {
	args := map[string]interface{}{
		"account_id": accountID,
	}
	argsJSON, _ := json.Marshal(args)

	options := int64(-1)
	resultRaw, err := c.userAccount.ViewFunction(c.contractID, "ft_balance_of", argsJSON, &options)
	if err != nil {
		return nil, err
	}

	resultMap := resultRaw.(map[string]interface{})
	resultBytes := resultMap["result"].([]interface{})
	bytes := make([]byte, len(resultBytes))
	for i, v := range resultBytes {
		if num, ok := v.(float64); ok {
			bytes[i] = byte(num)
		} else if n, ok := v.(json.Number); ok {
			n64, _ := n.Int64()
			bytes[i] = byte(n64)
		}
	}

	var balanceStr string
	if err := json.Unmarshal(bytes, &balanceStr); err != nil {
		return nil, err
	}

	balance := new(big.Int)
	balance.SetString(balanceStr, 10)
	return balance, nil
}

// RegisterAccount registers a new account with the contract
func (c *Client) RegisterAccount(accountID string) (map[string]interface{}, error) {
	args := map[string]interface{}{"account_id": accountID}
	argsJSON, _ := json.Marshal(args)

	amount := new(big.Int)
	amount.SetString("10000000000000000000000", 10)

	gas := uint64(100_000_000_000_000)

	return c.ownerAccount.FunctionCall(c.contractID, "storage_deposit", argsJSON, gas, *amount)
}

// CreateConversation starts a new AI conversation
func (c *Client) CreateConversation(conversationID string) (map[string]interface{}, error) {
	args := map[string]interface{}{
		"function_name":   "start_ai_conversation",
		"conversation_id": conversationID,
	}
	argsJSON, _ := json.Marshal(args)
	gas := uint64(100_000_000_000_000)
	zero := big.NewInt(0)

	return c.userAccount.FunctionCall(c.contractID, "call_js_func", argsJSON, gas, *zero)
}

// FundUser transfers tokens to a user account
func (c *Client) FundUser(receiverID string, amount string) error {
	transferArgs := map[string]interface{}{
		"receiver_id": receiverID,
		"amount":      amount,
	}
	transferJSON, _ := json.Marshal(transferArgs)
	gas := uint64(100_000_000_000_000)
	oneYocto := big.NewInt(1)

	_, err := c.ownerAccount.FunctionCall(c.contractID, "ft_transfer", transferJSON, gas, *oneYocto)
	return err
}

// ExtractContractError extracts a readable error message from a contract failure
func ExtractContractError(failure interface{}) string {
	failureMap, ok := failure.(map[string]interface{})
	if !ok {
		return "Unknown failure"
	}
	if actionErr, ok := failureMap["ActionError"].(map[string]interface{}); ok {
		if kind, ok := actionErr["kind"].(map[string]interface{}); ok {
			if fnErr, ok := kind["FunctionCallError"].(map[string]interface{}); ok {
				if execErr, ok := fnErr["ExecutionError"].(string); ok {
					return execErr
				}
			}
		}
	}
	return "Unknown contract failure"
}

// GetUserAccountID returns the user's account ID
func (c *Client) GetUserAccountID() string {
	return c.userAccount.AccountID()
}
