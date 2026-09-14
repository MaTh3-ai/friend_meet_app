import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
export function openDb(path) {
  if (path !== ":memory:") mkdirSync(dirname(path), { recursive: true });
  const db = new DatabaseSync(path);
  db.exec(`PRAGMA foreign_keys=ON; PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000;
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY, principal TEXT UNIQUE, profile TEXT NOT NULL DEFAULT '{}',
      answers TEXT NOT NULL DEFAULT '{}', texts TEXT NOT NULL DEFAULT '{}', contacts TEXT NOT NULL DEFAULT '{}',
      completed INTEGER NOT NULL DEFAULT 0, visible INTEGER NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS sessions (token TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, expires_at INTEGER NOT NULL);
    CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
    CREATE TABLE IF NOT EXISTS connections (sender TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, recipient TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, PRIMARY KEY(sender, recipient), CHECK(sender <> recipient));
    CREATE TABLE IF NOT EXISTS blocks (sender TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, recipient TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, PRIMARY KEY(sender, recipient), CHECK(sender <> recipient));
    CREATE TABLE IF NOT EXISTS auth_flows (token TEXT PRIMARY KEY, expires_at INTEGER NOT NULL);
    CREATE INDEX IF NOT EXISTS idx_users_visible ON users(visible, completed);
    CREATE INDEX IF NOT EXISTS idx_users_updated ON users(updated_at);
    `);
  const version = db.prepare("PRAGMA user_version").get().user_version;
  if (version < 2) {
    db.exec("BEGIN IMMEDIATE");
    try {
      const update = db.prepare("UPDATE users SET profile=? WHERE id=?");
      for (const row of db.prepare("SELECT id,profile FROM users").all()) {
        const profile = JSON.parse(row.profile);
        delete profile.pronouns;
        const course = (profile.course || "").toLowerCase();
        profile.course = /doctor|phd/.test(course)
          ? "doctorate"
          : /master|^m[12]$/.test(course)
            ? "master"
            : /licence|bachelor|^l[123]$/.test(course)
              ? "bachelor"
              : "";
        update.run(JSON.stringify(profile), row.id);
      }
      db.exec("PRAGMA user_version=2; COMMIT");
    } catch (error) {
      db.exec("ROLLBACK");
      throw error;
    }
  }
  return db;
}
export function prune(db, days) {
  const now = Date.now();
  db.prepare("DELETE FROM sessions WHERE expires_at < ?").run(now);
  db.prepare("DELETE FROM auth_flows WHERE expires_at < ?").run(now);
  return db
    .prepare("DELETE FROM users WHERE updated_at < ?")
    .run(now - days * 86400000).changes;
}
