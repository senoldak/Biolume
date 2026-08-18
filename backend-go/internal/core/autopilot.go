package core

import (
	"bytes"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strings"
	"sync"
	"time"

	"biolume-suite/internal/bot"
)

type LogEntry struct {
	Timestamp string                 `json:"timestamp"`
	Text      string                 `json:"text"`
	Level     string                 `json:"level"`
	Meta      map[string]interface{} `json:"meta,omitempty"`
}

type PendingCandidate struct {
	TokenAddress   string    `json:"token_address"`
	Symbol         string    `json:"symbol"`
	InitialPrice   float64   `json:"initial_price"`
	SafetyScore    int       `json:"safety_score"`
	SmartMoney     int       `json:"smart_money"`
	LiquidityUSD   float64   `json:"liquidity_usd"`
	DiscoveredAt   time.Time `json:"discovered_at"`
	ConfirmSeconds int       `json:"confirm_seconds"` // e.g. 15s-20s confirmation window
	PositionSize   float64   `json:"position_size"`
	StrategyID     string    `json:"strategy_id"`
}

type PnLPoint struct {
	Time       string  `json:"time"`
	BalanceSOL float64 `json:"balance_sol"`
	ProfitSOL  float64 `json:"profit_sol"`
}

type AutopilotStats struct {
	ScannedCount     int     `json:"scanned_count"`
	PassedCount      int     `json:"passed_count"`
	RejectedRugCount int     `json:"rejected_rug_count"`
	WinningTrades    int     `json:"winning_trades"`
	LosingTrades     int     `json:"losing_trades"`
	TotalProfitSOL   float64 `json:"total_profit_sol"`
}

type StrategyProfile struct {
	ID                 string  `json:"id"`
	Name               string  `json:"name"`
	Tagline            string  `json:"tagline"`
	Icon               string  `json:"icon"`
	TakeProfitPct      float64 `json:"take_profit_pct"`
	StopLossPct        float64 `json:"stop_loss_pct"`
	MinScore           int     `json:"min_score"`
	MinSmartMoney      int     `json:"min_smart_money"`
	MinLiquidity       float64 `json:"min_liquidity"`
	MinMarketCap       float64 `json:"min_market_cap,omitempty"`
	MaxBondingProg     float64 `json:"max_bonding_prog"`
	Color              string  `json:"color"`
	TrailingStopPct    float64 `json:"trailing_stop_pct,omitempty"`    // e.g. 8.0 means trigger sell if price drops 8% from ATH
	TrailingActivation float64 `json:"trailing_activation,omitempty"` // e.g. 15.0 means activate trailing after +15% profit
	PartialTPPct       float64 `json:"partial_tp_pct,omitempty"`       // e.g. 50.0 means sell 50% at partial target
	PartialTPTarget    float64 `json:"partial_tp_target,omitempty"`    // e.g. 25.0 means sell at +25%
	MaxOpenPositions   int     `json:"max_open_positions,omitempty"`   // max concurrent positions for this strategy (default: 3)
	IsCustom           bool    `json:"is_custom,omitempty"`
}

