package core

import (
	"fmt"
	"sync"
	"time"
)

type DiscoveredWhale struct {
	Address        string   `json:"address"`
	Label          string   `json:"label"`
	WinRate        float64  `json:"win_rate"`
	TotalTrades7d  int      `json:"total_trades_7d"`
	ProfitSOL7d    float64  `json:"profit_sol_7d"`
	TopHolding     string   `json:"top_holding"`
	AvgHoldingTime string   `json:"avg_holding_time"`
	Tags           []string `json:"tags"`
	IsCopied       bool     `json:"is_copied"`
}

type WhaleDiscoveryEngine struct {
	mu           sync.RWMutex
	Leaderboard  []DiscoveredWhale `json:"leaderboard"`
	LastScanTime time.Time         `json:"last_scan_time"`
}

var DefaultWhaleDiscovery = &WhaleDiscoveryEngine{
	Leaderboard: []DiscoveredWhale{
		{
			Address:        "9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM",
			Label:          "Pump.fun Alpha 01",
			WinRate:        89.4,
			TotalTrades7d:  42,
			ProfitSOL7d:    184.50,
			TopHolding:     "SOLAI (+420%)",
			AvgHoldingTime: "18 mins",
			Tags:           []string{"Sniper", "High Winrate", "Early Dev Tracker"},
			IsCopied:       false,
		},
		{
			Address:        "5Q544fKrFoe6tsEbD7S8EmxGTJYAKtTVhAW5Q5pge4j1",
			Label:          "Raydium Migration Shark",
			WinRate:        81.2,
			TotalTrades7d:  38,
			ProfitSOL7d:    112.30,
			TopHolding:     "TURBOSOL (+280%)",
			AvgHoldingTime: "45 mins",
			Tags:           []string{"Graduation Flip", "Whale"},
			IsCopied:       false,
		},
		{
			Address:        "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU",
			Label:          "Stealth Smart Whale",
			WinRate:        76.5,
			TotalTrades7d:  56,
			ProfitSOL7d:    98.75,
			TopHolding:     "CYBERPUP (+190%)",
			AvgHoldingTime: "12 mins",
			Tags:           []string{"Volume Momentum", "Fast Scalp"},
			IsCopied:       false,
		},
		{
			Address:        "2ySjb48b9v2p4w9f7h1e3k6n5m8b7v4c1x0z9a8s7d6f",
			Label:          "Degen Multiplier",
			WinRate:        74.0,
			TotalTrades7d:  65,
			ProfitSOL7d:    84.20,
			TopHolding:     "NEURAL (+350%)",
			AvgHoldingTime: "8 mins",
			Tags:           []string{"High Frequency", "Sub-Second"},
			IsCopied:       false,
		},
	},
}

func (wde *WhaleDiscoveryEngine) GetLeaderboard() []DiscoveredWhale {
	wde.mu.RLock()
	defer wde.mu.RUnlock()

	// Sync is_copied status with CopyTradingEngine
	copiedWallets := DefaultCopyTradingEngine.TrackedWallets
	list := make([]DiscoveredWhale, len(wde.Leaderboard))
	for i, w := range wde.Leaderboard {
		item := w
		if _, exists := copiedWallets[w.Address]; exists {
			item.IsCopied = true
		} else {
			item.IsCopied = false
		}
		list[i] = item
	}
	return list
}

func (wde *WhaleDiscoveryEngine) CopyDiscoveredWhale(address string) bool {
	wde.mu.Lock()
	defer wde.mu.Unlock()

	for _, w := range wde.Leaderboard {
		if w.Address == address {
			DefaultCopyTradingEngine.AddWallet(TrackedWallet{
				Address:        w.Address,
				Label:          w.Label,
				WinRate:        w.WinRate,
				TotalProfitSOL: w.ProfitSOL7d,
				CopyBuyAmount:  0.25,
				AutoSellOnDump: true,
				Enabled:        true,
			})
			DefaultAutopilotEngine.Log(
				fmt.Sprintf("🐳 WHALE ADDED TO COPY-TRADER: %s (%s)", w.Label, w.Address[:8]+"..."),
				"WHALE_DISCOVERY_COPIED",
				map[string]interface{}{"address": w.Address, "win_rate": w.WinRate},
			)
			return true
		}
	}
	return false
}
