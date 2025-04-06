package handlers

import (
	"encoding/json"
	"math/big"

	near "github.com/aurora-is-near/near-api-go"
)

func GetUserBalance(account *near.Account, contractID, userID string) (*big.Int, error) {
	args := map[string]interface{}{
		"account_id": userID,
	}
	argsJSON, _ := json.Marshal(args)

	options := int64(-1)
	resultRaw, err := account.ViewFunction(contractID, "ft_balance_of", argsJSON, &options)
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
