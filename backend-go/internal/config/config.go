package config

type Config struct {
	Port              string
	DexscreenerAPIURL string
	MaxTop10Ratio     float64
	MaxDevHoldRatio   float64
	MinLiquidityUSD   float64
	MinSmartMoney     int
}

var Settings = Config{
	Port:              "8000",
	DexscreenerAPIURL: "https://api.dexscreener.com/latest/dex",
	MaxTop10Ratio:     0.30,
	MaxDevHoldRatio:   0.10,
	MinLiquidityUSD:   5000.0,
	MinSmartMoney:     3,
}
