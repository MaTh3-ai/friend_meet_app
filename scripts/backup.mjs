import { backup, DatabaseSync } from "node:sqlite";
import { createReadStream } from "node:fs";
import { mkdtemp, unlink, rmdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pipeline } from "node:stream/promises";

// SQLite's online backup API reads a consistent snapshot, including WAL data.
// Only the database bytes go to stdout; diagnostics stay on stderr.
const folder = await mkdtemp(join(tmpdir(), "meeting-ground-backup-"));
const destination = join(folder, "snapshot.sqlite");
let db;
try {
  db = new DatabaseSync(
    process.env.DB_PATH || "/app/data/common-ground.sqlite",
    {
      readOnly: true,
    },
  );
  await backup(db, destination);
  db.close();
  db = undefined;
  await pipeline(createReadStream(destination), process.stdout);
} finally {
  db?.close();
  await unlink(destination).catch((error) => {
    if (error.code !== "ENOENT") throw error;
  });
  await rmdir(folder);
}
