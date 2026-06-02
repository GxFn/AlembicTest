# PCVM P12 SourceRef Candidate Comparison After P11

Date: 2026-05-31
Window: AlembicTest
Task: `PCVM P12: R4 SourceRef Candidate Comparison After P11`

## Window Positioning

AlembicTest only performed real-project validation and evidence backfill in this run. No Alembic/AlembicAgent/AlembicCore/AlembicDashboard/AlembicPlugin product source was modified. No BiliDili business source was modified. This report is test evidence, not total-control acceptance.

## Verdict

`partial(scope=split-metrics-carry-pass; sourceRef-target-missed; ghost-wiki-projection-observed)`

The same `BiliDili/design-patterns` one-dimension live AI test-mode route completed successfully after P11, and the new split N11 fields are present in latest report, session report, API report, and persisted report files.

The old aggregate sourceRef metric improved from P10 but still missed the R4 target:

- R3 baseline invalidSourceRefRatio: `0.5517`.
- P8 after P7 invalidSourceRefRatio: `0.2059`.
- P10 after P9 invalidSourceRefRatio: `0.32`.
- P12 after P11 invalidSourceRefRatio: `0.2444` (`11/45`).
- Target `<=0.10`: missed.
- Producer terminal tool calls: `0`, passed.

P11's value is not that it made R4 pass; it made the failure diagnosable. P12 now separates producer/accepted-candidate refs from analysis/report referenced-file refs and carries rejected candidate reasons.

## Configuration

| Field | Value |
| --- | --- |
| Target project | `BiliDili` |
| Dimension | `design-patterns` |
| Provider / model | `deepseek / deepseek-v4-pro` |
| Test mode | `ALEMBIC_TEST_MODE=1` |
| Bootstrap dims | `design-patterns` |
| maxFiles / contentMaxLines / skipGuard | `24` / `80` / `true` |
| Dashboard URL | `http://127.0.0.1:64989/jobs?job=bootstrap_mpsk52nx_a47130d6` |
| Job / session | `bootstrap_mpsk52nx_a47130d6` / `bs_1780158051058_05r1xf` |
| Alembic source anchor | `940f9b9c9a08478ecfa1d9f2b90ce19d0fe59de0` |
| AlembicAgent source anchor | `6147a34f0d7d1f2cfd6a3d07fd180e901120f2b6` |
| BiliDili source anchor | `5b10fd4c72ccc8aeda2e9b84289748b7d883d804` |

Fresh runtime proof:

- `npm --prefix /Users/gaoxuefeng/Documents/AlembicWorkspace/AlembicAgent run build`: exit `0`.
- `npm --prefix /Users/gaoxuefeng/Documents/AlembicWorkspace/Alembic run build:core`: exit `0`.
- `npm --prefix /Users/gaoxuefeng/Documents/AlembicWorkspace/Alembic run build:self`: exit `0`.
- Alembic dist contains P11 split fields in `dist/lib/workflows/capabilities/execution/internal-agent/BootstrapPcvNodeLocalEvidence.*` and `InternalDimensionFillFinalizer.js`.

## Commands

```bash
ALEMBIC_TEST_MODE=1 ALEMBIC_TEST_BOOTSTRAP_DIMS=design-patterns ALEMBIC_TEST_RESCAN_DIMS=design-patterns node /Users/gaoxuefeng/Documents/AlembicWorkspace/AlembicTest/scripts/restart-alembic.mjs --project BiliDili --json --wait 20000 --monitor-once --no-dev-link
```

The first restart stopped stale daemon state but hit the known preclean SIGKILL classification issue. The same config was rerun with `--no-preclean`:

```bash
ALEMBIC_TEST_MODE=1 ALEMBIC_TEST_BOOTSTRAP_DIMS=design-patterns ALEMBIC_TEST_RESCAN_DIMS=design-patterns node /Users/gaoxuefeng/Documents/AlembicWorkspace/AlembicTest/scripts/restart-alembic.mjs --project BiliDili --json --wait 20000 --monitor-once --no-dev-link --no-preclean
```

```bash
node /Users/gaoxuefeng/Documents/AlembicWorkspace/AlembicTest/scripts/verify-test-environment.mjs --url http://127.0.0.1:64989 --json
```

