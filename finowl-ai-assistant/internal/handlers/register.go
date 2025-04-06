package handlers

import (
	"encoding/json"
	"fmt"
	"math/big"
	"net/http"
	"os"

	near "github.com/aurora-is-near/near-api-go"
	"github.com/aurora-is-near/near-api-go/utils"
)

type RegisterRequest struct {
	AccountID string `json:"account_id"`
}

func RegisterHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Only POST allowed", http.StatusMethodNotAllowed)
		return
	}

	var req RegisterRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil || req.AccountID == "" {
		http.Error(w, "Invalid request", http.StatusBadRequest)
		return
	}

	ownerID := os.Getenv("NEAR_OWNER_ACCOUNT_ID")
	ownerPK := os.Getenv("NEAR_OWNER_PRIVATE_KEY")
	contractID := os.Getenv("NEAR_CONTRACT_ID")
	rpc := os.Getenv("NEAR_RPC_URL")

	ownerKey, err := utils.Ed25519PrivateKeyFromString(ownerPK)
	if err != nil {
		http.Error(w, "Invalid private key", http.StatusInternalServerError)
		return
	}

	conn := near.NewConnection(rpc)
	signer := near.LoadAccountWithPrivateKey(conn, ownerID, ownerKey)

	args := map[string]interface{}{"account_id": req.AccountID}
	argsJSON, _ := json.Marshal(args)

	amount := new(big.Int)
	amount.SetString("10000000000000000000000", 10)

	gas := uint64(100_000_000_000_000)

	result, err := signer.FunctionCall(contractID, "storage_deposit", argsJSON, gas, *amount)
	if err != nil {
		http.Error(w, fmt.Sprintf("Registration failed: %v", err), http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(result)
}
