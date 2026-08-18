package core

import (
	"sync"
	"time"
)

type VolumePoint struct {
	Timestamp time.Time `json:"timestamp"`
	VolumeUSD float64   `json:"volume_usd"`
	IsBuy     bool      `json:"is_buy"`
}

type TokenMomentumStats struct {
	TokenAddress      string        `json:"token_address"`
	Symbol            string        `json:"symbol"`
	Volume1mUSD       float64       `json:"volume_1m_usd"`
	Volume5mUSD       float64       `json:"volume_5m_usd"`
	VolumeSurgeRatio  float64       `json:"volume_surge_ratio"` // 1m Vol / (5m Vol / 5)
	BuyRatio          float64       `json:"buy_ratio"`          // Buy vol / Total vol
	IsSurging         bool          `json:"is_surging"`
	LastUpdated       time.Time     `json:"last_updated"`
	RecentTransactions []VolumePoint `json:"recent_transactions"`
}

type MomentumDetector struct {
	mu     sync.RWMutex
	tokens map[string]*TokenMomentumStats
}

var DefaultMomentumDetector = &MomentumDetector{
	tokens: make(map[string]*TokenMomentumStats),
}

func (md *MomentumDetector) RecordTrade(tokenAddress, symbol string, volumeUSD float64, isBuy bool) TokenMomentumStats {
	md.mu.Lock()
	defer md.mu.Unlock()

	stat, exists := md.tokens[tokenAddress]
	if !exists {
		stat = &TokenMomentumStats{
			TokenAddress:       tokenAddress,
			Symbol:             symbol,
			RecentTransactions: make([]VolumePoint, 0),
		}
		md.tokens[tokenAddress] = stat
	}

	now := time.Now()
	stat.RecentTransactions = append(stat.RecentTransactions, VolumePoint{
		Timestamp: now,
		VolumeUSD: volumeUSD,
		IsBuy:     isBuy,
	})

	// Filter transactions older than 5 minutes
	cutoff5m := now.Add(-5 * time.Minute)
	cutoff1m := now.Add(-1 * time.Minute)

	validTxs := make([]VolumePoint, 0)
	var vol1m, vol5m, buyVol float64

	for _, tx := range stat.RecentTransactions {
		if tx.Timestamp.After(cutoff5m) {
			validTxs = append(validTxs, tx)
			vol5m += tx.VolumeUSD
			if tx.Timestamp.After(cutoff1m) {
				vol1m += tx.VolumeUSD
				if tx.IsBuy {
					buyVol += tx.VolumeUSD
				}
			}
		}
	}
	stat.RecentTransactions = validTxs
	stat.Volume1mUSD = vol1m
	stat.Volume5mUSD = vol5m
	stat.LastUpdated = now

	// Calculate Surge Ratio: Volume in last 1m vs 5m average minute rate
	avgRatePerMin := (vol5m - vol1m) / 4.0
	if avgRatePerMin <= 0 {
		avgRatePerMin = max(vol5m/5.0, 100.0)
	}

	surgeRatio := vol1m / avgRatePerMin
	stat.VolumeSurgeRatio = surgeRatio

	buyRatio := 0.5
	if vol1m > 0 {
		buyRatio = buyVol / vol1m
	}
	stat.BuyRatio = buyRatio
	stat.IsSurging = surgeRatio >= 2.5 && buyRatio >= 0.65 && vol1m >= 1500

	return *stat
}

func (md *MomentumDetector) GetSurgingTokens() []TokenMomentumStats {
	md.mu.RLock()
	defer md.mu.RUnlock()

	surging := make([]TokenMomentumStats, 0)
	for _, s := range md.tokens {
		if s.IsSurging && time.Since(s.LastUpdated) < 2*time.Minute {
			surging = append(surging, *s)
		}
	}
	return surging
}
