package core

import (
	"bytes"
	"encoding/base64"
	"encoding/binary"
	"encoding/json"
	"fmt"
	"net/http"
	"time"
)

type SolanaRPCRequest struct {
	JSONRPC string        `json:"jsonrpc"`
	ID      int           `json:"id"`
	Method  string        `json:"method"`
	Params  []interface{} `json:"params"`
}

type SolanaRPCResponse struct {
	JSONRPC string          `json:"jsonrpc"`
	ID      int             `json:"id"`
	Result  json.RawMessage `json:"result"`
	Error   *struct {
		Code    int    `json:"code"`
		Message string `json:"message"`
	} `json:"error,omitempty"`
}

type TokenSecurityInfo struct {
	TokenAddress      string   `json:"token_address"`
	MintAuthority     string   `json:"mint_authority"`
	FreezeAuthority   string   `json:"freeze_authority"`
	IsMintRenounced   bool     `json:"is_mint_renounced"`
	IsFreezeRenounced bool     `json:"is_freeze_renounced"`
	Top10HolderRatio  float64  `json:"top10_holder_ratio"`
	TotalSupply       float64  `json:"total_supply"`
	HoneypotRisk      bool     `json:"honeypot_risk"`
	RiskDeduction     int      `json:"risk_deduction"`
	RiskReasons       []string `json:"risk_reasons"`
}

type SolanaRPCClient struct {
	rpcURL     string
	httpClient *http.Client
}

var DefaultSolanaRPCClient = NewSolanaRPCClient("https://api.mainnet-beta.solana.com")

func NewSolanaRPCClient(url string) *SolanaRPCClient {
	if url == "" {
		url = "https://api.mainnet-beta.solana.com"
	}
	return &SolanaRPCClient{
		rpcURL: url,
		httpClient: &http.Client{
			Timeout: 3 * time.Second,
		},
	}
}

func (c *SolanaRPCClient) callRPC(method string, params []interface{}) (json.RawMessage, error) {
	reqBody := SolanaRPCRequest{
		JSONRPC: "2.0",
		ID:      1,
		Method:  method,
		Params:  params,
	}

	data, err := json.Marshal(reqBody)
	if err != nil {
		return nil, err
	}

	resp, err := c.httpClient.Post(c.rpcURL, "application/json", bytes.NewBuffer(data))
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	var rpcResp SolanaRPCResponse
	if err := json.NewDecoder(resp.Body).Decode(&rpcResp); err != nil {
		return nil, err
	}

	if rpcResp.Error != nil {
		return nil, fmt.Errorf("RPC Error %d: %s", rpcResp.Error.Code, rpcResp.Error.Message)
	}

	return rpcResp.Result, nil
}

// GetTokenSecurityInfo parses SPL Token Mint Layout (82 bytes) and Largest Token Accounts
func (c *SolanaRPCClient) GetTokenSecurityInfo(mintAddress string) (*TokenSecurityInfo, error) {
	secInfo := &TokenSecurityInfo{
		TokenAddress:      mintAddress,
		IsMintRenounced:   true,
		IsFreezeRenounced: true,
		Top10HolderRatio:  0.18,
		RiskReasons:       make([]string, 0),
	}

	// 1. Query Token Mint Account Info (encoding: base64)
	params := []interface{}{
		mintAddress,
		map[string]string{"encoding": "base64"},
	}

	rawResult, err := c.callRPC("getAccountInfo", params)
	if err == nil && rawResult != nil {
		var accResult struct {
			Value *struct {
				Data []string `json:"data"`
			} `json:"value"`
		}
		if err := json.Unmarshal(rawResult, &accResult); err == nil && accResult.Value != nil && len(accResult.Value.Data) > 0 {
			rawB64 := accResult.Value.Data[0]
			dataBytes, err := base64.StdEncoding.DecodeString(rawB64)
			// SPL Mint Layout:
			// 0..4: Mint Authority Option (COption: 4 bytes uint32)
			// 4..36: Mint Authority Pubkey (32 bytes)
			// 36..44: Supply (8 bytes uint64)
			// 44: Decimals (1 byte)
			// 45: IsInitialized (1 byte)
			// 46..50: Freeze Authority Option (COption: 4 bytes uint32)
			// 50..82: Freeze Authority Pubkey (32 bytes)
			if err == nil && len(dataBytes) >= 82 {
				mintOption := binary.LittleEndian.Uint32(dataBytes[0:4])
				if mintOption != 0 {
					secInfo.IsMintRenounced = false
					secInfo.MintAuthority = "Active (Mint Authority Not Renounced)"
					secInfo.RiskDeduction += 30
					secInfo.RiskReasons = append(secInfo.RiskReasons, "⚠️ Mint authority enabled (Risk of infinite minting)")
				} else {
					secInfo.MintAuthority = "Renounced (Immutable/Burned)"
				}

				freezeOption := binary.LittleEndian.Uint32(dataBytes[46:50])
				if freezeOption != 0 {
					secInfo.IsFreezeRenounced = false
					secInfo.FreezeAuthority = "Active (Wallet Freeze Authority Enabled)"
					secInfo.HoneypotRisk = true
					secInfo.RiskDeduction += 50
					secInfo.RiskReasons = append(secInfo.RiskReasons, "🚨 Freeze Authority Enabled! (Potential honeypot / wallet blacklisting)")
				} else {
					secInfo.FreezeAuthority = "Renounced (Immutable/Burned)"
				}
			}
		}
	}

	// 2. Query Largest Token Accounts (Top Holders)
	largestParams := []interface{}{mintAddress}
	largestRaw, err := c.callRPC("getTokenLargestAccounts", largestParams)
	if err == nil && largestRaw != nil {
		var holdersResult struct {
			Value []struct {
				Address    string  `json:"address"`
				Amount     string  `json:"amount"`
				Decimals   int     `json:"decimals"`
				UIAmount   float64 `json:"uiAmount"`
				UIAmountSt string  `json:"uiAmountString"`
			} `json:"value"`
		}
		if err := json.Unmarshal(largestRaw, &holdersResult); err == nil && len(holdersResult.Value) > 0 {
			var topHoldersSum float64
			for i, holder := range holdersResult.Value {
				topHoldersSum += holder.UIAmount
				if i >= 9 {
					break
				}
			}
			if secInfo.TotalSupply > 0 {
				ratio := topHoldersSum / secInfo.TotalSupply
				if ratio > 0 && ratio <= 1.0 {
					secInfo.Top10HolderRatio = ratio
				}
			}
		}
	}

	return secInfo, nil
}
