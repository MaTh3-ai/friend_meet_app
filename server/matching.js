import { createHash } from "node:crypto";
import {
  currentAnswers,
  interestDimensions,
  referenceImages,
} from "../shared/questions.js";
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
// Exploratory similarity, not a validated predictor. Never return components.
export const similarityEngine = {
  version: "similarity-v1",
  simulated: false,
  score(a, b) {
    const x = currentAnswers(a.answers),
      y = currentAnswers(b.answers);
    const left = [],
      right = [];
    for (const { id } of interestDimensions) {
      const l = x.interests?.[id],
        r = y.interests?.[id];
      if (
        Number.isInteger(l) &&
        l >= 1 &&
        l <= 10 &&
        Number.isInteger(r) &&
        r >= 1 &&
        r <= 10
      ) {
        left.push(l);
        right.push(r);
      }
    }
    let sliderScore = null;
    if (left.length >= 3) {
      const dot = left.reduce((sum, n, i) => sum + n * right[i], 0);
      const normA = Math.sqrt(left.reduce((sum, n) => sum + n * n, 0));
      const normB = Math.sqrt(right.reduce((sum, n) => sum + n * n, 0));
      sliderScore = dot / (normA * normB);
    }
    const choices = [];
    for (const id of ["party", "humour"]) {
      if (
        Number.isInteger(x[id]) &&
        x[id] >= 0 &&
        x[id] <= 2 &&
        Number.isInteger(y[id]) &&
        y[id] >= 0 &&
        y[id] <= 2
      ) {
        choices.push(x[id] === y[id] ? 1 : 0);
      }
    }
    for (const id of ["activities", "references"]) {
      if (!Array.isArray(x[id]) || !Array.isArray(y[id])) continue;
      const allowed =
        id === "activities"
          ? [0, 1, 2, 3, 4, 5]
          : referenceImages
              .map((image, i) => (image ? i : null))
              .filter((i) => i !== null);
      const first = new Set(x[id].filter((i) => allowed.includes(i)));
      const second = new Set(y[id].filter((i) => allowed.includes(i)));
      const union = new Set([...first, ...second]);
      if (union.size)
        choices.push(
          [...first].filter((i) => second.has(i)).length / union.size,
        );
    }
    const choiceScore = choices.length
      ? choices.reduce((sum, n) => sum + n, 0) / choices.length
      : null;
    if (sliderScore === null && choiceScore === null)
      return { score: null, limited: false };
    // With no slider component, one single comparison would reveal whether one
    // private answer matched exactly. Require two choices before publishing.
    if (sliderScore === null && choices.length < 2)
      return { score: null, limited: false };
    const combined =
      sliderScore !== null && choiceScore !== null
        ? (sliderScore + choiceScore) / 2
        : (sliderScore ?? choiceScore);
    return {
      score: Math.max(0, Math.min(100, Math.round(combined * 100))),
      limited: sliderScore === null || choiceScore === null,
    };
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
