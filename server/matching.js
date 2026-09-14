import { createHash } from "node:crypto";
// Only this adapter invents numbers. Replace it with a validated engine later.
// Both components and their equal weighting are arbitrary DEMO mechanics.
function mockComponent(a, b, channel) {
  return (
    35 +
    (createHash("sha256")
      .update([a.id, b.id].sort().join(":") + channel)
      .digest()
      .readUInt16BE(0) %
      64)
  );
}
export const demoEngine = {
  version: "simulation-v1",
  simulated: true,
  score(a, b) {
    const questionnaire = mockComponent(a, b, "questionnaire");
    const semantics = mockComponent(a, b, "texts");
    return Math.round((questionnaire + semantics) / 2);
  },
};
// Future engine contract: {version, simulated, score(privatePersonA, privatePersonB)}.
// It may become async. Do not expose features, embeddings or component scores through the API.
export function eligible(a, b) {
  const accepts = (x, y) =>
    !x.preference || x.preference === "anyone" || x.preference === y.gender;
  return accepts(a, b) && accepts(b, a);
}
export const fixtures = [
  [
    "fixture-alex",
    "Alex",
    1,
    "Master Â· UPPA",
    "A coffee, a walk, and a good conversation.",
    "woman",
  ],
  [
    "fixture-sam",
    "Sam",
    0,
    "Master Â· UPPA",
    "Always up for discovering somewhere new.",
    "man",
  ],
  [
    "fixture-charlie",
    "Charlie",
    2,
    "Master Â· UPPA",
    "Letâ€™s make the next study break a good one.",
    "nonbinary",
  ],
  [
    "fixture-lou",
    "Lou",
    5,
    "Master Â· UPPA",
    "Here to meet people beyond my usual circle.",
    "woman",
  ],
  [
    "fixture-jules",
    "Jules",
    7,
    "Master Â· UPPA",
    "Good company makes an ordinary day better.",
    "man",
  ],
  [
    "fixture-noa",
    "Noa",
    4,
    "Master Â· UPPA",
    "A little curious about everything.",
    "nonbinary",
  ],
].map(([id, name, avatar, course, bio, gender]) => ({
  id,
  profile: { name, avatar, course, bio, gender, preference: "anyone" },
  answers: {},
  texts: {},
  fictitious: true,
}));
export function publicProfile(person) {
  const p = person.profile;
  return {
    id: person.id,
    name: p.name,
    avatar: p.avatar,
    course: p.course,
    bio: p.bio,
    age: p.age || null,
    fictitious: !!person.fictitious,
  };
}
