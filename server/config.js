export function readConfig(env = process.env) {
  const production =
    env.NODE_ENV === "production" || process.argv.includes("--production");
  const origin = env.APP_ORIGIN || "http://localhost:3000";
  const url = new URL(origin);
  if (url.origin !== origin)
    throw new Error(
      "APP_ORIGIN must be an origin, without a trailing slash or path.",
    );
  if (production && url.protocol !== "https:")
    throw new Error("Production requires an HTTPS APP_ORIGIN.");
  const mode = env.AUTH_MODE || "demo";
  if (!["demo", "cas"].includes(mode)) throw new Error("Invalid AUTH_MODE");
  if (production && mode === "demo" && (env.DEMO_ACCESS_CODE || "").length < 12)
    throw new Error(
      "Set a DEMO_ACCESS_CODE of at least 12 characters for a hosted demo.",
    );
  if (
    mode === "cas" &&
    ((env.IDENTITY_SECRET || "").length < 32 ||
      !env.CAS_STUDENT_ATTRIBUTE ||
      !env.CAS_STUDENT_VALUES)
  )
    throw new Error(
      "CAS requires IDENTITY_SECRET (32+ characters), CAS_STUDENT_ATTRIBUTE and CAS_STUDENT_VALUES confirmed by UPPA.",
    );
  const casUrl = env.CAS_BASE_URL || "https://sso.univ-pau.fr/cas";
  if (new URL(casUrl).protocol !== "https:")
    throw new Error("CAS must use HTTPS.");
  const retentionDays = Number(env.RETENTION_DAYS || 30);
  if (
    !Number.isInteger(retentionDays) ||
    retentionDays < 1 ||
    retentionDays > 365
  )
    throw new Error("RETENTION_DAYS must be 1–365.");
  return {
    production,
    origin,
    mode,
    port: Number(env.PORT || 3000),
    dbPath: env.DB_PATH || "data/common-ground.sqlite",
    demoCode: env.DEMO_ACCESS_CODE || "",
    retentionDays,
    casUrl: casUrl.replace(/\/$/, ""),
    identitySecret: env.IDENTITY_SECRET,
    studentAttribute: env.CAS_STUDENT_ATTRIBUTE,
    studentValues: (env.CAS_STUDENT_VALUES || "")
      .split(",")
      .map((s) => s.trim()),
    privacyContact: env.PRIVACY_CONTACT || "",
    trustProxy: env.TRUST_PROXY === "1" ? 1 : false,
  };
}
