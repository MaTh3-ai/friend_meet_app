// Runs against an isolated Compose project on CI, not against a real deployment.
import assert from "node:assert/strict";
import { readFileSync, writeFileSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import { questions, QUESTIONNAIRE_VERSION } from "../shared/questions.js";

const origin = process.env.APP_ORIGIN;
const stateFile = process.env.SMOKE_STATE_FILE;
const mode = process.argv[2];
if (!origin || !stateFile || !["create", "check", "backup"].includes(mode))
  throw new Error("Missing smoke-test configuration");

if (mode === "backup") {
  const db = new DatabaseSync(process.argv[3], { readOnly: true });
  try {
    assert.equal(
      db.prepare("PRAGMA integrity_check").get().integrity_check,
      "ok",
    );
    assert.equal(db.prepare("SELECT count(*) AS n FROM users").get().n, 2);
    assert.equal(
      db.prepare("SELECT count(*) AS n FROM connections").get().n,
      2,
    );
  } finally {
    db.close();
  }
  console.log("Backup integrity verified");
} else {
  async function request(path, method = "GET", body, cookie) {
    const response = await fetch(origin + "/api" + path, {
      method,
      headers: {
        "Content-Type": "application/json",
        "X-CG-Request": "1",
        Origin: origin,
        ...(cookie ? { Cookie: cookie } : {}),
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    const data = await response.json();
    assert.equal(response.status, 200, `${method} ${path} failed`);
    return { data, cookie: response.headers.get("set-cookie")?.split(";")[0] };
  }
  if (mode === "create") {
    const cookies = [];
    const ids = [];
    for (const name of ["Test A", "Test B"]) {
      const { cookie } = await request("/auth/demo", "POST", {
        code: process.env.CI_DEMO_CODE,
      });
      assert.ok(cookie);
      cookies.push(cookie);
      await request("/me/profile", "PUT", { name, avatar: 0 }, cookie);
      const answers = Object.fromEntries(questions.map(({ id }) => [id, null]));
      await request(
        "/me/complete",
        "POST",
        {
          version: QUESTIONNAIRE_VERSION,
          answers,
          texts: { likes: "", dislikes: "" },
          consent: true,
        },
        cookie,
      );
      ids.push((await request("/me", "GET", undefined, cookie)).data.id);
    }
    await request(
      "/me/contacts",
      "PUT",
      { instagram: "test_account", discord: "" },
      cookies[1],
    );
    const before = (await request("/matches", "GET", undefined, cookies[0]))
      .data;
    assert.equal(before.matches.length, 1);
    assert.ok(!("contacts" in before.matches[0]));
    await request(`/connections/${ids[1]}`, "POST", {}, cookies[0]);
    await request(`/connections/${ids[0]}`, "POST", {}, cookies[1]);
    writeFileSync(stateFile, JSON.stringify({ cookies, ids }), { mode: 0o600 });
    console.log("Two isolated participants connected through HTTPS");
  } else {
    const { cookies, ids } = JSON.parse(readFileSync(stateFile, "utf8"));
    assert.equal(
      (await request("/me", "GET", undefined, cookies[0])).data.id,
      ids[0],
    );
    assert.equal(
      (await request("/me", "GET", undefined, cookies[1])).data.id,
      ids[1],
    );
    const matches = (await request("/matches", "GET", undefined, cookies[0]))
      .data.matches;
    assert.equal(matches.length, 1);
    assert.equal(matches[0].id, ids[1]);
    assert.equal(matches[0].status, "connected");
    assert.equal(matches[0].contacts.instagram, "test_account");
    console.log(
      "Sessions, profiles and mutual contacts survived a container recreation",
    );
  }
}
