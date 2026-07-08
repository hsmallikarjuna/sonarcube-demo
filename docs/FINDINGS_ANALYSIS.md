# Expected Findings — `sample-app`

This maps the intentionally planted issues in `sample-app/src` to what
SonarQube's JavaScript analyzer flags them as. Exact rule keys/severities can
shift between SonarQube versions — treat these as "what family of finding to
expect," and confirm the live rule key in the Issues/Hotspots tab.

| File | Issue | Type | Rule (approx.) | Why it matters |
|---|---|---|---|---|
| `auth.js` | Hardcoded `admin`/`SuperSecret123!` credentials | Vulnerability / Hotspot | S2068 Hard-coded credentials | Anyone with source access has a working admin login; can't be rotated without a code change. |
| `auth.js` | `Math.random()` used to build a password-reset token | Security Hotspot | S2245 Insecure PRNG | `Math.random()` is not cryptographically secure — an attacker can predict tokens and hijack password resets. |
| `auth.js` | `rejectUnauthorized: false` on an HTTPS request | Vulnerability | S4830 Server certificates should be verified | Disables TLS certificate validation, opening the connection to MITM. |
| `auth.js` | Empty `error` handler on the request | Code Smell | S2486 / empty block | Failures are silently swallowed — an operator gets no signal that notifications are failing. |
| `utils.js` | `exec('ping -n 1 ' + host, ...)` with unsanitized input | Vulnerability | S4721 OS Command Injection | `host` comes straight from a query param; a value like `x & del /f /q *` (or `; rm -rf` on *nix) runs on the server. |
| `utils.js` | `eval(expr)` on external input | Vulnerability / Hotspot | S1523 Eval should not be used | Arbitrary code execution — `expr` is attacker-controlled via `/calc?expr=`. |
| `utils.js` | Deeply nested `if`/`else` in `classify()` | Code Smell | S3776 Cognitive Complexity | Hard to test and reason about; a common driver of the Maintainability Rating dropping below A. |
| `utils.js` | Unused `unusedFlag` variable | Code Smell | S1481 Unused variable | Dead code / noise; usually Minor severity but still counts against New Code cleanliness. |
| `utils.js` | `console.log` left in | Code Smell | S106 (or similar) | Debug logging left in production code; can also leak data into logs. |

## How this plays out against the default Quality Gate

- **Security Rating on New Code**: dropped to at least **C/D** by the OS
  command injection and `eval()` findings alone → **gate fails**.
- **Security Hotspots Reviewed**: starts at 0% until someone reviews the two
  Hotspots (`Math.random()` token, hardcoded credential) → **gate fails**
  until reviewed.
- **Reliability/Maintainability Rating**: the Code Smells here are Minor/Major,
  not Blocker, so they're less likely to fail the gate alone, but they do
  affect the Maintainability Rating and duplicated/complexity measures.
- **Coverage**: the test suite in `test/app.test.js` exercises the happy/most
  error paths but not `ping`, `evaluateExpression`, or the TLS/token code —
  expect New Code coverage below the 80% threshold too.

## Suggested remediation (if you want to show a "before/after" run)

1. Replace hardcoded credentials with an environment-variable-backed
   secret / secrets manager lookup.
2. Swap `Math.random()` for `crypto.randomBytes`.
3. Remove `rejectUnauthorized: false`; fix the underlying cert issue instead.
4. Log the notification error instead of swallowing it.
5. Replace string-concatenated `exec()` with `execFile()` and an allow-listed
   argument, or validate `host` against a strict hostname/IP regex.
6. Delete the `/calc` `eval()` endpoint or replace it with a real expression
   parser library (e.g. `mathjs` in safe-eval mode).
7. Flatten `classify()` into early returns / a lookup table.
8. Remove the unused variable and the stray `console.log`.
9. Add tests for the previously uncovered branches.

Re-running the pipeline after these changes should flip the Quality Gate to
Green and clear both Hotspots (once reviewed as Fixed).
