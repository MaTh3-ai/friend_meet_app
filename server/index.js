import { resolve } from "node:path";
import { createServer } from "node:http";
import { readConfig } from "./config.js";
import { openDb, prune } from "./db.js";
import { createApp } from "./app.js";
try {
  process.loadEnvFile();
} catch (e) {
  if (e.code !== "ENOENT") throw e;
}
const config = readConfig();
const db = openDb(config.dbPath);
prune(db, config.retentionDays);
const cleanup = setInterval(
  () => prune(db, config.retentionDays),
  3600000,
).unref();
const app = createApp(db, config);
const server = createServer(app);
let vite;
if (config.production) {
  const { default: express } = await import("express");
  app.use(express.static(resolve("dist")));
  app.get("/{*path}", (req, res) => res.sendFile(resolve("dist/index.html")));
} else {
  const { createServer } = await import("vite");
  vite = await createServer({
    server: { middlewareMode: true, hmr: { server } },
    appType: "spa",
  });
  app.use(vite.middlewares);
}
server.listen(config.port, "0.0.0.0", () =>
  console.log(`Meeting Ground ready: ${config.origin}`),
);
async function shutdown() {
  clearInterval(cleanup);
  await vite?.close();
  server.close(() => {
    db.close();
    process.exit(0);
  });
}
process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
