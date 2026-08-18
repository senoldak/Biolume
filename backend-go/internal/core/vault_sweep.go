package core

import (
	"fmt"
	"sync"
	"time"

	"biolume-suite/internal/bot"
)

type VaultSweepSettings struct {
	AutoSweepEnabled      bool    `json:"auto_sweep_enabled"`
	ThresholdSOL          float64 `json:"threshold_sol"`            // e.g. 15.0 SOL (Triggers sweep)
	KeepBalanceSOL        float64 `json:"keep_balance_sol"`         // e.g. 10.0 SOL (Trading reserve)
	ColdWalletAddress     string  `json:"cold_wallet_address"`      // Destination for secured profits
	ConsecutiveLossCount  int     `json:"consecutive_loss_count"`   // Track consecutive losses
	RiskThrottlingActive  bool    `json:"risk_throttling_active"`   // Active if 2+ consecutive losses
	TotalSweptSOL         float64 `json:"total_swept_sol"`
	LastSweepTime         string  `json:"last_sweep_time,omitempty"`
}

type VaultSweepManager struct {
	mu       sync.RWMutex
	Settings VaultSweepSettings
}

var DefaultVaultSweepManager = &VaultSweepManager{
	Settings: VaultSweepSettings{
		AutoSweepEnabled:  true,
		ThresholdSOL:      15.0,
		KeepBalanceSOL:    10.0,
		ColdWalletAddress: "ColdVault111111111111111111111111111111111111",
		TotalSweptSOL:     0.0,
	},
}

func (vm *VaultSweepManager) RecordTradeOutcome(isProfit bool) {
	vm.mu.Lock()
	defer vm.mu.Unlock()

	if isProfit {
		vm.Settings.ConsecutiveLossCount = 0
		vm.Settings.RiskThrottlingActive = false
	} else {
		vm.Settings.ConsecutiveLossCount++
		if vm.Settings.ConsecutiveLossCount >= 2 {
			vm.Settings.RiskThrottlingActive = true // Throttle sizing to protect capital
		}
	}
}

func (vm *VaultSweepManager) CheckAndExecuteSweep() (bool, float64) {
	vm.mu.Lock()
	defer vm.mu.Unlock()

	if !vm.Settings.AutoSweepEnabled || vm.Settings.ColdWalletAddress == "" {
		return false, 0
	}

	currentBal := bot.DefaultTradeExecutor.VirtualBalanceSOL
	if currentBal >= vm.Settings.ThresholdSOL {
		sweepAmount := currentBal - vm.Settings.KeepBalanceSOL
		if sweepAmount > 0 {
			bot.DefaultTradeExecutor.VirtualBalanceSOL = vm.Settings.KeepBalanceSOL
			vm.Settings.TotalSweptSOL += sweepAmount
			vm.Settings.LastSweepTime = time.Now().Format("2006-01-02 15:04:05")

			DefaultAutopilotEngine.Log(
				fmt.Sprintf("🏦 AUTO-PROFIT SWEEP: Secured +%.4f SOL to Cold Vault (%s). Trading reserve reset to %.2f SOL", sweepAmount, vm.Settings.ColdWalletAddress[:8]+"...", vm.Settings.KeepBalanceSOL),
				"VAULT_SWEEP",
				map[string]interface{}{"swept_sol": sweepAmount, "reserve_sol": vm.Settings.KeepBalanceSOL},
			)
			DefaultNotifier.SendRichNotification(
				DefaultAutopilotEngine.WebhookURL,
				"VAULT_SWEEP",
				"🏦 Auto-Profit Stash Secured!",
				"SOL",
				vm.Settings.ColdWalletAddress,
				0,
				sweepAmount,
				sweepAmount,
				map[string]interface{}{"Swept Amount": fmt.Sprintf("+%.4f SOL", sweepAmount), "Trading Reserve": fmt.Sprintf("%.2f SOL", vm.Settings.KeepBalanceSOL)},
			)
			return true, sweepAmount
		}
	}
	return false, 0
}

func (vm *VaultSweepManager) UpdateSettings(s VaultSweepSettings) {
	vm.mu.Lock()
	defer vm.mu.Unlock()
	vm.Settings.AutoSweepEnabled = s.AutoSweepEnabled
	if s.ThresholdSOL > 0 {
		vm.Settings.ThresholdSOL = s.ThresholdSOL
	}
	if s.KeepBalanceSOL > 0 {
		vm.Settings.KeepBalanceSOL = s.KeepBalanceSOL
	}
	if s.ColdWalletAddress != "" {
		vm.Settings.ColdWalletAddress = s.ColdWalletAddress
	}
}

func (vm *VaultSweepManager) GetStatus() VaultSweepSettings {
	vm.mu.RLock()
	defer vm.mu.RUnlock()
	return vm.Settings
}
