# AlembicTest Docs

This is the top-level documentation folder for the AlembicTest verification
window.

Use this folder for long-lived test plans, reproduction notes, smoke reports,
monitoring observations, and validation evidence that belong to the
AlembicTest window itself.

When the control center needs a real-project or Codex-environment test, it
should first create a state-root test card and assign it to `AlembicTest` or
`AlembicTest-IDE`. This repository stores the resulting report and evidence;
the control center links that evidence from the active state root or from a
short `test-exchange.md` projection when useful.

See [testing-operation-policy.md](testing-operation-policy.md) for the long-term
testing ownership and handoff rules.

## Reading Historical Evidence

Reports in this directory are point-in-time evidence. Localhost URLs, daemon
ports, process ids, cache markers, file mtimes, local source paths, and runtime
state snippets describe the test run that produced the report; they are not
current entrypoints for a new test.

For every new restart, monitor, probe, smoke, or regression task, rediscover the
current daemon URL, project root, plugin entry, and runtime status from the
current state root / test card, daemon state, or AlembicTest scripts. Do not reuse a
historical report's localhost URL, pid, cache marker, or path as live
configuration.

## Raw Tmp Evidence

`AlembicTest/tmp/` is for local raw evidence such as probe payload JSON, log
tails, and runtime snapshots. Files under `tmp/` are intentionally ignored by
git; long-lived conclusions must be summarized in `AlembicTest/docs/` instead.

Use the dry-run retention audit before any cleanup discussion:

```bash
npm --prefix AlembicTest run tmp:retention -- --max-age-days 0
```

The retention audit only lists candidate files. It must not be treated as delete
authorization. Removing raw evidence requires an explicit user or state-root
test-card authorization, plus a report that names the deleted files and the
sanitized long-lived evidence that replaces them.

See
[real-project-asset-intake-policy-2026-05-23.md](real-project-asset-intake-policy-2026-05-23.md)
for the SFC-R2 intake decision for real-project collection assets.

Do not store product design plans, source-repository implementation plans, API
keys, local credentials, or private machine-specific state here. Cross-repo
control plans belong in the control workspace state root / active workspace
surface, not in this repository's long-lived docs.
