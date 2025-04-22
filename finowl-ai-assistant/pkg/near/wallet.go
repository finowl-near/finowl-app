package near

import (
	"encoding/json"
	"fmt"
	"math/big"
)

// TransactionRequest represents a transaction request that can be signed by the wallet
type TransactionRequest struct {
	ContractID   string                 `json:"contract_id"`
	MethodName   string                 `json:"method_name"`
	Args         map[string]interface{} `json:"args"`
	Gas          string                 `json:"gas"`
	Deposit      string                 `json:"deposit"`
	CallbackURL  string                 `json:"callback_url,omitempty"`
	Meta         map[string]string      `json:"meta,omitempty"`
	NetworkID    string                 `json:"network_id,omitempty"`
	WalletURLs   map[string]string      `json:"wallet_urls,omitempty"`
	FailureURL   string                 `json:"failure_url,omitempty"`
	JSFunctionID string                 `json:"js_function_id,omitempty"`
}

// WalletAdapter provides methods for generating wallet-compatible transaction requests
type WalletAdapter struct {
	contractID string
	networkID  string
	walletURLs map[string]string
}

// NewWalletAdapter creates a new wallet adapter
func NewWalletAdapter(contractID, networkID string) *WalletAdapter {
	// Default wallet URLs
	walletURLs := map[string]string{
		"near":   "https://wallet.near.org",
		"sender": "https://sender.org",
		"meteor": "https://wallet.meteorwallet.app",
	}

	// Use testnet URLs if specified
	if networkID == "testnet" {
		walletURLs = map[string]string{
			"near":   "https://wallet.testnet.near.org",
			"sender": "https://testnet.sender.org",
			"meteor": "https://wallet.meteorwallet.app",
		}
	}

	return &WalletAdapter{
		contractID: contractID,
		networkID:  networkID,
		walletURLs: walletURLs,
	}
}

// GenerateCheckUserStatusRequest creates a transaction request for checking user status
func (w *WalletAdapter) GenerateCheckUserStatusRequest(callbackURL string) *TransactionRequest {
	args := map[string]interface{}{
		"function_name": "check_user_status",
	}

	return &TransactionRequest{
		ContractID:  w.contractID,
		MethodName:  "call_js_func",
		Args:        args,
		Gas:         "30000000000000", // 30 Tgas
		Deposit:     "0",
		CallbackURL: callbackURL,
		NetworkID:   w.networkID,
		WalletURLs:  w.walletURLs,
	}
}

// GenerateGrantFreeTokensRequest creates a transaction request for granting free tokens
func (w *WalletAdapter) GenerateGrantFreeTokensRequest(callbackURL string) *TransactionRequest {
	args := map[string]interface{}{
		"function_name": "grant_free_tokens",
	}

	return &TransactionRequest{
		ContractID:  w.contractID,
		MethodName:  "call_js_func",
		Args:        args,
		Gas:         "30000000000000", // 30 Tgas
		Deposit:     "0",
		CallbackURL: callbackURL,
		NetworkID:   w.networkID,
		WalletURLs:  w.walletURLs,
	}
}

// GenerateStartConversationRequest creates a transaction request for starting a conversation
func (w *WalletAdapter) GenerateStartConversationRequest(conversationID, reserveAmount, callbackURL string) *TransactionRequest {
	args := map[string]interface{}{
		"function_name":   "start_ai_conversation",
		"conversation_id": conversationID,
		"reserve_amount":  reserveAmount,
	}

	return &TransactionRequest{
		ContractID:  w.contractID,
		MethodName:  "call_js_func",
		Args:        args,
		Gas:         "50000000000000", // 50 Tgas
		Deposit:     "0",
		CallbackURL: callbackURL,
		NetworkID:   w.networkID,
		WalletURLs:  w.walletURLs,
	}
}

// GenerateStoreMessageRequest creates a transaction request for storing a message
func (w *WalletAdapter) GenerateStoreMessageRequest(conversationID, role, content, callbackURL string) *TransactionRequest {
	args := map[string]interface{}{
		"function_name":   "store_message",
		"conversation_id": conversationID,
		"role":            role,
		"content":         content,
	}

	return &TransactionRequest{
		ContractID:  w.contractID,
		MethodName:  "call_js_func",
		Args:        args,
		Gas:         "50000000000000", // 50 Tgas
		Deposit:     "0",
		CallbackURL: callbackURL,
		NetworkID:   w.networkID,
		WalletURLs:  w.walletURLs,
	}
}

// GenerateAddTokensToConversationRequest creates a transaction request for adding tokens
func (w *WalletAdapter) GenerateAddTokensToConversationRequest(conversationID, amount, callbackURL string) *TransactionRequest {
	args := map[string]interface{}{
		"function_name":   "add_tokens_to_conversation",
		"conversation_id": conversationID,
		"amount":          amount,
	}

	return &TransactionRequest{
		ContractID:  w.contractID,
		MethodName:  "call_js_func",
		Args:        args,
		Gas:         "50000000000000", // 50 Tgas
		Deposit:     "0",
		CallbackURL: callbackURL,
		NetworkID:   w.networkID,
		WalletURLs:  w.walletURLs,
	}
}

// GenerateRefundTokensRequest creates a transaction request for refunding tokens
func (w *WalletAdapter) GenerateRefundTokensRequest(conversationID, callbackURL string) *TransactionRequest {
	args := map[string]interface{}{
		"function_name":   "refund_reserved_tokens",
		"conversation_id": conversationID,
	}

	return &TransactionRequest{
		ContractID:  w.contractID,
		MethodName:  "call_js_func",
		Args:        args,
		Gas:         "30000000000000", // 30 Tgas
		Deposit:     "0",
		CallbackURL: callbackURL,
		NetworkID:   w.networkID,
		WalletURLs:  w.walletURLs,
	}
}

// GenerateWalletURL generates a URL that can be used to redirect the user to their wallet
func (w *WalletAdapter) GenerateWalletURL(req *TransactionRequest, walletType string) (string, error) {
	// Get the wallet base URL
	baseURL, ok := w.walletURLs[walletType]
	if !ok {
		return "", fmt.Errorf("unknown wallet type: %s", walletType)
	}

	// Convert request to JSON
	reqJSON, err := json.Marshal(req)
	if err != nil {
		return "", fmt.Errorf("failed to marshal request: %w", err)
	}

	// Base64 encode the JSON
	// In production, you would implement proper URL-safe encoding here

	return fmt.Sprintf("%s/sign?transactions=%s", baseURL, string(reqJSON)), nil
}

// FormatAmount formats a big.Int amount as a string
func FormatAmount(amount *big.Int) string {
	return amount.String()
}
