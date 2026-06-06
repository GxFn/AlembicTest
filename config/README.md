# AlembicTest Config

This folder owns AlembicTest verification configuration. The control center
should not keep ad hoc testing defaults in root scripts or root docs.

`defaults.json` defines:

- default real-project verification target for legacy commands;
- responsibility split between `AlembicTest-IDE` Codex Plugin / environment
  probes and `AlembicTest` real-project cold-start / rescan / AI validation;
- default AI config source project for tests whose selected target has no usable
  Alembic AI settings in Ghost or standard runtime storage;
- explicit real-project verification targets currently recognized by
  AlembicTest: `AlembicWorkspace` and `BiliDili`;
- Alembic repository path for local runtime smoke;
- restart wait / stop / status timing;
- restart preclean behavior for stopping Alembic services and clearing stale
  runtime logs before a test;
- Codex MCP reload ownership and forbidden AlembicTest use;
- monitor polling, timeout, log tail, and signal matching defaults.

`defaultProject` is only a fallback for scripts that are launched without
`--project`. It must not be read as "the only valid test project." The active
user request, controller state root / test card, or `test-exchange.md`
projection decides whether the target is `AlembicWorkspace`, `BiliDili`, or
another explicitly authorized project path.

`ai.defaultSourceProject` is a runtime fallback, not a source-code dependency.
When `restart-alembic.mjs` starts Alembic for a project that has no usable AI
configuration, it may inject the Ghost-mode AI settings/secrets from this source
project into the child process. The script only reports provider/model and
boolean key presence; it must never print or persist secret values.

`codexMcpReload` is a policy hint, not a Test-owned command route. It records
that AlembicPlugin owns `dev:codex-plugin:reload`, that reload refreshes the
installed plugin projection plus fresh MCP probe, and that it does not live
reload the current Codex host MCP session. Only `AlembicTest-IDE` may collect
fresh MCP evidence when the active test order asks; `AlembicTest` does not use
this route for real-project tests. Neither window may use `--stop-mcp` or watch
`--restart-mcp` unless the active state-root test card explicitly accepts losing
the current host MCP session and restarting Codex afterward.

Do not store secrets, API keys, local credentials, absolute user paths, or
project-private runtime data in this folder. Runtime-specific values should be
passed as command-line arguments when an AlembicTest window performs a test.
