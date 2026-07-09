# SonarQube + Jenkins CI/CD Demo

A minimal, self-contained example of wiring SonarQube static analysis and
Quality Gates into a Jenkins pipeline. It includes:

- **`sample-app/`** — a tiny Express app with a handful of *intentionally*
  planted issues (hardcoded secret, command injection, `eval()`, insecure
  randomness, disabled TLS verification, dead code, high complexity) so the
  scan has real findings to show. See
  [`docs/FINDINGS_ANALYSIS.md`](docs/FINDINGS_ANALYSIS.md) for the full
  breakdown.
- **`Jenkinsfile`** — declarative pipeline: install → test/coverage → SonarQube
  scan → Quality Gate → publish reports → build → deploy.
- **`docs/QUALITY_GATES_AND_SECURITY_HOTSPOTS.md`** — conceptual explainer.
- **`docs/SCAN_RESULTS.md`** — actual results pulled from a real run against
  this environment's SonarQube instance (Quality Gate, measures, issues,
  hotspots).

## 1. SonarQube server

Jenkins and SonarQube run as containers on the **same Docker network** here,
so Jenkins reaches SonarQube by container name, not by host port:

- From Jenkins: `http://sonarqube:9000`
- From your browser: `http://localhost:9000` (published on the host)

Already configured in this Jenkins instance (Manage Jenkins > System):
- SonarQube server name: **`SonarQube`**, URL `http://sonarqube:9000`
- Credential id **`sonarqube-token`** (Secret text) holding a SonarQube token
- Scanner tool name: **`SonarScanner`** (Manage Jenkins > Tools)

The `Jenkinsfile` in this repo references those exact names — no extra
Jenkins configuration is required beyond creating the pipeline job (§3).

Generate a token for the scanner: **My Account > Security > Generate Token**.

## 2. Try the scan locally (optional, before wiring up Jenkins)

```bash
cd sample-app
npm ci
npm test                     # produces coverage/lcov.info + reports/junit/results.xml

# Run the scanner (requires the sonar-scanner CLI on your PATH, or use Docker):
docker run --rm -v "$(pwd):/usr/src" -w /usr/src \
  -e SONAR_HOST_URL=http://host.docker.internal:9000 \
  -e SONAR_TOKEN=<paste-your-token> \
  sonarsource/sonar-scanner-cli
```

Open the project in the SonarQube UI to see the Issues, Security Hotspots,
Measures, and Quality Gate status.

## 3. Wire it into Jenkins

This environment already has the SonarQube Scanner plugin, the `SonarQube`
server connection, and the `SonarScanner` tool configured (§1). What's
project-specific and was created for this repo:

- SonarQube project **`sonar-demo-app`** (Administration > Projects), matching
  `sonar.projectKey` in `sample-app/sonar-project.properties`.
- Jenkins pipeline job **`sonarcube-demo-pipeline`**, a Git-backed Pipeline
  job pointed at `https://github.com/hsmallikarjuna/sonarcube-demo.git`
  (branch `main`, script path `Jenkinsfile`) — same shape as the existing
  `Devsecops-demo-pipeline` job.

If reproducing this in a fresh environment instead, you'd also need a webhook
in SonarQube (**Administration > Configuration > Webhooks**) pointing at
`http://<jenkins-container-name>:8080/sonarqube-webhook/` so
`waitForQualityGate()` gets notified instantly instead of relying on the
10-minute `timeout` fallback in the Jenkinsfile.

Run the job. The pipeline:

1. Installs dependencies (`npm ci`).
2. Runs unit tests and produces coverage (`lcov.info`) + JUnit XML.
3. Runs `sonar-scanner` against `sample-app/sonar-project.properties`,
   uploading source, test, and coverage data to SonarQube.
4. **Blocks** on the Quality Gate result and fails the build if the gate is
   red.
5. Publishes the HTML coverage report and JUnit results as Jenkins artifacts.
6. Packages and archives a build artifact, with a deploy stage gated to
   `main`.

## 4. Reading the reports

- **Jenkins** → build page → *Test Result* (JUnit) and *Code Coverage Report*
  (published HTML) tabs, plus the SonarQube Quality Gate badge on the build.
- **SonarQube** → project dashboard:
  - **Issues** tab — Bugs, Vulnerabilities, Code Smells, filterable by
    severity/type.
  - **Security Hotspots** tab — requires manual review, separate from Issues.
  - **Measures** tab — coverage %, duplication %, complexity, maintainability
    rating, etc., broken out for "overall code" vs. "new code."
  - **Quality Gate** panel — pass/fail plus which condition(s) failed.

See [`docs/QUALITY_GATES_AND_SECURITY_HOTSPOTS.md`](docs/QUALITY_GATES_AND_SECURITY_HOTSPOTS.md)
for what these mean and how to act on them, and
[`docs/FINDINGS_ANALYSIS.md`](docs/FINDINGS_ANALYSIS.md) for what this
specific sample app is expected to surface.
