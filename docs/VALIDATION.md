# Validation record

Validated locally on Windows with Node 24.19.0, 12 September 2026.

## Automated checks

`pnpm test` covers:

- Two isolated authenticated participants completing profiles and the questionnaire.
- Unauthorized reads and cross-origin writes rejected.
- Incomplete questionnaire rejected.
- No private answers, free text, identity, preferences or non-consensual contact details in another person's results.
- One-way pending and incoming requests; mutual agreement before contact disclosure.
- Hidden profile excluded, and connection attempts against it rejected.
- Blocking works in both directions, removes prior connections and prevents new requests; unblocking does not restore old consent.
- Own data export, permanent deletion, expired-account cleanup and foreign-key cascades.
- Fictional profiles clearly separated and impossible to contact.
- CAS success parsing with required student affiliation; failure, malformed XML, missing/wrong claim and DTD rejection.
- Deterministic, symmetric demo scoring and mutual discovery eligibility.
- Production refuses insecure configuration or incomplete CAS settings.

`pnpm build` compiles the production frontend.

## Browser checks

- Completed the actual ten-card journey using the rendered UI, including optional text and visibility consent.
- Verified English/French switching and the real-participant empty state.
- Explored six explicitly fictional examples and opened a fictional profile; no contact action is offered.
- Checked mobile (390 px), narrow settings (320 px) and desktop (1280 px) layouts. No document-width overflow was measured at those widths. Corrected the avatar grid to use larger mobile touch targets.
- Restarted the server and reloaded the browser: the same completed profile was restored from SQLite and its session cookie. Toggled visibility in the UI and verified the hidden-profile state in results.
- Exercised the minimum-score tool at 100, verified the empty result state, rejected 101, and restored 30. The same state is used by the visible slider.
- No browser error/warning was reported in the inspected final results view.

## Not yet verified

- Live UPPA CAS registration, attribute release, student filtering and the full identity-provider round trip.
- Docker build/runtime: Docker is not installed in this workspace. The deployment files have been supplied for the group's host.
- Public HTTPS/domain deployment and the final QR code.
- Actual iOS Safari / Android Chrome devices, campus Wi-Fi and load at the intended audience size.
- Scientific validity, questionnaire reliability, embeddings, score calibration or legal compliance. These are not claims made by this MVP.

These limits are separate from the locally functional demo. Before the event, run the deployment guide's two-browser smoke test on the actual domain and a real phone.

## Update — 14 September 2026

Six automated tests pass on Node 24.19.0, including the existing multi-user privacy suite, study-level validation and the v2 migration. Added checks cover removal of contact usernames, revoking mutual sharing, hidden participants receiving no real results, and migration idempotence with private data and relationships preserved. Production build succeeds.

Browser checks against an isolated local SQLite database:

- At 390 × 844, name, all eight avatars, Continue and the privacy note are visible without scrolling the first screen.
- Selected Master on the optional details screen; no pronouns field.
- A physical left drag advances one question. Right arrow advances; going back shows the saved right-hand choice.
- Skipped remaining cards and reached completion. Added a test Discord username, published with the explicit button and reached real results without a checkbox.
- Switched to French; settings showed Master and the saved username.
- Settings at 320 px had no horizontal document overflow.

Real-phone gesture testing remains outstanding. The original browser record above describes the initial version; the completion checkbox and old avatar layout have since been replaced. No real participant data, cookies, contacts or preview database are included in the repository.