var AvailableStrategies = []StrategyProfile{
	{
		ID:                 "scalper",
		Name:               "Micro-Scalper",
		Tagline:            "Quick Scalping (+10% Profit / -5% Protection)",
		Icon:               "Zap",
		TakeProfitPct:      10.0, // +10% (safe margin above DEX & gas fees)
		StopLossPct:        -5.0, // -5%
		MinScore:           80,
		MinSmartMoney:      2,
		MinLiquidity:       1500,
		MaxBondingProg:     1.0,
		Color:              "var(--accent-sky)",
		TrailingStopPct:    2.5,
		TrailingActivation: 6.0,
		PartialTPPct:       50.0,
		PartialTPTarget:    6.0,
		MaxOpenPositions:   4,
	},
	{
		ID:                 "trend",
		Name:               "Trend Runner",
		Tagline:            "Balanced Trend Sniper (+50% Target / Trailing)",
		Icon:               "TrendingUp",
		TakeProfitPct:      50.0,
		StopLossPct:        -20.0,
		MinScore:           75,
		MinSmartMoney:      2,
		MinLiquidity:       1000,
		MaxBondingProg:     1.0,
		Color:              "var(--accent-emerald)",
		TrailingStopPct:    8.0,
		TrailingActivation: 20.0,
		PartialTPPct:       50.0,
		PartialTPTarget:    25.0,
		MaxOpenPositions:   3,
	},
	{
		ID:                 "moonshot",
		Name:               "Moonshot Degen",
		Tagline:            "Early Stage 2x-5x Hunter",
		Icon:               "Crosshair",
		TakeProfitPct:      150.0,
		StopLossPct:        -30.0,
		MinScore:           65,
		MinSmartMoney:      1,
		MinLiquidity:       300,
		MaxBondingProg:     0.35, // Early tokens under 35% bonding curve
		Color:              "var(--accent-violet)",
		TrailingStopPct:    15.0,
		TrailingActivation: 50.0,
		PartialTPPct:       50.0,
		PartialTPTarget:    60.0,
		MaxOpenPositions:   3,
	},
	{
		ID:                 "moonshot_b",
		Name:               "Moonshot+B",
		Tagline:            "High-Cap Moonshot Hunter ($5k+ Liq / $30k+ MC)",
		Icon:               "Crosshair",
		TakeProfitPct:      150.0,
		StopLossPct:        -30.0,
		MinScore:           65,
		MinSmartMoney:      1,
		MinLiquidity:       5000,  // > $5,000 Liquidity
		MinMarketCap:       30000, // > $30,000 Market Cap
		MaxBondingProg:     0.35,  // Early tokens under 35% bonding curve
		Color:              "var(--accent-violet)",
		TrailingStopPct:    15.0,
		TrailingActivation: 50.0,
		PartialTPPct:       50.0,
		PartialTPTarget:    60.0,
		MaxOpenPositions:   3,
	},
	{
		ID:                 "whale_shadow",
		Name:               "Whale Shadow",
		Tagline:            "3+ Smart Money Whale Copy",
		Icon:               "BarChart2",
		TakeProfitPct:      25.0,
		StopLossPct:        -10.0,
		MinScore:           80,
		MinSmartMoney:      3,
		MinLiquidity:       1500,
		MaxBondingProg:     1.0,
		Color:              "var(--accent-cyan)",
		TrailingStopPct:    5.0,
		TrailingActivation: 12.0,
		PartialTPPct:       50.0,
		PartialTPTarget:    15.0,
		MaxOpenPositions:   3,
	},
	{
		ID:                 "ultra_safe",
		Name:               "Ultra-Safe Fort",
		Tagline:            "Zero-Tolerance Steel Shield",
		Icon:               "ShieldCheck",
		TakeProfitPct:      10.0,
		StopLossPct:        -5.0,
		MinScore:           90,
		MinSmartMoney:      2,
		MinLiquidity:       5000,
		MaxBondingProg:     1.0,
		Color:              "var(--accent-amber)",
		TrailingStopPct:    2.5,
		TrailingActivation: 5.0,
		PartialTPPct:       50.0,
		PartialTPTarget:    6.0,
		MaxOpenPositions:   2,
	},
	{
		ID:                 "anti_cabal",
		Name:               "Anti-Cabal Guardian",
		Tagline:            "0% Bundled / 100% Organic Fair-Launch",
		Icon:               "ShieldCheck",
		TakeProfitPct:      30.0,
		StopLossPct:        -10.0,
		MinScore:           85,
		MinSmartMoney:      2,
		MinLiquidity:       1200,
		MaxBondingProg:     1.0,
		Color:              "var(--accent-cyan)",
		TrailingStopPct:    6.0,
		TrailingActivation: 15.0,
		PartialTPPct:       50.0,
		PartialTPTarget:    18.0,
		MaxOpenPositions:   3,
	},
	{
		ID:                 "cabal_momentum",
		Name:               "Cabal Wave Rider",
		Tagline:            "Snipe-Surge Quick Flip (+40% / -8% SL)",
		Icon:               "Activity",
		TakeProfitPct:      40.0,
		StopLossPct:        -8.0,
		MinScore:           60,
		MinSmartMoney:      1,
		MinLiquidity:       800,
		MaxBondingProg:     0.60,
		Color:              "var(--accent-rose)",
		TrailingStopPct:    5.0,
		TrailingActivation: 15.0,
		PartialTPPct:       50.0,
		PartialTPTarget:    20.0,
		MaxOpenPositions:   3,
	},
	{
		ID:                 "breakout",
		Name:               "Breakout Velocity",
		Tagline:            "Volume & Transaction Surge",
		Icon:               "Flame",
		TakeProfitPct:      35.0,
		StopLossPct:        -15.0,
		MinScore:           70,
		MinSmartMoney:      2,
		MinLiquidity:       2000,
		MaxBondingProg:     1.0,
		Color:              "var(--accent-rose)",
		TrailingStopPct:    7.0,
		TrailingActivation: 15.0,
		PartialTPPct:       50.0,
		PartialTPTarget:    20.0,
		MaxOpenPositions:   3,
	},
	{
		ID:                 "bonding_apex",
		Name:               "Bonding Apex",
		Tagline:            "Raydium Migration Flip (+80% TP)",
		Icon:               "Radio",
		TakeProfitPct:      80.0,
		StopLossPct:        -25.0,
		MinScore:           75,
		MinSmartMoney:      2,
		MinLiquidity:       2500,
		MaxBondingProg:     0.95,
		Color:              "var(--accent-violet)",
		TrailingStopPct:    10.0,
		TrailingActivation: 30.0,
		PartialTPPct:       50.0,
		PartialTPTarget:    40.0,
		MaxOpenPositions:   3,
	},
	{
		ID:                 "liquidity_vanguard",
		Name:               "Liquidity Vanguard",
		Tagline:            "High-Cap Pool Defense ($10k+ Liq)",
		Icon:               "Layers",
		TakeProfitPct:      18.0,
		StopLossPct:        -7.0,
		MinScore:           88,
		MinSmartMoney:      3,
		MinLiquidity:       10000,
		MaxBondingProg:     1.0,
		Color:              "var(--accent-emerald)",
		TrailingStopPct:    4.0,
		TrailingActivation: 8.0,
		PartialTPPct:       50.0,
		PartialTPTarget:    10.0,
		MaxOpenPositions:   2,
	},
	{
		ID:                 "dip_rebound",
		Name:               "Dip Rebound Hunter",
		Tagline:            "Post-Dump Support Bounce (+20% TP)",
		Icon:               "Compass",
		TakeProfitPct:      20.0,
		StopLossPct:        -8.0,
		MinScore:           80,
		MinSmartMoney:      2,
		MinLiquidity:       1800,
		MaxBondingProg:     1.0,
		Color:              "var(--accent-sky)",
		TrailingStopPct:    4.0,
		TrailingActivation: 10.0,
		PartialTPPct:       50.0,
		PartialTPTarget:    12.0,
		MaxOpenPositions:   3,
	},
	{
		ID:                 "stealth_sniper",
		Name:               "Stealth Block Sniper",
		Tagline:            "Sub-Second Slot Ingestion (+45% TP)",
		Icon:               "Radar",
		TakeProfitPct:      45.0,
		StopLossPct:        -12.0,
		MinScore:           82,
		MinSmartMoney:      2,
		MinLiquidity:       1500,
		MaxBondingProg:     0.50,
		Color:              "var(--accent-amber)",
		TrailingStopPct:    6.0,
		TrailingActivation: 15.0,
		PartialTPPct:       50.0,
		PartialTPTarget:    22.0,
		MaxOpenPositions:   3,
	},
	{
		ID:                 "meteora_dlmm",
		Name:               "Meteora DLMM Farmer",
		Tagline:            "Dynamic Fee Concentrated LP (+35% TP / -7% SL)",
		Icon:               "Layers",
		TakeProfitPct:      35.0,
		StopLossPct:        -7.0,
		MinScore:           85,
		MinSmartMoney:      3,
		MinLiquidity:       8000,
		MaxBondingProg:     1.0,
		Color:              "var(--accent-emerald)",
		TrailingStopPct:    4.0,
		TrailingActivation: 12.0,
		PartialTPPct:       50.0,
		PartialTPTarget:    15.0,
		MaxOpenPositions:   3,
	},
	{
		ID:                 "velocity_surge",
		Name:               "Ticker Velocity Surge",
		Tagline:            "High Tx/Sec & Volume Wave (+70% TP)",
		Icon:               "Zap",
		TakeProfitPct:      70.0,
		StopLossPct:        -14.0,
		MinScore:           78,
		MinSmartMoney:      2,
		MinLiquidity:       1500,
		MaxBondingProg:     0.65,
		Color:              "var(--accent-rose)",
		TrailingStopPct:    8.0,
		TrailingActivation: 25.0,
		PartialTPPct:       50.0,
		PartialTPTarget:    30.0,
		MaxOpenPositions:   3,
	},
	{
		ID:                 "cluster_accumulator",
		Name:               "Smart Cluster Accumulator",
		Tagline:            "Anti-Cabal 4+ Whale Bottom (+28% TP)",
		Icon:               "Crosshair",
		TakeProfitPct:      28.0,
		StopLossPct:        -6.0,
		MinScore:           88,
		MinSmartMoney:      4,
		MinLiquidity:       2500,
		MaxBondingProg:     1.0,
		Color:              "var(--accent-cyan)",
		TrailingStopPct:    3.5,
		TrailingActivation: 8.0,
		PartialTPPct:       50.0,
		PartialTPTarget:    12.0,
		MaxOpenPositions:   2,
	},
}

type StrategyBenchmark struct {
	StrategyID    string  `json:"strategy_id"`
	TotalTrades   int     `json:"total_trades"`
	WinningTrades int     `json:"winning_trades"`
	LosingTrades  int     `json:"losing_trades"`
	WinRate       float64 `json:"win_rate"`
	TotalPnLSOL   float64 `json:"total_pnl_sol"`
}

type AutoSniperEngine struct {
	mu                 sync.RWMutex
	IsRunning          bool
	ActiveStrategyID   string
	MinSmartMoney      int
	MinSafetyScore     int
	MinLiquidity       float64
	MinMarketCap       float64
	MaxBondingProg     float64
	TakeProfitRatio    float64
	StopLossRatio      float64
	TrailingStopPct    float64
	TrailingActivation float64
	PartialTPPct       float64
	PartialTPTarget    float64
	MaxOpenPositions   int
	BuyAmountSOL       float64
	WebhookURL         string
	HistoryLogs        []LogEntry
	TradeHistory       []bot.Position
	PnLChartPoints     []PnLPoint
	Stats              AutopilotStats
	StrategyBenchmarks map[string]*StrategyBenchmark
	EvaluatedCache     map[string]bool
	PendingCandidates  map[string]*PendingCandidate
	PriceCache         map[string]float64
	StartedAt          time.Time
	WarmupSeconds      int // 60s initial calibration phase
}

