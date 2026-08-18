package core

import (
	"fmt"
	"sync"
	"time"

	"biolume-suite/internal/bot"
)

type GraduatingToken struct {
	Address              string    `json:"address"`
	Symbol               string    `json:"symbol"`
	BondingProgress      float64   `json:"bonding_progress"`
	LiquidityUSD         float64   `json:"liquidity_usd"`
	PriceUSD             float64   `json:"price_usd"`
	SmartMoneyCount      int       `json:"smart_money_count"`
	DetectedAt           time.Time `json:"detected_at"`
	IsGraduatedToRaydium bool      `json:"is_graduated_to_raydium"`
	RaydiumPoolAddress   string    `json:"raydium_pool_address,omitempty"`
}

type MigrationSniperEngine struct {
	mu               sync.RWMutex
	IsEnabled        bool                       `json:"is_enabled"`
	SnipeAmountSOL   float64                    `json:"snipe_amount_sol"`
	MinSmartMoney    int                        `json:"min_smart_money"`
	GraduatingTokens map[string]*GraduatingToken `json:"graduating_tokens"`
	GraduatedHistory []GraduatingToken          `json:"graduated_history"`
}

var DefaultMigrationSniper = &MigrationSniperEngine{
	IsEnabled:        true,
	SnipeAmountSOL:   0.35,
	MinSmartMoney:    2,
	GraduatingTokens: make(map[string]*GraduatingToken),
	GraduatedHistory: make([]GraduatingToken, 0),
}

func (mse *MigrationSniperEngine) InspectTokenForMigration(t TokenData) {
	mse.mu.Lock()
	defer mse.mu.Unlock()

	if !mse.IsEnabled || t.Address == "" {
		return
	}

	// Token nearing graduation (between 95% and 100%)
	if t.BondingCurveProgress >= 0.95 && t.BondingCurveProgress < 1.0 {
		if _, exists := mse.GraduatingTokens[t.Address]; !exists {
			item := &GraduatingToken{
				Address:         t.Address,
				Symbol:          t.Symbol,
				BondingProgress: t.BondingCurveProgress,
				LiquidityUSD:    t.LiquidityUSD,
				PriceUSD:        t.PriceUSD,
				SmartMoneyCount: t.SmartMoneyCount,
				DetectedAt:      time.Now(),
			}
			mse.GraduatingTokens[t.Address] = item
			DefaultAutopilotEngine.Log(
				fmt.Sprintf("🎓 GRADUATION TARGET DETECTED: $%s at %.1f%% bonding curve -> Armed for Raydium Snipe", t.Symbol, t.BondingCurveProgress*100),
				"MIGRATION_WATCH",
				map[string]interface{}{"symbol": t.Symbol, "progress": t.BondingCurveProgress},
			)
		}
	} else if t.BondingCurveProgress >= 1.0 {
		// Migration Completed: Trigger Sub-Second Raydium Snipe
		if item, exists := mse.GraduatingTokens[t.Address]; exists && !item.IsGraduatedToRaydium {
			item.IsGraduatedToRaydium = true
			item.RaydiumPoolAddress = fmt.Sprintf("RayPool_%s", t.Address[:8])
			mse.GraduatedHistory = append([]GraduatingToken{*item}, mse.GraduatedHistory...)

			if t.SmartMoneyCount >= mse.MinSmartMoney {
				DefaultAutopilotEngine.Log(
					fmt.Sprintf("⚡ RAYDIUM MIGRATION SNIPE TRIGGERED: $%s migrated! Executing instant entry...", t.Symbol),
					"MIGRATION_SNIPED",
					map[string]interface{}{"symbol": t.Symbol, "amount_sol": mse.SnipeAmountSOL},
				)
				bot.DefaultTradeExecutor.ExecuteQuickBuy(t.Address, t.Symbol, mse.SnipeAmountSOL, t.PriceUSD)
			}
			delete(mse.GraduatingTokens, t.Address)
		}
	}
}

func (mse *MigrationSniperEngine) GetStatus() map[string]interface{} {
	mse.mu.RLock()
	defer mse.mu.RUnlock()

	activeList := make([]GraduatingToken, 0)
	for _, g := range mse.GraduatingTokens {
		activeList = append(activeList, *g)
	}

	return map[string]interface{}{
		"is_enabled":        mse.IsEnabled,
		"snipe_amount_sol":  mse.SnipeAmountSOL,
		"graduating_count":  len(activeList),
		"graduating_tokens": activeList,
		"graduated_history": mse.GraduatedHistory,
	}
}
