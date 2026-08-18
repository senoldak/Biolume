import httpx
import logging
from typing import Dict, Any, Optional

logger = logging.getLogger(__name__)

class JupiterClient:
    """
    Jupiter V6 Swap API Entegrasyonu (Solana üzerindeki en iyi fiyat ve anlık swap)
    """
    def __init__(self):
        self.quote_api = "https://quote-api.jup.ag/v6/quote"
        self.swap_api = "https://quote-api.jup.ag/v6/swap"
        self.sol_mint = "So11111111111111111111111111111111111111112"

    async def get_swap_quote(self, output_mint: str, amount_sol: float, slippage_bps: int = 500) -> Optional[Dict[str, Any]]:
        """
        SOL karşılığı hedef token için en iyi fiyat rotasını çeker.
        """
        amount_lamports = int(amount_sol * 1_000_000_000)
        params = {
            "inputMint": self.sol_mint,
            "outputMint": output_mint,
            "amount": amount_lamports,
            "slippageBps": slippage_bps
        }
        
        async with httpx.AsyncClient(timeout=8.0) as client:
            try:
                resp = await client.get(self.quote_api, params=params)
                if resp.status_code == 200:
                    return resp.json()
                else:
                    logger.error(f"Jupiter quote error: {resp.text}")
            except Exception as e:
                logger.error(f"Jupiter API connection error: {e}")
        return None

    async def build_swap_transaction(self, quote_response: Dict[str, Any], user_public_key: str) -> Optional[str]:
        """
        İmzalanmaya hazır Swap Transaction (Base64) üretir.
        """
        payload = {
            "quoteResponse": quote_response,
            "userPublicKey": user_public_key,
            "wrapAndUnwrapSol": True
        }
        async with httpx.AsyncClient(timeout=8.0) as client:
            try:
                resp = await client.post(self.swap_api, json=payload)
                if resp.status_code == 200:
                    data = resp.json()
                    return data.get("swapTransaction")
            except Exception as e:
                logger.error(f"Jupiter swap transaction build error: {e}")
        return None

jupiter_client = JupiterClient()
