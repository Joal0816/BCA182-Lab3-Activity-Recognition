import assert from "node:assert";
import test from "node:test";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const goldensPath = path.resolve(__dirname, "../lib/goldens.json");
const goldensData = JSON.parse(fs.readFileSync(goldensPath, "utf-8"));

test("Inference parity and sanity test across goldens", () => {
  for (const golden of goldensData.goldens) {
    assert.ok(golden.prob_run >= 0 && golden.prob_run <= 1);
    assert.ok(golden.prob_walk >= 0 && golden.prob_walk <= 1);
    assert.strictEqual(golden.label === "run" ? golden.prob_run > 0.5 : golden.prob_walk > 0.5, true);
  }
});
