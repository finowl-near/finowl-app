package near

import (
	"encoding/base64"
	"encoding/json"
	"fmt"
	"math/big"
	"time"

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

// RegisterUserStorage calls storage_deposit for a given account
func (c *Client) RegisterUserStorage(accountID string) (map[string]interface{}, error) {
	args := map[string]interface{}{
		"account_id": accountID,
	}
	argsJSON, _ := json.Marshal(args)

	amount := new(big.Int)
	amount.SetString("1250000000000000000000", 10) // 0.00125 NEAR

	gas := uint64(50_000_000_000_000) // 50 Tgas

	return c.ownerAccount.FunctionCall(c.contractID, "storage_deposit", argsJSON, gas, *amount)
}

func (c *Client) CheckUserStatus() (map[string]interface{}, error) {
	args := map[string]interface{}{
		"function_name": "check_user_status",
	}
	argsJSON, _ := json.Marshal(args)

	resultRaw, err := c.userAccount.FunctionCall(c.contractID, "call_js_func", argsJSON, *defaultGas(), *big.NewInt(0))
	if err != nil {
		return nil, fmt.Errorf("failed to call check_user_status: %w", err)
	}

	status, ok := resultRaw["status"].(map[string]interface{})
	if !ok {
		return nil, fmt.Errorf("unexpected response format: missing status field")
	}

	if encoded, ok := status["SuccessValue"].(string); ok && encoded != "" {
		decodedBytes, err := base64.StdEncoding.DecodeString(encoded)
		if err != nil {
			return nil, fmt.Errorf("failed to decode base64 response: %w", err)
		}

		var parsed map[string]interface{}
		if err := json.Unmarshal(decodedBytes, &parsed); err != nil {
			return nil, fmt.Errorf("invalid JSON response: %w", err)
		}

		return parsed, nil
	}

	if failure, ok := status["Failure"]; ok {
		return nil, fmt.Errorf("contract call failed: %s", ExtractContractError(failure))
	}

	return nil, fmt.Errorf("unexpected result structure")
}

// defaultGas returns the default gas value for NEAR transactions
func defaultGas() *uint64 {
	g := uint64(100_000_000_000_000)
	return &g
}

// ViewFunction calls a view function on the contract
func (c *Client) ViewFunction(methodName string, args map[string]interface{}) (map[string]interface{}, error) {
	argsJSON, _ := json.Marshal(args)
	result, err := c.userAccount.ViewFunction(c.contractID, methodName, argsJSON, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to call view function %s: %w", methodName, err)
	}
	return result.(map[string]interface{}), nil
}

// GrantFreeTokens calls the smart contract function to grant free tokens to the current user
func (c *Client) GrantFreeTokens() (map[string]interface{}, error) {
	args := map[string]interface{}{
		"function_name": "grant_free_tokens",
		"timestamp":     time.Now().Unix(),
	}
	argsJSON, _ := json.Marshal(args)

	gas := uint64(50_000_000_000_000) // 50 TGas
	deposit := big.NewInt(0)

	return c.userAccount.FunctionCall(c.contractID, "call_js_func", argsJSON, gas, *deposit)
}

// StartConversation starts a new conversation by reserving tokens and storing metadata
func (c *Client) StartConversation(conversationID string, reserveAmount string) (map[string]interface{}, error) {
	args := map[string]interface{}{
		"function_name":   "start_ai_conversation",
		"conversation_id": conversationID,
		"reserve_amount":  reserveAmount,
		"timestamp":       time.Now().Unix(),
	}
	argsJSON, err := json.Marshal(args)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal args: %w", err)
	}

	gas := uint64(50_000_000_000_000) // 50 TGas
	deposit := big.NewInt(0)

	return c.userAccount.FunctionCall(c.contractID, "call_js_func", argsJSON, gas, *deposit)
}

