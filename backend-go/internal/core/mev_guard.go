package core

import (
	"fmt"
	"sync"
)

type MEVProtectionConfig struct {
	AntiSandwichEnabled  bool    `json:"anti_sandwich_enabled"`
	RequireJitoBundle    bool    `json:"require_jito_bundle"`
	MaxAllowedSlippage   float64 `json:"max_allowed_slippage"`   // Max slippage ceiling (e.g. 1.5%)
	JitoTipSOL           float64 `json:"jito_tip_sol"`           // Jito Validator Tip
	ProtectedTradesCount int     `json:"protected_trades_count"`
	BlockedSandwiches    int     `json:"blocked_sandwiches"`
}

type MEVGuard struct {
	mu     sync.RWMutex
	Config MEVProtectionConfig
}

var DefaultMEVGuard = &MEVGuard{
	Config: MEVProtectionConfig{
		AntiSandwichEnabled:  true,
		RequireJitoBundle:    true,
		MaxAllowedSlippage:   1.5,
		JitoTipSOL:           0.0005,
		ProtectedTradesCount: 0,
		BlockedSandwiches:    0,
	},
}

func (mg *MEVGuard) AnalyzeTxForMEV(tokenAddress string, slippage float64, priceImpact float64) (bool, string, float64) {
	mg.mu.Lock()
	defer mg.mu.Unlock()

	if !mg.Config.AntiSandwichEnabled {
		return true, "MEV Guard Disabled", slippage
	}

	// 1. Price impact & Slippage check (Sandwich sandwich bot trap)
	if priceImpact > 4.0 {
		mg.Config.BlockedSandwiches++
		return false, fmt.Sprintf("High price impact (%.1f%% > 4.0%%) - High Sandwich Risk", priceImpact), slippage
	}

	// 2. Enforce strict max slippage clamp
	effectiveSlippage := slippage
	if effectiveSlippage > mg.Config.MaxAllowedSlippage {
		effectiveSlippage = mg.Config.MaxAllowedSlippage
	}

	mg.Config.ProtectedTradesCount++
	return true, "Protected via Jito Private Mempool Bundle", effectiveSlippage
}

func (mg *MEVGuard) GetStatus() MEVProtectionConfig {
	mg.mu.RLock()
	defer mg.mu.RUnlock()
	return mg.Config
}