var DefaultAutopilotEngine = &AutoSniperEngine{
	IsRunning:          false,
	WarmupSeconds:      60, // 60-second market calibration phase
	ActiveStrategyID:   "trend",
	MinSmartMoney:      3,
	MinSafetyScore:     75,
	MinLiquidity:       1000,
	MinMarketCap:       0,
	MaxBondingProg:     1.0,
	TakeProfitRatio:    1.50, // +50%
	StopLossRatio:      0.80, // -20%
	TrailingStopPct:    8.0,
	TrailingActivation: 20.0,
	PartialTPPct:       50.0,
	PartialTPTarget:    25.0,
	MaxOpenPositions:   10, // Expanded to 10 concurrent positions
	BuyAmountSOL:       0.20,
	HistoryLogs:        make([]LogEntry, 0),
	TradeHistory:       make([]bot.Position, 0),
	PnLChartPoints: []PnLPoint{
		{Time: "Initial", BalanceSOL: 10.0, ProfitSOL: 0.0},
	},
	StrategyBenchmarks: map[string]*StrategyBenchmark{
		"scalper":             {StrategyID: "scalper"},
		"trend":               {StrategyID: "trend"},
		"moonshot":            {StrategyID: "moonshot"},
		"moonshot_b":          {StrategyID: "moonshot_b"},
		"whale_shadow":        {StrategyID: "whale_shadow"},
		"ultra_safe":          {StrategyID: "ultra_safe"},
		"anti_cabal":          {StrategyID: "anti_cabal"},
		"cabal_momentum":      {StrategyID: "cabal_momentum"},
		"breakout":            {StrategyID: "breakout"},
		"bonding_apex":        {StrategyID: "bonding_apex"},
		"liquidity_vanguard":  {StrategyID: "liquidity_vanguard"},
		"dip_rebound":         {StrategyID: "dip_rebound"},
		"stealth_sniper":      {StrategyID: "stealth_sniper"},
		"meteora_dlmm":        {StrategyID: "meteora_dlmm"},
		"velocity_surge":      {StrategyID: "velocity_surge"},
		"cluster_accumulator": {StrategyID: "cluster_accumulator"},
	},
	EvaluatedCache:    make(map[string]bool),
	PendingCandidates: make(map[string]*PendingCandidate),
	PriceCache:        make(map[string]float64),
}

func (a *AutoSniperEngine) UpdateStrategyProfile(updated StrategyProfile) bool {
	a.mu.Lock()
	defer a.mu.Unlock()

	for i := range AvailableStrategies {
		if AvailableStrategies[i].ID == updated.ID {
			if updated.Name != "" {
				AvailableStrategies[i].Name = updated.Name
			}
			if updated.Tagline != "" {
				AvailableStrategies[i].Tagline = updated.Tagline
			}
			if updated.TakeProfitPct > 0 {
				AvailableStrategies[i].TakeProfitPct = updated.TakeProfitPct
			}
			if updated.StopLossPct != 0 {
				AvailableStrategies[i].StopLossPct = updated.StopLossPct
			}
			if updated.MinScore > 0 {
				AvailableStrategies[i].MinScore = updated.MinScore
			}
			if updated.MinSmartMoney > 0 {
				AvailableStrategies[i].MinSmartMoney = updated.MinSmartMoney
			}
			if updated.MinLiquidity >= 0 {
				AvailableStrategies[i].MinLiquidity = updated.MinLiquidity
			}
			if updated.MaxBondingProg > 0 {
				AvailableStrategies[i].MaxBondingProg = updated.MaxBondingProg
			}
			if updated.TrailingStopPct > 0 {
				AvailableStrategies[i].TrailingStopPct = updated.TrailingStopPct
			}
			if updated.TrailingActivation > 0 {
				AvailableStrategies[i].TrailingActivation = updated.TrailingActivation
			}
			if updated.PartialTPPct >= 0 {
				AvailableStrategies[i].PartialTPPct = updated.PartialTPPct
			}
			if updated.PartialTPTarget > 0 {
				AvailableStrategies[i].PartialTPTarget = updated.PartialTPTarget
			}
			if updated.MaxOpenPositions > 0 {
				AvailableStrategies[i].MaxOpenPositions = updated.MaxOpenPositions
			}

			// If this is the currently active strategy, update runtime parameters immediately
			if a.ActiveStrategyID == updated.ID {
				a.MinSafetyScore = AvailableStrategies[i].MinScore
				a.MinSmartMoney = AvailableStrategies[i].MinSmartMoney
				a.MinLiquidity = AvailableStrategies[i].MinLiquidity
				a.MaxBondingProg = AvailableStrategies[i].MaxBondingProg
				a.TakeProfitRatio = 1.0 + (AvailableStrategies[i].TakeProfitPct / 100.0)
				a.StopLossRatio = 1.0 + (AvailableStrategies[i].StopLossPct / 100.0)
				a.TrailingStopPct = AvailableStrategies[i].TrailingStopPct
				a.TrailingActivation = AvailableStrategies[i].TrailingActivation
				a.PartialTPPct = AvailableStrategies[i].PartialTPPct
				a.PartialTPTarget = AvailableStrategies[i].PartialTPTarget
				if AvailableStrategies[i].MaxOpenPositions > 0 {
					a.MaxOpenPositions = AvailableStrategies[i].MaxOpenPositions
				}
				a.EvaluatedCache = make(map[string]bool)
			}

			a.Log(
				fmt.Sprintf("CUSTOM CONFIG APPLIED: %s [TP: +%.1f%%, SL: %.1f%%, Trailing: %.1f%%, PartTP: %.0f%%@+%.0f%%, MaxPos: %d]",
					AvailableStrategies[i].Name, AvailableStrategies[i].TakeProfitPct, AvailableStrategies[i].StopLossPct,
					AvailableStrategies[i].TrailingStopPct, AvailableStrategies[i].PartialTPPct, AvailableStrategies[i].PartialTPTarget,
					AvailableStrategies[i].MaxOpenPositions),
				"STRATEGY_CUSTOMIZED",
				map[string]interface{}{"strategy": AvailableStrategies[i]},
			)
			return true
		}
	}
	return false
}

func (a *AutoSniperEngine) AddCustomStrategy(s StrategyProfile) bool {
	a.mu.Lock()
	defer a.mu.Unlock()

	if s.ID == "" {
		s.ID = fmt.Sprintf("custom_%d", time.Now().Unix())
	}
	s.IsCustom = true
	if s.Name == "" {
		s.Name = "Custom Strategy"
	}
	if s.Icon == "" {
		s.Icon = "Cpu"
	}
	if s.Color == "" {
		s.Color = "var(--accent-cyan)"
	}
	if s.TakeProfitPct <= 0 {
		s.TakeProfitPct = 30.0
	}
	if s.StopLossPct >= 0 {
		s.StopLossPct = -10.0
	}
	if s.MinScore <= 0 {
		s.MinScore = 75
	}
	if s.MinSmartMoney <= 0 {
		s.MinSmartMoney = 2
	}
	if s.MinLiquidity <= 0 {
		s.MinLiquidity = 1000
	}
	if s.MaxBondingProg <= 0 {
		s.MaxBondingProg = 1.0
	}
	if s.MaxOpenPositions <= 0 {
		s.MaxOpenPositions = 3
	}

	AvailableStrategies = append(AvailableStrategies, s)
	a.StrategyBenchmarks[s.ID] = &StrategyBenchmark{StrategyID: s.ID}

	a.Log(
		fmt.Sprintf("✨ NEW CUSTOM STRATEGY CREATED: %s (TP: +%.1f%%, SL: %.1f%%, MaxPos: %d)", s.Name, s.TakeProfitPct, s.StopLossPct, s.MaxOpenPositions),
		"STRATEGY_CREATED",
		map[string]interface{}{"strategy": s},
	)
	return true
}

func (a *AutoSniperEngine) DeleteStrategy(id string) bool {
	a.mu.Lock()
	defer a.mu.Unlock()

	for i, s := range AvailableStrategies {
		if s.ID == id {
			if !s.IsCustom {
				return false // Built-in strategies cannot be deleted
			}
			AvailableStrategies = append(AvailableStrategies[:i], AvailableStrategies[i+1:]...)
			delete(a.StrategyBenchmarks, id)
			if a.ActiveStrategyID == id {
				a.ActiveStrategyID = "trend"
			}
			a.Log(fmt.Sprintf("🗑️ STRATEGY REMOVED: %s", s.Name), "STRATEGY_DELETED", nil)
			return true
		}
	}
	return false
}

