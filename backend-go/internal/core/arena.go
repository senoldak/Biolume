package core

import (
	"fmt"
	"sync"
	"time"

	"biolume-suite/internal/bot"
)

// ArenaBotPosition holds a simulated position for an individual strategy in the Arena
type ArenaBotPosition struct {
	ID                 string    `json:"id"`
	Mint               string    `json:"mint"`
	Symbol             string    `json:"symbol"`
	EntryPriceUSD      float64   `json:"entry_price_usd"`
	CurrentPriceUSD    float64   `json:"current_price_usd"`
	HighestPriceUSD    float64   `json:"highest_price_usd"`
	TokenAmount        float64   `json:"token_amount"`
	AmountSOL          float64   `json:"amount_sol"`
	InitialAmountSOL   float64   `json:"initial_amount_sol"` // Original buy size for partial sell tracking
	PnLPct             float64   `json:"pnl_pct"`
	PnLSOL             float64   `json:"pnl_sol"`
	RealizedPnLSOL     float64   `json:"realized_pnl_sol"`
	SoldRatio          float64   `json:"sold_ratio"` // Cumulative fraction already sold (0.0 - 1.0)
	// Multi-Tier DCA Out flags (mirrors autopilot Tier1/2/3 logic)
	Tier1Effected      bool      `json:"tier1_effected"`
	Tier2Effected      bool      `json:"tier2_effected"`
	Tier3Effected      bool      `json:"tier3_effected"`
	IsMoonbag          bool      `json:"is_moonbag"`
	PartialTPEffected  bool      `json:"partial_tp_effected"` // Legacy: kept for older single-tier strategies
	TrailingStopTarget float64   `json:"trailing_stop_target"`
	Status             string    `json:"status"` // "OPEN", "CLOSED_TP", "CLOSED_SL", "CLOSED_TRAILING"
	EntryTime          time.Time `json:"entry_time"`
	ExitTime           time.Time `json:"exit_time,omitempty"`
	StrategyID         string    `json:"strategy_id"`
}

// ArenaPnLPoint tracks a single time checkpoint for a strategy's equity
type ArenaPnLPoint struct {
	Time       string  `json:"time"`
	BalanceSOL float64 `json:"balance_sol"`
	ProfitSOL  float64 `json:"profit_sol"`
}

// ArenaBotState represents the isolated trading simulation for one strategy
type ArenaBotState struct {
	StrategyID      string             `json:"strategy_id"`
	Name            string             `json:"name"`
	Tagline         string             `json:"tagline"`
	Color           string             `json:"color"`
	Icon            string             `json:"icon"`
	BalanceSOL      float64            `json:"balance_sol"`
	InitialBalance  float64            `json:"initial_balance"`
	NetProfitSOL    float64            `json:"net_profit_sol"`
	NetProfitPct    float64            `json:"net_profit_pct"`
	WinningTrades   int                `json:"winning_trades"`
	LosingTrades    int                `json:"losing_trades"`
	TotalTrades     int                `json:"total_trades"`
	WinRate         float64            `json:"win_rate"`
	OpenPositions   []ArenaBotPosition `json:"open_positions"`
	ClosedPositions []ArenaBotPosition `json:"closed_positions"`
	PnLHistory      []ArenaPnLPoint    `json:"pnl_history"`
	CurrentRank     int                `json:"current_rank"`
	Profile         StrategyProfile    `json:"profile"`
}

// ArenaPendingCandidate holds candidates undergoing 15s momentum / stability check
type ArenaPendingCandidate struct {
	TokenAddress   string    `json:"token_address"`
	Symbol         string    `json:"symbol"`
	InitialPrice   float64   `json:"initial_price"`
	SafetyScore    int       `json:"safety_score"`
	SmartMoney     int       `json:"smart_money"`
	LiquidityUSD   float64   `json:"liquidity_usd"`
	DiscoveredAt   time.Time `json:"discovered_at"`
	ConfirmSeconds int       `json:"confirm_seconds"`
	StrategyID     string    `json:"strategy_id"`
}

