# AlembicTest Alignment

This repository can act as an external test window for AlembicWorkspace.

- New control flow is state-root first: total control writes machine test cards under `<stateRoot>/test-cards/*.json` with `control-intake.mjs test-card`.
- `.workspace-active/workspace/current/test-exchange.md` is only a short projection / exchange surface when useful; it is not the state authority for new demands.
- Use `AlembicTest-IDE` for Codex Plugin / host MCP / environment probes, and `AlembicTest` for BiliDili / AlembicWorkspace real-project cold-start, rescan, after-run, Dashboard, monitoring, and regression tests.
- Keep probe scripts and real-environment evidence in this repository only when the test really needs this external environment.
