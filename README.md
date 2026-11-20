# pump.fun Tracker

Every new pump.fun launch on Solana, live in your terminal, the moment it is created. Filter by dev buy, name or ticker, and see coins as they graduate from the bonding curve.

![Node 22+](https://img.shields.io/badge/node-%E2%89%A522-5FA04E?logo=node.js&logoColor=white) ![Dependencies: 0](https://img.shields.io/badge/dependencies-0-2ea44f) [![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE) [![Website](https://img.shields.io/badge/website-blixtrade.github.io-8b5cf6)](https://blixtrade.github.io/pump-fun-tracker/)

> Free and open source, part of the [Blix Trade](https://github.com/blixtrade) toolkit. For the live version with AI ratings on every coin, wallet tracking and one-click trading at 0% fees, see **[BLIX, the Solana memecoin terminal](https://blixvip.com/pump-fun-tracker?utm_source=github&utm_medium=readme&utm_campaign=pump-fun-tracker)**.

## What it does

- Streams every new pump.fun token (about 1,000 to 2,000 an hour) with ticker, name, dev buy in SOL, starting market cap, dev wallet and mint.
- Filters: minimum or maximum dev buy, a regex on name or ticker, and an exclude regex for spam.
- Optional graduation alerts when a coin completes its bonding curve and moves to PumpSwap.
- `--json` prints one JSON object per line, so you can pipe it into `jq`, a database, or your own bot.

## Quick start

You need [Node.js](https://nodejs.org) 22 or newer. There is nothing else to install: no dependencies, no API keys.

Run it straight from GitHub:

```bash
npx -y github:blixtrade/pump-fun-tracker --min-dev-buy 1 --migrations
```

Or clone it:

```bash
git clone https://github.com/blixtrade/pump-fun-tracker.git
cd pump-fun-tracker
node bin/pump-fun-tracker.js --min-dev-buy 1 --migrations
```

To get a `pump-fun-tracker` command on your PATH, run `npm link` inside the folder.

## Example output

Real output from a run on 18 November 2026:

```text
Time      Ticker      Name                          Dev buy       Mcap  Dev        Mint
17:36:55  $<3CAKE     🍰 LUCIA’S CAKE              0.10 SOL   28.1 SOL  D5rT…1kt7  Cy7dd9PucwK6KdaLWkRZcoUWQnEkzPLWSyfspzQDpump
17:36:57  LUNA        Luna                         0.00 SOL   28.0 SOL  GJ7C…MRDP  DTzwPY9SiKD8oZ1RzXDzFYtthr1Pgad7Pt1G6GPGpump
17:37:13  BEANIE      Beanie Rabbit                0.03 SOL   28.0 SOL  7Ljd…JY5K  7VruFMCMcsXNKWYDKqDAGmEEoUzWHbXe5RFbio12yLvn
17:37:17  GRADUATED   left the bonding curve                                       Gx94NLRY5WJLujMbhs4x22HvCSzeVtUHP8Vj1MeCpump
17:37:23  solnava     solnava.trade                0.28 SOL   28.5 SOL  4YZv…79kf  EbTKiemwWpz4G6NnDiXWzaXCmvVk2TsG7kg9Uuzpump
```

## Options

```text
pump-fun-tracker: every new pump.fun launch, live in your terminal

Usage:
  pump-fun-tracker [options]

Options:
  --min-dev-buy <sol>   Only launches where the dev bought at least this much SOL
  --max-dev-buy <sol>   Only launches where the dev bought at most this much SOL
  --name <regex>        Only names or tickers matching this (case-insensitive)
  --exclude <regex>     Hide names or tickers matching this
  --migrations          Also show coins graduating from the bonding curve
  --limit <n>           Stop after n matching events
  --json                One JSON object per line (for piping into other tools)
  --version             Show version
  --help                Show this help

Examples:
  pump-fun-tracker --min-dev-buy 1
  pump-fun-tracker --name "cat|dog" --migrations
  pump-fun-tracker --json | jq .mint
```

## How it works

- Connects to the free PumpPortal websocket (`wss://pumpportal.fun/api/data`) and subscribes to new-token and migration events.
- Reconnects on its own with exponential backoff if the connection drops.
- Large dev buys (2 SOL or more) are highlighted.

## Limits

- Graduation messages only include the mint, so they show without a name.
- PumpPortal is a third-party service. If it is down, the tracker keeps retrying.

## Development

```bash
npm test
```

Tests run offline against fixtures, so they never depend on a live API.

## Contributing

Pull requests are welcome, and first-timers are too. Pick an issue labelled [good first issue](https://github.com/blixtrade/pump-fun-tracker/issues?q=is%3Aissue+is%3Aopen+label%3A%22good+first+issue%22) or [help wanted](https://github.com/blixtrade/pump-fun-tracker/issues?q=is%3Aissue+is%3Aopen+label%3A%22help+wanted%22), comment that you are taking it, and read [CONTRIBUTING.md](CONTRIBUTING.md). No API keys needed: the tests run offline.

[![Contributors](https://contrib.rocks/image?repo=blixtrade/pump-fun-tracker)](https://github.com/blixtrade/pump-fun-tracker/graphs/contributors)

## More free Solana tools from Blix Trade

| Tool | What it does |
|---|---|
| [solana-bubble-map](https://github.com/blixtrade/solana-bubble-map) | Holder bubble map for any Solana or pump.fun token. |
| [solana-rug-checker](https://github.com/blixtrade/solana-rug-checker) | Rug pull scanner for Solana and pump.fun tokens. |
| [solana-memecoin-screener](https://github.com/blixtrade/solana-memecoin-screener) | Screen trending, new and boosted Solana memecoins from the terminal. |
| [solana-wallet-tracker](https://github.com/blixtrade/solana-wallet-tracker) | Follow any Solana wallets and see every memecoin buy and sell they make: token, size in SOL and USD, and a Solscan link. |
| [solana-pnl-tracker](https://github.com/blixtrade/solana-pnl-tracker) | Profit and loss for any Solana wallet's memecoin trades, worked out from its on-chain transactions. |
| [solana-whale-tracker](https://github.com/blixtrade/solana-whale-tracker) | Big buys and sells on any Solana token: net whale flow, every large trade with a Solscan link, and leaderboards of the wallets buying and dumping the most. |
| [memecoin-paper-trading](https://github.com/blixtrade/memecoin-paper-trading) | Practise Solana memecoin trading with fake SOL at real prices. |
| [memecoin-alert-bot](https://github.com/blixtrade/memecoin-alert-bot) | pump.fun alerts in Telegram and Discord. |
| [pump-fun-mcp](https://github.com/blixtrade/pump-fun-mcp) | An MCP server that gives Claude, Cursor and other AI assistants six Solana memecoin research tools: token info, rug check, top holders, a screener, whale trades and wallet trades. |

Want all of this in one place, live, with AI on every coin? **[Open BLIX](https://blixvip.com/?utm_source=github&utm_medium=readme&utm_campaign=pump-fun-tracker)**: the Solana memecoin terminal with 0% trading fees.

## Disclaimer

This is research software, not financial advice. Memecoins are extremely volatile and most go to zero. Never trade more than you can afford to lose. The data comes from free third-party APIs that can be wrong, late or unavailable.

## License

[MIT](LICENSE)
