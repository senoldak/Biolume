package core

import "testing"

func TestAnalyzeTokenSecuritySafe(t *testing.T) {
	token := TokenData{
		Address:         "SafeMint11111111111111111111111111111111111",
		Symbol:          "SAFE",
		Name:            "Safe Token",
		PriceUSD:        0.001,
		MarketCap:       50000,
		LiquidityUSD:    15000,
		Top10Ratio:      0.15,
		DevDumped:       false,
		SmartMoneyCount: 4,
	}

	res := AnalyzeTokenSecurity(token, 4)
	if !res.IsSafe {
		t.Errorf("Expected: Safe token, Got: Unsafe (Risk Score: %d)", res.RiskScore)
	}
}

func TestAnalyzeTokenSecurityRugDevDump(t *testing.T) {
	token := TokenData{
		Address:         "RugMint11111111111111111111111111111111111",
		Symbol:          "RUG",
		Name:            "Rug Token",
		PriceUSD:        0.001,
		MarketCap:       50000,
		LiquidityUSD:    15000,
		Top10Ratio:      0.45,
		DevDumped:       true,
		SmartMoneyCount: 1,
	}

	res := AnalyzeTokenSecurity(token, 1)
	if res.IsSafe {
		t.Errorf("Expected: Unsafe/Rug token, Got: Safe (Risk Score: %d)", res.RiskScore)
	}
	if res.RiskScore < 45 {
		t.Errorf("Expected Risk Score >= 45, Got: %d", res.RiskScore)
	}
}