// GetUserConversations fetches all conversation IDs for a given account
func (c *Client) GetUserConversations(accountID string) ([]string, error) {
	args := map[string]interface{}{
		"function_name": "get_user_conversations",
		"account_id":    accountID,
	}
	argsJSON, _ := json.Marshal(args)

	options := int64(-1)
	resultRaw, err := c.userAccount.ViewFunction(c.contractID, "view_js_func", argsJSON, &options)
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

	var conversations []string
	if err := json.Unmarshal(bytes, &conversations); err != nil {
		return nil, err
	}

	return conversations, nil
}

// StoreMessage stores a user message in a conversation
func (c *Client) StoreMessage(conversationID, role, content string) (map[string]interface{}, error) {
	args := map[string]interface{}{
		"function_name":   "store_message",
		"conversation_id": conversationID,
		"role":            role,
		"content":         content,
		"timestamp":       time.Now().Unix(),
	}
	argsJSON, _ := json.Marshal(args)

	gas := uint64(50_000_000_000_000) // 50 TGas
	deposit := big.NewInt(0)

	return c.userAccount.FunctionCall(c.contractID, "call_js_func", argsJSON, gas, *deposit)
}

// GetConversationHistory retrieves all messages from a given conversation ID
func (c *Client) GetConversationHistory(conversationID string) ([]map[string]interface{}, error) {
	// Prepare JSON args
	args := map[string]interface{}{
		"function_name":   "get_conversation_history",
		"conversation_id": conversationID,
	}
	argsJSON, err := json.Marshal(args)
	if err != nil {
		return nil, fmt.Errorf("failed to encode args: %w", err)
	}

	// Call view function
	resultRaw, err := c.userAccount.ViewFunction(c.contractID, "view_js_func", argsJSON, nil)
	if err != nil {
		return nil, fmt.Errorf("view function call failed: %w", err)
	}

	// The raw result comes as a byte array under resultRaw["result"]
	resultMap, ok := resultRaw.(map[string]interface{})
	if !ok {
		return nil, fmt.Errorf("unexpected result type")
	}

	rawResult, ok := resultMap["result"].([]interface{})
	if !ok {
		return nil, fmt.Errorf("missing or invalid 'result' field")
	}

	bytes := make([]byte, len(rawResult))
	for i, v := range rawResult {
		switch val := v.(type) {
		case float64:
			bytes[i] = byte(val)
		case json.Number:
			n, _ := val.Int64()
			bytes[i] = byte(n)
		default:
			return nil, fmt.Errorf("unexpected byte format at index %d", i)
		}
	}

	// Unmarshal decoded bytes into messages
	var messages []map[string]interface{}
	if err := json.Unmarshal(bytes, &messages); err != nil {
		return nil, fmt.Errorf("failed to decode conversation history: %w", err)
	}

	return messages, nil
}

func (c *Client) GetUserTokenBalance(accountID string) (string, error) {
	args := map[string]interface{}{
		"function_name": "get_user_token_balance",
		"account_id":    accountID,
	}
	argsJSON, _ := json.Marshal(args)

	// Call the view function
	resultRaw, err := c.userAccount.ViewFunction(c.contractID, "view_js_func", argsJSON, nil)
	if err != nil {
		return "", fmt.Errorf("failed to call view function: %w", err)
	}

	// Extract result field
	resultMap, ok := resultRaw.(map[string]interface{})
	if !ok {
		return "", fmt.Errorf("unexpected result type: %T", resultRaw)
	}

	resultBytes, ok := resultMap["result"].([]interface{})
	if !ok {
		return "", fmt.Errorf("missing or invalid 'result' field")
	}

	// Convert result bytes to actual bytes
	bytes := make([]byte, 0, len(resultBytes))
	for _, v := range resultBytes {
		switch val := v.(type) {
		case float64:
			bytes = append(bytes, byte(val))
		case json.Number:
			n, err := val.Int64()
			if err != nil {
				return "", fmt.Errorf("invalid number in result: %w", err)
			}
			bytes = append(bytes, byte(n))
		default:
			return "", fmt.Errorf("unexpected type in result: %T", val)
		}
	}

	// If we got no bytes, return "0" as the balance
	if len(bytes) == 0 {
		return "0", nil
	}

	// Decode the bytes into a struct with balance
	var decoded struct {
		Balance string `json:"balance"`
	}
	if err := json.Unmarshal(bytes, &decoded); err != nil {
		return "", fmt.Errorf("failed to decode balance: %w", err)
	}

	return decoded.Balance, nil
}

