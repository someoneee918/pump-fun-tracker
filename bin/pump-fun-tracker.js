#!/usr/bin/env node
import { c, footer, main, pad, parseArgs, short } from "../lib/core.js";
import { connect, makeFilter, readOptions } from "../lib/feed.js";

const HELP = `pump-fun-tracker: every new pump.fun launch, live in your terminal

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
  --help                Show this help

Examples:
  pump-fun-tracker --min-dev-buy 1
  pump-fun-tracker --name "cat|dog" --migrations
  pump-fun-tracker --json | jq .mint
`;

// `pump-fun-tracker --json | head -5`: when the reader goes away, stop quietly.
process.stdout.on("error", (err) => {
  if (err.code === "EPIPE") process.exit(0);
  throw err;
});

main(async () => {
  const args = parseArgs(process.argv.slice(2), { booleans: ["migrations", "json", "help"] });
  if (args.help) { console.log(HELP); return; }
  const options = readOptions(args);
  const filter = makeFilter(options);
  const limit = options.limit;
  let shown = 0;
  let seen = 0;
  const started = Date.now();

  const finish = () => {
    stop();
    if (!args.json) {
      const mins = Math.max((Date.now() - started) / 60000, 1 / 60);
      console.log(c.dim(`\n${seen} launches seen (${Math.round(seen / mins)}/min), ${shown} shown.`));
      footer("/pump-fun-tracker", "Launches with AI ratings, dev history and one-click trading");
    }
    process.exit(0);
  };

  if (!args.json) {
    console.log(c.dim(`${pad("Time", 8)}  ${pad("Ticker", 10)}  ${pad("Name", 26)}  ${pad("Dev buy", 9, true)}  ${pad("Mcap", 9, true)}  ${pad("Dev", 9)}  Mint`));
  }

  const stop = connect({
    migrations: Boolean(args.migrations),
    onStatus: (s) => { if (!args.json) console.error(c.dim(`[feed] ${s}`)); },
    onEvent: (ev) => {
      if (ev.type === "launch") {
        seen++;
        if (!filter(ev)) return;
      }
      shown++;
      if (args.json) {
        console.log(JSON.stringify(ev));
      } else if (ev.type === "migration") {
        console.log(`${pad(new Date(ev.at).toLocaleTimeString("en-GB"), 8)}  ${c.magenta(pad("GRADUATED", 10))}  ${pad("left the bonding curve", 26)}  ${pad("", 9)}  ${pad("", 9)}  ${pad("", 9)}  ${ev.mint}`);
      } else {
        const buy = ev.devBuySol.toFixed(2) + " SOL";
        console.log(
          `${pad(new Date(ev.at).toLocaleTimeString("en-GB"), 8)}  ${c.bold(pad(ev.symbol || "?", 10))}  ${pad(ev.name || "?", 26)}  ` +
          `${pad(ev.devBuySol >= 2 ? c.yellow(buy) : buy, 9, true)}  ${pad(ev.marketCapSol.toFixed(1) + " SOL", 9, true)}  ${pad(short(ev.dev), 9)}  ${c.cyan(ev.mint)}`,
        );
      }
      if (shown >= limit) finish();
    },
  });
  process.on("SIGINT", finish);
});
