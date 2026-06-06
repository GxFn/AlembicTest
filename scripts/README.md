# AlembicTest Scripts

This directory stores scripts owned by the AlembicTest verification window.
They are shared by `AlembicTest` and `AlembicTest-IDE`: real-project smoke,
cold-start monitoring, runtime restart checks, Codex Plugin / environment
probes, and evidence collection. Product fixes still belong in the
corresponding Alembic source repository.

Scripts here should:

- run from the workspace root or resolve the workspace root themselves;
- avoid secrets, tokens, and committed user-specific absolute paths;
- print enough status for the control center to judge the test result quickly;
- avoid modifying source repositories unless the user request or active
  state-root test card explicitly authorizes the test.
- keep Codex MCP verification separate from Plugin reload: only
  `AlembicTest-IDE` may launch fresh MCP runtimes for evidence when assigned;
  `AlembicTest` keeps to real-project cold-start / rescan / AI validation. No
  test window may use AlembicPlugin reload `--stop-mcp` / watch `--restart-mcp`
  to repair the current Codex host MCP session unless the active state-root test
  card explicitly authorizes that destructive route and a Codex restart.

Current scripts:

- `probe-codex-prime.mjs`: read-only Codex MCP prime probe for
  `AlembicTest-IDE` plugin / host environment validation. It launches the Alembic Codex MCP stdio runtime from the
  local `AlembicPlugin` repository with `ALEMBIC_PROJECT_DIR` pointing at the
  target project, calls `alembic_codex_status`, then calls
  `alembic_task(operation=prime)` and stores a JSON evidence packet under
  `AlembicTest/tmp/`. Use it when a control test needs to verify that prime
  returns `primeKnowledgeMaterial`, `hostResponse`, `shoutInstruction`, evidence
  refs, immediate receipt timing fields (`timing`, `requiredBeforeNextAction`,
  and `visibility`), readable receipt-shout guidance that does not dump
  evidence refs by default, and no fictional `codex_host_response` MCP tool.
  This is fresh MCP evidence only; it does not prove the already-running Codex
  host MCP session has reloaded Plugin code.
- `probe-resident-vector-search.mjs`: read-only Codex MCP resident search probe
  for `AlembicTest-IDE` plugin / host environment validation. It launches the same local Alembic Codex MCP
  stdio runtime, calls `alembic_codex_status`, `alembic_task(operation=prime)`,
  then direct `alembic_search` in `auto` and `semantic` modes. It stores a JSON
  evidence packet under `AlembicTest/tmp/` and summarizes
  `searchMeta.residentSearch`, `residentVector`, semantic/vector usage,
  fallback reason, representative hits, prime service boundary, and whether a
  fictional `codex_host_response` tool appeared. It also scans the direct search
  payload and MCP stderr for the removed `/api/v1/mcp/call` /
  `daemon-mcp-compat-bridge` path, so VEC-4R retests can distinguish bridge
  removal from daemon resident telemetry gaps. For VEC-5R retests it also
  summarizes `codexRequestedMode` / `residentRequestMode`, flags `auto ->
  semantic` resident request normalization, and keeps daemon `/api/v1/search`
  `searchMeta` evidence in the JSON packet.
- `probe-prime-injection-package-smoke.mjs`: test-mode G037 Stage 6A smoke for
  `PrimeInjectionPackage` runtime projection. It creates a temporary fixture
  project, writes local daemon state, starts a short-lived resident-shaped HTTP
  service on `127.0.0.1`, launches the embedded Alembic Codex Plugin runtime
  MCP server, and verifies that `searchMeta.primeInjectionPackage` reaches
  Codex-facing `alembic_search`, `alembic_task prime`, prime material, and
  IntentEpisode start / outcome handoff metadata. It does not run full
  cold-start / rescan, open Dashboard UI, or modify product source.
- `probe-unified-resident-service.mjs`: read-only Codex MCP integration probe
  for `AlembicTest-IDE` and the unified resident-service contract. It records baseline unavailable
  behavior or ready local-resident behavior for `alembic_codex_status`,
  diagnostics, Dashboard handoff, job status, prime, direct `alembic_search`
  auto/semantic, and direct daemon `/api/v1/search` / `/api/v1/jobs` evidence.
  It also scans probe payloads for removed `/api/v1/mcp/call`,
  `/api/v1/projects/*`, and `daemon-mcp-compat-bridge` paths.
