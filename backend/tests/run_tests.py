import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')))

from backend.core.filters import analyze_token_security

def run_tests():
    # Test 1: Safe Token
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
    assert result.is_safe is True, "Expected token to be safe"
    assert result.risk_score < 45, "Expected risk score < 45"
    assert result.smart_money_buyers == 3
    print("[PASS] Test 1: Safe Token Analysis")

    # Test 2: Rug / High Risk Token
    rug_data = {
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
    rug_result = analyze_token_security(rug_data, smart_wallets_active=0)
    assert rug_result.is_safe is False, "Expected token to be marked risky"
    assert rug_result.risk_score >= 45, "Expected risk score >= 45"
    assert rug_result.dev_dumped is True
    print("[PASS] Test 2: Rug Token Filter Analysis")

if __name__ == "__main__":
    run_tests()
