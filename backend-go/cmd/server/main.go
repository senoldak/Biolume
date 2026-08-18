package main

import (
	"encoding/json"
	"log"
	"net/http"
	"strings"
	"sync"
	"time"

	"biolume-suite/internal/bot"
	"biolume-suite/internal/config"
	"biolume-suite/internal/core"
)

// Standalone CORS & JSON Middleware
func enableCORS(w *http.ResponseWriter) {
	(*w).Header().Set("Access-Control-Allow-Origin", "*")
	(*w).Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS, HEAD")
	(*w).Header().Set("Access-Control-Allow-Headers", "*")
	(*w).Header().Set("Access-Control-Expose-Headers", "*")
}

func sendJSON(w http.ResponseWriter, status int, data interface{}) {
	enableCORS(&w)
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(data)
}

var (
	clientsMu  sync.Mutex
	sseClients = make(map[chan []byte]bool)
)

func broadcastSSE(event string, data interface{}) {
	payload, err := json.Marshal(data)
	if err != nil {
		return
	}
	msg := []byte("event: " + event + "\ndata: " + string(payload) + "\n\n")

	clientsMu.Lock()
	defer clientsMu.Unlock()
	for ch := range sseClients {
		select {
		case ch <- msg:
		default:
		}
	}
}

func startBackgroundScanner() {
	// 0. Start RPC Latency Router Benchmark
	core.DefaultRPCRouter.StartLatencyBenchmarkLoop()

	// 1. Radar & Trending Token Scanner Loop (1 Second Interval)
	go func() {
		for {
			tokens, err := core.DefaultGMGNClient.GetTrendingRadarTokens()
			if err == nil && len(tokens) > 0 {
				analyzed := make([]core.TokenAnalysisResult, 0)
				for _, t := range tokens {
					analyzed = append(analyzed, core.AnalyzeTokenSecurity(t, t.SmartMoneyCount))
					if core.DefaultAutopilotEngine.IsRunning {
						core.DefaultAutopilotEngine.EvaluateAndAutoTrade(t)
					}
					if core.DefaultArenaEngine.IsRunning {
						core.DefaultArenaEngine.EvaluateArenaToken(t)
					}
					// Check for Pump.fun graduation to Raydium
					core.DefaultMigrationSniper.InspectTokenForMigration(t)

					// Evaluate On-Chain Limit Orders & DCA Grids
					core.DefaultLimitOrderManager.EvaluateOrdersWithLivePrice(t.Address, t.PriceUSD)
				}
				// Broadcast to live SSE stream
				broadcastSSE("RADAR_UPDATE", analyzed)
			}
			time.Sleep(1 * time.Second)
		}
	}()

	// 2. Ultra-Low Latency Position & TP/SL Trigger Engine (300 Millisecond Independent Loop)
	go func() {
		for {
			if core.DefaultAutopilotEngine.IsRunning {
				core.DefaultAutopilotEngine.MonitorOpenPositionsAndAutoSell()
			}
			if core.DefaultArenaEngine.IsRunning {
				core.DefaultArenaEngine.MonitorArenaPositions()
			}
			// Check Auto-Profit Stash Vault Sweep
			core.DefaultVaultSweepManager.CheckAndExecuteSweep()

			// Regular position and balance broadcast via SSE
			positions := bot.DefaultTradeExecutor.GetPositions()
			broadcastSSE("POSITION_UPDATE", map[string]interface{}{
				"positions": positions,
				"balance":   bot.DefaultTradeExecutor.GetBalance(),
			})
			time.Sleep(300 * time.Millisecond)
		}
	}()

	// 3. Dedicated Arena 1-Second Broadcast Loop
	go func() {
		for {
			if core.DefaultArenaEngine.IsRunning {
				arenaState := core.DefaultArenaEngine.GetState()
				broadcastSSE("ARENA_UPDATE", arenaState)
			}
			time.Sleep(1 * time.Second)
		}
	}()
}

