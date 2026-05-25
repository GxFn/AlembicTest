# AlembicTest Config

This folder owns AlembicTest verification configuration. The control center
should not keep ad hoc testing defaults in root scripts or root docs.

`defaults.json` defines:

- default real-project verification target for legacy commands;
- explicit real-project verification targets currently recognized by
  AlembicTest: `AlembicWorkspace` and `BiliDili`;
- Alembic repository path for local runtime smoke;
- restart wait / stop / status timing;
- restart preclean behavior for stopping Alembic services and clearing stale
  runtime logs before a test;
- monitor polling, timeout, log tail, and signal matching defaults.

`defaultProject` is only a fallback for scripts that are launched without
`--project`. It must not be read as "the only valid test project." The active
user request or `docs/workspace/current/alembic-test-exchange.md` decides
whether the target is `AlembicWorkspace`, `BiliDili`, or another explicitly
authorized project path.

Do not store secrets, API keys, local credentials, absolute user paths, or
project-private runtime data in this folder. Runtime-specific values should be
passed as command-line arguments when an AlembicTest window performs a test.
