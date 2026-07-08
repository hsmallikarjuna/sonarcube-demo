# Quality Gates and Security Hotspots

## Quality Gates

A **Quality Gate** is a set of pass/fail conditions evaluated every time
SonarQube analyzes a project. If any condition fails, the gate is **Red
(Failed)**; if all pass, it's **Green (Passed)**. The Jenkins pipeline in this
repo enforces this via `waitForQualityGate abortPipeline: true` — a failed
gate fails the build, so bad code physically cannot merge/deploy.

Critically, most conditions apply to **New Code** (the diff since your last
baseline — e.g., since the last release, or in the last N days), not the
whole codebase. This is deliberate: a large legacy codebase can't be fixed
overnight, but you *can* enforce that nothing new makes it worse. This is the
"clean as you code" philosophy.

### The default gate ("Sonar way")

| Condition (on New Code)              | Threshold |
|---------------------------------------|-----------|
| Coverage                              | ≥ 80%     |
| Duplicated Lines                      | ≤ 3%      |
| Maintainability Rating                | A         |
| Reliability Rating                    | A         |
| Security Rating                       | A         |
| Security Hotspots Reviewed            | 100%      |

Ratings map to issue severity present in the new code:
- **A** = no issues of that type
- **B** = at least one Minor
- **C** = at least one Major
- **D** = at least one Critical
- **E** = at least one Blocker

You can clone and customize this gate (Quality Gates > Create), e.g. tighten
coverage to 90%, or add a condition on the whole codebase in addition to new
code.

### Why the pipeline blocks on it

Without `waitForQualityGate`, SonarQube analysis runs but nobody enforces the
result — it becomes a dashboard people ignore. Wiring the webhook + wait step
turns "please keep quality up" into a hard gate the same way a failing unit
test does.

## Security Hotspots vs. Vulnerabilities

Both come from security-focused rules, but they mean different things and
live in different tabs in the SonarQube UI:

- **Vulnerability**: SonarQube's analysis is confident the code path is
  exploitable as-is (e.g., string-concatenated SQL passed to a query
  executor). These show up under **Issues** and directly affect the Security
  Rating.
- **Security Hotspot**: The code touches a sensitive API or pattern (crypto,
  auth, file I/O, deserialization, process execution, TLS config, logging of
  sensitive data, etc.) where whether it's actually exploitable **depends on
  context that static analysis can't fully determine.** These show up under
  a separate **Security Hotspots** tab and require a human decision.

### The Hotspot review workflow

Each hotspot starts in status **"To Review"**. A reviewer reads the
highlighted code and the rule's "Are you at risk?" / "How can I fix it?"
guidance, then marks it:

- **Safe** — the surrounding code already neutralizes the risk (e.g., input
  is validated/sanitized elsewhere, or the value is never attacker-controlled).
- **Fixed** — the code was changed to remove the risk.
- **Acknowledged** *(if enabled)* — risk accepted with a comment, for cases
  you knowingly won't fix.

The Quality Gate's "Security Hotspots Reviewed" condition just measures
**review completion**, not safety — 100% reviewed can still mean some were
marked Safe. That's intentional: the gate forces a human to *look*, it
doesn't pretend to replace that judgment.

### Why this distinction matters operationally

- Don't let Vulnerabilities pile up — they gate the build and represent
  confirmed risk.
- Don't ignore the Hotspots tab because "it's not blocking Issues count" — an
  unreviewed hotspot on `eval()` of user input or disabled TLS verification is
  often the more serious finding, it's just modeled differently.
- In review, resist rubber-stamping everything "Safe" to turn the gate green.
  The value of the gate depends entirely on reviews being honest.

See [`FINDINGS_ANALYSIS.md`](FINDINGS_ANALYSIS.md) for concrete examples of
both categories taken from this repo's `sample-app`.
