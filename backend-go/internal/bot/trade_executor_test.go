package bot

import (
	"os"
	"testing"
)

func TestTradeExecutorCircuitBreakerAndPersistence(t *testing.T) {
	tmpPath := "data/test_bot_state.json"
	defer os.Remove(tmpPath)

	persistence := NewStatePersistenceManager(tmpPath)
	te := &TradeExecutor{
		PaperTrading:        true,
		VirtualBalanceSOL:   10.0,
		PeakDailyBalanceSOL: 10.0,
		MaxDailyDrawdownSOL: 1.0,
		PriorityFeeSOL:      0.0005,
		ActivePositions:     make([]Position, 0),
		ClosedPositions:     make([]Position, 0),
	}

	// 1. Buy test
	resp := te.ExecuteQuickBuy("TestToken111111111111111111111111111111111111", "TEST", 0.5, 0.001)
	if !resp.Success {
		t.Fatalf("Expected quick buy success, got error: %s", resp.Error)
	}

	// 2. Save and reload state
	if err := persistence.SaveState(te); err != nil {
		t.Fatalf("Failed to save state: %v", err)
	}

	newTe := &TradeExecutor{
		ActivePositions: make([]Position, 0),
		ClosedPositions: make([]Position, 0),
	}
	if err := persistence.LoadState(newTe); err != nil {
		t.Fatalf("Failed to load state: %v", err)
	}

	if len(newTe.ActivePositions) != 1 {
		t.Errorf("Expected 1 active position loaded, got %d", len(newTe.ActivePositions))
	}

	// 3. Test Circuit Breaker triggering
	te.VirtualBalanceSOL = 8.5 // Drawdown 1.5 SOL > Max 1.0 SOL
	te.DailyDrawdownSOL = 1.5
	te.IsCircuitBreakerHit = true

	failResp := te.ExecuteQuickBuy("TestToken222222222222222222222222222222222222", "TEST2", 0.2, 0.001)
	if failResp.Success {
		t.Errorf("Expected circuit breaker to block trade, but trade succeeded")
	}

	// 4. Test Circuit Breaker reset
	te.ResetCircuitBreaker()
	if te.IsCircuitBreakerHit {
		t.Errorf("Expected circuit breaker to be reset")
	}
}