```bash
node /Users/gaoxuefeng/Documents/AlembicWorkspace/AlembicTest/scripts/probe-cold-start-process-timeline.mjs --project BiliDili --url http://127.0.0.1:64989 --data-root /Users/gaoxuefeng/.asd/workspaces/02a25032 --max-files 24 --content-max-lines 80 --skip-guard --timeout-ms 900000 --poll-ms 2500 --output /Users/gaoxuefeng/Documents/AlembicWorkspace/AlembicTest/tmp/pcvm-p12-source-ref-candidate-comparison-after-p11/timeline.json
```

## Evidence Paths

Raw evidence directory:

`/Users/gaoxuefeng/Documents/AlembicWorkspace/AlembicTest/tmp/pcvm-p12-source-ref-candidate-comparison-after-p11/`

Key files:

- `timeline.json`
- `p12-evidence-summary.json`
- `token-usage-summary.json`
- `git-status.json`
- `health.json`
- `test-mode.json`
- `bootstrap-status.json`
- `api-job.json`
- `api-events.json`
- `api-modules-bootstrap-report-latest.json`
- `api-modules-bootstrap-report-session.json`
- `api-modules-bootstrap-reports-index.json`
- `persisted-bootstrap-report-latest.json`
- `persisted-bootstrap-report-session.json`
- `persisted-job.json`
- `combined-log-tail.txt`
- `raw-file-index.json`

Runtime source files:

- Report file: `/Users/gaoxuefeng/.asd/workspaces/02a25032/.asd/bootstrap-reports/bs_1780158051058_05r1xf.json`
- Latest report file: `/Users/gaoxuefeng/.asd/workspaces/02a25032/.asd/bootstrap-report.json`
- Job file: `/Users/gaoxuefeng/.asd/workspaces/02a25032/.asd/jobs/bootstrap_mpsk52nx_a47130d6.json`
- Combined log: `/Users/gaoxuefeng/.asd/workspaces/02a25032/.asd/logs/combined.log`

## Route Health

`timeline.json`:

- classification: `pass`
- durationMs: `622212`
- socket connected: `true`
- socket observed matching events: `true`
- event kind counts:
  - workflow `5`
  - checkpoint `1`
  - llm.input `29`
  - llm.reflection `12`
  - llm.output `29`
  - tool `1`
  - summary `4`
  - artifact `1`
- missingProducerKinds: `[]`

`test-mode.json`:

- enabled: `true`
- bootstrapDims: `["design-patterns"]`
- rescanDims: `["design-patterns"]`
- terminal sandbox: `enforce`, available `true`

## Old Aggregate Comparison

| Run | total | valid | invalid | invalid ratio | Verdict |
| --- | ---: | ---: | ---: | ---: | --- |
| R3 baseline | 29 | 13 | 16 | `0.5517` | baseline blocker |
| P8 after P7 | 34 | 27 | 7 | `0.2059` | improved, target missed |
| P10 after P9 | 50 | 34 | 16 | `0.32` | regressed, target missed |
| P12 after P11 | 45 | 34 | 11 | `0.2444` | improved from P10, target missed |

## P11 Split Metrics

| Metric | total | valid | invalid | invalid ratio | mode/status | Notes |
| --- | ---: | ---: | ---: | ---: | --- | --- |
| old aggregate / `sourceRefValidity` | 45 | 34 | 11 | `0.2444` | `strict` / `invalid` | Backward-compatible N11 field |
| `acceptedCandidateSourceRefValidity` | 43 | 33 | 10 | `0.2326` | `invalid` | Accepted candidate surface still has basename/entity refs |
| `producerSourceRefValidity` | 45 | 34 | 11 | `0.2444` | `strict` / `invalid` | Producer-facing R4 metric |
| `analysisReferencedFileValidity` | 44 | 26 | 18 | `0.4091` | `report-fallback` / `invalid` | Split out from producer metric; not counted as producer pass/fail denominator |

Counts:

- submitted / accepted / rejected: `13 / 10 / 3`
- terminalToolCallCount: `0`
- noTerminalProof: `true`
- repaired / rejected / warning sourceRef counts: `1 / 0 / 0`
- attributed / unattributed invalid sourceRef counts: `11 / 0`
- N11 status: `blocked-by-observability-gap`
- missingLinkReasons: `["producer_source_refs_invalid"]`

Reason counts:

