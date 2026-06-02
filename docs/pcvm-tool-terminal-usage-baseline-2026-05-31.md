# PCVM Tool / Terminal Usage Baseline Raw Evidence

Run ID: `pcv-20260531-1506-tool-terminal-usage-baseline`
Window: `AlembicTest`
Generated: `2026-05-31T15:36:03+08:00`
Scope: raw evidence only; no final PCVM verdict.

## Window Position

AlembicTest is acting only as the real-validation evidence window. This task did not modify Alembic, AlembicAgent, AlembicDashboard, AlembicPlugin, BiliDili, or PCVM product/source artifacts. It did not start live AI, cold-start, rescan, Dashboard, delivery, or any Alembic runtime route.

## Paths

Raw evidence tmp path:

- `/Users/gaoxuefeng/Documents/AlembicWorkspace/AlembicTest/tmp/pcvm-tool-terminal-usage-baseline-2026-05-31/`

Files:

- `telemetry-source-map.json`
- `baseline-actions.json`
- `baseline-metrics.json`

Report path:

- `/Users/gaoxuefeng/Documents/AlembicWorkspace/AlembicTest/docs/pcvm-tool-terminal-usage-baseline-2026-05-31.md`

## Sampling Window

Selected window: `controlled-current-turn-evidence-intake`.

Boundary:

- Start: AlembicTest cwd confirmation for this task.
- End: source map / action ledger / metrics / report write.
- Timestamp mode: order-only. Exact per-action Codex host timestamps were not available through a local transcript export.

This is a scoped baseline candidate, not a historical all-session baseline.

## Telemetry Source Map

| Source | Availability | Used | What It Supports | Blind Spot |
| --- | --- | --- | --- | --- |
| Codex current tool transcript | partial | yes | order, surface, workdir for terminal rows, success/exit status, sandbox escalation flag, command family/shape | no stable local raw transcript file or host action ids exposed |
| App terminal output | unavailable | no | only source availability probe | `read_thread_terminal` returned no attached app terminal |
| AlembicTest tmp/docs artifact inventory | available | source-map only | evidence paths and prior run artifacts | not complete tool/terminal telemetry |
| PCVM current run records | available | contract only | metric model and blocker definition | not measured usage |
| Shell history | not read | no | potential command list only | unscoped/private and missing tool purpose/results |
| Git status | available | boundary only | repository dirty-state evidence | cannot reconstruct prior actions |

Full source map: `/Users/gaoxuefeng/Documents/AlembicWorkspace/AlembicTest/tmp/pcvm-tool-terminal-usage-baseline-2026-05-31/telemetry-source-map.json`

## Baseline Metric Table

| Metric | Value | Scope / Notes |
| --- | ---: | --- |
| `pcvm.toolTerminal.baselineCoverage` | `1.0` | controlled-current-turn ledger; uses action order rather than exact host timestamps |
| `pcvm.tool.countBySurface.terminal` | `9` | terminal rows |
| `pcvm.tool.countBySurface.tool` | `6` | plan/session/app-terminal/apply_patch rows |
| `pcvm.terminal.commandCountByFamily.pwd/verify` | `1` | cwd confirmation |
| `pcvm.terminal.commandCountByFamily.sed/read` | `4` | PCVM plan/data/issues/skill reads |
| `pcvm.terminal.commandCountByFamily.rg/find` | `5` | tmp/docs/report inventory and misplaced-file check |
| `pcvm.terminal.commandCountByFamily.git` | `2` | AlembicTest dirty-state checks |
| `pcvm.terminal.commandCountByFamily.mkdir` | `1` | evidence directory creation |
| `pcvm.terminal.commandCountByFamily.date/verify` | `1` | local timestamp capture |
| `pcvm.terminal.commandCountByFamily.node/verify` | `2` | JSON parse verification, one failed before relocation and one passed after |
| `pcvm.terminal.commandCountByFamily.wc/verify` | `2` | report existence check, one failed before relocation and one passed after |
| `pcvm.terminal.commandCountByFamily.rsync` | `2` | copy misplaced evidence/report into AlembicTest |
| `pcvm.tool.readToWriteRatio` | `2.0` | 10 read/verify actions, 5 write/mutation actions |
| `pcvm.tool.parallelReadRatio` | `0.7` | 7 parallel read rows / 10 eligible read rows |
| `pcvm.terminal.workdirMismatchCount` | `0` | all terminal commands used AlembicTest workdir |
| `pcvm.tool.failureRate` | `0.0667` | one failed verification exposed wrong file placement |
| `pcvm.tool.escalationCount` | `0` | no `require_escalated` action |
| `pcvm.tool.externalCallCount` | `0` | no network/browser/live AI/runtime route |
| `pcvm.terminal.sessionLeakCount` | `0` | all exec sessions polled to exit |
| `pcvm.terminal.chainedCommandCount` | `0` | no shell separators/pipes in sampled commands |
| `pcvm.tool.duplicateReadCount` | `0` | no unnecessary repeat read in sample |
| `pcvm.tool.outputNoiseIncidents` | `1` | broad `rg --files AlembicTest/tmp` produced truncated/noisy output |
| `pcvm.tool.evidenceMissingCount` | `2` | no host transcript export path; no app terminal attached |
| `pcvm.tool.filePlacementMismatchCount` | `1` | first `apply_patch` wrote to parent workspace before relocation |

