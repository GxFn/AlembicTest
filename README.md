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

Run from the workspace root:

```bash
npm --prefix AlembicTest run restart
npm --prefix AlembicTest run restart:monitor
npm --prefix AlembicTest run monitor
npm --prefix AlembicTest run monitor:watch
```

Or from this repository:

```bash
npm run restart
npm run restart:monitor
npm run monitor
npm run monitor:watch
```

`scripts/restart-alembic.mjs` may need elevated Codex sandbox permissions
because Alembic writes local runtime-control state under the user's home
directory when registering the active runtime.