// ArenaState is the full multi-bot payload broadcast to the frontend
type ArenaState struct {
	IsRunning      bool            `json:"is_running"`
	StartTime      string          `json:"start_time"`
	TotalScanned   int             `json:"total_scanned"`
	TotalTrades    int             `json:"total_trades"`
	LeaderStrategy string          `json:"leader_strategy"`
	BestRoiPct     float64         `json:"best_roi_pct"`
	Bots           []ArenaBotState `json:"bots"`
	RecentEvents   []string        `json:"recent_events"`
	IsWarmingUp    bool            `json:"is_warming_up"`
	WarmupElapsed  int             `json:"warmup_elapsed"`
	WarmupTotal    int             `json:"warmup_total"`
}

// MultiBotArenaEngine manages the simultaneous live tournament
type MultiBotArenaEngine struct {
	mu                sync.RWMutex
	IsRunning         bool
	StartTime         time.Time
	WarmupSeconds     int // 60s market calibration & thinking window
	TotalScanned      int
	Bots              map[string]*ArenaBotState
	RecentEvents      []string
	PriceCache        map[string]float64
	PendingCandidates map[string]*ArenaPendingCandidate
}

// DefaultArenaEngine singleton
var DefaultArenaEngine = NewMultiBotArenaEngine()

func NewMultiBotArenaEngine() *MultiBotArenaEngine {
	engine := &MultiBotArenaEngine{
		IsRunning:         false,
		WarmupSeconds:     60,
		Bots:              make(map[string]*ArenaBotState),
		RecentEvents:      make([]string, 0),
		PriceCache:        make(map[string]float64),
		PendingCandidates: make(map[string]*ArenaPendingCandidate),
	}
	engine.Reset()
	return engine
}

// Reset re-initializes all strategies with clean 10.0 SOL balances
func (a *MultiBotArenaEngine) Reset() {
	a.mu.Lock()
	defer a.mu.Unlock()

	a.TotalScanned = 0
	a.StartTime = time.Time{}
	a.WarmupSeconds = 60
	botCount := len(AvailableStrategies)
	a.RecentEvents = []string{fmt.Sprintf("⚔️ Arena Lab initialized. Ready to launch %d-Bot live simulation tournament.", botCount)}
	a.Bots = make(map[string]*ArenaBotState)
	a.PriceCache = make(map[string]float64)
	a.PendingCandidates = make(map[string]*ArenaPendingCandidate)

	nowStr := time.Now().Format("15:04:05")

	for _, strat := range AvailableStrategies {
		botState := &ArenaBotState{
			StrategyID:      strat.ID,
			Name:            strat.Name,
			Tagline:         strat.Tagline,
			Color:           strat.Color,
			Icon:            strat.Icon,
			BalanceSOL:      10.0,
			InitialBalance:  10.0,
			NetProfitSOL:    0.0,
			NetProfitPct:    0.0,
			WinningTrades:   0,
			LosingTrades:    0,
			TotalTrades:     0,
			WinRate:         0.0,
			OpenPositions:   make([]ArenaBotPosition, 0),
			ClosedPositions: make([]ArenaBotPosition, 0),
			PnLHistory: []ArenaPnLPoint{
				{Time: nowStr, BalanceSOL: 10.0, ProfitSOL: 0.0},
			},
			CurrentRank: 1,
			Profile:     strat,
		}
		a.Bots[strat.ID] = botState
	}
}

// Start enables the arena
func (a *MultiBotArenaEngine) Start() {
	a.mu.Lock()
	defer a.mu.Unlock()
	a.IsRunning = true
	a.StartTime = time.Now()
	a.RecentEvents = append([]string{fmt.Sprintf("[%s] 🚀 %d-Bot Arena Simulation STARTED! Live tokens streaming to all bots.", time.Now().Format("15:04:05"), len(a.Bots))}, a.RecentEvents...)
	if len(a.RecentEvents) > 50 {
		a.RecentEvents = a.RecentEvents[:50]
	}
}

