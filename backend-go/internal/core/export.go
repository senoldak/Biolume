package core

import (
	"bytes"
	"encoding/csv"
	"fmt"

	"biolume-suite/internal/bot"
)

func GenerateTradeHistoryCSV() ([]byte, error) {
	positions := bot.DefaultTradeExecutor.GetClosedPositions()
	var buf bytes.Buffer
	writer := csv.NewWriter(&buf)

	// Write CSV Header
	header := []string{
		"Position ID",
		"Token Address",
		"Symbol",
		"Status",
		"Buy Time",
		"Exit Time",
		"Entry Price USD",
		"Exit Price USD",
		"Invested SOL",
		"Realized PnL SOL",
		"PnL %",
		"Tx Hash",
	}
	if err := writer.Write(header); err != nil {
		return nil, err
	}

	// Write Rows
	for _, p := range positions {
		row := []string{
			p.ID,
			p.TokenAddress,
			p.Symbol,
			p.Status,
			p.BuyTime,
			p.ExitTime,
			fmt.Sprintf("%.8f", p.EntryPriceUSD),
			fmt.Sprintf("%.8f", p.ExitPriceUSD),
			fmt.Sprintf("%.4f", p.AmountSOL),
			fmt.Sprintf("%.4f", p.PnLSOL),
			fmt.Sprintf("%.2f%%", p.PnLPct),
			p.TxHash,
		}
		if err := writer.Write(row); err != nil {
			return nil, err
		}
	}

	writer.Flush()
	return buf.Bytes(), writer.Error()
}
