import json
import logging
from typing import Dict, Any

logger = logging.getLogger(__name__)

def format_telegram_signal_card(token_analysis: Any) -> str:
    """
    Formats the rich signal notification card sent to Telegram users.
    """
    symbol = token_analysis.symbol
    name = token_analysis.name
    address = token_analysis.token_address
    mc = f"${token_analysis.market_cap:,.0f}" if token_analysis.market_cap else "N/A"
    liq = f"${token_analysis.liquidity_usd:,.0f}" if token_analysis.liquidity_usd else "N/A"
    price = f"${token_analysis.price_usd:.6f}" if token_analysis.price_usd else "N/A"
    smart_count = token_analysis.smart_money_buyers
    risk_score = token_analysis.risk_score
    
    # Risk Level Status
    if risk_score < 30:
        safety_status = "🟢 SAFE (Low Risk)"
    elif risk_score < 60:
        safety_status = "🟡 MODERATE RISK"
    else:
        safety_status = "🔴 HIGH RISK / POTENTIAL RUG"

    curve_info = ""
    if token_analysis.bonding_curve_progress is not None:
        progress_pct = int(token_analysis.bonding_curve_progress * 100)
        curve_info = f"\n💊 **Pump.fun Curve:** {progress_pct}% Completed"

    reasons_text = ""
    if token_analysis.reasons:
        reasons_text = "\n🔍 **Key Insights:**\n" + "\n".join([f" • {r}" for r in token_analysis.reasons])

    msg = (
        f"🚀 **NEW SMART SIGNAL: ${symbol}**\n"
        f"━━━━━━━━━━━━━━━━━━\n"
        f"🏷 **Name:** {name}\n"
        f"📊 **Market Cap:** {mc}\n"
        f"💧 **Liquidity:** {liq}\n"
        f"💵 **Price:** {price}\n"
        f"🧠 **Smart Money:** {smart_count} Whales Inflow\n"
        f"🛡 **Safety:** {safety_status} (Score: {100-risk_score}/100)"
        f"{curve_info}"
        f"{reasons_text}\n"
        f"━━━━━━━━━━━━━━━━━━\n"
        f"📋 **CA:** `{address}`\n"
        f"🔗 [GMGN.ai](https://gmgn.ai/sol/token/{address}) | [Dexscreener](https://dexscreener.com/solana/{address})"
    )
    return msg
