import pytest
from backend.core.filters import analyze_token_security

def test_analyze_token_security_safe():
    token_data = {
        "address": "TestToken11111111111111111111111111111111111",
        "symbol": "SAFE_COIN",
        "name": "Safe Token",
        "price_usd": 0.05,
        "market_cap": 120000,
        "liquidity_usd": 45000,
        "top10_ratio": 0.15,
        "dev_dumped": False,
        "dev_hold_rate": 0.02
    }
    result = analyze_token_security(token_data, smart_wallets_active=3)
    assert result.is_safe is True
    assert result.risk_score < 45
    assert result.smart_money_buyers == 3

def test_analyze_token_security_rug_risk():
    token_data = {
        "address": "RugToken11111111111111111111111111111111111",
        "symbol": "RUG",
        "name": "Danger Token",
        "price_usd": 0.00001,
        "market_cap": 10000,
        "liquidity_usd": 500,
        "top10_ratio": 0.65,
        "dev_dumped": True,
        "dev_hold_rate": 0.20
    }
    result = analyze_token_security(token_data, smart_wallets_active=0)
    assert result.is_safe is False
    assert result.risk_score >= 45
    assert result.dev_dumped is True
