# PCVM P10 SourceRef Candidate Comparison After P9

Date: 2026-05-30
Window: AlembicTest
Task: `Test-PCVM-AI-P10-001-ALEMBICTEST-SOURCE-REF-CANDIDATE-COMPARISON-AFTER-P9`

## Window Positioning

AlembicTest only performed real-project validation and evidence backfill in this run. No Alembic/AlembicAgent/AlembicCore/AlembicDashboard/AlembicPlugin product source was modified. No BiliDili business source was modified. This report is test evidence, not total-control acceptance.

## Verdict

`failed(scope=sourceRef-target-regressed; route-pass)`

The BiliDili/design-patterns one-dimension live AI no-delivery route completed successfully, but the P10 sourceRef target did not pass:

- R3 baseline invalidSourceRefRatio: `0.5517` (`16/29`).
- P8 after P7 invalidSourceRefRatio: `0.2059` (`7/34`).
- P10 after P9 invalidSourceRefRatio: `0.32` (`16/50`).
- Target `<=0.10`: missed.
- Stretch `0`: missed.
- N11 status: `blocked-by-observability-gap`, missing reason `producer_source_refs_invalid`.

Useful positive signal: the 8 persisted candidate markdown files all have valid file refs under direct candidate-file validation. The regression comes from report-level/N11 sourceRefs, including entity-only refs and symbols that remain in the runtime/report evidence stream.

## Configuration

| Field | Value |
| --- | --- |
| Target project | `BiliDili` |
| Dimension | `design-patterns` |
| Provider / model | `deepseek / deepseek-v4-pro` |
| Test mode | `ALEMBIC_TEST_MODE=1` |
| Bootstrap dims | `design-patterns` |
| maxFiles / contentMaxLines / skipGuard | `24` / `80` / `true` |
| Dashboard URL | `http://127.0.0.1:62763/jobs?job=bootstrap_mpshn8ho_d20f813f` |
| Job / session | `bootstrap_mpshn8ho_d20f813f` / `bs_1780153859581_jjajzt` |
| AlembicAgent source anchor | `6147a34f0d7d1f2cfd6a3d07fd180e901120f2b6` |
| Alembic source anchor | `7cc6df58c8af8fbbd222b8f03559711039ccd3a6` |
| BiliDili source anchor | `5b10fd4c72ccc8aeda2e9b84289748b7d883d804` |

## Commands

```bash
env ALEMBIC_TEST_MODE=1 ALEMBIC_TEST_BOOTSTRAP_DIMS=design-patterns ALEMBIC_TEST_RESCAN_DIMS=design-patterns node /Users/gaoxuefeng/Documents/AlembicWorkspace/AlembicTest/scripts/restart-alembic.mjs --project BiliDili --json --wait 20000 --monitor-once
```

The first restart stopped stale daemon state but reported the known preclean SIGKILL classification issue. The same config was rerun with `--no-preclean`:

```bash
env ALEMBIC_TEST_MODE=1 ALEMBIC_TEST_BOOTSTRAP_DIMS=design-patterns ALEMBIC_TEST_RESCAN_DIMS=design-patterns node /Users/gaoxuefeng/Documents/AlembicWorkspace/AlembicTest/scripts/restart-alembic.mjs --project BiliDili --json --wait 20000 --monitor-once --no-preclean
```

```bash
node /Users/gaoxuefeng/Documents/AlembicWorkspace/AlembicTest/scripts/verify-test-environment.mjs --url http://127.0.0.1:62763 --json
```

```bash
node /Users/gaoxuefeng/Documents/AlembicWorkspace/AlembicTest/scripts/probe-cold-start-process-timeline.mjs --project BiliDili --url http://127.0.0.1:62763 --data-root /Users/gaoxuefeng/.asd/workspaces/02a25032 --max-files 24 --content-max-lines 80 --skip-guard --timeout-ms 900000 --poll-ms 2500 --output /Users/gaoxuefeng/Documents/AlembicWorkspace/AlembicTest/tmp/pcvm-p10-source-ref-candidate-comparison-after-p9/timeline.json
```

## Evidence Paths

Raw evidence directory:

`/Users/gaoxuefeng/Documents/AlembicWorkspace/AlembicTest/tmp/pcvm-p10-source-ref-candidate-comparison-after-p9/`

Key files:

