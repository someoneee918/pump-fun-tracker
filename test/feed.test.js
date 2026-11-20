import test from "node:test";
import assert from "node:assert/strict";
import { makeFilter, parseLaunch, parseMigration, readOptions } from "../lib/feed.js";

const raw = { signature: "sig", mint: "9hjBLBrc7WZW2H8UQvBAvG5WiTZotXUv2Bdcn4f4pump", traderPublicKey: "BDZnRs7WZW2H8UQvBAvG5WiTZotXUv2Bdcn4fN6Fs2", txType: "create", initialBuy: 1788384, solAmount: 0.05, marketCapSol: 28.05, name: " GTA 6 GATOR ", symbol: "GATOR", uri: "https://ipfs.io/x" };

test("a create message becomes a launch", () => {
  const l = parseLaunch(raw);
  assert.equal(l.type, "launch");
  assert.equal(l.name, "GTA 6 GATOR");
  assert.equal(l.devBuySol, 0.05);
  assert.equal(l.dev, "BDZnRs7WZW2H8UQvBAvG5WiTZotXUv2Bdcn4fN6Fs2");
});

test("non-launch messages are ignored", () => {
  assert.equal(parseLaunch({ message: "Successfully subscribed" }), null);
  assert.equal(parseLaunch({ ...raw, txType: "buy" }), null);
  assert.equal(parseLaunch(null), null);
});

test("a migrate message becomes a migration", () => {
  assert.equal(parseMigration({ txType: "migrate", mint: raw.mint, pool: "pump-amm" }).type, "migration");
  assert.equal(parseMigration(raw), null);
});

test("filters combine", () => {
  const l = parseLaunch(raw);
  assert.equal(makeFilter()(l), true);
  assert.equal(makeFilter({ minDevBuy: 1 })(l), false);
  assert.equal(makeFilter({ maxDevBuy: 0.01 })(l), false);
  assert.equal(makeFilter({ name: "gator" })(l), true);
  assert.equal(makeFilter({ name: "cat$" })(l), false);
  assert.equal(makeFilter({ name: "gta", exclude: "gator" })(l), false);
});

test("control characters are stripped from names and bad mints are dropped", () => {
  const l = parseLaunch({ ...raw, name: "Evil\u001b]0;pwned\u0007\nCoin", symbol: "E\u001b[2JV" });
  assert.equal(l.name, "Evil ]0;pwned Coin");
  assert.equal(l.symbol, "E [2JV");
  assert.equal(parseLaunch({ ...raw, mint: 'x" onmouseover="' }), null);
  assert.equal(parseMigration({ txType: "migrate", mint: "<b>" }), null);
});

test("readOptions accepts valid values and defaults", () => {
  const def = readOptions({});
  assert.equal(def.minDevBuy, 0);
  assert.equal(def.maxDevBuy, Infinity);
  assert.equal(def.limit, Infinity);
  assert.equal(def.name, null);
  assert.equal(def.exclude, null);

  const custom = readOptions({ "min-dev-buy": "0.5", "max-dev-buy": "10", limit: "50", name: "sol", exclude: "inu" });
  assert.equal(custom.minDevBuy, 0.5);
  assert.equal(custom.maxDevBuy, 10);
  assert.equal(custom.limit, 50);
  assert.equal(custom.name, "sol");
  assert.equal(custom.exclude, "inu");
});

test("readOptions rejects bad or missing values for numeric flags", () => {
  // "abc"
  assert.throws(() => readOptions({ "min-dev-buy": "abc" }), /--min-dev-buy needs a number of SOL, got "abc"/);
  assert.throws(() => readOptions({ "max-dev-buy": "abc" }), /--max-dev-buy needs a number of SOL, got "abc"/);
  assert.throws(() => readOptions({ limit: "abc" }), /--limit needs a whole number above 0, got "abc"/);

  // true (flag without value)
  assert.throws(() => readOptions({ "min-dev-buy": true }), /--min-dev-buy needs a number of SOL, got "true"/);
  assert.throws(() => readOptions({ "max-dev-buy": true }), /--max-dev-buy needs a number of SOL, got "true"/);
  assert.throws(() => readOptions({ limit: true }), /--limit needs a whole number above 0, got "true"/);

  // -1 (negative values)
  assert.throws(() => readOptions({ "min-dev-buy": "-1" }), /--min-dev-buy needs a number of SOL, got "-1"/);
  assert.throws(() => readOptions({ "max-dev-buy": "-1" }), /--max-dev-buy needs a number of SOL, got "-1"/);
  assert.throws(() => readOptions({ limit: "-1" }), /--limit needs a whole number above 0, got "-1"/);
  assert.throws(() => readOptions({ limit: "0" }), /--limit needs a whole number above 0, got "0"/);
});
