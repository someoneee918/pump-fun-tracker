import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const bin = path.join(root, "bin", "pump-fun-tracker.js");

test("node bin/pump-fun-tracker.js --version prints package.json version and exits cleanly", () => {
  const pkg = JSON.parse(readFileSync(path.join(root, "package.json"), "utf8"));
  const start = Date.now();
  const stdout = execFileSync(process.execPath, [bin, "--version"], { encoding: "utf8" });
  const duration = Date.now() - start;

  assert.equal(stdout.trim(), pkg.version);
  assert.ok(duration < 1000, `Execution took ${duration}ms, expected under 1s`);
});
