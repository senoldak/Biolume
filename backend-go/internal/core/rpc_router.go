package core

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"sync"
	"time"

	"biolume-suite/internal/bot"
)

type RPCEndpoint struct {
	Name       string        `json:"name"`
	URL        string        `json:"url"`
	Latency    time.Duration `json:"latency"`
	LatencyMs  int64         `json:"latency_ms"`
	IsHealthy  bool          `json:"is_healthy"`
	IsActive   bool          `json:"is_active"`
	FailCount  int           `json:"fail_count"`
	TotalPings int           `json:"total_pings"`
}

type RPCRouter struct {
	mu        sync.RWMutex
	Endpoints []*RPCEndpoint
	ActiveRPC *RPCEndpoint
	client    *http.Client
}

var DefaultRPCRouter = &RPCRouter{
	client: &http.Client{Timeout: 3 * time.Second},
	Endpoints: []*RPCEndpoint{
		{Name: "Solana Official Mainnet", URL: "https://api.mainnet-beta.solana.com", IsHealthy: true},
		{Name: "Helius High-Speed RPC", URL: "https://mainnet.helius-rpc.com/?api-key=public", IsHealthy: true},
		{Name: "QuickNode Fast Lane", URL: "https://solana-mainnet.rpcpool.com", IsHealthy: true},
		{Name: "Triton RPC Node", URL: "https://ssc-dao.genesysgo.net", IsHealthy: true},
	},
}

func (rr *RPCRouter) StartLatencyBenchmarkLoop() {
	go func() {
		for {
			rr.BenchmarkAllEndpoints()
			time.Sleep(15 * time.Second)
		}
	}()
}

func (rr *RPCRouter) BenchmarkAllEndpoints() {
	rr.mu.Lock()
	defer rr.mu.Unlock()

	var fastest *RPCEndpoint
	var minLatency time.Duration = 999 * time.Second

	for _, ep := range rr.Endpoints {
		ep.TotalPings++
		start := time.Now()

		payload := map[string]interface{}{
			"jsonrpc": "2.0",
			"id":      1,
			"method":  "getHealth",
		}
		data, _ := json.Marshal(payload)
		resp, err := rr.client.Post(ep.URL, "application/json", bytes.NewBuffer(data))
		latency := time.Since(start)

		if err == nil && resp != nil && resp.StatusCode == 200 {
			resp.Body.Close()
			ep.IsHealthy = true
			ep.Latency = latency
			ep.LatencyMs = latency.Milliseconds()
			ep.FailCount = 0

			if latency < minLatency {
				minLatency = latency
				fastest = ep
			}
		} else {
			ep.FailCount++
			if ep.FailCount >= 3 {
				ep.IsHealthy = false
			}
			ep.LatencyMs = 999
		}
	}

	if fastest != nil {
		for _, ep := range rr.Endpoints {
			ep.IsActive = (ep.URL == fastest.URL)
		}
		rr.ActiveRPC = fastest
		bot.DefaultTradeExecutor.RPCUrl = fastest.URL
	}
}

func (rr *RPCRouter) AddEndpoint(name, url string) {
	rr.mu.Lock()
	defer rr.mu.Unlock()
	rr.Endpoints = append(rr.Endpoints, &RPCEndpoint{
		Name:      name,
		URL:       url,
		IsHealthy: true,
	})
}

func (rr *RPCRouter) GetStatus() map[string]interface{} {
	rr.mu.RLock()
	defer rr.mu.RUnlock()

	activeName := "Default"
	activeURL := "https://api.mainnet-beta.solana.com"
	var activePing int64 = 0

	if rr.ActiveRPC != nil {
		activeName = rr.ActiveRPC.Name
		activeURL = rr.ActiveRPC.URL
		activePing = rr.ActiveRPC.LatencyMs
	}

	return map[string]interface{}{
		"active_rpc_name": activeName,
		"active_rpc_url":  activeURL,
		"active_latency":  fmt.Sprintf("%dms", activePing),
		"endpoints":       rr.Endpoints,
	}
}
