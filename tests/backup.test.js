import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";

const run = promisify(execFile);
const script = fileURLToPath(new URL("../scripts/backup.mjs", import.meta.url));

test("online SQLite backup contains committed WAL data without stopping the database", async (t) => {
  const folder = mkdtempSync(join(tmpdir(), "meeting-backup-test-"));
  const source = join(folder, "live.sqlite");
  const copy = join(folder, "copy.sqlite");
  const live = new DatabaseSync(source);
  t.after(() => {
    live.close();
    rmSync(folder, { recursive: true, force: true });
  });
  live.exec(
    "PRAGMA journal_mode=WAL; CREATE TABLE items (value TEXT); INSERT INTO items VALUES ('saved in WAL');",
  );
  const { stdout } = await run(process.execPath, [script], {
    env: { ...process.env, DB_PATH: source },
    encoding: "buffer",
  });
  writeFileSync(copy, stdout);
  const restored = new DatabaseSync(copy, { readOnly: true });
  try {
    assert.equal(
      restored.prepare("PRAGMA integrity_check").get().integrity_check,
      "ok",
    );
    assert.equal(
      restored.prepare("SELECT value FROM items").get().value,
      "saved in WAL",
    );
  } finally {
    restored.close();
  }
  assert.equal(live.prepare("SELECT count(*) AS n FROM items").get().n, 1);
});
