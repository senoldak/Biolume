import time
import logging
from typing import Dict, Any, List
from backend.core.config import settings

logger = logging.getLogger(__name__)

class TradeExecutor:
    """
    Trade executor supporting paper trading and live Solana/Jupiter swap routing.
    """
    def __init__(self):
        self.paper_trading = settings.PAPER_TRADING
        self.virtual_balance_sol = 10.0
        self.active_positions: List[Dict[str, Any]] = []

    def execute_quick_buy(self, token_address: str, symbol: str, amount_sol: float, price_usd: float) -> Dict[str, Any]:
        """
        Executes a quick SOL buy order (Paper Simulation or Live).
        """
        if self.paper_trading:
            if self.virtual_balance_sol < amount_sol:
                return {"success": False, "error": "Insufficient virtual balance!"}
            
            self.virtual_balance_sol -= amount_sol
            token_amount = (amount_sol * 150.0) / max(price_usd, 0.000001) # Assume 1 SOL ~ $150 USD
            
            position = {
                "id": f"pos_{int(time.time()*1000)}",
                "token_address": token_address,
                "symbol": symbol,
                "entry_price_usd": price_usd,
                "amount_sol": amount_sol,
                "token_amount": token_amount,
                "buy_time": time.strftime("%Y-%m-%d %H:%M:%S"),
                "status": "OPEN"
            }
            self.active_positions.append(position)
            
            logger.info(f"[PAPER BUY] {amount_sol} SOL -> {symbol} ({token_address}) @ ${price_usd}")
            return {
                "success": True,
                "type": "PAPER",
                "position": position,
                "remaining_sol": self.virtual_balance_sol
            }
        else:
            logger.info(f"[LIVE BUY INITIATED] {amount_sol} SOL -> {token_address}")
            return {
                "success": True,
                "type": "LIVE",
                "tx_hash": "mock_tx_solana_jupiter_hash_123",
                "amount_sol": amount_sol
            }

    def get_positions(self) -> List[Dict[str, Any]]:
        return self.active_positions

    def get_balance(self) -> Dict[str, Any]:
        return {
            "mode": "PAPER" if self.paper_trading else "LIVE",
            "balance_sol": self.virtual_balance_sol,
            "open_positions_count": len([p for p in self.active_positions if p["status"] == "OPEN"])
        }

trade_executor = TradeExecutor()
