package core

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"time"
)

type JupiterQuoteResponse struct {
	InputMint            string `json:"inputMint"`
	InAmount             string `json:"inAmount"`
	OutputMint           string `json:"outputMint"`
	OutAmount            string `json:"outAmount"`
	OtherAmountThreshold string `json:"otherAmountThreshold"`
	SwapMode             string `json:"swapMode"`
	SlippageBps          int    `json:"slippageBps"`
	PriceImpactPct       string `json:"priceImpactPct"`
	RoutePlan            []struct {
		SwapInfo struct {
			AmmKey     string `json:"ammKey"`
			Label      string `json:"label"`
			InputMint  string `json:"inputMint"`
			OutputMint string `json:"outputMint"`
			InAmount   string `json:"inAmount"`
			OutAmount  string `json:"outAmount"`
			FeeAmount  string `json:"feeAmount"`
			FeeMint    string `json:"feeMint"`
		} `json:"swapInfo"`
		Percent int `json:"percent"`
	} `json:"routePlan"`
}

type JupiterSwapResponse struct {
	SwapTransaction      string `json:"swapTransaction"`
	LastValidBlockHeight int64  `json:"lastValidBlockHeight"`
	PriorityFeeInLamports int64  `json:"priorityFeeInLamports"`
}

type JupiterClient struct {
	quoteAPI   string
	swapAPI    string
	solMint    string
	httpClient *http.Client
}

var DefaultJupiterClient = &JupiterClient{
	quoteAPI: "https://quote-api.jup.ag/v6/quote",
	swapAPI:  "https://quote-api.jup.ag/v6/swap",
	solMint:  "So11111111111111111111111111111111111111112",
	httpClient: &http.Client{
		Timeout: 4 * time.Second,
	},
}

// GetQuote fetches the best route for SOL -> Target Token or Target Token -> SOL
func (j *JupiterClient) GetQuote(outputMint string, amountSOL float64, slippageBps int) (*JupiterQuoteResponse, error) {
	if slippageBps <= 0 {
		slippageBps = 100 // %1.0
	}
	lamports := int64(amountSOL * 1_000_000_000)
	url := fmt.Sprintf("%s?inputMint=%s&outputMint=%s&amount=%d&slippageBps=%d",
		j.quoteAPI, j.solMint, outputMint, lamports, slippageBps)

	resp, err := j.httpClient.Get(url)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("jupiter quote status: %d", resp.StatusCode)
	}

	var quote JupiterQuoteResponse
	if err := json.NewDecoder(resp.Body).Decode(&quote); err != nil {
		return nil, err
	}

	return &quote, nil
}

// BuildSwapTransaction produces the signed transaction wire payload
func (j *JupiterClient) BuildSwapTransaction(quote *JupiterQuoteResponse, userPublicKey string) (*JupiterSwapResponse, error) {
	payload := map[string]interface{}{
		"quoteResponse":       quote,
		"userPublicKey":       userPublicKey,
		"wrapAndUnwrapSol":    true,
		"computeUnitPriceMicroLamports": 50000, // Priority tip for fast block inclusion
	}

	bodyData, err := json.Marshal(payload)
	if err != nil {
		return nil, err
	}

	resp, err := j.httpClient.Post(j.swapAPI, "application/json", bytes.NewBuffer(bodyData))
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("jupiter swap build status: %d", resp.StatusCode)
	}

	var swapResp JupiterSwapResponse
	if err := json.NewDecoder(resp.Body).Decode(&swapResp); err != nil {
		return nil, err
	}

	return &swapResp, nil
}
