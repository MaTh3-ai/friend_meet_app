# UPPA CAS integration

## Verified vs unknown

UPPA publicly identifies `https://sso.univ-pau.fr/cas/` as its authentication service. The existence of a login page does **not** establish that an arbitrary student application is accepted as a CAS service. CAS authentication success also does not by itself establish student status: staff may use the same identity provider.

Sources consulted on 12 September 2026:

- [UPPA digital user charter](https://formation.univ-pau.fr/_shared-resource/all/Publique%20GED/Base%20documentaire/Espaces%20de%20publication/Public/Communication/Documents%20UPPA%20Publics/Recueil%20actes%20administratifs/Statuts%2C%20r%C3%A8glements%20int%C3%A9rieurs%20et%20chartes/Chartes/Chartes%20de%20l%27UPPA/Charte%20des%20usagers%20du%20num%C3%A9rique%20de%20l%27UPPA.pdf?download=true)
- [Apereo CAS protocol specification](https://github.com/apereo/cas/blob/master/docs/cas-server-documentation/protocol/CAS-Protocol-Specification.md)
- [Apereo security guide](https://apereo.github.io/cas/development/planning/Security-Guide.html)

## Implemented flow

1. Browser visits `/auth/cas`.
2. Server generates a one-use, five-minute state, stores its hash, and sets an HttpOnly SameSite=Lax cookie.
3. Browser is redirected to the **official** CAS `/login` endpoint. Credentials are entered there, never in this application.
4. CAS redirects to `APP_ORIGIN/auth/cas/callback?state=...&ticket=...`.
5. The application checks the browser state, consumes it, and validates the ticket through a server-to-server HTTPS call to `/p3/serviceValidate`, supplying the exact same service URL.
6. A valid success must include the university-confirmed student attribute with an allowed value. Missing/wrong claims fail closed.
7. The CAS user identifier is HMAC-hashed with a secret. Only that pseudonymous key is stored, not the raw identifier or password. A separate local session cookie is issued.

XML is size-bounded and validated; DTD/entity declarations are rejected. Validation requests use a timeout and reject redirects. No fallback accepts a ticket merely because it exists. No real UPPA credentials or tickets were used in development.

## Ask the university / administrator

- Can this student-run application be registered as an authorized service? Who handles this?
- Which callback URL/service pattern should be registered? The current implementation includes a random `state` query parameter in the service URL; the registration must allow this while restricting the origin and callback path.
- Does the provider support CAS 3 `/p3/serviceValidate`, and what is the official validation URL?
- Which stable identifier is returned? Which **attribute and exact values** reliably identify currently enrolled UPPA students? Do not assume an email suffix or `eduPersonAffiliation=student` without confirmation.
- Are there approved privacy/contact/retention requirements for this application?

## Activate after confirmation

```dotenv
AUTH_MODE=cas
CAS_BASE_URL=https://sso.univ-pau.fr/cas
IDENTITY_SECRET=<random secret of at least 32 characters>
CAS_STUDENT_ATTRIBUTE=<confirmed attribute name>
CAS_STUDENT_VALUES=<confirmed comma-separated allowed values>
APP_ORIGIN=https://your-registered-domain.example
```

Keep `IDENTITY_SECRET` stable and secret: changing it changes account identities. Switching from demo to CAS does not migrate demo accounts. Use a fresh database for the actual CAS launch, after exporting/deleting demo data as agreed. Disable the demo login entirely in CAS mode (implemented).

Test an allowed student, rejected non-student/missing claim, expired or reused ticket, wrong service/state and logout. Unit tests cover parsing/rejection; live service registration and end-to-end CAS verification remain outstanding.