// Stop pauses the arena
func (a *MultiBotArenaEngine) Stop() {
	a.mu.Lock()
	defer a.mu.Unlock()
	a.IsRunning = false
	a.RecentEvents = append([]string{fmt.Sprintf("[%s] ⏸️ %d-Bot Arena Simulation PAUSED.", time.Now().Format("15:04:05"), len(a.Bots))}, a.RecentEvents...)
	if len(a.RecentEvents) > 50 {
		a.RecentEvents = a.RecentEvents[:50]
	}
}

// EvaluateArenaToken is called on every new token discovered by GMGN / Radar
func (a *MultiBotArenaEngine) EvaluateArenaToken(token TokenData) {
	if !a.IsRunning {
		return
	}

	analysis := AnalyzeTokenSecurity(token, token.SmartMoneyCount)
	safetyScore := 100 - analysis.RiskScore

	a.mu.Lock()
	a.TotalScanned++
	if token.PriceUSD > 0 {
		a.PriceCache[token.Address] = token.PriceUSD
	}
	a.mu.Unlock()

	// Evaluate against all 12 strategies in parallel
	for _, strat := range AvailableStrategies {
		a.evaluateSingleBot(strat, token, analysis, safetyScore)
	}
}

func (a *MultiBotArenaEngine) evaluateSingleBot(strat StrategyProfile, token TokenData, analysis TokenAnalysisResult, safetyScore int) {
	a.mu.Lock()
	defer a.mu.Unlock()

	botState, exists := a.Bots[strat.ID]
	if !exists {
		return
	}

	// Concurrency guard
	maxOpen := strat.MaxOpenPositions
	if maxOpen <= 0 {
		maxOpen = 3
	}
	if len(botState.OpenPositions) >= maxOpen {
		return
	}

	// Check if already holding this token
	for _, pos := range botState.OpenPositions {
		if pos.Mint == token.Address {
			return
		}
	}

	// Verify Strategy Criteria
	if safetyScore < strat.MinScore {
		return
	}
	if token.SmartMoneyCount < strat.MinSmartMoney {
		return
	}
	if token.LiquidityUSD < strat.MinLiquidity {
		return
	}
	if strat.MaxBondingProg > 0 && token.BondingCurveProgress > strat.MaxBondingProg {
		return
	}

	// Additional anti-rug filters
	if strat.ID == "anti_cabal" {
		if analysis.DevDumped || analysis.IsBundled || analysis.BundledRatio > 0.10 {
			return
		}
	} else if strat.ID != "cabal_momentum" {
		if analysis.DevDumped || analysis.IsBundled {
			return
		}
	}

	// Check if arena engine is still in the 60s Warmup & Calibration Window
	if a.WarmupSeconds > 0 && !a.StartTime.IsZero() {
		elapsed := time.Since(a.StartTime)
		if elapsed < time.Duration(a.WarmupSeconds)*time.Second {
			// Engine is in 60-second warmup/thinking mode
			return
		}
	}

	// 15-Second Confirmation Watchlist for Arena
	candKey := fmt.Sprintf("%s_%s", strat.ID, token.Address)
	candidate, exists := a.PendingCandidates[candKey]
	if !exists {
		a.PendingCandidates[candKey] = &ArenaPendingCandidate{
			TokenAddress:   token.Address,
			Symbol:         token.Symbol,
			InitialPrice:   token.PriceUSD,
			SafetyScore:    safetyScore,
			SmartMoney:     token.SmartMoneyCount,
			LiquidityUSD:   token.LiquidityUSD,
			DiscoveredAt:   time.Now(),
			ConfirmSeconds: 15,
			StrategyID:     strat.ID,
		}
		return
	}

	// Verify 15-second confirmation window passed
	if time.Since(candidate.DiscoveredAt) < time.Duration(candidate.ConfirmSeconds)*time.Second {
		// Dump protection check in confirmation window
		if candidate.InitialPrice > 0 && token.PriceUSD < candidate.InitialPrice*0.90 {
			delete(a.PendingCandidates, candKey)
		}
		return
	}

	// Candidate confirmed! Remove from pending and execute order
	delete(a.PendingCandidates, candKey)

	// Dynamic position sizing (mirrors autopilot EvaluateAndAutoTrade logic)
	buyAmountSOL := 0.20
	if safetyScore >= 90 {
		buyAmountSOL = 0.25 // +25% boost on pristine score
	} else if safetyScore < 70 {
		buyAmountSOL = 0.15 // -25% reduction on borderline score
	}

	// Deduct realistic Solana gas + DEX trading fee + entry slippage
	baseGasSOL := 0.00055 // Base transaction gas + Jito priority tip
	dexFeeSOL := buyAmountSOL * bot.DEXTradingFeeRate // 1.0% DEX pool fee
	totalRequiredSOL := buyAmountSOL + baseGasSOL + dexFeeSOL
	if botState.BalanceSOL < totalRequiredSOL {
		return
	}

	// Apply realistic entry price slippage (+0.5%)
	effectiveEntryPrice := token.PriceUSD * (1.0 + bot.DefaultSlippage)
	if effectiveEntryPrice <= 0 {
		effectiveEntryPrice = 0.0001
	}

	botState.BalanceSOL -= totalRequiredSOL
	tokenAmount := (buyAmountSOL * 150.0) / effectiveEntryPrice

	newPos := ArenaBotPosition{
		ID:                 fmt.Sprintf("arena_%s_%s_%d", strat.ID, token.Symbol, time.Now().UnixNano()),
		Mint:               token.Address,
		Symbol:             token.Symbol,
		EntryPriceUSD:      effectiveEntryPrice,
		CurrentPriceUSD:    effectiveEntryPrice,
		HighestPriceUSD:    effectiveEntryPrice,
		TokenAmount:        tokenAmount,
		AmountSOL:          buyAmountSOL,
		InitialAmountSOL:   buyAmountSOL,
		PnLPct:             0.0,
		PnLSOL:             0.0,
		RealizedPnLSOL:     0.0,
		SoldRatio:          0.0,
		Tier1Effected:      false,
		Tier2Effected:      false,
		Tier3Effected:      false,
		IsMoonbag:          false,
		PartialTPEffected:  false,
		TrailingStopTarget: 0.0,
		Status:             "OPEN",
		EntryTime:          time.Now(),
		StrategyID:         strat.ID,
	}

	botState.OpenPositions = append(botState.OpenPositions, newPos)
	eventMsg := fmt.Sprintf("[%s] ⚡ %s sniped $%s @ $%.6f (Safety: %d/100, Whales: %d, Fee: %.4f SOL)",
		time.Now().Format("15:04:05"), strat.Name, token.Symbol, effectiveEntryPrice, safetyScore, token.SmartMoneyCount, baseGasSOL+dexFeeSOL)
	a.RecentEvents = append([]string{eventMsg}, a.RecentEvents...)
	if len(a.RecentEvents) > 50 {
		a.RecentEvents = a.RecentEvents[:50]
	}
}

