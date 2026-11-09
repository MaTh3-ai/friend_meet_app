# Product decisions

**Positioning:** help UPPA students meet people outside their usual circle. Friendship is the default framing; optional private discovery preferences allow a more selective or potentially romantic use without a dating feed, profile swiping or public romantic intent.

- Product name: Meeting Ground.
- Soft lavender, pink and mint, light dotted texture and tactile answer cards. Four local SVG avatars (mountain/snowboard, seal, pixel mushroom, island/surfboard) alongside the retained emojis. No avatar uploads or external font dependency.
- English is always the first-run language. A clearly labelled EN/FR switch preserves progress; only the language preference is stored in localStorage. User-written text is not automatically translated.
- First name/nickname and avatar are the only initial requirements. Study level, bio and age are optional public fields. Pronouns are not collected or displayed. The prototype's age field accepts adults (18+) and does not collect birth dates. This fits the stated M2 cohort; reconsider onboarding before admitting minors.
- Optional private identity is used only for discovery filtering. Discovery includes Anyone, Women, Men and Non-binary people. Both sides' filters apply.
- Five provisional story cards: two single-choice questions, private 1–10 interest ratings, an activity multiple choice, and four selectable reference images with two placeholders. Back and skip remain available. This is a UX hypothesis, not a validated scale.
- Previous optional private texts remain stored for existing users, but are no longer requested during onboarding. No external AI processing.
- Do not call the percentage a scientific compatibility estimate. Real scores are experimental and answer-dependent; fictional scores are disclosed as simulated.
- Results use real participants by default and refresh every 12 seconds. Fictional examples are separate. The minimum-score filter starts at 0, and people with no score remain visible.
- Optional Instagram/Discord contacts are revealed only after a mutual contact-sharing request and acceptance. No WhatsApp number, messaging system or notifications service. A high score alone is not mutual consent.
- One-tap hiding and explicit irreversible account deletion are separate. Export and blocking are implemented. Retention defaults to 30 days without updates, configurable on the server.

## Next scientific phase

Research pre-meeting measurable predictors, prioritizing short, non-sensitive measures and applicability to strangers. Define the objective (conversation, repeated contact, friendship) before model selection. Separate similarity from complementarity hypotheses. Validate item wording, bilingual equivalence, test-retest behavior, missingness and score calibration. Do not label unvalidated binary items as personality diagnostics. Evaluate whether negative preferences contribute useful signal before treating their embeddings like positive interests.

## Before wider university access

The current request establishes an M2 trial and an undecided continuation, not an unrestricted public rollout. Before broadening it: confirm a project operator/contact and retention/backup policy, validate CAS and student affiliation, define reporting/moderation and abuse handling, measure load, and complete the scoring research if real affinity claims will be made. This is future work, not a claim of compliance or scientific validation.

## Onboarding and visibility

The first screen asks only for name and avatar. A second screen groups optional details behind disclosures. Study level offers only Bachelor’s/Licence, Master and PhD/Doctorat, or unspecified. The final publish button explains that discovery is reciprocal: publishing opens results; hidden accounts cannot browse participants. Hiding and deletion remain available in settings. Social usernames can be entered during onboarding or in settings and are revealed only after mutual agreement.