- `probe-cold-start-process-timeline.mjs`: real-project cold-start process
  timeline probe. It uses the active local Alembic daemon for the target project,
  checks daemon health, opens a Socket.io notifications listener, enqueues one
  bounded bootstrap job through `/api/v1/jobs/bootstrap`, polls the job events
  endpoint, and stores JSON evidence under `AlembicTest/tmp/`. It records
  `eventsUrl`, `developerViews`, retained/hidden counts, endpoint capability,
  socket `job:process-event` delivery, and whether `llm.input`, `llm.output`,
  `llm.reflection`, and `tool` events were produced.
- `probe-dashboard-artifact-detail.mjs`: test-mode LLMI-P9 Dashboard artifact
  detail probe. It requires `ALEMBIC_TEST_MODE=1`, starts a fixture Alembic API,
  a temporary Dashboard Vite server, and headless Chrome, then verifies real
  Dashboard DOM behavior for timeline projection, artifact detail loading /
  success / failure / empty states, artifact metadata, `llmMetrics`,
  `traceEnvelope`, and secret-boundary redaction. It stores screenshots, DOM
  text, request logs, and a JSON summary under `AlembicTest/tmp/`; it does not
  run a full cold-start or modify product source.
- `probe-llm-input-layering.mjs`: test-mode LLMI-P4 probe for AlembicAgent
  input section assembly. It requires `ALEMBIC_TEST_MODE=1`, runs the targeted
  `llm-input-layering` Vitest suite, reuses the Test-05 correctness probe for
  `[object Promise]` / `code.read({ filePaths })` regression evidence, and
  stores a developer-safe JSON summary under `AlembicTest/tmp/`. It does not
  start a daemon, run full cold-start, or modify product source.
- `probe-llm-observation-ledger.mjs`: test-mode LLMI-P6 probe for AlembicAgent
  Observation Ledger runtime input. It requires `ALEMBIC_TEST_MODE=1`, verifies
  the expected AlembicAgent Wave 3 commit, runs source targeted Vitest coverage,
  creates a temporary runtime capture fixture, and stores JSON evidence for
  retained `llm.input`, provider message ledger sections, raw debug-field
  contraction, scratchpad priority, and Wave 1 / Wave 2 regression checks. It
  does not start a daemon, run full cold-start, or modify product source.
- `probe-package-runtime-integration.mjs`: test-mode LLMI-P11 probe for the
  AlembicAgent staged package/runtime integration gate. It requires
  `ALEMBIC_TEST_MODE=1`, verifies the Wave 6A source commit and staged manifest,
  dry-runs `npm pack`, creates a temporary package-shape `node_modules` harness,
  imports `@alembic/agent/runtime`, `@alembic/agent/memory`, and
  `@alembic/agent/tools/v2` from `tmp/release/@alembic-agent`, executes
  `code.read({ filePaths })`, builds an Observation Ledger, and assembles the
  LLM input runtime layer without starting a daemon, running cold-start, or
  modifying product source.
- `probe-pcv-canonical-source-baseline.mjs`: source-readonly PCVM Test-01
  probe for the canonical `progressive-chain-validation` source baseline. It
  verifies the expected PCV / Alembic / AlembicPlugin commits, checks the PCV
  metrics contract, plan template, and Alembic N9 baseline example, confirms
  Alembic and AlembicPlugin no longer depend on an internal
  `skills/progressive-chain-validation` checkout, and writes a minimal N9
  scorecard fixture plus JSON evidence under `AlembicTest/tmp/`. When no real
  N9 artifact / trace / metric / source-ref link exists, it records
  `blocked-by-observability-gap` instead of inventing a quality score. For
  cleanup reruns, use the `--expected-*-commit` overrides to bind the probe to
  the repaired consumer commits without rewriting the historical baseline.
