# Biolume 🌊

> **"Illuminating hidden liquidity, whale movements, and on-chain intelligence on Solana."**

An ultra-low latency Solana on-chain intelligence, smart money tracking, rug defense, automated multi-strategy sniping suite, and cyberpunk live terminal.

---

## 🌟 Overview & Features

In the deep, turbulent waters of the Solana memecoin and DeFi markets, massive liquidity flows beneath the surface. **Biolume** acts as the bioluminescent light in the abyss — casting instant clarity on on-chain token creation, whale entries, honeypot traps, and precision execution opportunities.

### Core Capabilities

- **🔥 Live On-Chain Radar:** Continuous sub-second streaming of new and trending Solana tokens (Pump.fun, Raydium, and Orca) with real-time liquidity, price, market cap, and bonding curve progress metrics.
- **🛡️ Solana RPC Security & Rug Shield:** Direct SPL token mint inspection verifying Mint Authority renunciation, Freeze Authority renunciation (honeypot elimination), Top 10 holder supply concentration, dev dump detection, and bundled sniper analysis.
- **🧠 Smart Money & Whale Tracking:** Live tracking of high-performing Solana trader wallets (30-day Win Rate > 70%, ROI > 200%) and instant detection of whale inflows.
- **🤖 12 Autonomous Trading Strategies (4x3 Grid):** Built-in battle-tested strategy profiles with customizable triggers:
  1. `Micro-Scalper` (+5% TP / -3% SL / +3% Partial TP / -1.5% Trailing)
  2. `Trend Runner` (+50% TP / -20% SL / +25% Partial TP / -8.0% Trailing)
  3. `Moonshot Degen` (+150% TP / -30% SL / +60% Partial TP / -15.0% Trailing)
  4. `Whale Shadow` (+25% TP / -10% SL / +15% Partial TP / -5.0% Trailing)
  5. `Ultra-Safe Fort` (+10% TP / -5% SL / +6% Partial TP / -2.5% Trailing)
  6. `Anti-Cabal Guardian` (+30% TP / -10% SL / +18% Partial TP / -6.0% Trailing)
  7. `Cabal Wave Rider` (+40% TP / -8% SL / +20% Partial TP / -5.0% Trailing)
  8. `Breakout Velocity` (+35% TP / -15% SL / +20% Partial TP / -7.0% Trailing)
  9. `Bonding Apex` (+80% TP / -25% SL / +40% Partial TP / -10.0% Trailing)
  10. `Liquidity Vanguard` (+18% TP / -7% SL / +10% Partial TP / -4.0% Trailing)
  11. `Dip Rebound Hunter` (+20% TP / -8% SL / +12% Partial TP / -4.0% Trailing)
  12. `Stealth Block Sniper` (+45% TP / -12% SL / +22% Partial TP / -6.0% Trailing)
- **⚔️ 12-Bot Multi-Simulation Arena & Backtest Lab:** Run all 12 autonomous strategy bots concurrently in a live simulation tournament. Each bot manages an isolated 10.0 SOL virtual bankroll with dynamic multi-line comparative equity curves, real-time ROI leaderboard, and open position matrix.
- **📑 Institutional Backtest & Audit Reports:** In-depth post-simulation diagnostic suite featuring Profit Factor, Tournament Max Drawdown, Expectancy per trade, 12-strategy viability scorecards (0-100), Hall of Fame standout trades, and one-click "Apply Champion to Live Autopilot" deployment.
- **🎯 Dynamic Trailing Stop & DCA Out (Partial TP):** Automatically locks 50% profit at the first milestone and trails the peak (ATH) to let runners maximize profit with zero risk.
- **🎛️ Custom Strategy Builder:** Create, configure, and delete custom user-defined autonomous strategy profiles right from the UI.
- **📈 Interactive Equity Curve & Timeframe PnL:** Edge-to-edge SVG chart with hover crosshair, live balance inspect, and timeframe filters (`Last 10`, `Last 25`, `Last 50`, `All`).
- **⚡ Dual Trading Engine:** Supports risk-free **Paper Trading** (10 SOL simulated balance with DEX fee + priority gas + slippage deduction) and **Live Solana Trading** with signing capabilities.
- **📢 Real-Time Webhook & Telegram Notifications:** Instant alert dispatch for buy signals, partial take profits, trailing stops, and stop-loss events.

---

## 🏗️ Architecture & Project Structure