- `verify-env.json`
- `test-mode.json`
- `health.json`
- `timeline.json`
- `job-full-api.json`
- `events-full-api.json`
- `report-latest-api.json`
- `report-session-api.json`
- `report-session-file.json`
- `bootstrap-report-file.json`
- `job-file.json`
- `combined-tail.log`
- `stage-token-summary.json`
- `p10-metrics-summary.json`
- `candidate-source-ref-direct-validation.json`
- `source-ref-validation-recomputed.json`
- `source-write-proof.json`
- `dist-proof.txt`

Runtime source files:

- Report file: `/Users/gaoxuefeng/.asd/workspaces/02a25032/.asd/bootstrap-reports/bs_1780153859581_jjajzt.json`
- Latest report file: `/Users/gaoxuefeng/.asd/workspaces/02a25032/.asd/bootstrap-report.json`
- Job file: `/Users/gaoxuefeng/.asd/workspaces/02a25032/.asd/jobs/bootstrap_mpshn8ho_d20f813f.json`
- Job artifacts: `/Users/gaoxuefeng/.asd/workspaces/02a25032/.asd/job-artifacts/bootstrap_mpshn8ho_d20f813f/`
- Report artifact manifest: `/Users/gaoxuefeng/.asd/workspaces/02a25032/.asd/bootstrap-reports/artifacts/bs_1780153859581_jjajzt/manifest.json`

## Route Health

`timeline.json`:

- classification: `pass`
- durationMs: `501717`
- socket connected: `true`
- socket observed matching events: `true`
- event kind counts:
  - workflow `5`
  - checkpoint `1`
  - llm.input `23`
  - llm.reflection `11`
  - llm.output `23`
  - tool `1`
  - summary `4`
  - artifact `1`
- hiddenCount: `0`

## SourceRef Comparison

| Run | total | valid | invalid | invalid ratio | Verdict |
| --- | ---: | ---: | ---: | ---: | --- |
| R3 baseline | 29 | 13 | 16 | `0.5517` | baseline blocker |
| P8 after P7 | 34 | 27 | 7 | `0.2059` | improved, target missed |
| P10 after P9 | 50 | 34 | 16 | `0.32` | regressed, target missed |

P10 N11:

- submitted / accepted / rejected: `10 / 8 / 2`
- sourceRefValidationMode: `strict`
- sourceRefValidityStatus: `invalid`
- sourceRefValidationPolicy: `sourceRefsMustComeFrom=project-files-or-canonical-source-ref-index`, `allowEntityOnlyRefs=false`, `allowGuessedPaths=false`
- repaired / rejected / warning sourceRef counts: `0 / 0 / 0`
- attributed / unattributed invalid counts: `4 / 12`
- terminal tool call count: `0`

## Invalid Refs

Official N11 invalid refs list contains 12 unattributed `report-fallback` entries. Local recomputation over the 50 report-level sourceRefs identifies all 16 invalid refs; all are `entity-not-file`.

| Ref | Reason | Attribution |
| --- | --- | --- |
| `README.m` | `entity-not-file` | unattributed / report-fallback |
| `ServiceRegistry.swift` | `entity-not-file` | unattributed / report-fallback |
| `AccountModule.swift` | `entity-not-file` | unattributed / report-fallback |
| `CookieManager.swift` | `entity-not-file` | unattributed / report-fallback |
| `ModuleManager.swift` | `entity-not-file` | unattributed / report-fallback |
| `NetworkMonitor.swift` | `entity-not-file` | unattributed / report-fallback |
| `NetworkPermissionManager.swift` | `entity-not-file` | unattributed / report-fallback |
| `SchemeRouter.swift` | `entity-not-file` | unattributed / report-fallback |
| `RouteMiddleware.swift` | `entity-not-file` | unattributed / report-fallback |
| `NetworkModule.swift` | `entity-not-file` | unattributed / report-fallback |
| `RouterModule.swift` | `entity-not-file` | unattributed / report-fallback |
| `AppCoordinator.swift` | `entity-not-file` | unattributed / report-fallback |
| `ServiceRegistry.shared.register` | `entity-not-file` | counted in N11 attributed bucket, not itemized in official invalid list |
| `Protocol.self` | `entity-not-file` | counted in N11 attributed bucket, not itemized in official invalid list |
| `ServiceRegistry.shared.resolve` | `entity-not-file` | counted in N11 attributed bucket, not itemized in official invalid list |
| `CookieProviding.self` | `entity-not-file` | counted in N11 attributed bucket, not itemized in official invalid list |

Candidate-level attribution status:

