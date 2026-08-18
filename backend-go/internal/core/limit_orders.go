package core

import (
	"fmt"
	"sync"
	"time"

	"biolume-suite/internal/bot"
)

type LimitOrder struct {
	ID             string    `json:"id"`
	TokenAddress   string    `json:"token_address"`
	Symbol         string    `json:"symbol"`
	OrderType      string    `json:"order_type"` // LIMIT_BUY, LIMIT_SELL, DCA_DIP_BUY
	TargetPriceUSD float64   `json:"target_price_usd"`
	AmountSOL      float64   `json:"amount_sol"`
	Status         string    `json:"status"` // PENDING, FILLED, CANCELLED
	CreatedAt      time.Time `json:"created_at"`
	FilledAt       string    `json:"filled_at,omitempty"`
}

type LimitOrderManager struct {
	mu     sync.RWMutex
	Orders map[string]*LimitOrder
}

var DefaultLimitOrderManager = &LimitOrderManager{
	Orders: make(map[string]*LimitOrder),
}

func (lom *LimitOrderManager) CreateOrder(tokenAddr, symbol, orderType string, targetPrice, amountSOL float64) LimitOrder {
	lom.mu.Lock()
	defer lom.mu.Unlock()

	id := fmt.Sprintf("order_%d", time.Now().UnixNano())
	order := &LimitOrder{
		ID:             id,
		TokenAddress:   tokenAddr,
		Symbol:         symbol,
		OrderType:      orderType,
		TargetPriceUSD: targetPrice,
		AmountSOL:      amountSOL,
		Status:         "PENDING",
		CreatedAt:      time.Now(),
	}
	lom.Orders[id] = order

	DefaultAutopilotEngine.Log(
		fmt.Sprintf("📋 LIMIT ORDER PLACED: %s $%s @ $%.6f (%.2f SOL)", orderType, symbol, targetPrice, amountSOL),
		"LIMIT_ORDER_CREATED",
		map[string]interface{}{"order_id": id, "symbol": symbol, "target_price": targetPrice},
	)

	return *order
}

func (lom *LimitOrderManager) CancelOrder(orderID string) bool {
	lom.mu.Lock()
	defer lom.mu.Unlock()

	if ord, ok := lom.Orders[orderID]; ok && ord.Status == "PENDING" {
		ord.Status = "CANCELLED"
		DefaultAutopilotEngine.Log(fmt.Sprintf("🚫 LIMIT ORDER CANCELLED: %s", orderID), "LIMIT_ORDER_CANCELLED", nil)
		return true
	}
	return false
}

func (lom *LimitOrderManager) EvaluateOrdersWithLivePrice(tokenAddr string, currentPrice float64) {
	lom.mu.Lock()
	defer lom.mu.Unlock()

	for _, ord := range lom.Orders {
		if ord.Status != "PENDING" || ord.TokenAddress != tokenAddr {
			continue
		}

		shouldFill := false
		if (ord.OrderType == "LIMIT_BUY" || ord.OrderType == "DCA_DIP_BUY") && currentPrice <= ord.TargetPriceUSD {
			shouldFill = true
		} else if ord.OrderType == "LIMIT_SELL" && currentPrice >= ord.TargetPriceUSD {
			shouldFill = true
		}

		if shouldFill {
			ord.Status = "FILLED"
			ord.FilledAt = time.Now().Format("2006-01-02 15:04:05")

			DefaultAutopilotEngine.Log(
				fmt.Sprintf("🎯 LIMIT ORDER TRIGGERED: %s $%s @ $%.6f", ord.OrderType, ord.Symbol, currentPrice),
				"LIMIT_FILLED",
				map[string]interface{}{"order_id": ord.ID, "symbol": ord.Symbol, "price": currentPrice},
			)

			if ord.OrderType == "LIMIT_BUY" || ord.OrderType == "DCA_DIP_BUY" {
				bot.DefaultTradeExecutor.ExecuteQuickBuy(ord.TokenAddress, ord.Symbol, ord.AmountSOL, currentPrice)
			}
		}
	}
}

func (lom *LimitOrderManager) GetOrders() []LimitOrder {
	lom.mu.RLock()
	defer lom.mu.RUnlock()

	list := make([]LimitOrder, 0)
	for _, ord := range lom.Orders {
		list = append(list, *ord)
	}
	return list
}
