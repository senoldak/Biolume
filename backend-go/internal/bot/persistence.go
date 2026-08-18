package bot

import (
	"encoding/json"
	"fmt"
	"log"
	"os"
	"path/filepath"
	"sync"
)

type BotStateSnapshot struct {
	VirtualBalanceSOL float64    `json:"virtual_balance_sol"`
	PaperTrading      bool       `json:"paper_trading"`
	LiveWalletAddress string     `json:"live_wallet_address"`
	RPCUrl            string     `json:"rpc_url"`
	SlippagePct       float64    `json:"slippage_pct"`
	ActivePositions   []Position `json:"active_positions"`
	ClosedPositions   []Position `json:"closed_positions"`
}

type StatePersistenceManager struct {
	mu       sync.Mutex
	filePath string
}

var DefaultStatePersistence = NewStatePersistenceManager("data/bot_state.json")

func NewStatePersistenceManager(relativeFilePath string) *StatePersistenceManager {
	return &StatePersistenceManager{
		filePath: relativeFilePath,
	}
}

func (sp *StatePersistenceManager) SaveState(te *TradeExecutor) error {
	sp.mu.Lock()
	defer sp.mu.Unlock()

	te.mu.RLock()
	snapshot := BotStateSnapshot{
		VirtualBalanceSOL: te.VirtualBalanceSOL,
		PaperTrading:      te.PaperTrading,
		LiveWalletAddress: te.LiveWalletAddress,
		RPCUrl:            te.RPCUrl,
		SlippagePct:       te.SlippagePct,
		ActivePositions:   te.ActivePositions,
		ClosedPositions:   te.ClosedPositions,
	}
	te.mu.RUnlock()

	dir := filepath.Dir(sp.filePath)
	if err := os.MkdirAll(dir, 0755); err != nil {
		return fmt.Errorf("failed to create data dir: %w", err)
	}

	data, err := json.MarshalIndent(snapshot, "", "  ")
	if err != nil {
		return fmt.Errorf("failed to marshal state: %w", err)
	}

	tempFile := sp.filePath + ".tmp"
	if err := os.WriteFile(tempFile, data, 0644); err != nil {
		return fmt.Errorf("failed to write temp state: %w", err)
	}

	if err := os.Rename(tempFile, sp.filePath); err != nil {
		return fmt.Errorf("failed to commit state file: %w", err)
	}

	return nil
}

func (sp *StatePersistenceManager) LoadState(te *TradeExecutor) error {
	sp.mu.Lock()
	defer sp.mu.Unlock()

	if _, err := os.Stat(sp.filePath); os.IsNotExist(err) {
		return nil // No previous state, skip
	}

	data, err := os.ReadFile(sp.filePath)
	if err != nil {
		return fmt.Errorf("failed to read state file: %w", err)
	}

	var snapshot BotStateSnapshot
	if err := json.Unmarshal(data, &snapshot); err != nil {
		return fmt.Errorf("failed to unmarshal state: %w", err)
	}

	te.mu.Lock()
	if snapshot.VirtualBalanceSOL > 0 {
		te.VirtualBalanceSOL = snapshot.VirtualBalanceSOL
	}
	te.PaperTrading = snapshot.PaperTrading
	if snapshot.LiveWalletAddress != "" {
		te.LiveWalletAddress = snapshot.LiveWalletAddress
	}
	if snapshot.RPCUrl != "" {
		te.RPCUrl = snapshot.RPCUrl
	}
	if snapshot.SlippagePct > 0 {
		te.SlippagePct = snapshot.SlippagePct
	}
	if snapshot.ActivePositions != nil {
		te.ActivePositions = snapshot.ActivePositions
	}
	if snapshot.ClosedPositions != nil {
		te.ClosedPositions = snapshot.ClosedPositions
	}
	te.mu.Unlock()

	log.Printf("[STATE PERSISTENCE] Successfully loaded %d active and %d closed positions from disk.", len(snapshot.ActivePositions), len(snapshot.ClosedPositions))
	return nil
}