func (a *AutoSniperEngine) SetStrategy(id string) bool {
	a.mu.Lock()
	defer a.mu.Unlock()

	for _, s := range AvailableStrategies {
		if s.ID == id {
			a.ActiveStrategyID = s.ID
			a.MinSafetyScore = s.MinScore
			a.MinSmartMoney = s.MinSmartMoney
			a.MinLiquidity = s.MinLiquidity
			a.MinMarketCap = s.MinMarketCap
			a.MaxBondingProg = s.MaxBondingProg
			a.TakeProfitRatio = 1.0 + (s.TakeProfitPct / 100.0)
			a.StopLossRatio = 1.0 + (s.StopLossPct / 100.0)
			a.TrailingStopPct = s.TrailingStopPct
			a.TrailingActivation = s.TrailingActivation
			a.PartialTPPct = s.PartialTPPct
			a.PartialTPTarget = s.PartialTPTarget
			if s.MaxOpenPositions > 0 {
				a.MaxOpenPositions = s.MaxOpenPositions
			} else {
				a.MaxOpenPositions = 3
			}
			a.EvaluatedCache = make(map[string]bool)

			a.Log(
				fmt.Sprintf("STRATEGY UPDATED: %s (TP: +%.1f%%, SL: %.1f%%, Trailing: %.1f%%, MaxPos: %d)",
					s.Name, s.TakeProfitPct, s.StopLossPct, s.TrailingStopPct, a.MaxOpenPositions),
				"STRATEGY_CHANGE",
				map[string]interface{}{"strategy": s},
			)
			return true
		}
	}
	return false
}

func (a *AutoSniperEngine) SendWebhookNotification(title, message, eventType string, meta map[string]interface{}) {
	if a.WebhookURL == "" {
		return
	}
	go func() {
		payload := map[string]interface{}{
			"title":      title,
			"message":    message,
			"event_type": eventType,
			"timestamp":  time.Now().Format("2006-01-02 15:04:05"),
			"meta":       meta,
		}
		data, err := json.Marshal(payload)
		if err != nil {
			return
		}
		client := http.Client{Timeout: 3 * time.Second}
		resp, err := client.Post(a.WebhookURL, "application/json", bytes.NewBuffer(data))
		if err == nil && resp != nil {
			resp.Body.Close()
		}
	}()
}

func (a *AutoSniperEngine) Log(text, level string, meta map[string]interface{}) {
	log.Printf("[BIOLUME ENGINE] %s", text)
	entry := LogEntry{
		Timestamp: time.Now().Format("15:04:05"),
		Text:      text,
		Level:     level,
		Meta:      meta,
	}

	a.HistoryLogs = append([]LogEntry{entry}, a.HistoryLogs...)
	if len(a.HistoryLogs) > 100 {
		a.HistoryLogs = a.HistoryLogs[:100]
	}
}