```
Biolume/
├── backend-go/                     # High-performance Go trading engine & SSE API
│   ├── cmd/
│   │   └── server/main.go          # Go HTTP server, router & SSE streaming
│   ├── internal/
│   │   ├── bot/                    # Trade execution & position manager
│   │   │   └── trade_executor.go
│   │   ├── config/                 # Application configuration
│   │   │   └── config.go
│   │   └── core/                   # On-chain scanner, RPC, filter, autopilot, arena & report engine
│   │       ├── arena.go            # 12-Bot concurrent simulation engine
│   │       ├── arena_report.go     # Institutional backtest analytics engine
│   │       ├── autopilot.go
│   │       ├── filters.go
│   │       ├── filters_test.go
│   │       ├── gmgn_client.go
│   │       ├── jupiter_client.go
│   │       ├── models.go
│   │       └── solana_rpc.go
│   ├── go.mod
│   └── go.sum
├── backend/                        # Python FastAPI backend & Telegram bot
│   ├── bot/
│   │   ├── formatters.py           # Telegram markdown signal templates
│   │   ├── telegram_bot.py         # Telegram bot handlers & callback buttons
│   │   └── trade_executor.py       # Python trade execution layer
│   ├── core/
│   │   ├── autopilot.py            # Autopilot logic & TP/SL monitoring
│   │   ├── config.py               # Pydantic settings & env loader
│   │   ├── filters.py              # Rug check & security scoring
│   │   ├── gmgn_client.py          # Dexscreener & GMGN on-chain client
│   │   └── jupiter_client.py       # Jupiter Swap V6 integration
│   ├── tests/
│   │   ├── run_tests.py            # Standalone test runner
│   │   └── test_filters.py         # Pytest filter test suite
│   ├── main.py                     # FastAPI application entrypoint
│   └── requirements.txt            # Python dependencies
├── frontend/                       # React 18 + Vite frontend cockpit
│   ├── src/
│   │   ├── components/             # Modular dashboard components
│   │   │   ├── ArenaChart.jsx          # 12-Bot simultaneous multi-curve SVG chart
│   │   │   ├── ArenaLeaderboard.jsx    # Real-time tournament ranking table
│   │   │   ├── ArenaPositions.jsx      # Multi-bot open position monitor
│   │   │   ├── ArenaTab.jsx            # 12-Bot Arena control master cockpit
│   │   │   ├── AutopilotTab.jsx
│   │   │   ├── BenchmarkTable.jsx
│   │   │   ├── BotSettingsTab.jsx
│   │   │   ├── CreateStrategyModal.jsx
│   │   │   ├── EditStrategyModal.jsx
│   │   │   ├── Navbar.jsx
│   │   │   ├── PnLChart.jsx
│   │   │   ├── PositionCard.jsx
│   │   │   ├── QuickBuyModal.jsx
│   │   │   ├── RadarTab.jsx
│   │   │   ├── ReportTab.jsx           # Institutional Backtest & Audit Reports
│   │   │   ├── SmartMoneyTab.jsx
│   │   │   ├── TradeHistory.jsx
│   │   │   └── WalletModal.jsx
│   │   ├── utils/
│   │   │   └── formatters.js       # Numeric, price, and SOL formatting utilities
│   │   ├── App.jsx                 # Main terminal application
│   │   ├── index.css               # Design system & cyberpunk glass theme
│   │   └── main.jsx
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
├── .env.example                    # Environment variable template
├── .gitignore                      # Git ignore patterns
├── pytest.ini                      # Pytest configuration
├── LICENSE                         # MIT License
└── README.md                       # Documentation
```

---

## ⚙️ Configuration & Environment Variables

Copy `.env.example` to create your local `.env` configuration:

```bash
cp .env.example .env
```

### Environment Variable Reference

| Variable | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `TELEGRAM_BOT_TOKEN` | String | `""` | Telegram Bot API token from `@BotFather` |
| `TELEGRAM_CHAT_ID` | String | `""` | Telegram Chat / Channel ID for notifications |
| `SOLANA_RPC_URL` | String | `https://api.mainnet-beta.solana.com` | Solana JSON-RPC endpoint |
| `SOLANA_PRIVATE_KEY` | String | `""` | Base58 private key (used locally for live signing) |
| `PAPER_TRADING` | Boolean | `true` | `true` for virtual simulation, `false` for live execution |
| `DEFAULT_BUY_AMOUNT_SOL` | Float | `0.2` | Default buy size per trade in SOL |
| `MIN_LIQUIDITY_USD` | Float | `3000` | Minimum liquidity threshold (USD) |
| `MAX_TOP10_HOLD_RATIO` | Float | `0.35` | Maximum allowed Top 10 holder supply concentration |
| `MIN_SMART_MONEY_COUNT` | Integer | `2` | Minimum required smart money whale buyers |
| `MAX_DEV_HOLD_RATIO` | Float | `0.05` | Maximum developer holding ratio (5%) |
| `SLIPPAGE_BPS` | Integer | `500` | Slippage tolerance in basis points (500 bps = 5%) |
| `AUTO_TP_PERCENT` | Float | `50.0` | Default Take-Profit target percentage |
| `AUTO_SL_PERCENT` | Float | `20.0` | Default Stop-Loss threshold percentage |

---

## 🚀 Quick Start Guide

### Running with Go Backend (Recommended)

1. **Start the Go Backend Server:**
   ```bash
   cd backend-go
   go run cmd/server/main.go
   ```
   *The server will start listening at `http://localhost:8000` with live SSE broadcast.*

2. **Start the React Frontend Cockpit:**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
   *Open `http://localhost:3000` in your browser.*

---

## 🧪 Testing & Validation

### Run Go Tests
```bash
cd backend-go
go test -v ./...
```

### Run Frontend Build Test
```bash
cd frontend
npm run build
```

---

## 🔒 Security & Safe Usage

- **Local Transaction Signing:** Private keys are stored strictly in memory on your local machine and never logged or sent to remote third-party analytics.
- **Paper Trading Safeguard:** `PAPER_TRADING=true` is enabled by default to allow complete simulation without risking capital.
- **Rug & Freeze Authority Filter:** Inspects SPL Mint account byte layouts to ensure freeze authority is disabled before executing transactions.

---

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.
