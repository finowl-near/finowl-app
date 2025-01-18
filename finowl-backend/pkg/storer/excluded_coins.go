package storer

import "strings"

var excludedTickers = []string{
	"BTC",   // Bitcoin
	"ETH",   // Ethereum
	"DOGE",  // Dogecoin
	"SOL",   // Solana
	"BNB",   // Binance Coin
	"XRP",   // Ripple
	"ADA",   // Cardano
	"USDT",  // Tether
	"DOT",   // Polkadot
	"LTC",   // Litecoin
	"UNI",   // Uniswap
	"LINK",  // Chainlink
	"MATIC", // Polygon (MATIC)
	"XLM",   // Stellar Lumens
	"BCH",   // Bitcoin Cash
	"ATOM",  // Cosmos
	"VET",   // VeChain
	"TRX",   // TRON
	"EOS",   // EOS
	"XMR",   // Monero
	"NEO",   // NEO
	"ETC",   // Ethereum Classic
	"MIOTA", // IOTA
	"DASH",  // Dash
	"ZEC",   // Zcash
	"XTZ",   // Tezos
	"BSV",   // Bitcoin SV
	"CRO",   // Crypto.com Coin
	"LEO",   // UNUS SED LEO
	"MKR",   // Maker
	"USDC",  // USD Coin
	"ALGO",  // Algorand
	"COMP",  // Compound
	"AAVE",  // Aave
	"HT",    // Huobi Token
	"DAI",   // Dai
	"SNX",   // Synthetix
	"BAT",   // Basic Attention Token
	"ZIL",   // Zilliqa
	"FTT",   // FTX Token
	"ENJ",   // Enjin Coin
	"NEXO",  // Nexo
	"CHZ",   // Chiliz
	"DCR",   // Decred
	"QTUM",  // Qtum
	"ONT",   // Ontology
	"BTT",   // BitTorrent
	"MANA",  // Decentraland
	"GRT",   // The Graph
	"HNT",   // Helium
	"KSM",   // Kusama
	"LUNA",  // Terra
	"SUSHI", // SushiSwap
	"YFI",   // Yearn.finance
	"REN",   // Ren
	"CRV",   // Curve DAO Token
	"CEL",   // Celsius
	"BAND",  // Band Protocol
	"WAVES", // Waves
	"ICX",   // ICON
	"OMG",   // OMG Network
	"1INCH", // 1inch
	"STORJ", // Storj
	"KAVA",  // Kava.io
	"RLC",   // iExec RLC
	"FIL",   // Filecoin
	"AR",    // Arweave
	"RUNE",  // THORChain
	"KNC",   // Kyber Network
	"OCEAN", // Ocean Protocol
	"LRC",   // Loopring
	"ANKR",  // Ankr
	"BTM",   // Bytom
	"FET",   // Fetch.ai
	"GNO",   // Gnosis
	"KDA",   // Kadena
	"SRM",   // Serum
	"SKL",   // SKALE Network
	"SXP",   // Swipe
	"CHR",   // Chromia
	"RSR",   // Reserve Rights
	"NKN",   // NKN
	"FX",    // Function X
	"TOMO",  // TomoChain
	"ARPA",  // ARPA Chain
	"CVC",   // Civic
	"TROY",  // Troy
	"WAXP",  // WAX
	"IRIS",  // IRISnet
	"XVS",   // Venus
	"OGN",   // Origin Protocol
	"ORN",   // Orion Protocol
	"PNT",   // pNetwork
	"PLA",   // PlayDapp
	"FUN",   // FunFair
	// Meme Coins
	"SHIB",    // Shiba Inu
	"PEPE",    // Pepe
	"BONK",    // Bonk
	"WIF",     // Dogwifhat
	"BRETT",   // Brett
	"SPX",     // SPX6900
	"SPX6900", // SPX6900
	"MOVE",    // SPX6900
	"APU",     // SPX6900
	"NEIRO",   // SPX6900
	"FWOG",    // SPX6900
	"AITHER",
	"GIGA",
	"FLOKI",
	"TOSHI",
	"SUI",
	"PNUT",   // Peanut
	"888",    // 888
	"POPCAT", // Popcat
	"AERO",
	"AVAX",
	"HYPE",
	"ENA",
}

// Check if a ticker is in the excluded list
func isTickerExcluded(tickerSymbol string) bool {
	// Normalize the input ticker symbol to uppercase
	tickerSymbol = strings.ToUpper(tickerSymbol)

	for _, excluded := range excludedTickers {
		// Normalize each excluded ticker to uppercase for comparison
		if tickerSymbol == strings.ToUpper(excluded) { // Case-insensitive comparison
			return true
		}
	}
	return false
}