func (a *AutoSniperEngine) EvaluateAndAutoTrade(tokenData TokenData) {
	a.mu.Lock()
	defer a.mu.Unlock()

	if tokenData.Address == "" || tokenData.PriceUSD <= 0 {
		return
	}

	if a.PriceCache == nil {
		a.PriceCache = make(map[string]float64)
	}
	a.PriceCache[tokenData.Address] = tokenData.PriceUSD

	// Initial Warmup / Market Calibration Phase (60 Seconds)
	isWarmingUp := false
	if a.WarmupSeconds > 0 && !a.StartedAt.IsZero() {
		elapsed := time.Since(a.StartedAt)
		if elapsed < time.Duration(a.WarmupSeconds)*time.Second {
			isWarmingUp = true
		}
	}

	// 0. Max Concurrent Positions Limit Check
	activePositions := bot.DefaultTradeExecutor.GetPositions()
	openCount := 0
	for _, pos := range activePositions {
		if pos.Status == "OPEN" {
			openCount++
			if pos.TokenAddress == tokenData.Address {
				return // Already open
			}
		}
	}
	maxPositions := a.MaxOpenPositions
	if maxPositions <= 0 {
		maxPositions = 3
	}
	if openCount >= maxPositions {
		return // Max concurrent positions capacity reached
	}

	// 0.5 Blacklist & Anti-Chop Cooldown Check
	if blocked, _ := DefaultBlacklistManager.IsTokenBlocked(tokenData.Address, ""); blocked {
		return // Token or dev is blacklisted / on cooldown
	}

	// 1. Token address cooldown lock
	if a.EvaluatedCache["BOUGHT_"+tokenData.Address] {
		return
	}

	// 2. Filter analysis
	analysis := AnalyzeTokenSecurity(tokenData, tokenData.SmartMoneyCount)
	safetyScore := 100 - analysis.RiskScore

	cacheKey := fmt.Sprintf("%s_%d_%d", tokenData.Address, safetyScore, tokenData.SmartMoneyCount)
	alreadyLogged := a.EvaluatedCache[cacheKey]

	// 3. Strategy specific bundle validation
	allowTrade := false
	if a.ActiveStrategyID == "anti_cabal" {
		// Strictly reject any bundled or sniper risk
		allowTrade = tokenData.SmartMoneyCount >= a.MinSmartMoney &&
			safetyScore >= a.MinSafetyScore &&
			tokenData.LiquidityUSD >= a.MinLiquidity &&
			tokenData.BondingCurveProgress <= a.MaxBondingProg &&
			!analysis.DevDumped &&
			!analysis.IsBundled &&
			analysis.BundledRatio < 0.10 &&
			analysis.Top10Ratio <= 0.22
	} else if a.ActiveStrategyID == "cabal_momentum" {
		// Ride the wave if whales are entering despite bundle, but dev hasn't dumped
		allowTrade = tokenData.SmartMoneyCount >= a.MinSmartMoney &&
			safetyScore >= a.MinSafetyScore &&
			tokenData.LiquidityUSD >= a.MinLiquidity &&
			tokenData.BondingCurveProgress <= a.MaxBondingProg &&
			!analysis.DevDumped
	} else {
		// Standard strategies: reject if hard bundled and verify liquidity & marketcap
		allowTrade = tokenData.SmartMoneyCount >= a.MinSmartMoney &&
			safetyScore >= a.MinSafetyScore &&
			tokenData.LiquidityUSD >= a.MinLiquidity &&
			(a.MinMarketCap <= 0 || tokenData.MarketCap >= a.MinMarketCap) &&
			tokenData.BondingCurveProgress <= a.MaxBondingProg &&
			!analysis.DevDumped &&
			!analysis.IsBundled &&
			analysis.Top10Ratio <= 0.30
	}

	if allowTrade {
		a.Stats.ScannedCount++
		a.Stats.PassedCount++
		a.EvaluatedCache[cacheKey] = true

		shortAddr := tokenData.Address
		if len(shortAddr) > 10 {
			shortAddr = fmt.Sprintf("%s...%s", shortAddr[:6], shortAddr[len(shortAddr)-4:])
		}

		// Check if engine is still in the 60s Warmup & Calibration Window
		if isWarmingUp {
			remainingSec := a.WarmupSeconds - int(time.Since(a.StartedAt).Seconds())
			if remainingSec < 0 {
				remainingSec = 0
			}
			a.Log(
				fmt.Sprintf("🔍 WARMUP CALIBRATION (%ds left): $%s (%s) spotted (Score: %d/100 | Whales: %d). Watching without firing trade...", remainingSec, tokenData.Symbol, shortAddr, safetyScore, tokenData.SmartMoneyCount),
				"CALIBRATING",
				map[string]interface{}{"symbol": tokenData.Symbol, "score": safetyScore, "smart_count": tokenData.SmartMoneyCount, "remaining_seconds": remainingSec},
			)
			return // Do not place orders during warmup phase
		}

		// Stage 1: Check if this candidate is in the 15-second Confirmation Watchlist
		candidate, exists := a.PendingCandidates[tokenData.Address]
		if !exists {
			// Place candidate into confirmation watch queue
			a.PendingCandidates[tokenData.Address] = &PendingCandidate{
				TokenAddress:   tokenData.Address,
				Symbol:         tokenData.Symbol,
				InitialPrice:   tokenData.PriceUSD,
				SafetyScore:    safetyScore,
				SmartMoney:     tokenData.SmartMoneyCount,
				LiquidityUSD:   tokenData.LiquidityUSD,
				DiscoveredAt:   time.Now(),
				ConfirmSeconds: 15,
				StrategyID:     a.ActiveStrategyID,
			}

			a.Log(
				fmt.Sprintf("🔍 CANDIDATE SPOTTED: $%s (%s) | Score: %d/100 | Whales: %d | ⏳ Analyzing momentum (15s watch)...", tokenData.Symbol, shortAddr, safetyScore, tokenData.SmartMoneyCount),
				"ANALYZING",
				map[string]interface{}{"symbol": tokenData.Symbol, "score": safetyScore, "smart_count": tokenData.SmartMoneyCount, "price_usd": tokenData.PriceUSD},
			)
			return
		}

		// Stage 2: Verify confirmation window passed (15 seconds elapsed)
		if time.Since(candidate.DiscoveredAt) < time.Duration(candidate.ConfirmSeconds)*time.Second {
			// Still in confirmation window - verify it hasn't dumped > -10% in this short window
			if candidate.InitialPrice > 0 && tokenData.PriceUSD < candidate.InitialPrice*0.90 {
				delete(a.PendingCandidates, tokenData.Address)
				a.EvaluatedCache["BOUGHT_"+tokenData.Address] = true
				a.Log(
					fmt.Sprintf("⚠️ CONFIRMATION REJECTED: $%s dumped -10%% during 15s watch window. Skipped!", tokenData.Symbol),
					"BLOCKED",
					map[string]interface{}{"symbol": tokenData.Symbol, "drop_pct": ((tokenData.PriceUSD - candidate.InitialPrice) / candidate.InitialPrice) * 100},
				)
			}
			return // Wait for full confirmation window
		}

		// Stage 3: Candidate Passed Multi-Step Analysis! Execute Order
		delete(a.PendingCandidates, tokenData.Address)

		// Dynamic Position Sizing based on Safety Score & Vault Loss Throttling
		positionSize := a.BuyAmountSOL
		if DefaultVaultSweepManager.Settings.RiskThrottlingActive {
			positionSize = positionSize * 0.50 // -50% reduction during drawdown protection mode
		} else if safetyScore >= 90 {
			positionSize = a.BuyAmountSOL * 1.25 // +25% size boost on pristine score
		} else if safetyScore < 70 {
			positionSize = a.BuyAmountSOL * 0.75 // -25% size reduction on borderline score
		}

		a.Log(
			fmt.Sprintf("✅ OPPORTUNITY CONFIRMED: $%s passed 15s stability check | Sizing: %.3f SOL -> EXECUTING BUY...", tokenData.Symbol, positionSize),
			"BUY_SIGNAL",
			map[string]interface{}{"symbol": tokenData.Symbol, "score": safetyScore, "smart_count": tokenData.SmartMoneyCount, "size_sol": positionSize},
		)

		res := bot.DefaultTradeExecutor.ExecuteQuickBuy(tokenData.Address, tokenData.Symbol, positionSize, tokenData.PriceUSD)
		if res.Success {
			a.EvaluatedCache["BOUGHT_"+tokenData.Address] = true
			a.Log(
				fmt.Sprintf("ORDER FILLED: %.3f SOL -> $%s @ $%.6f", positionSize, tokenData.Symbol, tokenData.PriceUSD),
				"SUCCESS",
				map[string]interface{}{"symbol": tokenData.Symbol, "amount_sol": positionSize, "price_usd": tokenData.PriceUSD},
			)
			DefaultNotifier.SendRichNotification(
				a.WebhookURL,
				"BUY_EXECUTION",
				fmt.Sprintf("🚀 Auto-Bought $%s (Confirmed Entry)", tokenData.Symbol),
				tokenData.Symbol,
				tokenData.Address,
				0,
				positionSize,
				0,
				map[string]interface{}{"Safety Score": fmt.Sprintf("%d/100", safetyScore), "Smart Money": tokenData.SmartMoneyCount, "Confirmed": "15s Watch Passed"},
			)
		}
	} else if !alreadyLogged {
		a.Stats.ScannedCount++
		a.Stats.RejectedRugCount++
		a.EvaluatedCache[cacheKey] = true

		reasons := make([]string, 0)
		if tokenData.SmartMoneyCount < a.MinSmartMoney {
			reasons = append(reasons, fmt.Sprintf("Insufficient Whales/Smart Money (%d < %d)", tokenData.SmartMoneyCount, a.MinSmartMoney))
		}
		if safetyScore < a.MinSafetyScore {
			reasons = append(reasons, fmt.Sprintf("Low Safety Score (%d/100 < %d)", safetyScore, a.MinSafetyScore))
		}
		if tokenData.LiquidityUSD < a.MinLiquidity {
			reasons = append(reasons, fmt.Sprintf("Low Liquidity ($%.0f < $%.0f)", tokenData.LiquidityUSD, a.MinLiquidity))
		}
		if tokenData.BondingCurveProgress > a.MaxBondingProg {
			reasons = append(reasons, fmt.Sprintf("Bonding Curve Threshold Exceeded (%.0f%% > %.0f%%)", tokenData.BondingCurveProgress*100, a.MaxBondingProg*100))
		}
		if analysis.DevDumped {
			reasons = append(reasons, "Dev Dumped Tokens")
		}
		if analysis.Top10Ratio > 0.30 {
			reasons = append(reasons, fmt.Sprintf("High Top 10 Concentration (%.1f%%)", analysis.Top10Ratio*100))
		}
		for _, r := range analysis.Reasons {
			if !strings.Contains(r, "Smart Money") {
				reasons = append(reasons, r)
			}
		}

		reasonsStr := strings.Join(reasons, ", ")
		if reasonsStr == "" {
			reasonsStr = fmt.Sprintf("Criteria not met (Score: %d, Whales: %d)", safetyScore, tokenData.SmartMoneyCount)
		}

		a.Log(
			fmt.Sprintf("RISK INTERCEPTED: $%s rejected. Reason: %s", tokenData.Symbol, reasonsStr),
			"BLOCKED",
			map[string]interface{}{"symbol": tokenData.Symbol, "score": safetyScore, "reasons": reasons},
		)
	}
}

