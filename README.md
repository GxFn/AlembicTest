# AlembicTest

AlembicTest is the dedicated verification workspace for Alembic real-link
testing inside `AlembicWorkspace`. It stores test scripts, reusable test
configuration, reproduction notes, monitoring records, and validation evidence.

The primary real project target is the workspace `BiliDili` repository. Treat it
as a real iOS/Swift project: prefer read-only scans, cold-start verification,
smoke checks, and evidence collection. Product fixes belong in the owning
Alembic or BiliDili repository, not in this test workspace.

## Boundaries

- Do not copy Alembic product implementation into this repository.
- Do not store API keys, cookies, tokens, login state, device IDs, or local
  private runtime data here.
- Do not modify `BiliDili` product behavior for test convenience.
- Destructive test operations require explicit user or control-plan
  authorization.
- The default restart flow performs a clean-environment preflight: stop existing
  Alembic daemons / stale AlembicTest monitors, then clear old Alembic runtime
  logs. It does not delete databases, candidates, settings, secrets, or project
  source files.

## Layout

```text
AlembicTest/
├── AGENTS.md
├── config/
├── docs/
├── scripts/
└── tmp/
```

## Common Commands

Start with the safe self-check path when closing documentation or script
changes. These commands print script help or planned actions only; they do not
start Alembic, probe `BiliDili`, monitor a cold start, or clean runtime logs.

Run from the workspace root:

```bash
npm --prefix AlembicTest run check
npm --prefix AlembicTest run tmp:retention -- --max-age-days 0
node AlembicTest/scripts/restart-alembic.mjs --dry-run
```

Or from this repository:

```bash
npm run check
npm run tmp:retention -- --max-age-days 0
node scripts/restart-alembic.mjs --dry-run
```

The commands below are authorized test paths. Use them only when the user or the
current control plan explicitly asks AlembicTest to restart, monitor, or probe a
real project flow.

Run from the workspace root:

```bash
npm --prefix AlembicTest run restart
npm --prefix AlembicTest run restart:monitor
npm --prefix AlembicTest run monitor
npm --prefix AlembicTest run monitor:watch
node AlembicTest/scripts/probe-codex-prime.mjs
node AlembicTest/scripts/probe-resident-vector-search.mjs
```

Or from this repository:

```bash
npm run restart
npm run restart:monitor
npm run monitor
npm run monitor:watch
node scripts/probe-codex-prime.mjs
node scripts/probe-resident-vector-search.mjs
```

`scripts/restart-alembic.mjs` may need elevated Codex sandbox permissions
because Alembic writes local runtime-control state under the user's home
directory when registering the active runtime.