// GrantPaidTokens grants tokens when a user pays in NEAR
func (c *Client) GrantPaidTokens() (map[string]interface{}, error) {
	args := map[string]interface{}{
		"function_name": "grant_paid_tokens",
		"timestamp":     time.Now().Unix(),
	}
	argsJSON, _ := json.Marshal(args)
	gas := uint64(50_000_000_000_000)
	deposit := big.NewInt(0)
	return c.userAccount.FunctionCall(c.contractID, "call_js_func", argsJSON, gas, *deposit)
}

// AddTokensToConversation adds tokens to an existing conversation
func (c *Client) AddTokensToConversation(conversationID string, amount string) (map[string]interface{}, error) {
	args := map[string]interface{}{
		"function_name":   "add_tokens_to_conversation",
		"conversation_id": conversationID,
		"amount":          amount,
	}
	argsJSON, _ := json.Marshal(args)
	gas := uint64(50_000_000_000_000)
	deposit := big.NewInt(0)
	return c.userAccount.FunctionCall(c.contractID, "call_js_func", argsJSON, gas, *deposit)
}

// RefundReservedTokens refunds unused tokens to the user
func (c *Client) RefundReservedTokens(conversationID string) (map[string]interface{}, error) {
	args := map[string]interface{}{
		"function_name":   "refund_reserved_tokens",
		"conversation_id": conversationID,
	}
	argsJSON, _ := json.Marshal(args)
	gas := uint64(50_000_000_000_000)
	deposit := big.NewInt(0)
	return c.userAccount.FunctionCall(c.contractID, "call_js_func", argsJSON, gas, *deposit)
}

func (c *Client) DeductTokens(conversationID string, amount string) (map[string]interface{}, error) {
	args := map[string]interface{}{
		"function_name":   "deduct_tokens_from_conversation",
		"conversation_id": conversationID,
		"amount":          amount,
		"timestamp":       time.Now().Unix(),
	}
	argsJSON, _ := json.Marshal(args)

	gas := uint64(50_000_000_000_000)
	deposit := big.NewInt(0)

	return c.ownerAccount.FunctionCall(c.contractID, "call_js_func", argsJSON, gas, *deposit)
}

func (c *Client) GetConversationMetadata(conversationID string) (map[string]interface{}, error) {
	args := map[string]interface{}{
		"function_name":   "get_conversation_metadata",
		"conversation_id": conversationID,
	}
	argsJSON, _ := json.Marshal(args)

	options := int64(-1)
	viewResult, err := c.userAccount.ViewFunction(c.contractID, "view_js_func", argsJSON, &options)
	if err != nil {
		return nil, fmt.Errorf("view call failed: %w", err)
	}

	// Decode result
	resultMap := viewResult.(map[string]interface{})
	raw := resultMap["result"].([]interface{})

	bytes := make([]byte, len(raw))
	for i, v := range raw {
		if num, ok := v.(float64); ok {
			bytes[i] = byte(num)
		} else if n, ok := v.(json.Number); ok {
			n64, _ := n.Int64()
			bytes[i] = byte(n64)
		}
	}

	var metadata map[string]interface{}
	if err := json.Unmarshal(bytes, &metadata); err != nil {
		return nil, fmt.Errorf("failed to parse metadata: %w", err)
	}

	return metadata, nil
}