// MonitorArenaPositions checks TP/SL, Trailing Stop, and Partial TP for all 12 bots
func (a *MultiBotArenaEngine) MonitorArenaPositions() {
	if !a.IsRunning {
		return
	}

	a.mu.Lock()
	defer a.mu.Unlock()

	nowStr := time.Now().Format("15:04:05")

	for _, botState := range a.Bots {
		strat := botState.Profile
		remainingPositions := make([]ArenaBotPosition, 0)

		for _, pos := range botState.OpenPositions {
			// Fetch live price from cached on-chain feed (GMGN / Dexscreener)
			currentPrice := pos.CurrentPriceUSD
			if cachedPrice, found := a.PriceCache[pos.Mint]; found && cachedPrice > 0 {
				currentPrice = cachedPrice
			}

			if currentPrice > pos.HighestPriceUSD {
				pos.HighestPriceUSD = currentPrice
			}
			pos.CurrentPriceUSD = currentPrice

			pnlPct := 0.0
			if pos.EntryPriceUSD > 0 {
				pnlPct = ((currentPrice - pos.EntryPriceUSD) / pos.EntryPriceUSD) * 100.0
			}
			pos.PnLPct = pnlPct
			pos.PnLSOL = (pos.AmountSOL * (pnlPct / 100.0))

			// Trailing Target Level
			if strat.TrailingStopPct > 0 && pos.HighestPriceUSD > pos.EntryPriceUSD*(1.0+(strat.TrailingActivation/100.0)) {
				pos.TrailingStopTarget = pos.HighestPriceUSD * (1.0 - (strat.TrailingStopPct / 100.0))
			}

			// Break-Even Stop Loss protection: Once profit crosses +15%, lock floor to Entry Price (+0.5% buffer)
			effectiveStopLossPct := strat.StopLossPct
			if pos.HighestPriceUSD >= pos.EntryPriceUSD*1.15 {
				effectiveStopLossPct = 0.5 // Lock stop-loss at Break-Even +0.5% buffer
			}

			closed := false
			closeReason := ""
			profitSOL := 0.0

			// Real-world exit deductions
			exitGasSOL := 0.00055
			exitDEXFeeRate := bot.DEXTradingFeeRate // 1.0%
			effectiveExitPrice := currentPrice * (1.0 - bot.DefaultSlippage) // 0.5% normal slippage

			// --- MULTI-TIER DCA OUT ENGINE (mirrors autopilot.go exactly) ---

			// Tier 1: At +25% → Sell 40% (recover initial cost & gas)
			if !pos.Tier1Effected && pnlPct >= 25.0 {
				sellRatio := 0.40
				partialSoldSOL := pos.AmountSOL * sellRatio
				grossReturnSOL := partialSoldSOL * (effectiveExitPrice / pos.EntryPriceUSD)
				netDEXFee := grossReturnSOL * exitDEXFeeRate
				netReturnSOL := grossReturnSOL - netDEXFee - (exitGasSOL * 0.4)
				profitT1 := netReturnSOL - partialSoldSOL

				pos.AmountSOL -= partialSoldSOL
				pos.TokenAmount = pos.TokenAmount * (1.0 - sellRatio)
				pos.Tier1Effected = true
				pos.PartialTPEffected = true // legacy compat
				pos.SoldRatio += sellRatio
				pos.RealizedPnLSOL += profitT1

				botState.BalanceSOL += netReturnSOL
				botState.NetProfitSOL += profitT1

				eventMsg := fmt.Sprintf("[%s] 🎯 %s TIER-1 TP (40%%) on $%s (+%.1f%%, Net: +%.4f SOL)",
					nowStr, strat.Name, pos.Symbol, pnlPct, profitT1)
				a.RecentEvents = append([]string{eventMsg}, a.RecentEvents...)
			} else if pos.Tier1Effected && !pos.Tier2Effected && pnlPct >= 60.0 {
				// Tier 2: At +60% → Sell 50% of remaining (= 30% of original). Lock major profit.
				sellRatio := 0.50
				partialSoldSOL := pos.AmountSOL * sellRatio
				grossReturnSOL := partialSoldSOL * (effectiveExitPrice / pos.EntryPriceUSD)
				netDEXFee := grossReturnSOL * exitDEXFeeRate
				netReturnSOL := grossReturnSOL - netDEXFee - (exitGasSOL * 0.3)
				profitT2 := netReturnSOL - partialSoldSOL

				pos.AmountSOL -= partialSoldSOL
				pos.TokenAmount = pos.TokenAmount * (1.0 - sellRatio)
				pos.Tier2Effected = true
				pos.SoldRatio += 0.30
				pos.RealizedPnLSOL += profitT2

				botState.BalanceSOL += netReturnSOL
				botState.NetProfitSOL += profitT2

				eventMsg := fmt.Sprintf("[%s] 🚀 %s TIER-2 TP (30%%) on $%s (+%.1f%%, Net: +%.4f SOL)",
					nowStr, strat.Name, pos.Symbol, pnlPct, profitT2)
				a.RecentEvents = append([]string{eventMsg}, a.RecentEvents...)
			} else if pos.Tier2Effected && !pos.Tier3Effected && pnlPct >= 150.0 {
				// Tier 3: At +150% → Sell 66% of remaining, leave 10% as Moonbag
				sellRatio := 0.66
				partialSoldSOL := pos.AmountSOL * sellRatio
				grossReturnSOL := partialSoldSOL * (effectiveExitPrice / pos.EntryPriceUSD)
				netDEXFee := grossReturnSOL * exitDEXFeeRate
				netReturnSOL := grossReturnSOL - netDEXFee - (exitGasSOL * 0.2)
				profitT3 := netReturnSOL - partialSoldSOL

				pos.AmountSOL -= partialSoldSOL
				pos.TokenAmount = pos.TokenAmount * (1.0 - sellRatio)
				pos.Tier3Effected = true
				pos.IsMoonbag = true
				pos.SoldRatio += 0.20
				pos.RealizedPnLSOL += profitT3

				botState.BalanceSOL += netReturnSOL
				botState.NetProfitSOL += profitT3

				eventMsg := fmt.Sprintf("[%s] 🌕 %s MOONBAG (10%% runner) on $%s (+%.1f%%, Net: +%.4f SOL)",
					nowStr, strat.Name, pos.Symbol, pnlPct, profitT3)
				a.RecentEvents = append([]string{eventMsg}, a.RecentEvents...)
			}

			// 2. Trailing Stop Trigger
			if strat.TrailingStopPct > 0 && pos.HighestPriceUSD > pos.EntryPriceUSD*(1.0+(strat.TrailingActivation/100.0)) && currentPrice <= pos.HighestPriceUSD*(1.0-(strat.TrailingStopPct/100.0)) {
				closed = true
				closeReason = "TRAILING_STOP"
				grossReturnSOL := pos.AmountSOL * (effectiveExitPrice / pos.EntryPriceUSD)
				netDEXFee := grossReturnSOL * exitDEXFeeRate
				netReturnSOL := grossReturnSOL - netDEXFee - exitGasSOL
				profitSOL = netReturnSOL - pos.AmountSOL
			}

			// 3. Full Take Profit Trigger
			if !closed && pnlPct >= strat.TakeProfitPct {
				closed = true
				closeReason = "TAKE_PROFIT"
				grossReturnSOL := pos.AmountSOL * (effectiveExitPrice / pos.EntryPriceUSD)
				netDEXFee := grossReturnSOL * exitDEXFeeRate
				netReturnSOL := grossReturnSOL - netDEXFee - exitGasSOL
				profitSOL = netReturnSOL - pos.AmountSOL
			}

			// 4. Stop Loss Trigger (with emergency high slippage 2.5%)
			if !closed && pnlPct <= effectiveStopLossPct {
				closed = true
				closeReason = "STOP_LOSS"
				emergencyExitPrice := currentPrice * (1.0 - bot.StopLossSlippage) // 2.5% dump slippage
				grossReturnSOL := pos.AmountSOL * (emergencyExitPrice / pos.EntryPriceUSD)
				netDEXFee := grossReturnSOL * exitDEXFeeRate
				netReturnSOL := grossReturnSOL - netDEXFee - exitGasSOL
				profitSOL = netReturnSOL - pos.AmountSOL
			}

			if closed {
				pos.Status = closeReason
				pos.ExitTime = time.Now()
				botState.TotalTrades++

				returnedSOL := pos.AmountSOL + profitSOL
				if returnedSOL > 0 {
					botState.BalanceSOL += returnedSOL
				}
				botState.NetProfitSOL += profitSOL

				if profitSOL > 0 {
					botState.WinningTrades++
					eventMsg := fmt.Sprintf("[%s] 🏆 %s %s on $%s: +%.1f%% (Net: +%.4f SOL)",
						nowStr, strat.Name, closeReason, pos.Symbol, pnlPct, profitSOL)
					a.RecentEvents = append([]string{eventMsg}, a.RecentEvents...)
				} else {
					botState.LosingTrades++
					eventMsg := fmt.Sprintf("[%s] 🛑 %s %s on $%s: %.1f%% (Net: %.4f SOL)",
						nowStr, strat.Name, closeReason, pos.Symbol, pnlPct, profitSOL)
					a.RecentEvents = append([]string{eventMsg}, a.RecentEvents...)
				}

				botState.ClosedPositions = append([]ArenaBotPosition{pos}, botState.ClosedPositions...)
				if len(botState.ClosedPositions) > 30 {
					botState.ClosedPositions = botState.ClosedPositions[:30]
				}
			} else {
				remainingPositions = append(remainingPositions, pos)
			}
		}

		botState.OpenPositions = remainingPositions

		// Calculate total equity including marked-to-market open positions
		unrealizedProfitSOL := 0.0
		for _, pos := range botState.OpenPositions {
			unrealizedProfitSOL += pos.PnLSOL
		}
		totalEquity := botState.BalanceSOL + (float64(len(botState.OpenPositions)) * 0.20) + unrealizedProfitSOL

		if botState.TotalTrades > 0 {
			botState.WinRate = (float64(botState.WinningTrades) / float64(botState.TotalTrades)) * 100.0
		}
		botState.NetProfitPct = ((totalEquity - botState.InitialBalance) / botState.InitialBalance) * 100.0

		// Append PnL timeline point
		botState.PnLHistory = append(botState.PnLHistory, ArenaPnLPoint{
			Time:       nowStr,
			BalanceSOL: totalEquity,
			ProfitSOL:  botState.NetProfitSOL + unrealizedProfitSOL,
		})
		if len(botState.PnLHistory) > 300 {
			botState.PnLHistory = botState.PnLHistory[len(botState.PnLHistory)-300:]
		}
	}

	if len(a.RecentEvents) > 50 {
		a.RecentEvents = a.RecentEvents[:50]
	}
}

