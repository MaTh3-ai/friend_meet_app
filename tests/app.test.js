import { test } from "node:test";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { profileSchema, completionSchema } from "../server/validation.js";
import assert from "node:assert/strict";
import { createApp } from "../server/app.js";
import { openDb, prune } from "../server/db.js";
import { readConfig } from "../server/config.js";
import { parseCas } from "../server/auth.js";
import { demoEngine, eligible } from "../server/matching.js";
import {
  questions,
  QUESTIONNAIRE_VERSION,
  interestDimensions,
  currentAnswers,
} from "../shared/questions.js";

const ratings = () =>
  Object.fromEntries(
    interestDimensions.map(({ id }, i) => [id, i === 0 ? 7 : null]),
  );

const profile = (name) => ({
  name,
  avatar: 0,
  course: "master",
  bio: "Hello!",
  age: null,
  gender: "unspecified",
  preference: "anyone",
});
test("Private data, mutual contacts, visibility, blocks, export and deletion across separate sessions", async (t) => {
  const db = openDb(":memory:");
  const config = readConfig({});
  const app = createApp(db, config);
  const server = app.listen(0, "127.0.0.1");
  await new Promise((r) => server.on("listening", r));
  config.origin = `http://127.0.0.1:${server.address().port}`;
  t.after(() => {
    server.close();
    db.close();
  });
  async function request(
    path,
    method = "GET",
    body,
    cookie,
    origin = config.origin,
  ) {
    const r = await fetch(config.origin + "/api" + path, {
      method,
      headers: {
        "Content-Type": "application/json",
        "X-CG-Request": "1",
        Origin: origin,
        ...(cookie ? { Cookie: cookie } : {}),
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    return {
      status: r.status,
      cookie: r.headers.get("set-cookie")?.split(";")[0],
      data: await r.json(),
    };
  }
  assert.equal((await request("/matches")).status, 401);
  assert.equal(
    (await request("/auth/demo", "POST", {}, null, "https://attacker.test"))
      .status,
    403,
  );
  const alice = (await request("/auth/demo", "POST", {})).cookie;
  const bob = (await request("/auth/demo", "POST", {})).cookie;
  assert.notEqual(alice, bob);
  for (const [cookie, name] of [
    [alice, "Alice"],
    [bob, "Bob"],
  ]) {
    assert.equal(
      (await request("/me/profile", "PUT", profile(name), cookie)).status,
      200,
    );
    assert.equal(
      (
        await request(
          "/me/complete",
          "POST",
          {
            version: QUESTIONNAIRE_VERSION,
            answers: {},
            texts: { likes: "", dislikes: "" },
            consent: true,
          },
          cookie,
        )
      ).status,
      400,
    );
    assert.equal(
      (
        await request(
          "/me/complete",
          "POST",
          {
            version: QUESTIONNAIRE_VERSION,
            answers: Object.fromEntries(
              questions.map((q) => [
                q.id,
                q.type === "ratings"
                  ? ratings()
                  : q.type === "text"
                    ? "SECRET-INTERESTS"
                    : q.type === "multiple"
                      ? q.id === "references"
                        ? [1, 2]
                        : [0, 2]
                      : 0,
              ]),
            ),
            texts: { likes: `SECRET-${name}`, dislikes: "PRIVATE-TEXT" },
            consent: true,
          },
          cookie,
        )
      ).status,
      200,
    );
  }
  const a = (await request("/me", "GET", undefined, alice)).data;
  const b = (await request("/me", "GET", undefined, bob)).data;
  // Starting the new questionnaire keeps legacy answers in the owner's export.
  db.prepare("UPDATE users SET answers=? WHERE id=?").run(
    JSON.stringify({
      version: "scenario-v2",
      values: { interests: "PRIVATE-OLD-TEXT" },
      history: [{ version: "explore-v1", values: { evening: 1 } }],
    }),
    a.id,
  );
  assert.equal(
    (
      await request(
        "/me/draft",
        "PUT",
        { answers: { party: 2 }, texts: { likes: "", dislikes: "" } },
        alice,
      )
    ).status,
    200,
  );
  const exported = (await request("/me/export", "GET", undefined, alice)).data;
  assert.deepEqual(exported.answers.history, [
    { version: "explore-v1", values: { evening: 1 } },
    { version: "scenario-v2", values: { interests: "PRIVATE-OLD-TEXT" } },
  ]);
  assert.equal(
    (
      await request(
        "/me/complete",
        "POST",
        {
          version: QUESTIONNAIRE_VERSION,
          answers: {
            party: 2,
            interests: ratings(),
            activities: [0, 3],
            humour: 1,
            references: null,
          },
          texts: { likes: "", dislikes: "" },
          consent: true,
        },
        alice,
      )
    ).status,
    200,
  );
  assert.deepEqual(
    (await request("/me", "GET", undefined, alice)).data.answers.history,
    exported.answers.history,
  );
  const ownAnswers = (await request("/me", "GET", undefined, bob)).data.answers
    .values;
  assert.deepEqual(ownAnswers.interests, ratings());
  assert.deepEqual(ownAnswers.references, [1, 2]);
  await request(
    "/me/contacts",
    "PUT",
    { instagram: "bob.test", discord: "bob_test" },
    bob,
  );
  let result = (await request("/matches", "GET", undefined, alice)).data;
  assert.equal(result.matches.length, 1);
  assert.equal(result.matches[0].name, "Bob");
  for (const secret of [
    "SECRET",
    "PRIVATE-TEXT",
    "PRIVATE-OLD-TEXT",
    '"interests"',
    '"references"',
    "answers",
    "texts",
    "principal",
    "gender",
    "preference",
    "bob.test",
  ])
    assert.ok(!JSON.stringify(result).includes(secret), `Leaked ${secret}`);
  assert.equal(
    (await request(`/connections/${b.id}`, "POST", {}, alice)).data.status,
    "pending",
  );
  assert.equal(
    (await request("/matches", "GET", undefined, bob)).data.matches[0].status,
    "incoming",
  );
  assert.ok(
    !(await request("/matches", "GET", undefined, alice)).data.matches[0]
      .contacts,
  );
  // Declining an incoming request clears it without creating consent or a block.
  await request(`/connections/${a.id}`, "DELETE", undefined, bob);
  assert.equal(
    (await request("/matches", "GET", undefined, alice)).data.matches[0].status,
    "none",
  );
  assert.ok(
    !(await request("/matches", "GET", undefined, alice)).data.matches[0]
      .contacts,
  );
  await request(`/connections/${b.id}`, "POST", {}, alice);
  assert.equal(
    (await request(`/connections/${a.id}`, "POST", {}, bob)).data.status,
    "connected",
  );
  assert.equal(
    (await request("/matches", "GET", undefined, alice)).data.matches[0]
      .contacts.instagram,
    "bob.test",
  );
  // Either participant may revoke a request or an established exchange.
  await request(`/connections/${a.id}`, "DELETE", undefined, bob);
  assert.ok(
    !(await request("/matches", "GET", undefined, alice)).data.matches[0]
      .contacts,
  );
  await request(`/connections/${b.id}`, "POST", {}, alice);
  await request(`/connections/${a.id}`, "POST", {}, bob);
  await request("/me/contacts", "PUT", { instagram: "", discord: "" }, bob);
  assert.deepEqual(
    (await request("/matches", "GET", undefined, alice)).data.matches[0]
      .contacts,
    { instagram: "", discord: "" },
  );
  await request("/me/visibility", "PUT", { visible: false }, bob);
  assert.equal(
    (await request("/matches", "GET", undefined, bob)).data.matches.length,
    0,
  );
  assert.equal(
    (await request("/matches", "GET", undefined, alice)).data.matches.length,
    0,
  );
  assert.equal(
    (await request(`/connections/${b.id}`, "POST", {}, alice)).status,
    404,
  );
  await request("/me/visibility", "PUT", { visible: true }, bob);
  await request(`/blocks/${b.id}`, "POST", {}, alice);
  assert.equal(
    (await request("/matches", "GET", undefined, bob)).data.matches.length,
    0,
  );
  assert.equal(
    (await request(`/connections/${a.id}`, "POST", {}, bob)).status,
    404,
  );
  await request(`/blocks/${b.id}`, "DELETE", {}, alice);
  assert.equal(
    (await request("/matches", "GET", undefined, alice)).data.matches[0].status,
    "none",
  );
  assert.equal(
    (await request("/me/export", "GET", undefined, bob)).data.texts.likes,
    "SECRET-Bob",
  );
  assert.equal(
    (await request("/me", "DELETE", { confirm: "DELETE" }, bob)).status,
    200,
  );
  assert.equal((await request("/me", "GET", undefined, bob)).status, 401);
  assert.equal(
    (await request("/matches", "GET", undefined, alice)).data.matches.length,
    0,
  );
  assert.equal(db.prepare("SELECT count(*) n FROM connections").get().n, 0);
  assert.equal(db.prepare("SELECT count(*) n FROM blocks").get().n, 0);
  const examples = (
    await request("/matches?example=1", "GET", undefined, alice)
  ).data.matches;
  assert.equal(examples.length, 6);
  assert.ok(examples.every((p) => p.fictitious && p.status === "example"));
  assert.equal(
    (await request(`/connections/${examples[0].id}`, "POST", {}, alice)).status,
    404,
  );
  db.prepare("UPDATE users SET updated_at=0").run();
  assert.equal(prune(db, 30), 1);
  assert.equal(db.prepare("SELECT count(*) n FROM sessions").get().n, 0);
});

test("Scenario answers accept the correct types and reject invalid choices", () => {
  const body = {
    version: QUESTIONNAIRE_VERSION,
    answers: {
      party: 2,
      interests: ratings(),
      activities: [0, 5],
      humour: 1,
      references: null,
    },
    texts: { likes: "", dislikes: "" },
    consent: true,
  };
  assert.equal(completionSchema.safeParse(body).success, true);
  for (const [key, value] of [
    ["party", 3],
    ["activities", [0, 0]],
    ["activities", [6]],
    ["interests", { ...ratings(), pop: 0 }],
    ["interests", { ...ratings(), pop: 11 }],
    ["interests", { ...ratings(), pop: 3.5 }],
    ["interests", { ...ratings(), unexpected: 4 }],
    ["references", [0]],
    ["references", [5]],
    ["humour", [0]],
  ]) {
    assert.equal(
      completionSchema.safeParse({
        ...body,
        answers: { ...body.answers, [key]: value },
      }).success,
      false,
    );
  }
});

test("Version 3 answers preserve retained ratings and other card responses", () => {
  const previous = {
    version: "scenario-v3",
    values: {
      party: 2,
      interests: {
        ...ratings(),
        pop: 8,
        rock: 6,
        jazz: 4,
        classical: 7,
        series: 3,
      },
      activities: [0, 3],
      humour: null,
      references: [1, 2],
    },
  };
  const converted = currentAnswers(previous);
  assert.equal(converted.interests.pop, 8);
  assert.equal(converted.interests.fashion, null);
  assert.ok(!("rock" in converted.interests));
  assert.ok(!("series" in converted.interests));
  assert.deepEqual(converted.references, [1, 2]);
  assert.equal(
    completionSchema.safeParse({
      version: QUESTIONNAIRE_VERSION,
      answers: converted,
      texts: { likes: "", dislikes: "" },
      consent: true,
    }).success,
    true,
  );
  assert.equal(previous.values.interests.rock, 6);
});
test("CAS fails closed for failure, missing affiliation, wrong affiliation, malformed XML and DTD", () => {
  const c = {
    studentAttribute: "eduPersonAffiliation",
    studentValues: ["student"],
    identitySecret: "test-secret-long-enough-32-characters",
  };
  const valid =
    '<cas:serviceResponse xmlns:cas="http://www.yale.edu/tp/cas"><cas:authenticationSuccess><cas:user>student-123</cas:user><cas:attributes><cas:eduPersonAffiliation>student</cas:eduPersonAffiliation></cas:attributes></cas:authenticationSuccess></cas:serviceResponse>';
  assert.match(parseCas(valid, c), /^[a-f0-9]{64}$/);
  assert.equal(parseCas(valid, c), parseCas(valid, c));
  assert.throws(() => parseCas(valid.replace(">student<", ">staff<"), c));
  assert.throws(() =>
    parseCas(valid.replace(/<cas:attributes>.*<\/cas:attributes>/, ""), c),
  );
  assert.throws(() =>
    parseCas(
      "<cas:serviceResponse><cas:authenticationFailure>NO</cas:authenticationFailure></cas:serviceResponse>",
      c,
    ),
  );
  assert.throws(() => parseCas("<broken>", c));
  assert.throws(() => parseCas("<!DOCTYPE x>" + valid, c));
});
test("Demo score is stable, symmetric and bounded; preferences apply mutually", () => {
  const a = { id: "a" },
    b = { id: "b" };
  assert.equal(demoEngine.score(a, b), demoEngine.score(b, a));
  assert.equal(demoEngine.score(a, b), demoEngine.score(a, b));
  assert.ok(demoEngine.score(a, b) >= 30 && demoEngine.score(a, b) <= 100);
  assert.ok(
    eligible(
      { gender: "man", preference: "woman" },
      { gender: "woman", preference: "man" },
    ),
  );
  assert.ok(
    !eligible(
      { gender: "man", preference: "woman" },
      { gender: "woman", preference: "woman" },
    ),
  );
  assert.ok(
    !eligible(
      { gender: "unspecified", preference: "anyone" },
      { gender: "woman", preference: "man" },
    ),
  );
});
test("Hosted configuration refuses insecure demo and incomplete CAS setup", () => {
  assert.throws(() => readConfig({ NODE_ENV: "production" }));
  assert.throws(() =>
    readConfig({ NODE_ENV: "production", APP_ORIGIN: "https://example.org" }),
  );
  assert.throws(() => readConfig({ AUTH_MODE: "cas" }));
  assert.throws(() => readConfig({ RETENTION_DAYS: "NaN" }));
  assert.equal(
    readConfig({
      NODE_ENV: "production",
      APP_ORIGIN: "https://example.org",
      DEMO_ACCESS_CODE: "a-long-demo-code",
    }).mode,
    "demo",
  );
});

test("Study level is limited to three choices; pronouns and arbitrary courses are rejected", () => {
  for (const course of ["", "bachelor", "master", "doctorate"])
    assert.equal(
      profileSchema.parse({ ...profile("Test"), course }).course,
      course,
    );
  assert.equal(
    profileSchema.safeParse({ ...profile("Test"), course: "anything" }).success,
    false,
  );
  assert.equal(
    profileSchema.safeParse({ ...profile("Test"), pronouns: "she/her" })
      .success,
    false,
  );
});

test("Version 2 migration normalizes old profiles once and preserves private data and relationships", (t) => {
  const folder = mkdtempSync(join(tmpdir(), "common-ground-migration-"));
  const path = join(folder, "test.sqlite");
  let db = openDb(path);
  t.after(() => {
    db.close();
    rmSync(folder, { recursive: true, force: true });
  });
  const insert = db.prepare(
    "INSERT INTO users(id,profile,answers,texts,contacts,completed,visible,created_at,updated_at) VALUES(?,?,?,?,?,1,1,?,?)",
  );
  for (const [id, course] of [
    ["a", "M2"],
    ["b", "Licence · UPPA"],
    ["c", "PhD"],
    ["d", "Unmapped course"],
  ]) {
    insert.run(
      id,
      JSON.stringify({ ...profile(id), course, pronouns: "legacy" }),
      '{"values":{"evening":0}}',
      '{"likes":"private"}',
      '{"discord":"private_id"}',
      10,
      20,
    );
  }
  db.prepare("INSERT INTO connections(sender,recipient) VALUES(?,?)").run(
    "a",
    "b",
  );
  db.exec("PRAGMA user_version=1");
  db.close();
  db = openDb(path);
  assert.equal(db.prepare("PRAGMA user_version").get().user_version, 2);
  const rows = db.prepare("SELECT * FROM users ORDER BY id").all();
  assert.deepEqual(
    rows.map((row) => JSON.parse(row.profile).course),
    ["master", "bachelor", "doctorate", ""],
  );
  for (const row of rows) {
    assert.ok(!("pronouns" in JSON.parse(row.profile)));
    assert.equal(row.visible, 1);
    assert.equal(row.completed, 1);
    assert.equal(row.updated_at, 20);
    assert.equal(row.texts, '{"likes":"private"}');
    assert.equal(row.contacts, '{"discord":"private_id"}');
  }
  assert.equal(db.prepare("SELECT COUNT(*) AS n FROM connections").get().n, 1);
  db.close();
  db = openDb(path);
  assert.deepEqual(db.prepare("SELECT * FROM users ORDER BY id").all(), rows);
});