func (a *AutoSniperEngine) MonitorOpenPositionsAndAutoSell() {
	positions := bot.DefaultTradeExecutor.GetPositions()
	var totalUnrealizedProfitSOL float64

	for i := range positions {
		pos := positions[i]
		if pos.Status != "OPEN" {
			continue
		}

		entryPrice := pos.EntryPriceUSD
		if entryPrice <= 0 {
			entryPrice = 0.000001
		}

		// Fetch live price with multi-layered fallback (PriceCache -> DexScreener -> Micro-volatility simulation)
		var currentPrice float64
		a.mu.RLock()
		if a.PriceCache != nil {
			if cachedPrice, found := a.PriceCache[pos.TokenAddress]; found && cachedPrice > 0 {
				currentPrice = cachedPrice
			}
		}
		a.mu.RUnlock()

		if currentPrice <= 0 {
			info, err := DefaultGMGNClient.GetTokenInfo(pos.TokenAddress)
			if err == nil && info != nil && info.PriceUSD > 0 {
				currentPrice = info.PriceUSD
				a.mu.Lock()
				if a.PriceCache == nil {
					a.PriceCache = make(map[string]float64)
				}
				a.PriceCache[pos.TokenAddress] = currentPrice
				a.mu.Unlock()
			}
		}

		// Fallback for Paper Trading or delayed new token: hold at last known price (no artificial drift)
		if currentPrice <= 0 {
			if pos.CurrentPriceUSD > 0 {
				currentPrice = pos.CurrentPriceUSD // Hold at last known price
			} else {
				currentPrice = entryPrice // Last resort: hold at entry
			}
		}

		pos.CurrentPriceUSD = currentPrice
		pnlPct := ((currentPrice - entryPrice) / entryPrice) * 100
		pos.PnLPct = pnlPct
		currentValSOL := pos.AmountSOL * (currentPrice / entryPrice)
		unrealizedSOL := currentValSOL - pos.AmountSOL
		pos.PnLSOL = unrealizedSOL
		totalUnrealizedProfitSOL += unrealizedSOL

		// Track Highest Price (ATH)
		if pos.HighestPriceUSD <= 0 || currentPrice > pos.HighestPriceUSD {
			pos.HighestPriceUSD = currentPrice
		}

		// Calculate Trailing Stop Target price & Break-Even Stop Loss
		if a.TrailingStopPct > 0 && pos.HighestPriceUSD > entryPrice*(1.0+(a.TrailingActivation/100.0)) {
			pos.TrailingStopTarget = pos.HighestPriceUSD * (1.0 - (a.TrailingStopPct / 100.0))
		}

		// BREAK-EVEN STOP-LOSS: Once profit hits +15%, lock floor to Entry Price (Zero Risk Mode)
		effectiveStopLossRatio := a.StopLossRatio
		if pos.HighestPriceUSD >= entryPrice*1.15 {
			effectiveStopLossRatio = 1.005 // Lock stop-loss at Break-Even +0.5% buffer to cover gas
		}

		nowStr := time.Now().Format("15:04:05")

		a.mu.Lock()
		// Exit deductions (Gas + DEX Fee + Slippage)
		exitGasFee := bot.SolanaTxFeeSOL + bot.PriorityFeeSOL
		exitDEXFeeRate := bot.DEXTradingFeeRate
		effectiveExitPrice := currentPrice * (1.0 - bot.DefaultSlippage)

		// 1. MULTI-TIER TAKE PROFIT ENGINE (Tier 1 @ +25%, Tier 2 @ +60%, Tier 3 @ +150%, Moonbag @ 10%)
		if !pos.Tier1Effected && pnlPct >= 25.0 {
			// Tier 1: Sell 40% (Recover initial cost & gas)
			sellRatio := 0.40
			partialSoldSOL := pos.AmountSOL * sellRatio
			grossReturnSOL := partialSoldSOL * (effectiveExitPrice / entryPrice)
			netDEXFee := grossReturnSOL * exitDEXFeeRate
			netReturnSOL := grossReturnSOL - netDEXFee - (exitGasFee * 0.4)
			profitSOL := netReturnSOL - partialSoldSOL

			pos.AmountSOL -= partialSoldSOL
			pos.TokenAmount = pos.TokenAmount * (1.0 - sellRatio)
			pos.Tier1Effected = true
			pos.SoldRatio += sellRatio
			pos.RealizedPnLSOL += profitSOL

			bot.DefaultTradeExecutor.AddBalance(netReturnSOL)
			bot.DefaultTradeExecutor.UpdatePosition(pos)
			a.Stats.TotalProfitSOL += profitSOL

			a.Log(
				fmt.Sprintf("🎯 MULTI-TIER TP 1 (40%%): $%s -> Net +%.1f%% (+%.4f SOL secured)", pos.Symbol, pnlPct, profitSOL),
				"PARTIAL_PROFIT",
				map[string]interface{}{"symbol": pos.Symbol, "profit_sol": profitSOL, "tier": 1},
			)
		} else if pos.Tier1Effected && !pos.Tier2Effected && pnlPct >= 60.0 {
			// Tier 2: Sell 30% of original (Lock major profit)
			sellRatio := 0.50 // 50% of remaining (equals 30% of original)
			partialSoldSOL := pos.AmountSOL * sellRatio
			grossReturnSOL := partialSoldSOL * (effectiveExitPrice / entryPrice)
			netDEXFee := grossReturnSOL * exitDEXFeeRate
			netReturnSOL := grossReturnSOL - netDEXFee - (exitGasFee * 0.3)
			profitSOL := netReturnSOL - partialSoldSOL

			pos.AmountSOL -= partialSoldSOL
			pos.TokenAmount = pos.TokenAmount * (1.0 - sellRatio)
			pos.Tier2Effected = true
			pos.SoldRatio += 0.30
			pos.RealizedPnLSOL += profitSOL

			bot.DefaultTradeExecutor.AddBalance(netReturnSOL)
			bot.DefaultTradeExecutor.UpdatePosition(pos)
			a.Stats.TotalProfitSOL += profitSOL

			a.Log(
				fmt.Sprintf("🚀 MULTI-TIER TP 2 (30%%): $%s -> Net +%.1f%% (+%.4f SOL secured)", pos.Symbol, pnlPct, profitSOL),
				"PARTIAL_PROFIT",
				map[string]interface{}{"symbol": pos.Symbol, "profit_sol": profitSOL, "tier": 2},
			)
		} else if pos.Tier2Effected && !pos.Tier3Effected && pnlPct >= 150.0 {
			// Tier 3: Sell 20% of original, Leave 10% as Moonbag
			sellRatio := 0.66
			partialSoldSOL := pos.AmountSOL * sellRatio
			grossReturnSOL := partialSoldSOL * (effectiveExitPrice / entryPrice)
			netDEXFee := grossReturnSOL * exitDEXFeeRate
			netReturnSOL := grossReturnSOL - netDEXFee - (exitGasFee * 0.2)
			profitSOL := netReturnSOL - partialSoldSOL

			pos.AmountSOL -= partialSoldSOL
			pos.TokenAmount = pos.TokenAmount * (1.0 - sellRatio)
			pos.Tier3Effected = true
			pos.IsMoonbag = true
			pos.SoldRatio += 0.20
			pos.RealizedPnLSOL += profitSOL

			bot.DefaultTradeExecutor.AddBalance(netReturnSOL)
			bot.DefaultTradeExecutor.UpdatePosition(pos)
			a.Stats.TotalProfitSOL += profitSOL

			a.Log(
				fmt.Sprintf("🌕 MOONBAG UNLOCKED (Remaining 10%% running freely): $%s -> +%.1f%% (+%.4f SOL secured)", pos.Symbol, pnlPct, profitSOL),
				"MOONBAG_ACTIVATED",
				map[string]interface{}{"symbol": pos.Symbol, "profit_sol": profitSOL, "moonbag": true},
			)
		}

		// 2. DYNAMIC TRAILING STOP LOSS TRIGGER (If price drops X% from ATH after activation)
		if a.TrailingStopPct > 0 && pos.HighestPriceUSD > entryPrice*(1.0+(a.TrailingActivation/100.0)) && currentPrice <= pos.HighestPriceUSD*(1.0-(a.TrailingStopPct/100.0)) {
			pos.Status = "CLOSED_TRAILING"
			pos.ExitPriceUSD = effectiveExitPrice
			pos.ExitTime = nowStr

			grossReturnSOL := pos.AmountSOL * (effectiveExitPrice / entryPrice)
			netDEXFee := grossReturnSOL * exitDEXFeeRate
			netReturnSOL := grossReturnSOL - netDEXFee - exitGasFee
			profitSOL := netReturnSOL - pos.AmountSOL
			pnlPct = ((effectiveExitPrice - entryPrice) / entryPrice) * 100

			pos.PnLPct = pnlPct
			pos.PnLSOL = profitSOL + pos.RealizedPnLSOL

			bot.DefaultTradeExecutor.AddBalance(netReturnSOL)
			bot.DefaultTradeExecutor.UpdatePosition(pos)
			a.Stats.TotalProfitSOL += profitSOL
			if profitSOL >= 0 {
				a.Stats.WinningTrades++
			} else {
				a.Stats.LosingTrades++
			}

			// Update strategy benchmark
			if bm, ok := a.StrategyBenchmarks[a.ActiveStrategyID]; ok {
				bm.TotalTrades++
				if profitSOL >= 0 {
					bm.WinningTrades++
				} else {
					bm.LosingTrades++
				}
				bm.TotalPnLSOL += profitSOL
				bm.WinRate = (float64(bm.WinningTrades) / float64(bm.TotalTrades)) * 100.0
			}

			a.TradeHistory = append([]bot.Position{pos}, a.TradeHistory...)
			if len(a.TradeHistory) > 60 {
				a.TradeHistory = a.TradeHistory[:60]
			}
			a.PnLChartPoints = append(a.PnLChartPoints, PnLPoint{
				Time:       nowStr,
				BalanceSOL: bot.DefaultTradeExecutor.VirtualBalanceSOL,
				ProfitSOL:  a.Stats.TotalProfitSOL,
			})

			a.Log(
				fmt.Sprintf("🛡️ TRAILING STOP TRIGGERED: $%s (ATH: $%.6f -> Drop: %.1f%%) | Net PnL: %+.1f%% (+%.4f SOL)", pos.Symbol, pos.HighestPriceUSD, a.TrailingStopPct, pnlPct, profitSOL),
				"TRAILING_STOP",
				map[string]interface{}{"symbol": pos.Symbol, "profit_sol": profitSOL, "pnl_pct": pnlPct, "ath": pos.HighestPriceUSD},
			)
			a.SendWebhookNotification(
				fmt.Sprintf("🛡️ Trailing Stop: $%s", pos.Symbol),
				fmt.Sprintf("Locked profit on trail: %+.1f%% (+%.4f SOL)", pnlPct, profitSOL),
				"TRAILING_STOP",
				map[string]interface{}{"symbol": pos.Symbol, "profit_sol": profitSOL},
			)
		} else if currentPrice >= entryPrice*a.TakeProfitRatio || effectiveExitPrice >= entryPrice*a.TakeProfitRatio {
			// 3. FULL TAKE PROFIT (Primary Check)
			pos.Status = "CLOSED_PROFIT"
			pos.ExitPriceUSD = effectiveExitPrice
			pos.ExitTime = nowStr

			grossReturnSOL := pos.AmountSOL * (effectiveExitPrice / entryPrice)
			netDEXFee := grossReturnSOL * exitDEXFeeRate
			netReturnSOL := grossReturnSOL - netDEXFee - exitGasFee
			profitSOL := netReturnSOL - pos.AmountSOL
			pnlPct = ((effectiveExitPrice - entryPrice) / entryPrice) * 100

			pos.PnLPct = pnlPct
			pos.PnLSOL = profitSOL + pos.RealizedPnLSOL

			bot.DefaultTradeExecutor.AddBalance(netReturnSOL)
			bot.DefaultTradeExecutor.UpdatePosition(pos)
			a.Stats.TotalProfitSOL += profitSOL
			a.Stats.WinningTrades++

			// Update strategy benchmark
			if bm, ok := a.StrategyBenchmarks[a.ActiveStrategyID]; ok {
				bm.TotalTrades++
				bm.WinningTrades++
				bm.TotalPnLSOL += profitSOL
				bm.WinRate = (float64(bm.WinningTrades) / float64(bm.TotalTrades)) * 100.0
			}

			a.TradeHistory = append([]bot.Position{pos}, a.TradeHistory...)
			if len(a.TradeHistory) > 60 {
				a.TradeHistory = a.TradeHistory[:60]
			}
			a.PnLChartPoints = append(a.PnLChartPoints, PnLPoint{
				Time:       nowStr,
				BalanceSOL: bot.DefaultTradeExecutor.VirtualBalanceSOL,
				ProfitSOL:  a.Stats.TotalProfitSOL,
			})

			a.Log(
				fmt.Sprintf("TAKE PROFIT TRIGGERED: $%s -> Net +%.1f%% (+%.4f SOL net profit)", pos.Symbol, pnlPct, profitSOL),
				"PROFIT",
				map[string]interface{}{"symbol": pos.Symbol, "profit_sol": profitSOL, "pnl_pct": pnlPct},
			)
			a.SendWebhookNotification(
				fmt.Sprintf("🚀 Take Profit: $%s", pos.Symbol),
				fmt.Sprintf("Target Hit: Net +%.1f%% (+%.4f SOL)", pnlPct, profitSOL),
				"TAKE_PROFIT",
				map[string]interface{}{"symbol": pos.Symbol, "profit_sol": profitSOL},
			)
		} else if currentPrice <= entryPrice*effectiveStopLossRatio {
			// 4. STOP LOSS (Triggered when price breaches stop-loss threshold with dynamic emergency slippage)
			effectiveSLPrice := currentPrice * (1.0 - bot.StopLossSlippage)
			pos.Status = "CLOSED_LOSS"
			pos.ExitPriceUSD = effectiveSLPrice
			pos.ExitTime = nowStr

			grossReturnSOL := pos.AmountSOL * (effectiveSLPrice / entryPrice)
			netDEXFee := grossReturnSOL * exitDEXFeeRate
			netReturnSOL := grossReturnSOL - netDEXFee - exitGasFee
			lossSOL := pos.AmountSOL - netReturnSOL
			pnlPct = ((effectiveSLPrice - entryPrice) / entryPrice) * 100

			pos.PnLPct = pnlPct
			pos.PnLSOL = -lossSOL + pos.RealizedPnLSOL

			bot.DefaultTradeExecutor.AddBalance(netReturnSOL)
			bot.DefaultTradeExecutor.UpdatePosition(pos)
			a.Stats.TotalProfitSOL -= lossSOL
			a.Stats.LosingTrades++

			// Update strategy benchmark
			if bm, ok := a.StrategyBenchmarks[a.ActiveStrategyID]; ok {
				bm.TotalTrades++
				bm.LosingTrades++
				bm.TotalPnLSOL -= lossSOL
				bm.WinRate = (float64(bm.WinningTrades) / float64(bm.TotalTrades)) * 100.0
			}

			a.TradeHistory = append([]bot.Position{pos}, a.TradeHistory...)
			if len(a.TradeHistory) > 60 {
				a.TradeHistory = a.TradeHistory[:60]
			}
			a.PnLChartPoints = append(a.PnLChartPoints, PnLPoint{
				Time:       nowStr,
				BalanceSOL: bot.DefaultTradeExecutor.VirtualBalanceSOL,
				ProfitSOL:  a.Stats.TotalProfitSOL,
			})

			// Put token on 45-minute anti-chop cooldown to prevent revenge buying
			DefaultBlacklistManager.AddCooldown(pos.TokenAddress, 45)

			a.Log(
				fmt.Sprintf("🛑 STOP LOSS TRIGGERED: $%s -> Net -%.1f%% (-%.4f SOL loss) | 45m Cooldown applied", pos.Symbol, -pnlPct, lossSOL),
				"LOSS",
				map[string]interface{}{"symbol": pos.Symbol, "loss_sol": lossSOL, "pnl_pct": pnlPct},
			)
			DefaultNotifier.SendRichNotification(
				a.WebhookURL,
				"STOP_LOSS",
				fmt.Sprintf("🛑 Stop Loss: $%s (45m Cooldown Applied)", pos.Symbol),
				pos.Symbol,
				pos.TokenAddress,
				pnlPct,
				pos.AmountSOL,
				-lossSOL,
				map[string]interface{}{"Loss (SOL)": fmt.Sprintf("-%.4f SOL", lossSOL)},
			)
		} else {
			// 5. TIME-STOP / STALE POSITION EXIT (Release capital if open for > 45 minutes with low momentum)
			isStale := false
			if buyT, err := time.Parse("2006-01-02 15:04:05", pos.BuyTime); err == nil {
				if time.Since(buyT) > 45*time.Minute && pnlPct < 5.0 && pnlPct > -10.0 {
					isStale = true
				}
			}

			if isStale {
				pos.Status = "CLOSED_TIMESTOP"
				pos.ExitPriceUSD = effectiveExitPrice
				pos.ExitTime = nowStr

				grossReturnSOL := pos.AmountSOL * (effectiveExitPrice / entryPrice)
				netDEXFee := grossReturnSOL * exitDEXFeeRate
				netReturnSOL := grossReturnSOL - netDEXFee - exitGasFee
				diffSOL := netReturnSOL - pos.AmountSOL

				pos.PnLPct = pnlPct
				pos.PnLSOL = diffSOL + pos.RealizedPnLSOL

				bot.DefaultTradeExecutor.AddBalance(netReturnSOL)
				bot.DefaultTradeExecutor.UpdatePosition(pos)
				a.Stats.TotalProfitSOL += diffSOL
				if diffSOL >= 0 {
					a.Stats.WinningTrades++
				} else {
					a.Stats.LosingTrades++
				}

				a.TradeHistory = append([]bot.Position{pos}, a.TradeHistory...)
				a.Log(
					fmt.Sprintf("⏳ TIME-STOP EXPIRED: $%s closed after 45m inactivity | PnL: %+.1f%% (%+.4f SOL)", pos.Symbol, pnlPct, diffSOL),
					"TIME_STOP",
					map[string]interface{}{"symbol": pos.Symbol, "pnl_sol": diffSOL, "pnl_pct": pnlPct},
				)
			} else {
				bot.DefaultTradeExecutor.UpdatePosition(pos)
			}
		}
		a.mu.Unlock()
	}

	// Update portfolio trajectory
	if len(positions) > 0 {
		a.mu.Lock()
		netPortfolioSOL := bot.DefaultTradeExecutor.VirtualBalanceSOL + (float64(len(positions))*0.2 + totalUnrealizedProfitSOL)
		nowStr := time.Now().Format("15:04:05")

		a.PnLChartPoints = append(a.PnLChartPoints, PnLPoint{
			Time:       nowStr,
			BalanceSOL: netPortfolioSOL,
			ProfitSOL:  a.Stats.TotalProfitSOL + totalUnrealizedProfitSOL,
		})
		if len(a.PnLChartPoints) > 500 {
			a.PnLChartPoints = a.PnLChartPoints[len(a.PnLChartPoints)-500:]
		}
		a.mu.Unlock()
	}
}

