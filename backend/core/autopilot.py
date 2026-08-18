import asyncio
import logging
from typing import Dict, Any, List, Optional
from backend.core.config import settings
from backend.core.filters import analyze_token_security
from backend.core.gmgn_client import gmgn_client
from backend.bot.trade_executor import trade_executor

logger = logging.getLogger(__name__)

class AutoSniperEngine:
    """
    Autonomous trading and rug-defense engine for automated on-chain sniping.
    """
    def __init__(self):
        self.is_running = False
        self.min_smart_money = 3        # Require at least 3 smart money buyers
        self.min_safety_score = 75       # Minimum safety score of 75/100
        self.take_profit_ratio = 1.50   # Auto-sell on 50% profit
        self.stop_loss_ratio = 0.80     # Auto-sell on 20% loss
        self.buy_amount_sol = 0.2        # Default purchase size in SOL
        self.history_logs: List[Dict[str, Any]] = []
        self.trade_history: List[Dict[str, Any]] = []
        self.evaluated_token_log_cache: set = set()
        self.pnl_chart_points: List[Dict[str, Any]] = [
            {"time": "Initial", "balance_sol": 10.0, "profit_sol": 0.0}
        ]
        self.stats = {
            "scanned_count": 0,
            "passed_count": 0,
            "rejected_rug_count": 0,
            "winning_trades": 0,
            "losing_trades": 0,
            "total_profit_sol": 0.0
        }

    def log(self, text: str, level: str = "INFO", meta: Optional[Dict[str, Any]] = None):
        logger.info(f"[AUTOPILOT] {text}")
        import time
        log_entry = {
            "timestamp": time.strftime("%H:%M:%S"),
            "text": text,
            "level": level,
            "meta": meta or {}
        }
        self.history_logs.insert(0, log_entry)
        if len(self.history_logs) > 100:
            self.history_logs.pop()

    async def evaluate_and_auto_trade(self, token_data: Dict[str, Any]):
        """
        Evaluates token against strict security filters and executes automated buy if criteria are satisfied.
        """
        token_address = token_data.get("token_address", token_data.get("address", ""))
        symbol = token_data.get("symbol", "")
        price_usd = float(token_data.get("price_usd", 0.0) or 0.0)

        if not token_address or price_usd <= 0:
            return

        # 1. Check if position is already open
        for pos in trade_executor.get_positions():
            if pos["token_address"] == token_address and pos["status"] == "OPEN":
                return

        # 2. Strict Filter Evaluation
        smart_count = token_data.get("smart_money_buyers", token_data.get("smart_money_count", 0))
        analysis = analyze_token_security(token_data, smart_wallets_active=smart_count)
        safety_score = 100 - analysis.risk_score

        cache_key = f"{token_address}_{safety_score}_{smart_count}"
        already_logged = cache_key in self.evaluated_token_log_cache

        # 3. Decision Matrix (Elite Filter)
        if (smart_count >= self.min_smart_money and 
            safety_score >= self.min_safety_score and 
            not analysis.dev_dumped and 
            analysis.top10_ratio <= 0.30):
            
            self.stats["scanned_count"] += 1
            self.stats["passed_count"] += 1
            self.evaluated_token_log_cache.add(cache_key)

            self.log(
                f"🔥 ELITE OPPORTUNITY: ${symbol} ({token_address[:6]}...{token_address[-4:]}) | Whales: {smart_count} | Safety: {safety_score}/100 -> EXECUTING BUY...",
                level="BUY_SIGNAL",
                meta={"symbol": symbol, "score": safety_score, "smart_count": smart_count}
            )

            # Execute Auto Buy
            res = trade_executor.execute_quick_buy(
                token_address=token_address,
                symbol=symbol,
                amount_sol=self.buy_amount_sol,
                price_usd=price_usd
            )
            if res.get("success"):
                self.log(
                    f"✅ BOUGHT: {self.buy_amount_sol} SOL -> ${symbol} @ ${price_usd:.6f}",
                    level="SUCCESS",
                    meta={"symbol": symbol, "amount_sol": self.buy_amount_sol, "price_usd": price_usd}
                )
        else:
            if not already_logged:
                self.stats["scanned_count"] += 1
                self.stats["rejected_rug_count"] += 1
                self.evaluated_token_log_cache.add(cache_key)
                
                reasons_str = ", ".join(analysis.reasons) if analysis.reasons else f"Insufficient safety score ({safety_score}/100)"
                self.log(
                    f"🛡️ RUG/RISK BLOCKED: ${symbol} rejected. Reason: {reasons_str} (Score: {safety_score}/100, Whales: {smart_count})",
                    level="BLOCKED",
                    meta={"symbol": symbol, "score": safety_score, "reasons": analysis.reasons}
                )

    async def monitor_open_positions_and_auto_sell(self):
        """
        Tracks live prices and automatically triggers TP/SL closures.
        """
        import time
        positions = trade_executor.get_positions()
        for pos in positions:
            if pos["status"] != "OPEN":
                continue

            entry_price = float(pos["entry_price_usd"] or 0.000001)
            token_address = pos["token_address"]

            # Query live on-chain price
            info = await gmgn_client.get_token_info(token_address)
            if info and info.get("price_usd") and info.get("price_usd") > 0:
                current_price = float(info["price_usd"])
            else:
                continue

            pnl_pct = ((current_price - entry_price) / max(entry_price, 0.000001)) * 100
            now_str = time.strftime("%H:%M:%S")

            # Take Profit
            if current_price >= entry_price * self.take_profit_ratio:
                pos["status"] = "CLOSED_PROFIT"
                pos["exit_price_usd"] = current_price
                pos["exit_time"] = now_str
                pos["pnl_pct"] = pnl_pct
                profit_sol = pos["amount_sol"] * (self.take_profit_ratio - 1.0)
                pos["pnl_sol"] = profit_sol
                
                trade_executor.virtual_balance_sol += (pos["amount_sol"] + profit_sol)
                self.stats["total_profit_sol"] += profit_sol
                self.stats["winning_trades"] += 1

                self.trade_history.insert(0, {**pos})
                self.pnl_chart_points.append({
                    "time": now_str,
                    "balance_sol": round(trade_executor.virtual_balance_sol, 4),
                    "profit_sol": round(self.stats["total_profit_sol"], 4)
                })

                self.log(
                    f"💰 TAKE PROFIT: ${pos['symbol']} -> +{pnl_pct:.1f}% Profit (+{profit_sol:.3f} SOL net)",
                    level="PROFIT",
                    meta={"symbol": pos['symbol'], "profit_sol": profit_sol, "pnl_pct": pnl_pct}
                )

            # Stop Loss
            elif current_price <= entry_price * self.stop_loss_ratio:
                pos["status"] = "CLOSED_LOSS"
                pos["exit_price_usd"] = current_price
                pos["exit_time"] = now_str
                pos["pnl_pct"] = pnl_pct
                loss_sol = pos["amount_sol"] * (1.0 - self.stop_loss_ratio)
                pos["pnl_sol"] = -loss_sol

                trade_executor.virtual_balance_sol += (pos["amount_sol"] - loss_sol)
                self.stats["total_profit_sol"] -= loss_sol
                self.stats["losing_trades"] += 1

                self.trade_history.insert(0, {**pos})
                self.pnl_chart_points.append({
                    "time": now_str,
                    "balance_sol": round(trade_executor.virtual_balance_sol, 4),
                    "profit_sol": round(self.stats["total_profit_sol"], 4)
                })

                self.log(
                    f"🛑 STOP LOSS: ${pos['symbol']} -> -{abs(pnl_pct):.1f}% Loss protection triggered.",
                    level="LOSS",
                    meta={"symbol": pos['symbol'], "loss_sol": loss_sol, "pnl_pct": pnl_pct}
                )

autopilot_engine = AutoSniperEngine()
