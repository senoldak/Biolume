package core

import (
	"sync"
)

type AdaptiveTipEngine struct {
	mu           sync.RWMutex
	BaseTipSOL   float64 `json:"base_tip_sol"`
	MaxTipSOL    float64 `json:"max_tip_sol"`
	IsFastLaneOn bool    `json:"is_fast_lane_on"`
}

var DefaultAdaptiveTipEngine = &AdaptiveTipEngine{
	BaseTipSOL:   0.0005, // Standard baseline tip
	MaxTipSOL:    0.0050, // Max bribe for high-competition snipes
	IsFastLaneOn: true,
}

func (ate *AdaptiveTipEngine) CalculateOptimalTip(sniperCount int, safetyScore int) float64 {
	ate.mu.RLock()
	defer ate.mu.RUnlock()

	if !ate.IsFastLaneOn {
		return ate.BaseTipSOL
	}

	tip := ate.BaseTipSOL

	// Increase tip aggressively if many snipers are competing for the same slot
	if sniperCount >= 5 {
		tip += 0.0020
	} else if sniperCount >= 2 {
		tip += 0.0010
	}

	// Increase tip if token is a pristine diamond play (Score 90+)
	if safetyScore >= 90 {
		tip += 0.0010
	}

	if tip > ate.MaxTipSOL {
		tip = ate.MaxTipSOL
	}

	return tip
}
