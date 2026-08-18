package core

import (
	"sync"
	"time"
)

type BlacklistManager struct {
	mu             sync.RWMutex
	TokenCooldowns map[string]time.Time `json:"token_cooldowns"` // Token -> Expiration
	BlacklistDevs  map[string]string    `json:"blacklist_devs"`  // Dev Wallet -> Reason
	BlacklistTokens map[string]string   `json:"blacklist_tokens"` // Token Address -> Reason
}

var DefaultBlacklistManager = &BlacklistManager{
	TokenCooldowns:  make(map[string]time.Time),
	BlacklistDevs:   make(map[string]string),
	BlacklistTokens: make(map[string]string),
}

func (bm *BlacklistManager) AddCooldown(tokenAddress string, durationMinutes int) {
	bm.mu.Lock()
	defer bm.mu.Unlock()
	bm.TokenCooldowns[tokenAddress] = time.Now().Add(time.Duration(durationMinutes) * time.Minute)
}

func (bm *BlacklistManager) IsTokenBlocked(tokenAddress, devAddress string) (bool, string) {
	bm.mu.RLock()
	defer bm.mu.RUnlock()

	// 1. Check permanent token blacklist
	if reason, ok := bm.BlacklistTokens[tokenAddress]; ok {
		return true, "Token is blacklisted: " + reason
	}

	// 2. Check dev blacklist
	if devAddress != "" {
		if reason, ok := bm.BlacklistDevs[devAddress]; ok {
			return true, "Developer is blacklisted: " + reason
		}
	}

	// 3. Check anti-chop cooldown
	if exp, ok := bm.TokenCooldowns[tokenAddress]; ok {
		if time.Now().Before(exp) {
			remaining := time.Until(exp).Round(time.Second)
			return true, "Token is on cooldown (" + remaining.String() + " remaining)"
		}
	}

	return false, ""
}

func (bm *BlacklistManager) AddBlacklistToken(tokenAddress, reason string) {
	bm.mu.Lock()
	defer bm.mu.Unlock()
	bm.BlacklistTokens[tokenAddress] = reason
}

func (bm *BlacklistManager) AddBlacklistDev(devAddress, reason string) {
	bm.mu.Lock()
	defer bm.mu.Unlock()
	bm.BlacklistDevs[devAddress] = reason
}

func (bm *BlacklistManager) RemoveBlacklistToken(tokenAddress string) {
	bm.mu.Lock()
	defer bm.mu.Unlock()
	delete(bm.BlacklistTokens, tokenAddress)
	delete(bm.TokenCooldowns, tokenAddress)
}

func (bm *BlacklistManager) GetStatus() map[string]interface{} {
	bm.mu.RLock()
	defer bm.mu.RUnlock()

	activeCooldowns := make(map[string]string)
	now := time.Now()
	for addr, exp := range bm.TokenCooldowns {
		if now.Before(exp) {
			activeCooldowns[addr] = exp.Sub(now).Round(time.Second).String()
		}
	}

	return map[string]interface{}{
		"active_cooldowns":  activeCooldowns,
		"blacklisted_devs":   bm.BlacklistDevs,
		"blacklisted_tokens": bm.BlacklistTokens,
	}
}
