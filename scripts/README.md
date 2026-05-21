# AlembicTest Scripts

This directory stores scripts owned by the AlembicTest verification window.
They are for real-project smoke, cold-start monitoring, runtime restart checks,
and evidence collection. Product fixes still belong in the corresponding
Alembic source repository.

Scripts here should:

- run from the workspace root or resolve the workspace root themselves;
- avoid secrets, tokens, and committed user-specific absolute paths;
- print enough status for the control center to judge the test result quickly;
- avoid modifying source repositories unless the current control document or
  user explicitly authorizes the test.

Current scripts:

- `probe-codex-prime.mjs`: read-only Codex MCP prime probe for real-project
  plugin validation. It launches the Alembic Codex MCP stdio runtime from the
  local `AlembicPlugin` repository with `ALEMBIC_PROJECT_DIR` pointing at the
  target project, calls `alembic_codex_status`, then calls
  `alembic_task(operation=prime)` and stores a JSON evidence packet under
  `AlembicTest/tmp/`. Use it when a control test needs to verify that prime
  returns `primeKnowledgeMaterial`, `hostResponse`, `shoutInstruction`, evidence
  refs, immediate receipt timing fields (`timing`, `requiredBeforeNextAction`,
  and `visibility`), and no fictional `codex_host_response` MCP tool.
- `restart-alembic.mjs`: one-command local Alembic runtime restart for real
  project testing. It defaults to the workspace `BiliDili` project, first
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
  inside Codex.
- `monitor-alembic-bootstrap.mjs`: read-only bootstrap monitor for cold-start
  runs. It never starts, stops, cancels, or kills Alembic; it resolves the
  current daemon URL/data root, polls the compact jobs API
  (`/api/v1/jobs?kind=bootstrap&limit=1&compact=true`), counts candidate files,
  and tails focused log signals such as `coding-standards`, `note_finding`,
  `QualityGate`, timeout, cancellation, and failed dimensions. It must not call
  heavyweight Dashboard compatibility endpoints such as
  `/api/v1/modules/bootstrap/status` for routine monitoring.

Shared defaults live in `AlembicTest/config/defaults.json`. Override them with
CLI flags for one-off verification instead of editing the script body.

Restart local Alembic for `BiliDili`:

```bash
node AlembicTest/scripts/restart-alembic.mjs
```

Restart local Alembic and monitor cold-start progress:

```bash
node AlembicTest/scripts/restart-alembic.mjs --monitor
```

Monitor an already-running Alembic cold start:

```bash
node AlembicTest/scripts/monitor-alembic-bootstrap.mjs --watch
```

Probe Codex prime against `BiliDili`:

```bash
node AlembicTest/scripts/probe-codex-prime.mjs
```
