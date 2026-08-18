package core

import (
	"math/rand"
	"sync"
	"time"
)

type SubWallet struct {
	ID            string  `json:"id"`
	Address       string  `json:"address"`
	Label         string  `json:"label"`
	AllocatedSOL  float64 `json:"allocated_sol"`
	TradesCount   int     `json:"trades_count"`
	IsActive      bool    `json:"is_active"`
}

type WalletRotationEngine struct {
	mu          sync.RWMutex
	IsEnabled   bool          `json:"is_enabled"`
	SubWallets  []*SubWallet  `json:"sub_wallets"`
	currentIndex int
}

var DefaultWalletRotation = &WalletRotationEngine{
	IsEnabled: true,
	SubWallets: []*SubWallet{
		{ID: "sub_1", Address: "SubWalletAlpha11111111111111111111111111111", Label: "Sub-Wallet Alpha", AllocatedSOL: 2.5, IsActive: true},
		{ID: "sub_2", Address: "SubWalletBeta222222222222222222222222222222", Label: "Sub-Wallet Beta", AllocatedSOL: 2.5, IsActive: true},
		{ID: "sub_3", Address: "SubWalletGamma33333333333333333333333333333", Label: "Sub-Wallet Gamma", AllocatedSOL: 2.5, IsActive: true},
		{ID: "sub_4", Address: "SubWalletDelta44444444444444444444444444444", Label: "Sub-Wallet Delta", AllocatedSOL: 2.5, IsActive: true},
	},
}

func (wre *WalletRotationEngine) GetNextRotatedWallet() *SubWallet {
	wre.mu.Lock()
	defer wre.mu.Unlock()

	if !wre.IsEnabled || len(wre.SubWallets) == 0 {
		return nil
	}

	// Pseudo-random / round-robin rotation to avoid on-chain wallet clustering
	r := rand.New(rand.NewSource(time.Now().UnixNano()))
	idx := r.Intn(len(wre.SubWallets))
	selected := wre.SubWallets[idx]
	selected.TradesCount++
	return selected
}

func (wre *WalletRotationEngine) AddSubWallet(label, address string, sol float64) {
	wre.mu.Lock()
	defer wre.mu.Unlock()
	wre.SubWallets = append(wre.SubWallets, &SubWallet{
		ID:           address[:8],
		Address:      address,
		Label:        label,
		AllocatedSOL: sol,
		IsActive:     true,
	})
}

func (wre *WalletRotationEngine) GetStatus() map[string]interface{} {
	wre.mu.RLock()
	defer wre.mu.RUnlock()

	return map[string]interface{}{
		"is_enabled":  wre.IsEnabled,
		"sub_wallets": wre.SubWallets,
		"total_count": len(wre.SubWallets),
	}
}