func (a *AutoSniperEngine) GetStatus() map[string]interface{} {
	a.mu.RLock()
	defer a.mu.RUnlock()

	tpPct := (a.TakeProfitRatio - 1.0) * 100
	slPct := (a.StopLossRatio - 1.0) * 100

	warmupRemaining := 0
	isWarmingUp := false
	if a.IsRunning && a.WarmupSeconds > 0 && !a.StartedAt.IsZero() {
		elapsed := int(time.Since(a.StartedAt).Seconds())
		if elapsed < a.WarmupSeconds {
			isWarmingUp = true
			warmupRemaining = a.WarmupSeconds - elapsed
		}
	}

	return map[string]interface{}{
		"is_running":               a.IsRunning,
		"is_warming_up":            isWarmingUp,
		"warmup_remaining_seconds": warmupRemaining,
		"warmup_total_seconds":     a.WarmupSeconds,
		"active_strategy":          a.ActiveStrategyID,
		"available_strategies":     AvailableStrategies,
		"benchmarks":               a.StrategyBenchmarks,
		"logs":                     a.HistoryLogs,
		"stats":                    a.Stats,
		"positions":                bot.DefaultTradeExecutor.GetPositions(),
		"pending_candidates":       a.PendingCandidates,
		"trade_history":            a.TradeHistory,
		"pnl_chart_points":     a.PnLChartPoints,
		"settings": map[string]interface{}{
			"active_strategy":     a.ActiveStrategyID,
			"min_smart_money":     a.MinSmartMoney,
			"min_safety_score":    a.MinSafetyScore,
			"take_profit":         fmt.Sprintf("+%.1f%%", tpPct),
			"stop_loss":           fmt.Sprintf("%.1f%%", slPct),
			"buy_amount_sol":      a.BuyAmountSOL,
			"trailing_stop_pct":   a.TrailingStopPct,
			"trailing_activation": a.TrailingActivation,
			"partial_tp_pct":      a.PartialTPPct,
			"partial_tp_target":   a.PartialTPTarget,
			"max_open_positions":  a.MaxOpenPositions,
			"webhook_url":         a.WebhookURL,
		},
	}
}

