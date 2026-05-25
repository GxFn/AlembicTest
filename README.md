# AlembicTest

AlembicTest is the dedicated verification workspace for Alembic real-link
testing inside `AlembicWorkspace`. It stores test scripts, reusable test
configuration, reproduction notes, monitoring records, and validation evidence.

Current real-project verification targets include both `AlembicWorkspace` and
`BiliDili`. `AlembicWorkspace` is used for Alembic self-hosting and multi-root
ProjectScope integration checks; `BiliDili` remains the real iOS/Swift business
project target. Select the target from the user request or the active control
test order. Product fixes belong in the owning Alembic or BiliDili repository,
not in this test workspace.

## Boundaries

- Do not copy Alembic product implementation into this repository.
- Do not store API keys, cookies, tokens, login state, device IDs, or local
  private runtime data here.
- Do not treat `BiliDili` as a disposable fixture or modify its product
  behavior for test convenience.
- Do not treat `AlembicWorkspace` as disposable test data; when it is the target,
  keep workspace control docs, source folders, and ProjectScope bindings within
  the explicit test order.
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
start Alembic, probe `AlembicWorkspace` or `BiliDili`, monitor a cold start, or
clean runtime logs.

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
real project flow. Pass `--project AlembicWorkspace` or `--project BiliDili`
when the target matters; the configured `defaultProject` is only a CLI fallback
for legacy commands.

Run from the workspace root:

```bash
npm --prefix AlembicTest run restart
npm --prefix AlembicTest run restart:monitor
npm --prefix AlembicTest run monitor
npm --prefix AlembicTest run monitor:watch
node AlembicTest/scripts/probe-codex-prime.mjs
node AlembicTest/scripts/probe-resident-vector-search.mjs
node AlembicTest/scripts/probe-unified-resident-service.mjs --phase baseline
node AlembicTest/scripts/probe-unified-resident-service.mjs --phase resident
```

Or from this repository:

```bash
npm run restart
npm run restart:monitor
npm run monitor
npm run monitor:watch
node scripts/probe-codex-prime.mjs
node scripts/probe-resident-vector-search.mjs
node scripts/probe-unified-resident-service.mjs --phase baseline
node scripts/probe-unified-resident-service.mjs --phase resident
```

`scripts/restart-alembic.mjs` may need elevated Codex sandbox permissions
because Alembic writes local runtime-control state under the user's home
directory when registering the active runtime.
