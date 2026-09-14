import { z } from "zod";
import {
  questions,
  QUESTIONNAIRE_VERSION,
  avatars,
} from "../shared/questions.js";
const clean = (max) =>
  z
    .string()
    .trim()
    .max(max)
    .refine((s) => !/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(s));
export const profileSchema = z
  .object({
    name: clean(30).pipe(z.string().min(1)),
    avatar: z
      .number()
      .int()
      .min(0)
      .max(avatars.length - 1),
    course: z.enum(["", "bachelor", "master", "doctorate"]).default(""),
    bio: clean(140).default(""),
    age: z.number().int().min(18).max(99).nullable().default(null),
    gender: z
      .enum(["woman", "man", "nonbinary", "unspecified"])
      .default("unspecified"),
    preference: z
      .enum(["anyone", "woman", "man", "nonbinary"])
      .default("anyone"),
  })
  .strict();
const answersSchema = z
  .object(
    Object.fromEntries(
      questions.map((q) => [
        q.id,
        z.union([z.literal(0), z.literal(1), z.null()]),
      ]),
    ),
  )
  .strict();
export const textsSchema = z
  .object({ likes: clean(180), dislikes: clean(180) })
  .strict();
export const draftSchema = z
  .object({ answers: answersSchema.partial(), texts: textsSchema })
  .strict();
export const completionSchema = z
  .object({
    version: z.literal(QUESTIONNAIRE_VERSION),
    answers: answersSchema,
    texts: textsSchema,
    consent: z.literal(true),
  })
  .strict();
const handle = clean(32).refine((s) => !s || /^[a-zA-Z0-9_.]{2,32}$/.test(s));
export const contactsSchema = z
  .object({ instagram: handle, discord: handle })
  .strict();
