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
- **`docker-compose.yml`** — spins up a local SonarQube server + Postgres.
  Only needed if you *don't* already have a SonarQube server; skip to step 1a
  if Jenkins and SonarQube are already running as containers.
- **`docs/QUALITY_GATES_AND_SECURITY_HOTSPOTS.md`** — conceptual explainer.

## 1. SonarQube server

### 1a. You already have SonarQube + Jenkins running as containers (this setup)

Jenkins reaches SonarQube through the **host**, not a shared Docker network,
so use the host's published port rather than a container name:

- From the Jenkins container: `http://host.docker.internal:9000`
  (works out of the box on Docker Desktop for Windows/Mac; on Linux add
  `--add-host=host.docker.internal:host-gateway` to how the Jenkins container
  was started, or use the host's LAN IP instead).
- From your browser: whatever port you published SonarQube on, e.g.
  `http://localhost:9000`.

Log in, set a password if this is first boot, then generate a scanner token:
**My Account > Security > Generate Token**.

### 1b. Starting from scratch

```bash
docker compose up -d
# first boot takes ~1-2 minutes; watch it with:
docker compose logs -f sonarqube
```

Browse to http://localhost:9000, log in with `admin`/`admin`, and set a new
password when prompted.

> Linux/WSL note: SonarQube needs `vm.max_map_count >= 262144` on the Docker
> host. If the container exits with an Elasticsearch bootstrap error, run:
> `sudo sysctl -w vm.max_map_count=262144`

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

1. Install the **SonarQube Scanner** plugin (Manage Jenkins > Plugins).
2. Manage Jenkins > System > **SonarQube servers**: add a server named
   `SonarQubeServer`, URL `http://host.docker.internal:9000` (see §1a above —
   adjust if your Jenkins container can't resolve that host), and a
   credential (Secret text) holding the token you generated above (e.g. id
   `sonarqube-token`).
3. Manage Jenkins > Tools > **SonarQube Scanner installations**: add one named
   `SonarScanner`. Since your Jenkins container already has Node.js/npm, it
   can also auto-install the scanner binary here — no extra image needed.
4. In SonarQube, add a webhook (**Administration > Configuration >
   Webhooks**) pointing at `http://<jenkins-host-or-host.docker.internal>:8080/sonarqube-webhook/`.
   This is what lets the pipeline's `waitForQualityGate()` step get notified
   instantly instead of polling. If SonarQube can't reach that address, the
   Quality Gate stage will instead time out after 10 minutes (see the
   `timeout` wrapper in the Jenkinsfile) rather than hang forever.
5. In Jenkins, create a new **Pipeline** job (or Multibranch Pipeline) pointed
   at `https://github.com/hsmallikarjuna/sonarcube-demo.git` — it will pick up
   the `Jenkinsfile` at the repo root automatically.

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
