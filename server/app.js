import express from "express";
import helmet from "helmet";
import { rateLimit } from "express-rate-limit";
import { z } from "zod";
import {
  cookies,
  hash,
  issueSession,
  newUser,
  registerCas,
  sameSecret,
} from "./auth.js";
import {
  profileSchema,
  completionSchema,
  contactsSchema,
  draftSchema,
  textsSchema,
} from "./validation.js";
import { QUESTIONNAIRE_VERSION } from "../shared/questions.js";
import { demoEngine, eligible, fixtures, publicProfile } from "./matching.js";

const decode = (row) => ({
  ...row,
  profile: JSON.parse(row.profile),
  answers: JSON.parse(row.answers),
  texts: JSON.parse(row.texts),
  contacts: JSON.parse(row.contacts),
});
// Keep older questionnaire responses available in the user's own export.
function updatedAnswers(previous, values) {
  const history = [...(previous.history || [])];
  if (previous.version && previous.version !== QUESTIONNAIRE_VERSION) {
    history.push({ version: previous.version, values: previous.values || {} });
  }
  return {
    version: QUESTIONNAIRE_VERSION,
    values,
    ...(history.length ? { history } : {}),
  };
}
export function createApp(db, config) {
  const app = express();
  app.disable("x-powered-by");
  app.set("trust proxy", config.trustProxy);
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", "data:"],
          connectSrc: config.production
            ? ["'self'"]
            : ["'self'", config.origin.replace(/^http/, "ws")],
          upgradeInsecureRequests: config.production ? [] : null,
        },
      },
      strictTransportSecurity: config.production ? undefined : false,
    }),
  );
  app.use(express.json({ limit: "12kb" }));
  app.use(["/api", "/auth"], (req, res, next) => {
    res.set("Cache-Control", "no-store");
    next();
  });
  // Origin + custom header prevent cross-site mutations, including login CSRF.
  app.use("/api", (req, res, next) => {
    if (
      !["GET", "HEAD", "OPTIONS"].includes(req.method) &&
      (req.get("Origin") !== config.origin || req.get("X-CG-Request") !== "1")
    )
      return res.status(403).json({ error: "origin" });
    next();
  });
  // Shared campus Wi-Fi may put a whole cohort behind one public IP.
  app.use(
    "/api",
    rateLimit({
      windowMs: 60000,
      limit: 1800,
      standardHeaders: "draft-8",
      legacyHeaders: false,
      message: { error: "rate" },
    }),
  );
  app.use(
    "/auth",
    rateLimit({
      windowMs: 60000,
      limit: 240,
      message: "Too many sign-in attempts. Please try again in a minute.",
    }),
  );
  app.post(
    "/api/auth/demo",
    rateLimit({ windowMs: 60000, limit: 120, message: { error: "rate" } }),
    (req, res) => {
      if (config.mode !== "demo")
        return res.status(404).json({ error: "unavailable" });
      if (!sameSecret(String(req.body?.code || ""), config.demoCode))
        return res.status(403).json({ error: "code" });
      const token = cookies(req).cg_session;
      const existing =
        token &&
        db
          .prepare(
            "SELECT user_id FROM sessions WHERE token=? AND expires_at>?",
          )
          .get(hash(token), Date.now());
      if (!existing) issueSession(db, res, newUser(db), config);
      res.json({ ok: true });
    },
  );
  registerCas(app, db, config);
  app.get("/api/config", (req, res) =>
    res.json({
      authMode: config.mode,
      accessCodeRequired: !!config.demoCode,
      simulated: true,
      retentionDays: config.retentionDays,
      privacyContact: config.privacyContact,
    }),
  );
  app.get("/healthz", (req, res) => {
    db.prepare("SELECT 1").get();
    res.json({ ok: true });
  });
  app.use("/api", (req, res, next) => {
    const token = cookies(req).cg_session;
    const session =
      token &&
      db
        .prepare("SELECT user_id FROM sessions WHERE token=? AND expires_at>?")
        .get(hash(token), Date.now());
    const row =
      session &&
      db.prepare("SELECT * FROM users WHERE id=?").get(session.user_id);
    if (!row) return res.status(401).json({ error: "session" });
    req.person = decode(row);
    next();
  });
  const own = (person) => ({
    id: person.id,
    profile: person.profile,
    answers: person.answers,
    texts: person.texts,
    contacts: person.contacts,
    completed: !!person.completed,
    visible: !!person.visible,
  });
  app.get("/api/me", (req, res) => res.json(own(req.person)));
  app.put("/api/me/profile", (req, res) => {
    const profile = profileSchema.parse(req.body);
    db.prepare("UPDATE users SET profile=?, updated_at=? WHERE id=?").run(
      JSON.stringify(profile),
      Date.now(),
      req.person.id,
    );
    res.json({ profile });
  });
  app.put("/api/me/draft", (req, res) => {
    const body = draftSchema.parse(req.body);
    db.prepare(
      "UPDATE users SET answers=?,texts=?,updated_at=? WHERE id=?",
    ).run(
      JSON.stringify(updatedAnswers(req.person.answers, body.answers)),
      JSON.stringify(body.texts),
      Date.now(),
      req.person.id,
    );
    res.json({ ok: true });
  });
  app.put("/api/me/texts", (req, res) => {
    const texts = textsSchema.parse(req.body);
    db.prepare("UPDATE users SET texts=?,updated_at=? WHERE id=?").run(
      JSON.stringify(texts),
      Date.now(),
      req.person.id,
    );
    res.json({ ok: true });
  });
  app.post("/api/me/complete", (req, res) => {
    const body = completionSchema.parse(req.body);
    profileSchema.parse(req.person.profile);
    db.prepare(
      "UPDATE users SET answers=?,texts=?,visible=CASE WHEN completed=1 THEN visible ELSE 1 END,completed=1,updated_at=? WHERE id=?",
    ).run(
      JSON.stringify(updatedAnswers(req.person.answers, body.answers)),
      JSON.stringify(body.texts),
      Date.now(),
      req.person.id,
    );
    res.json({ ok: true });
  });
  app.put("/api/me/contacts", (req, res) => {
    const contacts = contactsSchema.parse(req.body);
    db.prepare("UPDATE users SET contacts=?,updated_at=? WHERE id=?").run(
      JSON.stringify(contacts),
      Date.now(),
      req.person.id,
    );
    res.json({ ok: true });
  });
  app.put("/api/me/visibility", (req, res) => {
    const { visible } = z
      .object({ visible: z.boolean() })
      .strict()
      .parse(req.body);
    if (!req.person.completed)
      return res.status(409).json({ error: "incomplete" });
    db.prepare("UPDATE users SET visible=?,updated_at=? WHERE id=?").run(
      Number(visible),
      Date.now(),
      req.person.id,
    );
    res.json({ visible });
  });
  app.get("/api/me/export", (req, res) => {
    res.attachment("common-ground-data.json").json({
      ...own(req.person),
      createdAt: req.person.created_at,
      updatedAt: req.person.updated_at,
      connections: db
        .prepare(
          "SELECT sender,recipient FROM connections WHERE sender=? OR recipient=?",
        )
        .all(req.person.id, req.person.id),
      blocks: db
        .prepare("SELECT recipient FROM blocks WHERE sender=?")
        .all(req.person.id),
    });
  });
  app.delete("/api/me", (req, res) => {
    if (req.body?.confirm !== "DELETE")
      return res.status(400).json({ error: "confirm" });
    db.prepare("DELETE FROM users WHERE id=?").run(req.person.id);
    res.clearCookie("cg_session", { path: "/" });
    res.json({ ok: true });
  });
  app.post("/api/logout", (req, res) => {
    db.prepare("DELETE FROM sessions WHERE token=?").run(
      hash(cookies(req).cg_session || ""),
    );
    res.clearCookie("cg_session", { path: "/" });
    res.json({ ok: true });
  });
  function connectionStatus(a, b) {
    const outgoing = !!db
      .prepare("SELECT 1 FROM connections WHERE sender=? AND recipient=?")
      .get(a, b);
    const incoming = !!db
      .prepare("SELECT 1 FROM connections WHERE sender=? AND recipient=?")
      .get(b, a);
    return outgoing && incoming
      ? "connected"
      : incoming
        ? "incoming"
        : outgoing
          ? "pending"
          : "none";
  }
  function isBlocked(a, b) {
    return !!db
      .prepare(
        "SELECT 1 FROM blocks WHERE (sender=? AND recipient=?) OR (sender=? AND recipient=?)",
      )
      .get(a, b, b, a);
  }
  function accessible(person, target) {
    return (
      target &&
      target.id !== person.id &&
      person.visible &&
      target.visible &&
      target.completed &&
      !isBlocked(person.id, target.id) &&
      eligible(person.profile, target.profile)
    );
  }
  app.get("/api/matches", async (req, res) => {
    if (!req.person.completed)
      return res.status(409).json({ error: "incomplete" });
    const example = req.query.example === "1";
    const candidates = example
      ? fixtures
      : req.person.visible
        ? db
            .prepare(
              "SELECT * FROM users WHERE visible=1 AND completed=1 AND id<>?",
            )
            .all(req.person.id)
            .map(decode)
            .filter((p) => accessible(req.person, p))
        : [];
    const matches = await Promise.all(
      candidates
        .filter((p) => eligible(req.person.profile, p.profile))
        .map(async (p) => {
          const status = example
            ? "example"
            : connectionStatus(req.person.id, p.id);
          return {
            ...publicProfile(p),
            score: await demoEngine.score(req.person, p),
            status,
            ...(status === "connected" ? { contacts: p.contacts } : {}),
          };
        }),
    );
    res.json({
      simulated: true,
      engineVersion: demoEngine.version,
      matches: matches.sort(
        (a, b) => b.score - a.score || a.id.localeCompare(b.id),
      ),
    });
  });
  app.post("/api/connections/:id", (req, res) => {
    const row = db.prepare("SELECT * FROM users WHERE id=?").get(req.params.id);
    const target = row && decode(row);
    if (!accessible(req.person, target))
      return res.status(404).json({ error: "unavailable" });
    db.prepare("INSERT OR IGNORE INTO connections VALUES (?,?)").run(
      req.person.id,
      target.id,
    );
    res.json({ status: connectionStatus(req.person.id, target.id) });
  });
  app.delete("/api/connections/:id", (req, res) => {
    db.prepare(
      "DELETE FROM connections WHERE (sender=? AND recipient=?) OR (sender=? AND recipient=?)",
    ).run(req.person.id, req.params.id, req.params.id, req.person.id);
    res.json({ ok: true });
  });
  app.post("/api/blocks/:id", (req, res) => {
    const target = db
      .prepare("SELECT id FROM users WHERE id=?")
      .get(req.params.id);
    if (!target || target.id === req.person.id)
      return res.status(404).json({ error: "unavailable" });
    db.prepare("INSERT OR IGNORE INTO blocks VALUES (?,?)").run(
      req.person.id,
      target.id,
    );
    db.prepare(
      "DELETE FROM connections WHERE (sender=? AND recipient=?) OR (sender=? AND recipient=?)",
    ).run(req.person.id, target.id, target.id, req.person.id);
    res.json({ ok: true });
  });
  app.get("/api/blocks", (req, res) =>
    res.json(
      db
        .prepare(
          "SELECT u.id,u.profile FROM users u JOIN blocks b ON b.recipient=u.id WHERE b.sender=?",
        )
        .all(req.person.id)
        .map((r) => ({ id: r.id, name: JSON.parse(r.profile).name })),
    ),
  );
  app.delete("/api/blocks/:id", (req, res) => {
    db.prepare("DELETE FROM blocks WHERE sender=? AND recipient=?").run(
      req.person.id,
      req.params.id,
    );
    res.json({ ok: true });
  });
  app.use("/api", (req, res) => res.status(404).json({ error: "unavailable" }));
  app.use((error, req, res, next) => {
    if (
      error instanceof z.ZodError ||
      error.type === "entity.parse.failed" ||
      error.type === "entity.too.large"
    )
      return res.status(400).json({ error: "validation" });
    console.error("Request failed:", error.name); // No request bodies, tickets, identities or answers.
    res.status(500).json({ error: "server" });
  });
  return app;
}
