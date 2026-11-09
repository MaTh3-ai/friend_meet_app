import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const script = fileURLToPath(new URL("../scripts/setup.sh", import.meta.url));

test(
  "server setup generates a unique private config and never overwrites it",
  { skip: process.platform === "win32" },
  (t) => {
    const first = mkdtempSync(join(tmpdir(), "meeting-setup-"));
    const second = mkdtempSync(join(tmpdir(), "meeting-setup-"));
    t.after(() => {
      rmSync(first, { recursive: true, force: true });
      rmSync(second, { recursive: true, force: true });
    });
    const execute = (
      folder,
      domain = "meeting.example.org",
      contact = "team@example.org",
    ) =>
      spawnSync("sh", [script, domain, contact], {
        cwd: folder,
        encoding: "utf8",
      });
    assert.notEqual(execute(first, "bad domain").status, 0);
    assert.notEqual(execute(first, "meeting.example.org", "invalid").status, 0);
    const result = execute(first);
    assert.equal(result.status, 0, result.stderr);
    const original = readFileSync(join(first, ".env"), "utf8");
    assert.match(original, /APP_ORIGIN=https:\/\/meeting\.example\.org/);
    assert.match(original, /SITE_DOMAIN=meeting\.example\.org/);
    assert.match(original, /DEMO_ACCESS_CODE=[0-9a-f]{48}/);
    assert.equal(statSync(join(first, ".env")).mode & 0o777, 0o600);
    const code = original.match(/DEMO_ACCESS_CODE=([^\n]+)/)[1];
    assert.ok(!result.stdout.includes(code));
    assert.notEqual(execute(first).status, 0);
    assert.equal(readFileSync(join(first, ".env"), "utf8"), original);
    assert.equal(execute(second).status, 0);
    assert.notEqual(readFileSync(join(second, ".env"), "utf8"), original);
  },
);