func (a *AutoSniperEngine) ClosePositionManual(posID string) bool {
	a.mu.Lock()
	defer a.mu.Unlock()

	positions := bot.DefaultTradeExecutor.GetPositions()
	for _, pos := range positions {
		if pos.ID == posID && pos.Status == "OPEN" {
			nowStr := time.Now().Format("15:04:05")
			currentPrice := pos.CurrentPriceUSD
			if currentPrice <= 0 {
				currentPrice = pos.EntryPriceUSD
			}

			exitGasFee := bot.SolanaTxFeeSOL + bot.PriorityFeeSOL
			exitDEXFeeRate := bot.DEXTradingFeeRate
			effectiveExitPrice := currentPrice * (1.0 - bot.DefaultSlippage)

			grossReturnSOL := pos.AmountSOL * (effectiveExitPrice / pos.EntryPriceUSD)
			netDEXFee := grossReturnSOL * exitDEXFeeRate
			netReturnSOL := grossReturnSOL - netDEXFee - exitGasFee
			pnlSOL := netReturnSOL - pos.AmountSOL
			pnlPct := ((effectiveExitPrice - pos.EntryPriceUSD) / pos.EntryPriceUSD) * 100

			pos.Status = "CLOSED_MANUAL"
			pos.ExitPriceUSD = effectiveExitPrice
			pos.ExitTime = nowStr
			pos.PnLPct = pnlPct
			pos.PnLSOL = pnlSOL

			bot.DefaultTradeExecutor.AddBalance(netReturnSOL)
			bot.DefaultTradeExecutor.UpdatePosition(pos)
			a.Stats.TotalProfitSOL += pnlSOL
			if pnlSOL >= 0 {
				a.Stats.WinningTrades++
			} else {
				a.Stats.LosingTrades++
			}

			a.TradeHistory = append([]bot.Position{pos}, a.TradeHistory...)
			if len(a.TradeHistory) > 60 {
				a.TradeHistory = a.TradeHistory[:60]
			}
			a.PnLChartPoints = append(a.PnLChartPoints, PnLPoint{
				Time:       nowStr,
				BalanceSOL: bot.DefaultTradeExecutor.VirtualBalanceSOL,
				ProfitSOL:  a.Stats.TotalProfitSOL,
			})

			statusTag := "PROFIT"
			if pnlSOL < 0 {
				statusTag = "LOSS"
			}

			a.Log(
				fmt.Sprintf("⚡ MANUAL CLOSE: $%s -> %s %.1f%% (%+.4f SOL net) [Market Order]", pos.Symbol, statusTag, pnlPct, pnlSOL),
				"MANUAL_CLOSE",
				map[string]interface{}{"symbol": pos.Symbol, "pnl_sol": pnlSOL, "pnl_pct": pnlPct},
			)
			return true
		}
	}
	return false
}

func (a *AutoSniperEngine) CloseAllPositionsPanic() int {
	positions := bot.DefaultTradeExecutor.GetPositions()
	closedCount := 0
	for _, pos := range positions {
		if pos.Status == "OPEN" {
			if a.ClosePositionManual(pos.ID) {
				closedCount++
			}
		}
	}
	return closedCount
}

func (a *AutoSniperEngine) Toggle() bool {
	a.mu.Lock()
	defer a.mu.Unlock()

	a.IsRunning = !a.IsRunning
	if a.IsRunning {
		a.StartedAt = time.Now()
		if a.WarmupSeconds <= 0 {
			a.WarmupSeconds = 60
		}
		a.PendingCandidates = make(map[string]*PendingCandidate)
		a.Log(fmt.Sprintf("🟡 AUTOPILOT INITIALIZED: Entering %d-second Market Calibration & Ingestion Phase. Analyzing volume momentum...", a.WarmupSeconds), "INFO", nil)
	} else {
		a.Log("🛑 Autopilot mode STOPPED.", "INFO", nil)
	}
	return a.IsRunning
}