// GetState returns the sorted snapshot of all 12 arena bots
func (a *MultiBotArenaEngine) GetState() ArenaState {
	a.mu.RLock()
	defer a.mu.RUnlock()

	botsList := make([]ArenaBotState, 0, len(a.Bots))
	for _, b := range a.Bots {
		botsList = append(botsList, *b)
	}

	// Sort bots by NetProfitPct descending for leaderboard ranking
	for i := 0; i < len(botsList); i++ {
		for j := i + 1; j < len(botsList); j++ {
			if botsList[j].NetProfitPct > botsList[i].NetProfitPct {
				botsList[i], botsList[j] = botsList[j], botsList[i]
			}
		}
	}

	for idx := range botsList {
		botsList[idx].CurrentRank = idx + 1
	}

	leaderName := "None"
	bestRoi := 0.0
	totalTradesAll := 0
	if len(botsList) > 0 {
		leaderName = botsList[0].Name
		bestRoi = botsList[0].NetProfitPct
		for _, b := range botsList {
			totalTradesAll += b.TotalTrades
		}
	}

	isWarmingUp := false
	warmupElapsed := 0
	if a.IsRunning && a.WarmupSeconds > 0 && !a.StartTime.IsZero() {
		elapsed := int(time.Since(a.StartTime).Seconds())
		if elapsed < a.WarmupSeconds {
			isWarmingUp = true
			warmupElapsed = elapsed
		}
	}

	return ArenaState{
		IsRunning:      a.IsRunning,
		StartTime:      a.StartTime.Format("15:04:05"),
		TotalScanned:   a.TotalScanned,
		TotalTrades:    totalTradesAll,
		LeaderStrategy: leaderName,
		BestRoiPct:     bestRoi,
		Bots:           botsList,
		RecentEvents:   a.RecentEvents,
		IsWarmingUp:    isWarmingUp,
		WarmupElapsed:  warmupElapsed,
		WarmupTotal:    a.WarmupSeconds,
	}
}