func main() {
	// Initialize persistence from disk
	if err := bot.DefaultStatePersistence.LoadState(bot.DefaultTradeExecutor); err != nil {
		log.Printf("[STATE PERSISTENCE] Notice: %v", err)
	}

	startBackgroundScanner()

	mux := http.NewServeMux()

	mux.HandleFunc("/api/health", func(w http.ResponseWriter, r *http.Request) {
		if r.Method == "OPTIONS" {
			enableCORS(&w)
			w.WriteHeader(http.StatusOK)
			return
		}
		sendJSON(w, http.StatusOK, map[string]string{
			"status":  "online",
			"service": "Biolume Engine (Ultra-Low Latency Solana Intelligence)",
		})
	})

	mux.HandleFunc("/api/wallet/reset-circuit-breaker", func(w http.ResponseWriter, r *http.Request) {
		if r.Method == "OPTIONS" {
			enableCORS(&w)
			w.WriteHeader(http.StatusOK)
			return
		}
		if r.Method == "POST" {
			bot.DefaultTradeExecutor.ResetCircuitBreaker()
			sendJSON(w, http.StatusOK, bot.DefaultTradeExecutor.GetBalance())
			return
		}
	})

	mux.HandleFunc("/api/backtest/run", func(w http.ResponseWriter, r *http.Request) {
		if r.Method == "OPTIONS" {
			enableCORS(&w)
			w.WriteHeader(http.StatusOK)
			return
		}
		if r.Method == "POST" {
			var req core.BacktestRequest
			if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
				sendJSON(w, http.StatusBadRequest, map[string]string{"error": err.Error()})
				return
			}
			result := core.RunBacktest(req)
			sendJSON(w, http.StatusOK, result)
			return
		}
	})

	// === COPY TRADING ENDPOINTS ===
	mux.HandleFunc("/api/copy-trade/state", func(w http.ResponseWriter, r *http.Request) {
		if r.Method == "OPTIONS" {
			enableCORS(&w)
			w.WriteHeader(http.StatusOK)
			return
		}
		sendJSON(w, http.StatusOK, core.DefaultCopyTradingEngine.GetState())
	})

	mux.HandleFunc("/api/copy-trade/toggle-engine", func(w http.ResponseWriter, r *http.Request) {
		if r.Method == "OPTIONS" {
			enableCORS(&w)
			w.WriteHeader(http.StatusOK)
			return
		}
		if r.Method == "POST" {
			enabled := core.DefaultCopyTradingEngine.ToggleEngine()
			sendJSON(w, http.StatusOK, map[string]interface{}{"is_enabled": enabled})
			return
		}
	})

	mux.HandleFunc("/api/copy-trade/add-wallet", func(w http.ResponseWriter, r *http.Request) {
		if r.Method == "OPTIONS" {
			enableCORS(&w)
			w.WriteHeader(http.StatusOK)
			return
		}
		if r.Method == "POST" {
			var req core.TrackedWallet
			if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
				sendJSON(w, http.StatusBadRequest, map[string]string{"error": err.Error()})
				return
			}
			core.DefaultCopyTradingEngine.AddWallet(req)
			sendJSON(w, http.StatusOK, core.DefaultCopyTradingEngine.GetState())
			return
		}
	})

	mux.HandleFunc("/api/copy-trade/update-wallet", func(w http.ResponseWriter, r *http.Request) {
		if r.Method == "OPTIONS" {
			enableCORS(&w)
			w.WriteHeader(http.StatusOK)
			return
		}
		if r.Method == "POST" {
			var req core.TrackedWallet
			if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
				sendJSON(w, http.StatusBadRequest, map[string]string{"error": err.Error()})
				return
			}
			success := core.DefaultCopyTradingEngine.UpdateWallet(req)
			sendJSON(w, http.StatusOK, map[string]interface{}{"success": success, "state": core.DefaultCopyTradingEngine.GetState()})
			return
		}
	})

	mux.HandleFunc("/api/copy-trade/delete-wallet", func(w http.ResponseWriter, r *http.Request) {
		if r.Method == "OPTIONS" {
			enableCORS(&w)
			w.WriteHeader(http.StatusOK)
			return
		}
		if r.Method == "POST" {
			var req struct {
				Address string `json:"address"`
			}
			if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
				sendJSON(w, http.StatusBadRequest, map[string]string{"error": err.Error()})
				return
			}
			success := core.DefaultCopyTradingEngine.RemoveWallet(req.Address)
			sendJSON(w, http.StatusOK, map[string]interface{}{"success": success, "state": core.DefaultCopyTradingEngine.GetState()})
			return
		}
	})

	mux.HandleFunc("/api/copy-trade/toggle-wallet", func(w http.ResponseWriter, r *http.Request) {
		if r.Method == "OPTIONS" {
			enableCORS(&w)
			w.WriteHeader(http.StatusOK)
			return
		}
		if r.Method == "POST" {
			var req struct {
				Address string `json:"address"`
			}
			if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
				sendJSON(w, http.StatusBadRequest, map[string]string{"error": err.Error()})
				return
			}
			enabled := core.DefaultCopyTradingEngine.ToggleWallet(req.Address)
			sendJSON(w, http.StatusOK, map[string]interface{}{"address": req.Address, "enabled": enabled})
			return
		}
	})

	mux.HandleFunc("/api/copy-trade/trigger-sim", func(w http.ResponseWriter, r *http.Request) {
		if r.Method == "OPTIONS" {
			enableCORS(&w)
			w.WriteHeader(http.StatusOK)
			return
		}
		if r.Method == "POST" {
			// Trigger realistic simulation transaction on first active tracked wallet
			state := core.DefaultCopyTradingEngine.GetState()
			wallets := state["wallets"].([]core.TrackedWallet)
			if len(wallets) > 0 {
				w := wallets[0]
				core.DefaultCopyTradingEngine.HandleWhaleTransaction(
					w.Address,
					"MockAlphaToken1111111111111111111111111111111",
					"ALPHAWHALE",
					"BUY",
					w.CopyBuyAmount,
					0.00035,
				)
			}
			sendJSON(w, http.StatusOK, map[string]interface{}{"success": true, "state": core.DefaultCopyTradingEngine.GetState()})
			return
		}
	})

	// === BLACKLIST & COOLDOWN ENDPOINTS ===
	mux.HandleFunc("/api/blacklist/status", func(w http.ResponseWriter, r *http.Request) {
		if r.Method == "OPTIONS" {
			enableCORS(&w)
			w.WriteHeader(http.StatusOK)
			return
		}
		sendJSON(w, http.StatusOK, core.DefaultBlacklistManager.GetStatus())
	})

	mux.HandleFunc("/api/blacklist/add-token", func(w http.ResponseWriter, r *http.Request) {
		if r.Method == "OPTIONS" {
			enableCORS(&w)
			w.WriteHeader(http.StatusOK)
			return
		}
		if r.Method == "POST" {
			var req struct {
				Address string `json:"address"`
				Reason  string `json:"reason"`
			}
			if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
				sendJSON(w, http.StatusBadRequest, map[string]string{"error": err.Error()})
				return
			}
			core.DefaultBlacklistManager.AddBlacklistToken(req.Address, req.Reason)
			sendJSON(w, http.StatusOK, core.DefaultBlacklistManager.GetStatus())
			return
		}
	})

	mux.HandleFunc("/api/blacklist/add-dev", func(w http.ResponseWriter, r *http.Request) {
		if r.Method == "OPTIONS" {
			enableCORS(&w)
			w.WriteHeader(http.StatusOK)
			return
		}
		if r.Method == "POST" {
			var req struct {
				Address string `json:"address"`
				Reason  string `json:"reason"`
			}
			if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
				sendJSON(w, http.StatusBadRequest, map[string]string{"error": err.Error()})
				return
			}
			core.DefaultBlacklistManager.AddBlacklistDev(req.Address, req.Reason)
			sendJSON(w, http.StatusOK, core.DefaultBlacklistManager.GetStatus())
			return
		}
	})

	mux.HandleFunc("/api/blacklist/remove-token", func(w http.ResponseWriter, r *http.Request) {
		if r.Method == "OPTIONS" {
			enableCORS(&w)
			w.WriteHeader(http.StatusOK)
			return
		}
		if r.Method == "POST" {
			var req struct {
				Address string `json:"address"`
			}
			if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
				sendJSON(w, http.StatusBadRequest, map[string]string{"error": err.Error()})
				return
			}
			core.DefaultBlacklistManager.RemoveBlacklistToken(req.Address)
			sendJSON(w, http.StatusOK, core.DefaultBlacklistManager.GetStatus())
			return
		}
	})

	// === MOMENTUM SURGE ENDPOINTS ===
	mux.HandleFunc("/api/momentum/surging", func(w http.ResponseWriter, r *http.Request) {
		if r.Method == "OPTIONS" {
			enableCORS(&w)
			w.WriteHeader(http.StatusOK)
			return
		}
		sendJSON(w, http.StatusOK, core.DefaultMomentumDetector.GetSurgingTokens())
	})

	// === VAULT & PROFIT STASH ENDPOINTS ===
	mux.HandleFunc("/api/vault/status", func(w http.ResponseWriter, r *http.Request) {
		if r.Method == "OPTIONS" {
			enableCORS(&w)
			w.WriteHeader(http.StatusOK)
			return
		}
		sendJSON(w, http.StatusOK, core.DefaultVaultSweepManager.GetStatus())
	})

	mux.HandleFunc("/api/vault/update", func(w http.ResponseWriter, r *http.Request) {
		if r.Method == "OPTIONS" {
			enableCORS(&w)
			w.WriteHeader(http.StatusOK)
			return
		}
		if r.Method == "POST" {
			var req core.VaultSweepSettings
			if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
				sendJSON(w, http.StatusBadRequest, map[string]string{"error": err.Error()})
				return
			}
			core.DefaultVaultSweepManager.UpdateSettings(req)
			sendJSON(w, http.StatusOK, core.DefaultVaultSweepManager.GetStatus())
			return
		}
	})

	mux.HandleFunc("/api/vault/sweep-now", func(w http.ResponseWriter, r *http.Request) {
		if r.Method == "OPTIONS" {
			enableCORS(&w)
			w.WriteHeader(http.StatusOK)
			return
		}
		if r.Method == "POST" {
			success, amount := core.DefaultVaultSweepManager.CheckAndExecuteSweep()
			sendJSON(w, http.StatusOK, map[string]interface{}{"success": success, "swept_amount_sol": amount})
			return
		}
	})

	// === MIGRATION SNIPER ENDPOINTS ===
	mux.HandleFunc("/api/migration/status", func(w http.ResponseWriter, r *http.Request) {
		if r.Method == "OPTIONS" {
			enableCORS(&w)
			w.WriteHeader(http.StatusOK)
			return
		}
		sendJSON(w, http.StatusOK, core.DefaultMigrationSniper.GetStatus())
	})

	mux.HandleFunc("/api/migration/update", func(w http.ResponseWriter, r *http.Request) {
		if r.Method == "OPTIONS" {
			enableCORS(&w)
			w.WriteHeader(http.StatusOK)
			return
		}
		if r.Method == "POST" {
			var req struct {
				IsEnabled      bool    `json:"is_enabled"`
				SnipeAmountSOL float64 `json:"snipe_amount_sol"`
				MinSmartMoney  int     `json:"min_smart_money"`
			}
			if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
				sendJSON(w, http.StatusBadRequest, map[string]string{"error": err.Error()})
				return
			}
			core.DefaultMigrationSniper.IsEnabled = req.IsEnabled
			if req.SnipeAmountSOL > 0 {
				core.DefaultMigrationSniper.SnipeAmountSOL = req.SnipeAmountSOL
			}
			if req.MinSmartMoney > 0 {
				core.DefaultMigrationSniper.MinSmartMoney = req.MinSmartMoney
			}
			sendJSON(w, http.StatusOK, core.DefaultMigrationSniper.GetStatus())
			return
		}
	})

	// === MULTI-RPC ROUTER ENDPOINTS ===
	mux.HandleFunc("/api/rpc/status", func(w http.ResponseWriter, r *http.Request) {
		if r.Method == "OPTIONS" {
			enableCORS(&w)
			w.WriteHeader(http.StatusOK)
			return
		}
		sendJSON(w, http.StatusOK, core.DefaultRPCRouter.GetStatus())
	})

	// === MEV GUARD ENDPOINTS ===
	mux.HandleFunc("/api/mev/guard-status", func(w http.ResponseWriter, r *http.Request) {
		if r.Method == "OPTIONS" {
			enableCORS(&w)
			w.WriteHeader(http.StatusOK)
			return
		}
		sendJSON(w, http.StatusOK, core.DefaultMEVGuard.GetStatus())
	})

	// === CSV & TAX EXPORT ENDPOINTS ===
	mux.HandleFunc("/api/reports/export-csv", func(w http.ResponseWriter, r *http.Request) {
		enableCORS(&w)
		csvBytes, err := core.GenerateTradeHistoryCSV()
		if err != nil {
			http.Error(w, "Failed to generate CSV", http.StatusInternalServerError)
			return
		}
		w.Header().Set("Content-Type", "text/csv")
		w.Header().Set("Content-Disposition", "attachment; filename=biolume_trade_history.csv")
		w.Write(csvBytes)
	})

	// === LIMIT ORDERS & DCA GRID ENDPOINTS ===
	mux.HandleFunc("/api/orders/limit", func(w http.ResponseWriter, r *http.Request) {
		if r.Method == "OPTIONS" {
			enableCORS(&w)
			w.WriteHeader(http.StatusOK)
			return
		}
		sendJSON(w, http.StatusOK, core.DefaultLimitOrderManager.GetOrders())
	})

	mux.HandleFunc("/api/orders/create", func(w http.ResponseWriter, r *http.Request) {
		if r.Method == "OPTIONS" {
			enableCORS(&w)
			w.WriteHeader(http.StatusOK)
			return
		}
		if r.Method == "POST" {
			var req struct {
				TokenAddress string  `json:"token_address"`
				Symbol       string  `json:"symbol"`
				OrderType    string  `json:"order_type"`
				TargetPrice  float64 `json:"target_price_usd"`
				AmountSOL    float64 `json:"amount_sol"`
			}
			if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
				sendJSON(w, http.StatusBadRequest, map[string]string{"error": err.Error()})
				return
			}
			order := core.DefaultLimitOrderManager.CreateOrder(req.TokenAddress, req.Symbol, req.OrderType, req.TargetPrice, req.AmountSOL)
			sendJSON(w, http.StatusOK, order)
			return
		}
	})

	mux.HandleFunc("/api/orders/cancel", func(w http.ResponseWriter, r *http.Request) {
		if r.Method == "OPTIONS" {
			enableCORS(&w)
			w.WriteHeader(http.StatusOK)
			return
		}
		if r.Method == "POST" {
			var req struct {
				OrderID string `json:"order_id"`
			}
			if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
				sendJSON(w, http.StatusBadRequest, map[string]string{"error": err.Error()})
				return
			}
			success := core.DefaultLimitOrderManager.CancelOrder(req.OrderID)
			sendJSON(w, http.StatusOK, map[string]interface{}{"success": success})
			return
		}
	})

	// === SUB-WALLET ROTATION ENDPOINTS ===
	mux.HandleFunc("/api/wallet/sub-wallets", func(w http.ResponseWriter, r *http.Request) {
		if r.Method == "OPTIONS" {
			enableCORS(&w)
			w.WriteHeader(http.StatusOK)
			return
		}
		sendJSON(w, http.StatusOK, core.DefaultWalletRotation.GetStatus())
	})

	// === WHALE DISCOVERY LEADERBOARD ENDPOINTS ===
	mux.HandleFunc("/api/whales/discovery", func(w http.ResponseWriter, r *http.Request) {
		if r.Method == "OPTIONS" {
			enableCORS(&w)
			w.WriteHeader(http.StatusOK)
			return
		}
		sendJSON(w, http.StatusOK, core.DefaultWhaleDiscovery.GetLeaderboard())
	})

	mux.HandleFunc("/api/whales/copy", func(w http.ResponseWriter, r *http.Request) {
		if r.Method == "OPTIONS" {
			enableCORS(&w)
			w.WriteHeader(http.StatusOK)
			return
		}
		if r.Method == "POST" {
			var req struct {
				Address string `json:"address"`
			}
			if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
				sendJSON(w, http.StatusBadRequest, map[string]string{"error": err.Error()})
				return
			}
			success := core.DefaultWhaleDiscovery.CopyDiscoveredWhale(req.Address)
			sendJSON(w, http.StatusOK, map[string]interface{}{"success": success, "address": req.Address})
			return
		}
	})

	mux.HandleFunc("/api/tokens/radar", func(w http.ResponseWriter, r *http.Request) {
		if r.Method == "OPTIONS" {
			enableCORS(&w)
			w.WriteHeader(http.StatusOK)
			return
		}
		tokens, _ := core.DefaultGMGNClient.GetTrendingRadarTokens()
		analyzed := make([]core.TokenAnalysisResult, 0)
		for _, t := range tokens {
			analyzed = append(analyzed, core.AnalyzeTokenSecurity(t, t.SmartMoneyCount))
		}
		sendJSON(w, http.StatusOK, analyzed)
	})

	mux.HandleFunc("/api/smart-money", func(w http.ResponseWriter, r *http.Request) {
		if r.Method == "OPTIONS" {
			enableCORS(&w)
			w.WriteHeader(http.StatusOK)
			return
		}
		sendJSON(w, http.StatusOK, core.DefaultGMGNClient.GetSmartMoneyWallets())
	})

	mux.HandleFunc("/api/smartmoney/top", func(w http.ResponseWriter, r *http.Request) {
		if r.Method == "OPTIONS" {
			enableCORS(&w)
			w.WriteHeader(http.StatusOK)
			return
		}
		sendJSON(w, http.StatusOK, core.DefaultGMGNClient.GetSmartMoneyWallets())
	})

	mux.HandleFunc("/api/wallet/generate-keypair", func(w http.ResponseWriter, r *http.Request) {
		if r.Method == "OPTIONS" {
			enableCORS(&w)
			w.WriteHeader(http.StatusOK)
			return
		}
		if r.Method == "POST" {
			kp, err := bot.GenerateDedicatedBotKeypair()
			if err != nil {
				sendJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
				return
			}
			sendJSON(w, http.StatusOK, kp)
			return
		}
	})

	mux.HandleFunc("/api/dex/quote", func(w http.ResponseWriter, r *http.Request) {
		if r.Method == "OPTIONS" {
			enableCORS(&w)
			w.WriteHeader(http.StatusOK)
			return
		}
		tokenAddr := r.URL.Query().Get("token_address")
		if tokenAddr == "" {
			tokenAddr = "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263" // Bonk default
		}
		quote, err := bot.DefaultJupiterClient.GetQuote(bot.WSOL_MINT, tokenAddr, 0.1, 1.0)
		if err != nil {
			sendJSON(w, http.StatusOK, map[string]interface{}{
				"status": "simulated",
				"router": "Jupiter V6 Aggregator",
				"in_sol": 0.1,
				"slippage_bps": 100,
				"note": "Quote available on live mainnet execution",
			})
			return
		}
		sendJSON(w, http.StatusOK, quote)
	})

	mux.HandleFunc("/api/wallet/balance", func(w http.ResponseWriter, r *http.Request) {
		if r.Method == "OPTIONS" {
			enableCORS(&w)
			w.WriteHeader(http.StatusOK)
			return
		}
		sendJSON(w, http.StatusOK, bot.DefaultTradeExecutor.GetBalance())
	})

	mux.HandleFunc("/api/wallet/positions", func(w http.ResponseWriter, r *http.Request) {
		if r.Method == "OPTIONS" {
			enableCORS(&w)
			w.WriteHeader(http.StatusOK)
			return
		}
		sendJSON(w, http.StatusOK, bot.DefaultTradeExecutor.GetPositions())
	})

	mux.HandleFunc("/api/wallet/set-mode", func(w http.ResponseWriter, r *http.Request) {
		if r.Method == "OPTIONS" {
			enableCORS(&w)
			w.WriteHeader(http.StatusOK)
			return
		}
		if r.Method == "POST" {
			var req struct {
				PaperTrading  bool    `json:"paper_trading"`
				WalletAddress string  `json:"wallet_address"`
				PrivateKey    string  `json:"private_key"`
				RPCUrl        string  `json:"rpc_url"`
				SlippagePct   float64 `json:"slippage_pct"`
			}
			if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
				sendJSON(w, http.StatusBadRequest, map[string]string{"error": err.Error()})
				return
			}
			bot.DefaultTradeExecutor.SetTradingMode(req.PaperTrading, req.WalletAddress, req.PrivateKey, req.RPCUrl, req.SlippagePct)
			sendJSON(w, http.StatusOK, bot.DefaultTradeExecutor.GetBalance())
			return
		}
	})

	mux.HandleFunc("/api/trades/quick-buy", func(w http.ResponseWriter, r *http.Request) {
		if r.Method == "OPTIONS" {
			enableCORS(&w)
			w.WriteHeader(http.StatusOK)
			return
		}
		if r.Method == "POST" {
			var req struct {
				TokenAddress string  `json:"token_address"`
				Symbol       string  `json:"symbol"`
				AmountSOL    float64 `json:"amount_sol"`
				PriceUSD     float64 `json:"price_usd"`
			}
			if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
				sendJSON(w, http.StatusBadRequest, map[string]string{"error": err.Error()})
				return
			}
			res := bot.DefaultTradeExecutor.ExecuteQuickBuy(req.TokenAddress, req.Symbol, req.AmountSOL, req.PriceUSD)
			sendJSON(w, http.StatusOK, res)
			return
		}
	})

	mux.HandleFunc("/api/trades/close-position", func(w http.ResponseWriter, r *http.Request) {
		if r.Method == "OPTIONS" {
			enableCORS(&w)
			w.WriteHeader(http.StatusOK)
			return
		}
		if r.Method == "POST" {
			var req struct {
				PositionID string `json:"position_id"`
			}
			if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
				sendJSON(w, http.StatusBadRequest, map[string]string{"error": err.Error()})
				return
			}
			success := core.DefaultAutopilotEngine.ClosePositionManual(req.PositionID)
			sendJSON(w, http.StatusOK, map[string]interface{}{"success": success})
			return
		}
	})

	mux.HandleFunc("/api/trades/panic-close-all", func(w http.ResponseWriter, r *http.Request) {
		if r.Method == "OPTIONS" {
			enableCORS(&w)
			w.WriteHeader(http.StatusOK)
			return
		}
		if r.Method == "POST" {
			closedCount := core.DefaultAutopilotEngine.CloseAllPositionsPanic()
			sendJSON(w, http.StatusOK, map[string]interface{}{"success": true, "closed_count": closedCount})
			return
		}
	})

	mux.HandleFunc("/api/autopilot/status", func(w http.ResponseWriter, r *http.Request) {
		if r.Method == "OPTIONS" {
			enableCORS(&w)
			w.WriteHeader(http.StatusOK)
			return
		}
		sendJSON(w, http.StatusOK, core.DefaultAutopilotEngine.GetStatus())
	})

	mux.HandleFunc("/api/autopilot/strategies", func(w http.ResponseWriter, r *http.Request) {
		if r.Method == "OPTIONS" {
			enableCORS(&w)
			w.WriteHeader(http.StatusOK)
			return
		}
		sendJSON(w, http.StatusOK, core.AvailableStrategies)
	})

	mux.HandleFunc("/api/autopilot/set-strategy", func(w http.ResponseWriter, r *http.Request) {
		if r.Method == "OPTIONS" {
			enableCORS(&w)
			w.WriteHeader(http.StatusOK)
			return
		}
		if r.Method == "POST" {
			var req struct {
				StrategyID string `json:"strategy_id"`
			}
			if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
				sendJSON(w, http.StatusBadRequest, map[string]string{"error": err.Error()})
				return
			}
			success := core.DefaultAutopilotEngine.SetStrategy(req.StrategyID)
			sendJSON(w, http.StatusOK, map[string]interface{}{
				"success":         success,
				"active_strategy": core.DefaultAutopilotEngine.ActiveStrategyID,
			})
			return
		}
	})

	mux.HandleFunc("/api/autopilot/create-strategy", func(w http.ResponseWriter, r *http.Request) {
		if r.Method == "OPTIONS" {
			enableCORS(&w)
			w.WriteHeader(http.StatusOK)
			return
		}
		if r.Method == "POST" {
			var req core.StrategyProfile
			if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
				sendJSON(w, http.StatusBadRequest, map[string]string{"error": err.Error()})
				return
			}
			success := core.DefaultAutopilotEngine.AddCustomStrategy(req)
			sendJSON(w, http.StatusOK, map[string]interface{}{
				"success":    success,
				"strategies": core.AvailableStrategies,
			})
			return
		}
	})

	mux.HandleFunc("/api/autopilot/delete-strategy", func(w http.ResponseWriter, r *http.Request) {
		if r.Method == "OPTIONS" {
			enableCORS(&w)
			w.WriteHeader(http.StatusOK)
			return
		}
		if r.Method == "POST" {
			var req struct {
				StrategyID string `json:"strategy_id"`
			}
			if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
				sendJSON(w, http.StatusBadRequest, map[string]string{"error": err.Error()})
				return
			}
			success := core.DefaultAutopilotEngine.DeleteStrategy(req.StrategyID)
			sendJSON(w, http.StatusOK, map[string]interface{}{
				"success":    success,
				"strategies": core.AvailableStrategies,
			})
			return
		}
	})

	mux.HandleFunc("/api/autopilot/update-settings", func(w http.ResponseWriter, r *http.Request) {
		if r.Method == "OPTIONS" {
			enableCORS(&w)
			w.WriteHeader(http.StatusOK)
			return
		}
		if r.Method == "POST" {
			var req struct {
				WebhookURL string  `json:"webhook_url"`
				BuyAmount  float64 `json:"buy_amount_sol"`
			}
			if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
				sendJSON(w, http.StatusBadRequest, map[string]string{"error": err.Error()})
				return
			}
			if req.BuyAmount > 0 {
				core.DefaultAutopilotEngine.BuyAmountSOL = req.BuyAmount
			}
			core.DefaultAutopilotEngine.WebhookURL = req.WebhookURL
			sendJSON(w, http.StatusOK, map[string]interface{}{
				"success":     true,
				"webhook_url": core.DefaultAutopilotEngine.WebhookURL,
				"buy_amount":  core.DefaultAutopilotEngine.BuyAmountSOL,
			})
			return
		}
	})

	mux.HandleFunc("/api/autopilot/update-strategy", func(w http.ResponseWriter, r *http.Request) {
		if r.Method == "OPTIONS" {
			enableCORS(&w)
			w.WriteHeader(http.StatusOK)
			return
		}
		if r.Method == "POST" {
			var req core.StrategyProfile
			if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
				sendJSON(w, http.StatusBadRequest, map[string]string{"error": err.Error()})
				return
			}
			success := core.DefaultAutopilotEngine.UpdateStrategyProfile(req)
			sendJSON(w, http.StatusOK, map[string]interface{}{
				"success":    success,
				"strategies": core.AvailableStrategies,
			})
			return
		}
	})

	// === ARENA 12-BOT MULTI-SIMULATION ENDPOINTS ===
	mux.HandleFunc("/api/arena/start", func(w http.ResponseWriter, r *http.Request) {
		if r.Method == "OPTIONS" {
			enableCORS(&w)
			w.WriteHeader(http.StatusOK)
			return
		}
		core.DefaultArenaEngine.Start()
		state := core.DefaultArenaEngine.GetState()
		broadcastSSE("ARENA_UPDATE", state)
		sendJSON(w, http.StatusOK, state)
	})

	mux.HandleFunc("/api/arena/stop", func(w http.ResponseWriter, r *http.Request) {
		if r.Method == "OPTIONS" {
			enableCORS(&w)
			w.WriteHeader(http.StatusOK)
			return
		}
		core.DefaultArenaEngine.Stop()
		state := core.DefaultArenaEngine.GetState()
		broadcastSSE("ARENA_UPDATE", state)
		sendJSON(w, http.StatusOK, state)
	})

	mux.HandleFunc("/api/arena/reset", func(w http.ResponseWriter, r *http.Request) {
		if r.Method == "OPTIONS" {
			enableCORS(&w)
			w.WriteHeader(http.StatusOK)
			return
		}
		core.DefaultArenaEngine.Reset()
		state := core.DefaultArenaEngine.GetState()
		broadcastSSE("ARENA_UPDATE", state)
		sendJSON(w, http.StatusOK, state)
	})

	mux.HandleFunc("/api/arena/state", func(w http.ResponseWriter, r *http.Request) {
		if r.Method == "OPTIONS" {
			enableCORS(&w)
			w.WriteHeader(http.StatusOK)
			return
		}
		sendJSON(w, http.StatusOK, core.DefaultArenaEngine.GetState())
	})

	mux.HandleFunc("/api/arena/report", func(w http.ResponseWriter, r *http.Request) {
		if r.Method == "OPTIONS" {
			enableCORS(&w)
			w.WriteHeader(http.StatusOK)
			return
		}
		report := core.GenerateArenaReport()
		sendJSON(w, http.StatusOK, report)
	})

	mux.HandleFunc("/api/autopilot/toggle", func(w http.ResponseWriter, r *http.Request) {
		if r.Method == "OPTIONS" {
			enableCORS(&w)
			w.WriteHeader(http.StatusOK)
			return
		}
		if r.Method == "POST" {
			isRunning := core.DefaultAutopilotEngine.Toggle()
			sendJSON(w, http.StatusOK, map[string]bool{"is_running": isRunning})
			return
		}
	})

	// Live Server-Sent Events (SSE) Stream Endpoint (0ms Latency)
	mux.HandleFunc("/api/stream/live", func(w http.ResponseWriter, r *http.Request) {
		enableCORS(&w)
		w.Header().Set("Content-Type", "text/event-stream")
		w.Header().Set("Cache-Control", "no-cache, no-transform")
		w.Header().Set("Connection", "keep-alive")
		w.Header().Set("X-Accel-Buffering", "no")

		flusher, ok := w.(http.Flusher)
		if !ok {
			http.Error(w, "Streaming unsupported", http.StatusInternalServerError)
			return
		}

		ch := make(chan []byte, 10)
		clientsMu.Lock()
		sseClients[ch] = true
		clientsMu.Unlock()

		defer func() {
			clientsMu.Lock()
			delete(sseClients, ch)
			close(ch)
			clientsMu.Unlock()
		}()

		// Initial connection handshake event
		w.Write([]byte("event: CONNECTED\ndata: {\"status\":\"connected\"}\n\n"))
		flusher.Flush()

		notify := r.Context().Done()
		for {
			select {
			case <-notify:
				return
			case msg := <-ch:
				w.Write(msg)
				flusher.Flush()
			}
		}
	})

	// Standalone WebSocket (Fallback)
	mux.HandleFunc("/ws/radar", func(w http.ResponseWriter, r *http.Request) {
		enableCORS(&w)
		w.Header().Set("Content-Type", "text/plain")
		w.Write([]byte("WS ready"))
	})

	// Wrap Global CORS & Preflight Handler
	handler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		enableCORS(&w)
		if strings.ToUpper(r.Method) == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}
		mux.ServeHTTP(w, r)
	})

	log.Printf("🚀 Biolume Engine running on http://localhost:%s", config.Settings.Port)
	if err := http.ListenAndServe(":"+config.Settings.Port, handler); err != nil {
		log.Fatalf("Server failed: %v", err)
	}
}