Full action ledger and metrics:

- `/Users/gaoxuefeng/Documents/AlembicWorkspace/AlembicTest/tmp/pcvm-tool-terminal-usage-baseline-2026-05-31/baseline-actions.json`
- `/Users/gaoxuefeng/Documents/AlembicWorkspace/AlembicTest/tmp/pcvm-tool-terminal-usage-baseline-2026-05-31/baseline-metrics.json`

## Blind Spots

- Complete historical Codex tool-call telemetry was not found as a local raw export path.
- The app terminal source was unavailable in this thread.
- Existing AlembicTest tmp/docs artifacts are useful as prior run outputs but do not provide command purpose, workdir, success, escalation, or session-closure fields.
- Shell history was intentionally not read because it may include unrelated private commands and would not include Codex tool results.
- This sample is biased toward evidence-intake behavior; it should not be used to judge cold-start, live AI, frontend testing, or product repair sessions.
- File edit tools can have a different default base directory from terminal `workdir`; this sample caught and corrected one such placement mismatch.

## Candidate Optimization Directions

These are candidate directions only, not confirmed PCVM conclusions.

1. Prefer a small structured action ledger for controlled PCVM baseline windows so every tool/terminal row has purpose, workdir, target repo, success, evidence ref, and escalation state.
2. Replace broad artifact inventory reads with narrowed globs or count summaries before expanding, because noisy output can reduce evidence review quality.
3. Keep independent document reads batched in parallel when they are read-only and bounded, but record the batch contents so command count and evidence refs remain auditable.
4. Treat shell history and private transcript sources as non-default; use them only with explicit scope and privacy review.
5. For future optimization rounds, compare evidence completeness and workdir safety before comparing raw command count.
6. Use absolute file paths or verify immediately after `apply_patch` when AlembicTest's required actual workdir matters; terminal `workdir` alone did not constrain `apply_patch` in this sample.

## Boundary Statement

Touched product source: no.

Started live AI / AlembicTest runtime route: no.

Touched BiliDili / product repositories: no operation in this task.

AlembicTest writes in this task:

- raw evidence under `/Users/gaoxuefeng/Documents/AlembicWorkspace/AlembicTest/tmp/pcvm-tool-terminal-usage-baseline-2026-05-31/`
- this report under `/Users/gaoxuefeng/Documents/AlembicWorkspace/AlembicTest/docs/`

Corrected placement:

- The first `apply_patch` created the same files under `/Users/gaoxuefeng/Documents/AlembicWorkspace/`; they were copied into AlembicTest with `rsync -a` and then deleted from the parent workspace with `apply_patch Delete File`.

## Suggested PCVM Next Step

Recommended next step: `metric refinement`.

Reason: a scoped baseline now exists, but the source map shows that historical all-session telemetry is not yet available. PCVM should first decide whether the canonical metric source is a controlled action ledger, a Codex transcript export, or a future instrumentation source before implementing source-unit collection or root-cause work.
