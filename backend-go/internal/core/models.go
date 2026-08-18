package core

type TokenData struct {
	Address              string  `json:"address"`
	Symbol               string  `json:"symbol"`
	Name                 string  `json:"name"`
	PriceUSD             float64 `json:"price_usd"`
	MarketCap            float64 `json:"market_cap"`
	LiquidityUSD         float64 `json:"liquidity_usd"`
	SmartMoneyCount      int     `json:"smart_money_count"`
	BondingCurveProgress float64 `json:"bonding_curve_progress"`
	Top10Ratio           float64 `json:"top10_ratio"`
	BundledRatio         float64 `json:"bundled_ratio"`
	SniperCount          int     `json:"sniper_count"`
	DevDumped            bool    `json:"dev_dumped"`
	DexURL               string  `json:"dex_url"`
}