| Bucket | entity-not-file | file-not-found | missing-prefix | other |
| --- | ---: | ---: | ---: | ---: |
| accepted candidate | 10 | 0 | 0 | 0 |
| producer | 11 | 0 | 1 | 0 |
| analysis referenced files | 13 | 5 | 0 | 0 |

Collector source breakdown:

| Origin | total | valid | invalid | invalid ratio |
| --- | ---: | ---: | ---: | ---: |
| acceptedCandidate | 43 | 33 | 10 | `0.2326` |
| rejectedCandidate | 7 | 6 | 1 | `0.1429` |
| producerToolArgs | 44 | 33 | 11 | `0.25` |
| producerToolResult | 0 | 0 | 0 | `0` |
| contentSourceLabel | 44 | 33 | 11 | `0.25` |
| analysisReferencedFiles | 44 | 26 | 18 | `0.4091` |
| reportFallback | 11 | 0 | 11 | `1` |

## Invalid Producer Refs

| Ref | Reason | Origin | Candidate |
| --- | --- | --- | --- |
| `ServiceRegistry.swift:49` | `entity-not-file` | acceptedCandidate | `ServiceRegistry: 类型安全的 DI 容器，替代传统 DIContainer` |
| `ServiceRegistry.swift:86` | `entity-not-file` | acceptedCandidate | `ServiceRegistry: 类型安全的 DI 容器，替代传统 DIContainer` |
| `ServiceRegistry.swift:107` | `entity-not-file` | acceptedCandidate | `ServiceRegistry: 类型安全的 DI 容器，替代传统 DIContainer` |
| `ServiceRegistry.swift:290` | `entity-not-file` | acceptedCandidate | `ServiceRegistry: 类型安全的 DI 容器，替代传统 DIContainer` |
| `ServiceRegistry.swift:62` | `entity-not-file` | acceptedCandidate | `ServiceRegistry: 类型安全的 DI 容器，替代传统 DIContainer` |
| `Middleware.swift:27` | `entity-not-file` | acceptedCandidate | `Middleware 协议: 网络中间件责任链（adapt/didReceive/recover）` |
| `Middleware.swift:44` | `entity-not-file` | acceptedCandidate | `Middleware 协议: 网络中间件责任链（adapt/didReceive/recover）` |
| `RouteMiddleware.swift:36` | `entity-not-file` | acceptedCandidate | `RouteMiddleware 洋葱模型: process(route:next:) 可组合路由拦截` |
| `RouteMiddleware.swift:57` | `entity-not-file` | acceptedCandidate | `RouteMiddleware 洋葱模型: process(route:next:) 可组合路由拦截` |
| `AppCoordinator.swift:62` | `entity-not-file` | rejectedCandidate | `AppCoordinator + SchemeRouter: Coordinator 导航模式` |
| `AppModule.swift:9` | `entity-not-file` | acceptedCandidate | `AppModule 协议 + ModuleManager: 声明式模块组装模式` |

Repaired sourceRef:

- `AppModule.swift:9-18` -> `Packages/AOXFoundationKit/Sources/AOXFoundationKit/ModuleKit/AppModule.swift:9-18`, reason `missing-prefix`.

## Rejected Candidate Reasons

`rejectedCandidateReasonSummary`:

- rejectedCount: `3`
- typedRejectedReasonCount: `3`
- missingTypedReasonCount: `0`
- sourceRefRelatedRejectedCount: `3`
- nonSourceRefRejectedCount: `0`

Rejected categories:

| Candidate | Category |
| --- | --- |
| `AppCoordinator + SchemeRouter: Coordinator 导航模式` | `sourceref_strict_validation_failed_content_markdown_source-label_tab_entity-not-file` |
| `AsyncRxBridge: Observable.create 桥接 async/await 与 RxSwift 订阅生命周期` | `sourceref_strict_validation_failed_content_markdown_source-label_rxswift_entity-not-file` |
| `AsyncRxBridge: Observable.create 桥接 async/await 与订阅生命周期` | `sourceref_strict_validation_failed_content_markdown_source-label_observable_c_entity-not-file__content_markdown_source-label_disposables_c_entity-not-file` |

Interpretation: P11 succeeded at carrying typed rejected reasons and candidate-level attribution. The remaining sourceRef failure is primarily the model producing basename/entity refs in content/source-label surfaces, not analysis referenced-file contamination.

## N12 And AI8 Report Carry

N12:

