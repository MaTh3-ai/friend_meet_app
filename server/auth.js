import {
  createHash,
  randomBytes,
  randomUUID,
  createHmac,
  timingSafeEqual,
} from "node:crypto";
import { XMLParser, XMLValidator } from "fast-xml-parser";
export const hash = (value) => createHash("sha256").update(value).digest("hex");
export const cookies = (req) =>
  Object.fromEntries(
    (req.headers.cookie || "")
      .split(";")
      .map((p) => p.trim().split("="))
      .filter((p) => p.length === 2),
  );
export function sameSecret(a, b) {
  return timingSafeEqual(Buffer.from(hash(a)), Buffer.from(hash(b)));
}
export function newUser(db, principal = null) {
  const id = randomUUID(),
    now = Date.now();
  db.prepare(
    "INSERT INTO users(id,principal,created_at,updated_at) VALUES (?,?,?,?)",
  ).run(id, principal, now, now);
  return id;
}
export function issueSession(db, res, userId, config) {
  const token = randomBytes(32).toString("hex");
  db.prepare("INSERT INTO sessions VALUES (?,?,?)").run(
    hash(token),
    userId,
    Date.now() + 7 * 86400000,
  );
  res.cookie("cg_session", token, {
    httpOnly: true,
    secure: config.production,
    sameSite: "lax",
    path: "/",
    maxAge: 7 * 86400000,
  });
}
export function parseCas(xml, config) {
  if (
    xml.length > 65536 ||
    /<!DOCTYPE|<!ENTITY/i.test(xml) ||
    XMLValidator.validate(xml) !== true
  )
    throw new Error("Invalid CAS response");
  const parsed = new XMLParser({
    removeNSPrefix: true,
    parseTagValue: false,
    processEntities: false,
  }).parse(xml);
  const success = parsed?.serviceResponse?.authenticationSuccess;
  if (!success || typeof success.user !== "string" || !success.user.trim())
    throw new Error("CAS validation failed");
  const attribute = success.attributes?.[config.studentAttribute];
  const values = Array.isArray(attribute) ? attribute : [attribute];
  if (
    !values.some(
      (v) => typeof v === "string" && config.studentValues.includes(v),
    )
  )
    throw new Error("Student affiliation not confirmed");
  return createHmac("sha256", config.identitySecret)
    .update(success.user)
    .digest("hex");
}
export function registerCas(app, db, config) {
  app.get("/auth/cas", (req, res) => {
    if (config.mode !== "cas") return res.redirect("/?auth=unavailable");
    const state = randomBytes(32).toString("hex");
    db.prepare("INSERT INTO auth_flows VALUES (?,?)").run(
      hash(state),
      Date.now() + 5 * 60000,
    );
    res.cookie("cg_flow", state, {
      httpOnly: true,
      secure: config.production,
      sameSite: "lax",
      path: "/auth",
      maxAge: 5 * 60000,
    });
    const service = `${config.origin}/auth/cas/callback?state=${state}`;
    res.redirect(`${config.casUrl}/login?${new URLSearchParams({ service })}`);
  });
  app.get("/auth/cas/callback", async (req, res) => {
    try {
      if (config.mode !== "cas") throw new Error("Disabled");
      const { state, ticket } = req.query;
      if (
        typeof state !== "string" ||
        !/^[a-f0-9]{64}$/.test(state) ||
        typeof ticket !== "string" ||
        !/^ST-[\w.-]{1,500}$/.test(ticket) ||
        cookies(req).cg_flow !== state
      )
        throw new Error("Invalid flow");
      const flow = db
        .prepare(
          "DELETE FROM auth_flows WHERE token=? AND expires_at>? RETURNING token",
        )
        .get(hash(state), Date.now());
      if (!flow) throw new Error("Expired flow");
      const service = `${config.origin}/auth/cas/callback?state=${state}`;
      const response = await fetch(
        `${config.casUrl}/p3/serviceValidate?${new URLSearchParams({ service, ticket })}`,
        { signal: AbortSignal.timeout(8000), redirect: "error" },
      );
      if (!response.ok) throw new Error("CAS unavailable");
      const principal = parseCas(await response.text(), config);
      const existing = db
        .prepare("SELECT id FROM users WHERE principal=?")
        .get(principal);
      issueSession(db, res, existing?.id || newUser(db, principal), config);
      res.clearCookie("cg_flow", { path: "/auth" });
      res.redirect("/");
    } catch {
      res.clearCookie("cg_flow", { path: "/auth" });
      res.redirect("/?auth=failed");
    }
  });
}