- `probe-pcv-n9-observability-linkage.mjs`: test-mode PCVM Test-11 probe for
  the N9 observability linkage handoff between `AlembicAgent` and `Alembic`.
  It verifies the expected Wave 3A commits, runs targeted product tests,
  generates a temporary Vitest fixture that calls the real Agent
  `pcvNodeEvidence` helper and Alembic carry helper, stores fixture / plan /
  JSON evidence under `AlembicTest/tmp/`, and reports whether nested
  `metadata.pcvNodeEvidence` reaches job-level `pcvN9Observability` or remains
  `blocked-by-observability-gap`. It does not run full cold-start / rescan or
  modify product source.
- `tool-terminal-baseline.mjs`: controlled Tool/Terminal usage baseline helper.
  It reads an explicit action ledger, normalizes transcript-order rows into a
  concrete `timestamp` field, recomputes support/diagnostic metrics, and writes
  generated JSON/report evidence only under `AlembicTest/`. Use it when a PCVM
  or AlembicTest task needs auditable tool/terminal metrics without hand-writing
  path-sensitive evidence files.
- `restart-alembic.mjs`: one-command local Alembic runtime restart for real
  project testing. It uses `AlembicTest/config/defaults.json` for its CLI
  fallback project, while `AlembicWorkspace` and `BiliDili` are both valid
  real-project targets when the active test order selects them. It first
  performs a clean-environment preflight that stops existing Alembic daemon
  processes / stale AlembicTest monitors and removes old `.asd/daemon.log` plus
  `.asd/logs/` files from known Alembic data roots. It then runs
  `npm run dev:link` in the Alembic repository to refresh the local global
  development environment, and finally calls the Alembic CLI
  `start --restart --no-open --json`, prints the active Dashboard URL, daemon
  pid, and compact bootstrap job probe. Use `--monitor` to immediately hand off
  to the read-only bootstrap monitor after restart. Use `--no-preclean`,
  `--no-stop-all-services`, or `--no-clean-logs` only when intentionally
  preserving current runtime state for a focused diagnostic. Use `--no-dev-link`
  only when intentionally testing an already-linked build. Because Alembic must write
  `~/.asd/runtime-control.json` to register the active runtime, the script
  preflights that write and should be run with elevated sandbox permissions
  inside Codex. Before launching Alembic, it resolves the target project's
  Ghost/standard AI config; if that target has no usable provider/key pair, it
  can inject the configured default source project's AI config into the child
  process. The JSON/human summary only reports source, provider/model, and
  boolean key presence, never secret values.
- `verify-test-environment.mjs`: read-only readiness check for an already
  started Alembic test daemon. It resolves the current daemon URL/data root,
  checks `/api/v1/health`, `/api/v1/modules/test-mode`, and the compact
  bootstrap jobs API, summarizes the latest job, and classifies Codex localhost
  sandbox failures separately from real daemon unavailability. Use it before
  starting a probe or after `restart-alembic.mjs` when the task only needs a
  stable test environment rather than a cold-start chain.
- `monitor-alembic-bootstrap.mjs`: read-only bootstrap monitor for cold-start
  runs. It never starts, stops, cancels, or kills Alembic; it resolves the
  current daemon URL/data root, polls the compact jobs API
  (`/api/v1/jobs?kind=bootstrap&limit=1&compact=true`), counts candidate files,
  and tails focused log signals such as `coding-standards`, `note_finding`,
  `QualityGate`, timeout, cancellation, and failed dimensions. It must not call
  heavyweight Dashboard compatibility endpoints such as
  `/api/v1/modules/bootstrap/status` for routine monitoring.
- `tmp-evidence-retention.mjs`: dry-run retention audit for ignored raw evidence
  under `AlembicTest/tmp/`. It lists file age and cleanup candidates but never
  deletes files; deleting raw evidence still requires explicit user or
  state-root test-card authorization.

Shared defaults live in `AlembicTest/config/defaults.json`. The config lists
both supported real-project targets: `AlembicWorkspace` for Alembic self-hosting
/ multi-root checks and `BiliDili` for the iOS/Swift business project checks.
It also records the default AI config source project used when a selected target
has no usable AI config. Override the target or fallback source with CLI flags
for one-off verification instead of editing the script body.

`codexMcpReload` in the shared defaults is a boundary note, not a Test command.
Plugin reload belongs to AlembicPlugin and only refreshes installed projection
plus fresh MCP probe by default. `AlembicTest-IDE` may verify current Codex host
MCP behavior after the user / controller has refreshed or restarted Codex;
`AlembicTest` should not take this route. Neither window should kill
`codex-mcp.js` from a test run.

