# Actual SonarQube Scan Results — `sonar-demo-app`

Pulled directly from the running SonarQube instance (`http://localhost:9000`)
via its REST API. This is the **real output** of the last analysis, as
opposed to [`FINDINGS_ANALYSIS.md`](FINDINGS_ANALYSIS.md), which documents
what was *expected* before the scan ran.

- **Project key**: `sonar-demo-app`
- **Analysis date**: 2026-07-08 07:33:17 UTC
- **Detected CI**: Jenkins
- **Revision**: `b134d2f` (project version `1.0`)
- **SonarQube**: `26.6.0.123539` (upgraded mid-history — see analysis events)

## Quality Gate

| Field | Value |
|---|---|
| Status | **OK** (passed) |
| Conditions evaluated | none (`conditions: []`) |
| CaYC status | compliant |

The gate came back green, but note it evaluated **zero conditions** — the
gate attached to this project isn't actually checking anything (no
rating/coverage/hotspot thresholds fired), so "OK" here doesn't mean the
same thing as a fully-configured Quality Gate passing. See
[Observations](#observations) below.

## Measures

| Metric | Value | Rating |
|---|---|---|
| Bugs | 0 | Reliability: **A** |
| Vulnerabilities | 4 | Security: **D** |
| Code Smells | 5 | Maintainability: **A** |
| Security Hotspots | 2 | Review: **E** (0% reviewed) |
| Coverage | 62.0% | — |
| Duplicated Lines | 0.0% | — |
| Lines of Code (ncloc) | 126 | — |
| Complexity / Cognitive Complexity | 33 / 27 | — |

## Issues (9 open)

| File:Line | Severity | Type | Rule | Message |
|---|---|---|---|---|
| `src/auth.js:37` | CRITICAL | Vulnerability | S4830 | Enable server certificate validation on this SSL/TLS connection. |
| `src/auth.js:37` | CRITICAL | Vulnerability | S5527 | Enable server hostname verification on this SSL/TLS connection. |
| `src/utils.js:24` | CRITICAL | Code Smell | S3776 | Refactor this function to reduce its Cognitive Complexity from 18 to the 15 allowed. |
| `src/auth.js:8` | MAJOR | Vulnerability | S2068 | Review this potentially hard-coded password. |
| `src/utils.js:36` | MAJOR | Code Smell | S6660 | 'If' statement should not be the only statement in 'else' block. |
| `src/app.js:7` | MINOR | Vulnerability | S5689 | This framework implicitly discloses version information by default. |
| `src/auth.js:3` | MINOR | Code Smell | S7772 | Prefer `node:https` over `https`. |
| `src/utils.js:3` | MINOR | Code Smell | S7772 | Prefer `node:child_process` over `child_process`. |
| `src/utils.js:53` | MINOR | Code Smell | S1481 | Remove the declaration of the unused `unusedFlag` variable. |

## Security Hotspots (2, both `TO_REVIEW`)

| File:Line | Category | Probability | Rule | Message |
|---|---|---|---|---|
| `src/utils.js:21` | RCE | MEDIUM | S1523 | Make sure that this dynamic injection or execution of code is safe. (`eval`) |
| `src/auth.js:24` | Weak Cryptography | MEDIUM | S2245 | Make sure that using this pseudorandom number generator is safe here. (`Math.random()`) |

## Observations

- **Coverage (62%) came in higher than the `FINDINGS_ANALYSIS.md` guess**
  ("below 80% threshold") — the actual test suite covers more branches than
  anticipated, though `ping`/`eval`/TLS paths are still the likely gaps.
- **The command-injection finding (`exec('ping -n 1 ' + host)`, expected as
  S4721) did not appear as a separate issue** in this run — only the `eval()`
  RCE hotspot did. Worth re-checking whether that code path is still present
  or was refactored since `FINDINGS_ANALYSIS.md` was written.
- **Quality Gate passing with 0 conditions evaluated is misleading** for a
  demo meant to show a gate *failing*: with Security Rating D and 0% Hotspot
  review, a standard "Sonar way" gate (Security Rating on New Code ≥ A,
  Security Hotspots Reviewed = 100%) would fail. Check
  **Project Settings > Quality Gate** to confirm which gate is assigned —
  it may be set to "None"/a custom gate instead of the built-in default.
- Two of the nine issues (`S7772`, node: protocol import style) and the
  framework-disclosure issue (`S5689`) aren't in the original planted-issue
  list — they're incidental findings from the JavaScript analyzer's default
  rule set, not intentional plants.
