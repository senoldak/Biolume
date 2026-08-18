import os
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv()

class Settings(BaseModel):
    # Telegram Bot
    TELEGRAM_BOT_TOKEN: str = os.getenv("TELEGRAM_BOT_TOKEN", "")
    TELEGRAM_CHAT_ID: str = os.getenv("TELEGRAM_CHAT_ID", "")
    
    # GMGN / API URLs
    GMGN_BASE_URL: str = "https://gmgn.ai"
    PUMP_FUN_API_URL: str = "https://frontend-api.pump.fun"
    DEXSCREENER_API_URL: str = "https://api.dexscreener.com/latest/dex"
    
    # Filter Defaults
    MIN_LIQUIDITY_USD: float = float(os.getenv("MIN_LIQUIDITY_USD", "3000"))
    MAX_TOP10_HOLD_RATIO: float = float(os.getenv("MAX_TOP10_HOLD_RATIO", "0.35")) # Max %35 top 10 holders
    MIN_SMART_MONEY_COUNT: int = int(os.getenv("MIN_SMART_MONEY_COUNT", "2"))
    MAX_DEV_HOLD_RATIO: float = float(os.getenv("MAX_DEV_HOLD_RATIO", "0.05")) # Max %5 dev holding
    
    # Paper Trading / Live Trade
    PAPER_TRADING: bool = os.getenv("PAPER_TRADING", "true").lower() == "true"
    DEFAULT_BUY_AMOUNT_SOL: float = float(os.getenv("DEFAULT_BUY_AMOUNT_SOL", "0.2"))
    SLIPPAGE_BPS: int = int(os.getenv("SLIPPAGE_BPS", "500")) # %5

settings = Settings()
