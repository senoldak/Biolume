from typing import Dict, Any, List, Optional
from pydantic import BaseModel
from backend.core.config import settings

class TokenAnalysisResult(BaseModel):
    token_address: str
    symbol: str
    name: str
    price_usd: float
    market_cap: float
    liquidity_usd: float
    bonding_curve_progress: Optional[float] = None
    smart_money_buyers: int = 0
    top10_ratio: float = 0.0
    bundled_ratio: float = 0.0
    sniper_count: int = 0
    is_bundled: bool = False
    dev_dumped: bool = False
    is_safe: bool = True
    risk_score: int = 0  # 0 to 100 (0: safe, 100: extreme rug risk)
    reasons: List[str] = []

def analyze_token_security(token_data: Dict[str, Any], smart_wallets_active: int = 0) -> TokenAnalysisResult:
    """
    Analyzes token data against on-chain rug risk rules and generates a security score.
    """
    reasons = []
    risk_score = 0
    
    symbol = token_data.get("symbol", "UNKNOWN")
    name = token_data.get("name", "Unknown Token")
    address = token_data.get("address", token_data.get("mint", ""))
    price_usd = float(token_data.get("price_usd", token_data.get("price", 0.0) or 0.0))
    market_cap = float(token_data.get("market_cap", token_data.get("usd_market_cap", 0.0) or 0.0))
    liquidity_usd = float(token_data.get("liquidity_usd", token_data.get("liquidity", 0.0) or 0.0))
    bonding_curve_progress = token_data.get("bonding_curve_progress")
    
    top10_ratio = float(token_data.get("top_10_holder_rate", token_data.get("top10_ratio", 0.20) or 0.20))
    dev_hold_rate = float(token_data.get("dev_hold_rate", 0.0) or 0.0)
    dev_dumped = bool(token_data.get("dev_dumped", False))

    bundled_ratio = float(token_data.get("bundled_ratio", 0.0) or 0.0)
    if bundled_ratio == 0 and top10_ratio > 0.30:
        bundled_ratio = top10_ratio * 0.90
    sniper_count = int(token_data.get("sniper_count", 0) or max(1, int(bundled_ratio * 20)))
    is_bundled = bundled_ratio >= 0.20

    # 1. Bundled Launch & Top 10 Holder Check
    if is_bundled:
        risk_score += 45
        reasons.append(f"🚨 Dev/Cabal Bundled Snipe ({bundled_ratio * 100:.1f}% initial supply)")
    elif top10_ratio > settings.MAX_TOP10_HOLD_RATIO:
        risk_score += 35
        reasons.append(f"Top 10 holder ratio is high ({top10_ratio * 100:.1f}%)")
        
    # 2. Dev Dump / Sell Check
    if dev_dumped:
        risk_score += 40
        reasons.append("Developer dumped/sold all tokens!")
    elif dev_hold_rate > settings.MAX_DEV_HOLD_RATIO:
        risk_score += 20
        reasons.append(f"Developer retains high supply ratio ({dev_hold_rate * 100:.1f}%)")
        
    # 3. Liquidity Check
    if bonding_curve_progress is None or bonding_curve_progress >= 1.0:
        if liquidity_usd < settings.MIN_LIQUIDITY_USD and liquidity_usd > 0:
            risk_score += 25
            reasons.append(f"Low liquidity (${liquidity_usd:,.0f})")
            
    # 4. Smart Money Inflow Boost
    if smart_wallets_active >= settings.MIN_SMART_MONEY_COUNT:
        risk_score = max(0, risk_score - 20)
        reasons.append(f"🔥 {smart_wallets_active} Smart Money whales entered")

    is_safe = risk_score < 45 and not is_bundled

    return TokenAnalysisResult(
        token_address=address,
        symbol=symbol,
        name=name,
        price_usd=price_usd,
        market_cap=market_cap,
        liquidity_usd=liquidity_usd,
        bonding_curve_progress=bonding_curve_progress,
        smart_money_buyers=smart_wallets_active,
        top10_ratio=top10_ratio,
        bundled_ratio=bundled_ratio,
        sniper_count=sniper_count,
        is_bundled=is_bundled,
        dev_dumped=dev_dumped,
        is_safe=is_safe,
        risk_score=risk_score,
        reasons=reasons
    )
