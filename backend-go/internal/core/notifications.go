package core

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"time"
)

type NotificationDispatcher struct {
	client *http.Client
}

var DefaultNotifier = &NotificationDispatcher{
	client: &http.Client{Timeout: 4 * time.Second},
}

type DiscordEmbedField struct {
	Name   string `json:"name"`
	Value  string `json:"value"`
	Inline bool   `json:"inline"`
}

type DiscordEmbed struct {
	Title       string              `json:"title"`
	Description string              `json:"description"`
	Color       int                 `json:"color"`
	Fields      []DiscordEmbedField `json:"fields"`
	Footer      map[string]string   `json:"footer"`
	Timestamp   string              `json:"timestamp"`
}

func (nd *NotificationDispatcher) SendRichNotification(webhookURL, eventType, title, symbol, tokenAddress string, pnlPct, amountSOL, profitSOL float64, meta map[string]interface{}) {
	if webhookURL == "" {
		return
	}

	go func() {
		color := 0x00F0FF // Cyan info
		switch eventType {
		case "BUY_SIGNAL", "BUY_EXECUTION":
			color = 0x10B981 // Emerald Green
		case "TAKE_PROFIT", "PARTIAL_TP":
			color = 0x22C55E // Bright Green
		case "STOP_LOSS", "CIRCUIT_BREAKER":
			color = 0xEF4444 // Red
		case "TRAILING_STOP":
			color = 0xF59E0B // Amber
		}

		dexLink := fmt.Sprintf("https://dexscreener.com/solana/%s", tokenAddress)
		gmgnLink := fmt.Sprintf("https://gmgn.ai/sol/token/%s", tokenAddress)

		description := fmt.Sprintf("**Token:** $%s\n**Contract:** `%s`\n[DexScreener](%s) | [GMGN.ai](%s)", symbol, tokenAddress, dexLink, gmgnLink)

		fields := []DiscordEmbedField{
			{Name: "Event", Value: eventType, Inline: true},
			{Name: "Position Size", Value: fmt.Sprintf("%.3f SOL", amountSOL), Inline: true},
		}

		if pnlPct != 0 {
			fields = append(fields, DiscordEmbedField{
				Name:   "Net PnL",
				Value:  fmt.Sprintf("%+.2f%% (%+.4f SOL)", pnlPct, profitSOL),
				Inline: true,
			})
		}

		for k, v := range meta {
			fields = append(fields, DiscordEmbedField{
				Name:   k,
				Value:  fmt.Sprintf("%v", v),
				Inline: true,
			})
		}

		discordPayload := map[string]interface{}{
			"username": "Biolume Intelligence",
			"embeds": []DiscordEmbed{
				{
					Title:       title,
					Description: description,
					Color:       color,
					Fields:      fields,
					Footer:      map[string]string{"text": "Biolume Autopilot Trading Suite"},
					Timestamp:   time.Now().UTC().Format(time.RFC3339),
				},
			},
		}

		data, err := json.Marshal(discordPayload)
		if err != nil {
			return
		}

		resp, err := nd.client.Post(webhookURL, "application/json", bytes.NewBuffer(data))
		if err == nil && resp != nil {
			resp.Body.Close()
		}
	}()
}