- Official counts expose `attributedInvalidSourceRefCount=4` and `unattributedInvalidSourceRefCount=12`.
- Official invalid refs array still itemizes only the 12 unattributed fallback refs.
- Rejected reason clarity is insufficient at report level: `rejectedCount=2`, but `rejectedSourceRefCount=0`, `rejectedSourceRefs=[]`, and producer tool call summaries only show `status=error` without actionable rejected ref details in the N11 report.

## Accepted Candidate Direct Validation

Direct validation of the persisted candidate markdown files found `8/8` all-valid accepted candidates when checking `_reasoning.sources` and `(来源: path:line)` labels against the BiliDili source tree.

| Candidate | refs | valid | invalid |
| --- | ---: | ---: | ---: |
| AppCoordinator：应用级导航协调器模式 | 3 | 3 | 0 |
| AppModule 协议 + ModuleManager：显式模块生命周期管理 | 6 | 6 | 0 |
| 闭包工厂模式：轻量级依赖创建 | 4 | 4 | 0 |
| 设计模式健康评估：无反模式滥用 | 4 | 4 | 0 |
| RouteMiddleware 洋葱模型：责任链中间件模式 | 5 | 5 | 0 |
| SchemeRouter 观察者模式：路由完成回调通知 | 3 | 3 | 0 |
| ServiceRegistry：类型安全的 DI 容器模式 | 6 | 6 | 0 |
| 静态常量 Singleton 模式：Swift 原生单例规范 | 13 | 13 | 0 |

Interpretation: P9 improved accepted candidate markdown/content citations, but the runtime/report sourceRef collector still carries invalid entity-style refs into N11/AI8.

## N12 And AI8

- N12 status: `linked`
- N12 summary: `8/8 accepted candidate(s) are findable in SessionStore.`
- failureDetailsPersisted: `true`
- persistedFailureReason: `null`
- AI8/report carry: `pcvScorecard` exists; `nodes.n11.sourceRefValidity` carries `invalidSourceRefCount=16`, `invalidSourceRefRatio=0.32`, `attributedInvalidSourceRefCount=4`, `unattributedInvalidSourceRefCount=12`; `nodes.n12.statuses.linked=1`.

## Token Usage

| Stage | Calls | Input | Output | Reasoning | Cache hit | Total model tokens | Max input | Max output | Duration |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| analyze | 12 | 155274 | 7835 | 2216 | 78336 | 165325 | 20821 | 2781 | 156681ms |
| produce | 10 | 234888 | 19520 | 5599 | 119296 | 260007 | 31737 | 5774 | 341694ms |
| quality_gate | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0ms |
| rejection_gate | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0ms |
| whole route | 22 | 390162 | 27355 | 7815 | 197632 | 425332 | 31737 | 5774 | 498375ms |

`totalModelTokens = input + output + reasoning`; provider `usage.totalTokens` excludes reasoning and totals `417517`.

Included stage ids / phases: `SCAN`, `EXPLORE`, `VERIFY`, `RECORD`, `SUMMARIZE`, `PRODUCE`.

## No Source Writes / Delivery Boundary

Source tree proof:

- `git -C BiliDili status --short`: clean.
- `find BiliDili -maxdepth 2 -name .asd -o -name Alembic`: no output.
- `Alembic`, `AlembicAgent`, `AlembicCore`, `AlembicDashboard`, and `AlembicPlugin` status: clean.

Boundary observation:

- BiliDili source tree was not written.
- Runtime wrote ghost data-root artifacts under `/Users/gaoxuefeng/.asd/workspaces/02a25032/Alembic/`, including `candidates/design-patterns/*.md` and `wiki/*`. These are not BiliDili source writes, but they mean the run is not a zero-artifact runtime; report this separately if the total-control definition of "no delivery/wiki export" also forbids ghost data-root wiki projection.

## Cannot Conclude

- This run does not prove R4 sourceRef repair passed.
- This run does not prove DeepSeek output will be stable across repeated runs.
- This run does not validate full dimensions, R5 expansion, Alembic self-hosting, Dashboard manual UX, delivery/wiki/project-skill export, or source repository writes.

## Next Suggestions

- Total control should treat P10 as a target failure/regression, not a route/environment block.
- The next repair should focus on the report-level/N11 sourceRef collection path that is still ingesting entity names, basename-only refs, symbol refs, and absolute paths into `sourceRefs`.
- Candidate markdown/content citation validation appears improved; avoid reworking that layer until the N11 collector/report projection path is isolated.
- Improve rejected reason carry: `rejectedCount=2` should include actionable rejected candidate/sourceRef details or an explicit reason if unrelated to sourceRefs.
