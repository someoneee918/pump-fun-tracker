// Live pump.fun events over the free PumpPortal websocket.
import { isAddress } from "./core.js";

export const FEED_URL = "wss://pumpportal.fun/api/data";

/** Token names and tickers are chosen by whoever launches the coin: drop control characters and newlines, and cap the length. */
export const cleanText = (s, max = 64) => String(s ?? "").replace(/[\u0000-\u001f\u007f-\u009f]/g, " ").replace(/\s+/g, " ").trim().slice(0, max);

/** Turn a raw feed message into a flat launch record, or null if it is not a launch. */
export function parseLaunch(msg) {
  if (!msg || msg.txType !== "create" || !isAddress(msg.mint)) return null;
  return {
    type: "launch",
    mint: msg.mint,
    name: cleanText(msg.name),
    symbol: cleanText(msg.symbol, 24),
    dev: isAddress(msg.traderPublicKey) ? msg.traderPublicKey : null,
    devBuySol: Number(msg.solAmount) || 0,
    devBuyTokens: Number(msg.initialBuy) || 0,
    marketCapSol: Number(msg.marketCapSol) || 0,
    uri: msg.uri || null,
    signature: msg.signature || null,
    at: Date.now(),
  };
}

/** Turn a raw feed message into a migration record, or null. */
export function parseMigration(msg) {
  if (!msg || msg.txType !== "migrate" || !isAddress(msg.mint)) return null;
  return { type: "migration", mint: msg.mint, pool: msg.pool || null, signature: msg.signature || null, at: Date.now() };
}

function parseSol(name, val, fallback) {
  if (val === undefined) return fallback;
  if (typeof val === "boolean" || typeof val === "object" || val === null) {
    throw new Error(`--${name} needs a number of SOL, got "${val}"`);
  }
  const str = String(val).trim();
  const n = Number(str);
  if (str === "" || isNaN(n) || n < 0) {
    throw new Error(`--${name} needs a number of SOL, got "${val}"`);
  }
  return n;
}

function parseLimit(val) {
  if (val === undefined) return Infinity;
  if (typeof val === "boolean" || typeof val === "object" || val === null) {
    throw new Error(`--limit needs a whole number above 0, got "${val}"`);
  }
  const str = String(val).trim();
  if (!/^\d+$/.test(str) || Number(str) <= 0) {
    throw new Error(`--limit needs a whole number above 0, got "${val}"`);
  }
  return Number(str);
}

/** Validate CLI filter flags and return normalized options for makeFilter. */
export function readOptions(args = {}) {
  const minDevBuy = parseSol("min-dev-buy", args["min-dev-buy"], 0);
  const maxDevBuy = parseSol("max-dev-buy", args["max-dev-buy"], Infinity);
  if (minDevBuy > maxDevBuy) {
    throw new Error(`--min-dev-buy (${minDevBuy}) cannot be greater than --max-dev-buy (${maxDevBuy})`);
  }
  const limit = parseLimit(args.limit);
  return {
    minDevBuy,
    maxDevBuy,
    name: typeof args.name === "string" ? args.name : null,
    exclude: typeof args.exclude === "string" ? args.exclude : null,
    limit,
  };
}

/** Build a predicate from CLI filters. All given filters must pass. */
export function makeFilter({ minDevBuy = 0, maxDevBuy = Infinity, name = null, exclude = null } = {}) {
  const include = name ? new RegExp(name, "i") : null;
  const reject = exclude ? new RegExp(exclude, "i") : null;
  return (launch) => {
    if (launch.devBuySol < minDevBuy || launch.devBuySol > maxDevBuy) return false;
    const text = `${launch.name} ${launch.symbol}`;
    if (include && !include.test(text)) return false;
    if (reject && reject.test(text)) return false;
    return true;
  };
}

/**
 * Connect and keep the connection alive. Calls onEvent for every launch and,
 * if asked, every migration. Returns a function that stops the feed.
 */
export function connect({ migrations = false, onEvent, onStatus = () => {} }) {
  let ws;
  let stopped = false;
  let retry = 0;
  let timer;

  const open = () => {
    if (stopped) return;
    ws = new WebSocket(FEED_URL);
    ws.onopen = () => {
      retry = 0;
      ws.send(JSON.stringify({ method: "subscribeNewToken" }));
      if (migrations) ws.send(JSON.stringify({ method: "subscribeMigration" }));
      onStatus("connected");
    };
    ws.onmessage = (ev) => {
      let msg;
      try { msg = JSON.parse(String(ev.data)); } catch { return; }
      const event = parseLaunch(msg) || (migrations ? parseMigration(msg) : null);
      if (event) onEvent(event);
    };
    ws.onerror = () => {};
    ws.onclose = () => {
      if (stopped) return;
      const wait = Math.min(30000, 1000 * 2 ** retry++);
      onStatus(`disconnected, retrying in ${Math.round(wait / 1000)}s`);
      timer = setTimeout(open, wait);
    };
  };
  open();
  return () => { stopped = true; clearTimeout(timer); try { ws.close(); } catch { /* already closed */ } };
}