Audit ignored raw evidence without deleting it:

```bash
node AlembicTest/scripts/tmp-evidence-retention.mjs --max-age-days 0
```

Restart local Alembic for the configured fallback target:

```bash
node AlembicTest/scripts/restart-alembic.mjs
```

Restart local Alembic for an explicit target:

```bash
node AlembicTest/scripts/restart-alembic.mjs --project AlembicWorkspace
node AlembicTest/scripts/restart-alembic.mjs --project BiliDili
node AlembicTest/scripts/restart-alembic.mjs --project ../SomeFixture --ai-source-project BiliDili
```

Restart local Alembic and monitor cold-start progress:

```bash
node AlembicTest/scripts/restart-alembic.mjs --monitor
```

Verify the current test daemon environment without starting a job:

```bash
node AlembicTest/scripts/verify-test-environment.mjs --json
node AlembicTest/scripts/verify-test-environment.mjs --url http://127.0.0.1:60870 --json
```

Monitor an already-running Alembic cold start:

```bash
node AlembicTest/scripts/monitor-alembic-bootstrap.mjs --watch
```

Probe Codex prime against the fallback target or an explicit target only when
`AlembicTest-IDE` is assigned:

```bash
node AlembicTest/scripts/probe-codex-prime.mjs
node AlembicTest/scripts/probe-codex-prime.mjs --project AlembicWorkspace --query "<target-specific prompt>"
```

Probe resident vector search against the fallback target or an explicit target
only when `AlembicTest-IDE` is assigned:

```bash
node AlembicTest/scripts/probe-resident-vector-search.mjs
node AlembicTest/scripts/probe-resident-vector-search.mjs --project AlembicWorkspace --prime-query "<target-specific prompt>" --search-query "<target-specific query>"
```

Probe PrimeInjectionPackage projection through embedded Plugin runtime only when
`AlembicTest-IDE` is assigned:

```bash
<node-22-binary> AlembicTest/scripts/probe-prime-injection-package-smoke.mjs
```

Build or check a controlled Tool/Terminal baseline from an explicit action
ledger:

```bash
node AlembicTest/scripts/tool-terminal-baseline.mjs \
  --actions AlembicTest/tmp/pcvm-tool-terminal-usage-baseline-2026-05-31/baseline-actions.json \
  --source-map AlembicTest/tmp/pcvm-tool-terminal-usage-baseline-2026-05-31/telemetry-source-map.json \
  --out-dir AlembicTest/tmp/tool-terminal-baseline-smoke \
  --report AlembicTest/tmp/tool-terminal-baseline-smoke/report.md
```

Probe unified resident-service behavior:

```bash
node AlembicTest/scripts/probe-unified-resident-service.mjs --phase baseline
node AlembicTest/scripts/probe-unified-resident-service.mjs --phase resident
```

Probe cold-start process timeline behavior:

```bash
node AlembicTest/scripts/probe-cold-start-process-timeline.mjs --max-files 24 --content-max-lines 80
```

Probe Dashboard artifact detail behavior in test mode:

```bash
ALEMBIC_TEST_MODE=1 node AlembicTest/scripts/probe-dashboard-artifact-detail.mjs
```

Probe AlembicAgent LLM input layering in test mode:

```bash
ALEMBIC_TEST_MODE=1 node AlembicTest/scripts/probe-llm-input-layering.mjs
```

Probe AlembicAgent Observation Ledger in test mode:

```bash
ALEMBIC_TEST_MODE=1 node AlembicTest/scripts/probe-llm-observation-ledger.mjs
```

Probe AlembicAgent staged package/runtime integration in test mode:

```bash
ALEMBIC_TEST_MODE=1 node AlembicTest/scripts/probe-package-runtime-integration.mjs
```

Probe PCV canonical source baseline:

```bash
node AlembicTest/scripts/probe-pcv-canonical-source-baseline.mjs
```

Probe PCV N9 observability linkage:

```bash
node AlembicTest/scripts/probe-pcv-n9-observability-linkage.mjs
```