- status: `linked`
- summary: `10/10 accepted candidate(s) are findable in SessionStore.`
- sessionStoreSnapshotAvailable: `true`
- failureDetailsPersisted: `true`
- missingLinkReasons: `[]`

AI8/report carry:

- latest persisted report carries all split N11 fields.
- session persisted report carries all split N11 fields.
- `/api/v1/modules/bootstrap/report/latest` carries all split N11 fields.
- `/api/v1/modules/bootstrap/reports/bs_1780158051058_05r1xf` carries all split N11 fields.
- `pcvScorecard.nodes.n11.sourceRefValidity` carries aggregate status and counts.
- `pcvScorecard.nodes.n11.acceptedCandidateSourceRefValidity`, `producerSourceRefValidity`, `analysisReferencedFileValidity`, `collectorSourceBreakdown`, and `rejectedCandidateReasonSummary` are present.
- No explicit field named `AI8` exists in the runtime JSON; this report treats AI8 as report scorecard carry, consistent with previous P10 records.

## Token Usage

Token usage was derived from `combined.log` `AgentRuntime` completion lines. Provider `usage.totalTokens` equals input + output; reasoning is also recorded separately.

| Stage | Calls | Input | Output | Reasoning | Cache hit | Total model tokens | Max input | Max output | Duration |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| analyze | 17 | 264913 | 9692 | 2976 | 161408 | 274605 | 27630 | 3075 | 203898ms |
| produce | 11 | 267058 | 21735 | 5237 | 147456 | 288793 | 33725 | 4441 | 411982ms |
| whole route | 28 | 531971 | 31427 | 8213 | 308864 | 563398 | 33725 | 4441 | 615880ms |

Included stage ids / phases:

- analyze: `SCAN`, `EXPLORE`, `VERIFY`, `RECORD`, `SUMMARIZE`
- produce: `PRODUCE`, `SUMMARIZE`

## No Source Writes / Delivery Boundary

Source tree proof:

- `git -C /Users/gaoxuefeng/Documents/AlembicWorkspace/BiliDili status --short`: clean.
- `git -C /Users/gaoxuefeng/Documents/AlembicWorkspace/Alembic status --short`: clean.
- `git -C /Users/gaoxuefeng/Documents/AlembicWorkspace/AlembicAgent status --short`: clean.
- `git -C /Users/gaoxuefeng/Documents/AlembicWorkspace/AlembicCore status --short`: clean.
- `git -C /Users/gaoxuefeng/Documents/AlembicWorkspace/AlembicDashboard status --short`: clean.
- `git -C /Users/gaoxuefeng/Documents/AlembicWorkspace/AlembicPlugin status --short`: clean.
- `BiliDili/.asd`: absent.
- `BiliDili/Alembic`: absent.

Boundary observation:

- BiliDili source tree was not written.
- Product source trees were not written.
- Runtime report says `completion.delivery.status=skipped`.
- Ghost data root was written under `/Users/gaoxuefeng/.asd/workspaces/02a25032/Alembic/`:
  - `candidates/design-patterns/*.md`: 10 files
  - `wiki/*`: 8 files
  - `skills/*`: 0 files

This means the run satisfies no BiliDili/product source writes, but does not satisfy a strict interpretation of "no wiki/export" if Ghost data-root wiki projection is also forbidden. Total control should decide whether future P12-style probes need an explicit `noWiki`/projection-off route.

## Cannot Conclude

- This run does not prove R4 passed; the producer ratio is still above `0.10`.
- This run does not prove DeepSeek output stability across repeated runs.
- This run does not validate R5 two/full dimensions, Alembic self-hosting, Dashboard manual UX, delivery/wiki/project-skill export, or product source writes.
- This run does not prove the old aggregate should remain the pass/fail metric; P11 split metrics show the old aggregate now coexists with more precise producer/accepted/analysis buckets.

## Next Suggestions

1. Treat P11 split carry as validated.
2. Keep R4 open because `producerSourceRefInvalidRatio=0.2444` and `acceptedCandidateInvalidSourceRefRatio=0.2326` still miss target.
3. Next fix should focus on accepted candidate content/source-label basename refs such as `ServiceRegistry.swift:49`, `Middleware.swift:27`, and `RouteMiddleware.swift:36`, plus stricter repair/reject behavior for canonical package-relative paths.
4. Decide whether Ghost data-root wiki generation is allowed in "no-delivery" live AI probes; if not, add a daemon/test-mode switch before the next rerun.
