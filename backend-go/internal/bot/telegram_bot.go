package bot

import (
	"bytes"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strconv"
	"strings"
	"sync"
	"time"
)

type TelegramMessage struct {
	MessageID int `json:"message_id"`
	From      struct {
		ID        int64  `json:"id"`
		FirstName string `json:"first_name"`
		Username  string `json:"username"`
	} `json:"from"`
	Chat struct {
		ID int64 `json:"id"`
	} `json:"chat"`
	Text string `json:"text"`
}

type TelegramUpdate struct {
	UpdateID int              `json:"update_id"`
	Message  *TelegramMessage `json:"message,omitempty"`
}

type TelegramBotManager struct {
	mu           sync.Mutex
	BotToken     string
	ChatID       int64
	IsRunning    bool
	LastUpdateID int
	client       *http.Client
}

var DefaultTelegramBot = &TelegramBotManager{
	client: &http.Client{Timeout: 10 * time.Second},
}

func (tb *TelegramBotManager) Start(botToken string, allowedChatID int64) {
	tb.mu.Lock()
	if botToken == "" {
		tb.mu.Unlock()
		return
	}
	tb.BotToken = botToken
	tb.ChatID = allowedChatID
	if tb.IsRunning {
		tb.mu.Unlock()
		return
	}
	tb.IsRunning = true
	tb.mu.Unlock()

	go tb.pollLoop()
	log.Printf("[TELEGRAM BOT] Remote control terminal listener active.")
}

func (tb *TelegramBotManager) SendMessage(chatID int64, text string) {
	if tb.BotToken == "" {
		return
	}
	targetID := chatID
	if targetID == 0 {
		targetID = tb.ChatID
	}
	if targetID == 0 {
		return
	}

	url := fmt.Sprintf("https://api.telegram.org/bot%s/sendMessage", tb.BotToken)
	payload := map[string]interface{}{
		"chat_id":    targetID,
		"text":       text,
		"parse_mode": "Markdown",
	}
	data, _ := json.Marshal(payload)
	resp, err := tb.client.Post(url, "application/json", bytes.NewBuffer(data))
	if err == nil && resp != nil {
		resp.Body.Close()
	}
}

func (tb *TelegramBotManager) pollLoop() {
	for tb.IsRunning {
		url := fmt.Sprintf("https://api.telegram.org/bot%s/getUpdates?offset=%d&timeout=15", tb.BotToken, tb.LastUpdateID+1)
		resp, err := tb.client.Get(url)
		if err != nil {
			time.Sleep(3 * time.Second)
			continue
		}

		var result struct {
			Ok     bool             `json:"ok"`
			Result []TelegramUpdate `json:"result"`
		}

		if err := json.NewDecoder(resp.Body).Decode(&result); err == nil && result.Ok {
			for _, upd := range result.Result {
				if upd.UpdateID > tb.LastUpdateID {
					tb.LastUpdateID = upd.UpdateID
				}
				if upd.Message != nil {
					tb.handleCommand(upd.Message)
				}
			}
		}
		resp.Body.Close()
		time.Sleep(1 * time.Second)
	}
}

func (tb *TelegramBotManager) handleCommand(msg *TelegramMessage) {
	text := strings.TrimSpace(msg.Text)
	chatID := msg.Chat.ID

	if strings.HasPrefix(text, "/start") || strings.HasPrefix(text, "/help") {
		helpText := "🤖 *Biolume Remote Control Bot*\n\n" +
			"Available Commands:\n" +
			"`/status` - Live balance, positions & drawdown\n" +
			"`/panic` - Emergency close ALL open positions\n" +
			"`/buy <token_addr> <sol_amount>` - Instant manual snipe\n" +
			"`/resetcb` - Reset Circuit Breaker limit\n"
		tb.SendMessage(chatID, helpText)
		return
	}

	if strings.HasPrefix(text, "/status") {
		bal := DefaultTradeExecutor.GetBalance()
		positions := DefaultTradeExecutor.GetPositions()

		statusText := fmt.Sprintf(
			"📊 *Biolume System Status*\n\n"+
				"• *Mode:* `%v`\n"+
				"• *Balance:* `%.4f SOL`\n"+
				"• *Open Positions:* `%d`\n"+
				"• *Daily Drawdown:* `%.4f SOL` (Limit: `%.2f SOL`)\n"+
				"• *Circuit Breaker:* `%v`",
			bal["mode"], bal["balance_sol"], len(positions), bal["daily_drawdown_sol"], bal["max_daily_drawdown_sol"], bal["circuit_breaker_active"],
		)
		tb.SendMessage(chatID, statusText)
		return
	}

	if strings.HasPrefix(text, "/panic") {
		positions := DefaultTradeExecutor.GetPositions()
		count := len(positions)
		for _, p := range positions {
			if p.Status == "OPEN" {
				p.Status = "CLOSED_MANUAL"
				DefaultTradeExecutor.UpdatePosition(p)
			}
		}
		tb.SendMessage(chatID, fmt.Sprintf("🚨 *PANIC CLOSE EXECUTED:* Closed %d positions.", count))
		return
	}

	if strings.HasPrefix(text, "/resetcb") {
		DefaultTradeExecutor.ResetCircuitBreaker()
		tb.SendMessage(chatID, "✅ *Circuit Breaker Reset successfully!* Bot trading re-enabled.")
		return
	}

	if strings.HasPrefix(text, "/buy") {
		parts := strings.Fields(text)
		if len(parts) < 3 {
			tb.SendMessage(chatID, "❌ Usage: `/buy <token_address> <sol_amount>`")
			return
		}
		tokenAddr := parts[1]
		amountSOL, err := strconv.ParseFloat(parts[2], 64)
		if err != nil || amountSOL <= 0 {
			tb.SendMessage(chatID, "❌ Invalid SOL amount.")
			return
		}

		res := DefaultTradeExecutor.ExecuteQuickBuy(tokenAddr, "MANUAL", amountSOL, 0.0001)
		if res.Success {
			tb.SendMessage(chatID, fmt.Sprintf("🚀 *Bought with %.3f SOL:* `%s`", amountSOL, tokenAddr))
		} else {
			tb.SendMessage(chatID, fmt.Sprintf("❌ *Buy Failed:* %s", res.Error))
		}
		return
	}
}
