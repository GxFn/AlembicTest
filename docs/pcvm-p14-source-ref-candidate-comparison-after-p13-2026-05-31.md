# PCVM P14 SourceRef Candidate Comparison After P13

Date: 2026-05-31
Window: AlembicTest
Task: `PCVM P14: R4 SourceRef Candidate Comparison After P13`

## Window Positioning

AlembicTest only performed real-project validation and evidence backfill in this run. No Alembic/AlembicAgent/AlembicCore/AlembicDashboard/AlembicPlugin product source was modified. No BiliDili business source was modified. This report is test evidence, not total-control acceptance.

## Verdict

`failed(scope=sourceRef-target-regressed-after-P13; route-health-pass; n12-linked; no-protected-source-write)`

The same `BiliDili/design-patterns` one-dimension live AI test-mode route completed after fresh AlembicAgent P13 dist. Route health, events, N12 persistence, typed rejected reasons, and no protected source writes all passed.

P14 did not meet the R4 sourceRef target and regressed from P12:

- R3 baseline old aggregate invalidSourceRefRatio: `0.5517`.
- P8 after P7 old aggregate invalidSourceRefRatio: `0.2059`.
- P10 after P9 old aggregate invalidSourceRefRatio: `0.32`.
- P12 after P11 old aggregate invalidSourceRefRatio: `0.2444`.
- P14 after P13 old aggregate invalidSourceRefRatio: `0.4359` (`17/39`).
- P14 accepted candidate invalid ratio: `0.3667` (`11/30`), target `0`, missed.
- P14 producer invalid ratio: `0.4359` (`17/39`), target `<=0.10`, missed.
- Producer terminal tool calls: `0`, passed.

P13 appears to improve `contentSourceLabel` specifically (`0.04`, only `SceneDelegate.swift:33`), but accepted candidate and producer surfaces still contain entity-only basename refs in `reasoning.notes` / report fallback surfaces. Failure attribution is therefore not environment or N11 split carry; it is still producer/validation repair coverage for non-content-label candidate fields.

## Configuration

| Field | Value |
| --- | --- |
| Target project | `BiliDili` |
| Dimension | `design-patterns` |
| Provider / model | `deepseek / deepseek-v4-pro` |
| Test mode | `ALEMBIC_TEST_MODE=1` |
| Bootstrap / rescan dims | `design-patterns` / `design-patterns` |
| maxFiles / contentMaxLines / skipGuard | `24` / `80` / `true` |
| Dashboard URL | `http://127.0.0.1:50014/jobs?job=bootstrap_mpslv11g_36170807` |
| Job / session | `bootstrap_mpslv11g_36170807` / `bs_1780160941558_un5pwx` |
| AlembicAgent source anchor | `554e58f7844cd445a3a50d897d093dae001ab6dc` |
| Alembic source anchor | `940f9b9c9a08478ecfa1d9f2b90ce19d0fe59de0` |
| AlembicTest source anchor | `acfb8a84fd14537eeceb9deb25bd0d2b43cd8f33` |
| BiliDili source anchor | `5b10fd4c72ccc8aeda2e9b84289748b7d883d804` |

Fresh runtime proof:

- `npm --prefix /Users/gaoxuefeng/Documents/AlembicWorkspace/AlembicAgent run build`: exit `0`.
- `npm --prefix /Users/gaoxuefeng/Documents/AlembicWorkspace/Alembic run build:core`: exit `0`.
- `npm --prefix /Users/gaoxuefeng/Documents/AlembicWorkspace/Alembic run build:self`: exit `0`.
- `@alembic/agent` runtime package resolves to `/Users/gaoxuefeng/Documents/AlembicWorkspace/AlembicAgent`.
- `AlembicAgent/dist/tools/v2/handlers/knowledge.js` contains P13 grounding evidence (`groundContentSourceCitations`, `candidateTitle`, `contentFieldPath`, `invalidRef`, `suggestedRef`).

## Commands

```bash
ALEMBIC_TEST_MODE=1 ALEMBIC_TEST_BOOTSTRAP_DIMS=design-patterns ALEMBIC_TEST_RESCAN_DIMS=design-patterns node /Users/gaoxuefeng/Documents/AlembicWorkspace/AlembicTest/scripts/restart-alembic.mjs --project BiliDili --json --wait 20000 --monitor-once --no-dev-link
```

The first restart stopped stale daemon state but hit the known preclean SIGKILL classification issue. The same config was rerun with `--no-preclean`:

```bash
ALEMBIC_TEST_MODE=1 ALEMBIC_TEST_BOOTSTRAP_DIMS=design-patterns ALEMBIC_TEST_RESCAN_DIMS=design-patterns node /Users/gaoxuefeng/Documents/AlembicWorkspace/AlembicTest/scripts/restart-alembic.mjs --project BiliDili --json --wait 20000 --monitor-once --no-dev-link --no-preclean
```

```bash
node /Users/gaoxuefeng/Documents/AlembicWorkspace/AlembicTest/scripts/verify-test-environment.mjs --url http://127.0.0.1:50014 --json
```

```bash
node /Users/gaoxuefeng/Documents/AlembicWorkspace/AlembicTest/scripts/probe-cold-start-process-timeline.mjs --project BiliDili --url http://127.0.0.1:50014 --data-root /Users/gaoxuefeng/.asd/workspaces/02a25032 --max-files 24 --content-max-lines 80 --skip-guard --timeout-ms 900000 --poll-ms 2500 --output /Users/gaoxuefeng/Documents/AlembicWorkspace/AlembicTest/tmp/pcvm-p14-source-ref-candidate-comparison-after-p13/timeline.json
```

## Evidence Paths

Raw evidence directory:

`/Users/gaoxuefeng/Documents/AlembicWorkspace/AlembicTest/tmp/pcvm-p14-source-ref-candidate-comparison-after-p13/`

Key files:

- `timeline.json`
- `p14-analysis-summary.json`
- `event-kind-counts.json`
- `write-boundary.json`
- `candidate-files.json`
- `health.json`
- `test-mode.json`
- `api-job.json`
- `api-events.json`
- `api-report-latest.json`
- `api-report-session.json`
- `api-reports-index.json`
- `bootstrap-report-latest-file.json`
- `bootstrap-report-session-file.json`
- `job-file.json`
- `combined.log`

Runtime source files:

- Report file: `/Users/gaoxuefeng/.asd/workspaces/02a25032/.asd/bootstrap-reports/bs_1780160941558_un5pwx.json`
- Latest report file: `/Users/gaoxuefeng/.asd/workspaces/02a25032/.asd/bootstrap-report.json`
- Job file: `/Users/gaoxuefeng/.asd/workspaces/02a25032/.asd/jobs/bootstrap_mpslv11g_36170807.json`
- Combined log: `/Users/gaoxuefeng/.asd/workspaces/02a25032/.asd/logs/combined.log`

## Route Health

`timeline.json`:

- classification: `pass`
- durationMs: `876306`
- socket connected: `true`
- socket observed matching events: `true`
- enqueue had events URL: `true`
- event kind counts observed by probe:
  - workflow `5`
  - checkpoint `1`
  - llm.input `31`
  - llm.reflection `13`
  - llm.output `31`
  - tool `1`
  - summary `4`
  - artifact `1`
- missingProducerKinds: `[]`

REST events snapshot (`api-events.json` / `event-kind-counts.json`):

- total retained events: `50`
- llm.input `19`
- llm.output `20`
- llm.reflection `5`
- tool `1`
- summary `4`
- artifact `1`

`test-mode.json`:

- enabled: `true`
- bootstrapDims: `["design-patterns"]`
- rescanDims: `["design-patterns"]`
- terminal sandbox: `enforce`, available `true`

## Old Aggregate Continuity

| Run | total | valid | invalid | invalid ratio | Verdict |
| --- | ---: | ---: | ---: | ---: | --- |
| R3 baseline | 29 | 13 | 16 | `0.5517` | baseline blocker |
| P8 after P7 | 34 | 27 | 7 | `0.2059` | improved, target missed |
| P10 after P9 | 50 | 34 | 16 | `0.32` | regressed, target missed |
| P12 after P11 | 45 | 34 | 11 | `0.2444` | improved from P10, target missed |
| P14 after P13 | 39 | 22 | 17 | `0.4359` | regressed from P12, target missed |

## P14 Split Metrics

| Metric | total | valid | invalid | invalid ratio | mode/status | Notes |
| --- | ---: | ---: | ---: | ---: | --- | --- |
| old aggregate / `sourceRefValidity` | 39 | 22 | 17 | `0.4359` | `strict` / `invalid` | Backward-compatible N11 field |
| `acceptedCandidateSourceRefValidity` | 30 | 19 | 11 | `0.3667` | `invalid` | Accepted candidates still carry entity refs |
| `producerSourceRefValidity` | 39 | 22 | 17 | `0.4359` | `strict` / `invalid` | Producer-facing R4 metric |
| `analysisReferencedFileValidity` | 31 | 27 | 4 | `0.1290` | `invalid` | Improved versus P12 `0.4091` but still not clean |

Counts:

- submitted / accepted / rejected: `28 / 10 / 18`
- accepted candidates with all-valid refs: `4/10`
- terminalToolCallCount: `0`
- noTerminalProof: `true`
- repaired / rejected / warning sourceRef counts: `0 / 0 / 0`
- attributed / unattributed invalid sourceRef counts: `17 / 0`
- sourceRefReasonCounts: `entity-not-file=17`, all other buckets `0`
- `sourceRefValidationMode=strict`
- `sourceRefValidityStatus=invalid`

Collector source breakdown:

| Origin | total | valid | invalid | invalid ratio | Notes |
| --- | ---: | ---: | ---: | ---: | --- |
| acceptedCandidate | 30 | 19 | 11 | `0.3667` | Failed target |
| rejectedCandidate | 36 | 25 | 11 | `0.3056` | Typed rejection evidence present |
| producerToolArgs | 39 | 27 | 12 | `0.3077` | Producer payload still emits entity refs |
| producerToolResult | 0 | 0 | 0 | `0` | Empty |
| contentSourceLabel | 25 | 24 | 1 | `0.04` | P13 likely improved this surface |
| analysisReferencedFiles | 31 | 27 | 4 | `0.1290` | Better than P12 but not clean |
| reportFallback | 12 | 0 | 12 | `1` | Fallback projection still records invalid entity refs |

## Accepted Invalid Refs

| Ref | Reason | Origins | Candidate | Field |
| --- | --- | --- | --- | --- |
| `VideoRepository.swift:10` | `entity-not-file` | accepted/rejected/producer/fallback | `VideoRepository: Protocol + Struct 构造器注入 Repository` | `reasoning.notes` |
| `ReplyRepository.swift:10` | `entity-not-file` | accepted/rejected/producer/fallback | `VideoRepository: Protocol + Struct 构造器注入 Repository` | `reasoning.notes` |
| `ServiceRegistry.swift` | `entity-not-file` | accepted/rejected/producer/fallback | `ServiceRegistry: 声明式 DI 容器与生命周期作用域` | `reasoning.notes` |
| `Architecture.md:106` | `entity-not-file` | accepted/rejected/producer/fallback | `ServiceRegistry: 声明式 DI 容器与生命周期作用域` | `reasoning.notes` |
| `VideoRepository.swift:48` | `entity-not-file` | accepted/rejected/producer/fallback | `ServiceRegistry: 声明式 DI 容器与生命周期作用域` | `reasoning.notes` |
| `Endpoint.swift:40` | `entity-not-file` | accepted/rejected/producer/fallback | `Endpoint: URLRequest Builder with Alamofire ParameterEncoder` | `reasoning.notes` |
| `VideoResourceRequestManager.swift:18` | `entity-not-file` | accepted/producer/fallback | `VideoResourceRequestManagerDelegate: 弱引用零锁 Delegate` | `reasoning.notes` |
| `AsyncRxBridge.swift:8` | `entity-not-file` | accepted/rejected/producer/fallback | `AsyncRxBridge: async/await → Observable 桥接层` | `reasoning.notes` |
| `SceneDelegate.swift:33` | `entity-not-file` | accepted/rejected/producer/contentSourceLabel/fallback | `AppCoordinator + SchemeRouter: 双路由 Coordinator 架构` | `content.markdown` |
| `AppCoordinator.swift:1` | `entity-not-file` | accepted/rejected/producer/fallback | `AppCoordinator + SchemeRouter: 双路由 Coordinator 架构` | `reasoning.notes` |
| `SchemeRouter.swift:22` | `entity-not-file` | accepted/rejected/producer/fallback | `AppCoordinator + SchemeRouter: 双路由 Coordinator 架构` | `reasoning.notes` |

Focus residual list:

| Focus ref | Accepted invalid residual |
| --- | --- |
| `ServiceRegistry.swift` | present: `ServiceRegistry.swift` |
| `Middleware.swift` | absent |
| `RouteMiddleware.swift` | absent |
| `AppCoordinator.swift` | present: `AppCoordinator.swift:1` |
| `AppModule.swift` | absent |

Interpretation: P13 reduced the old P12 focus list for `Middleware.swift`, `RouteMiddleware.swift`, and `AppModule.swift`, and content source-label invalid refs dropped to one. It did not make accepted candidates clean because entity-only names are still emitted through `reasoning.notes` and report fallback attribution.

## Rejected Candidate Reasons

`rejectedCandidateReasonSummary`:

- rejectedCount: `18`
- typedRejectedReasonCount: `18`
- missingTypedReasonCount: `0`
- sourceRefRelatedRejectedCount: `17`
- nonSourceRefRejectedCount: `1`
- sourceRefInvalidCount: `0`

Rejected categories include:

- `missing_required_param__description__for_knowledge_submit`: `1`
- `sourceref_strict_validation_failed_content_markdown_self_c_entity-not-file`: `4`
- `sourceref_strict_validation_failed_content_markdown_observable_c_entity-not-file__content_markdown_disposables_c_entity-not-file__content_markdown_task_c_entity-not-file`: `2`
- `sourceref_strict_validation_failed_content_markdown_sessionpool_sh_entity-not-file`: `2`
- source-label typed categories for `RouteSource`, `SchemeRouter`, `NetworkClient`, `ServiceRegistry`, `CookieManager`, and `Module`: present

Reason clarity passed: every rejected candidate has a typed reason (`missingTypedReasonCount=0`), even though accepted candidate refs still failed.

## N12 And AI8 Report Carry

N12:

- status: `linked`
- summary: `10/10 accepted candidate(s) are findable in SessionStore.`
- acceptedCandidateTitles and findableCandidateTitles match.

Report carry:

- `api-report-latest.json` carries split N11 fields.
- `api-report-session.json` carries split N11 fields.
- `bootstrap-report-latest-file.json` carries split N11 fields.
- `bootstrap-report-session-file.json` carries split N11 fields.
- Runtime JSON has no literal `AI8` field, so AlembicTest continues the P10/P12 interpretation that AI8 means scorecard/report carry.

## Token Metrics

| Stage | Calls | Input | Output | Reasoning | Cache hit | Total model tokens | Max input | Max output | Duration |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| analyze | 15 | 223347 | 11139 | 2821 | 128384 | 234486 | 22745 | 5000 | 191431ms |
| produce | 15 | 449656 | 42921 | 9360 | 274304 | 492577 | 49747 | 4627 | 681052ms |
| total | 30 | 673003 | 54060 | 12181 | 402688 | 727063 | 49747 | 5000 | 872483ms |

Report efficiency summary also records `toolCalls=63`, `duplicateToolCalls=0`, `cacheMisses=30`, `maxCompactionLevel=2`, `totalCompactedItems=12`, `nudgeCount=12`, `replanCount=2`.

## Boundary

Protected source write proof:

- BiliDili git status: clean.
- Alembic git status: clean.
- AlembicAgent git status: clean.
- No `BiliDili/.asd`.
- No `BiliDili/Alembic`.
- Product source was not modified by this test.

AlembicTest status:

- Pre-existing untracked reports from R3/P8/P10/P12 remain.
- This P14 report and raw evidence are local AlembicTest test artifacts.

Ghost dataRoot projection observation:

- Data root: `/Users/gaoxuefeng/.asd/workspaces/02a25032`
- `Alembic/candidates/design-patterns/*.md`: `10` files
- `Alembic/wiki/*`: `8` files
- `Alembic/skills/*`: `0` files

This is not a BiliDili/product source write. It remains a separate no-wiki/no-export boundary for total-control decision, as in P12.

## Failure Attribution

P14 route health and runtime linkage passed:

- Fresh AlembicAgent P13 dist was built before the run.
- The new job started after the fresh dist timestamp.
- Test mode constrained bootstrap/rescan dims to `design-patterns`.
- Real DeepSeek calls occurred for analyze and produce stages.
- N11 split fields, rejected reason summary, and N12 linked evidence reached the persisted report.

P14 sourceRef targets failed:

- Old aggregate regressed from P12 `0.2444` to P14 `0.4359`.
- Accepted candidate split regressed from P12 `0.2326` to P14 `0.3667`.
- Producer split regressed from P12 `0.2444` to P14 `0.4359`.
- `contentSourceLabel` improved to `0.04`, so P13 likely helped that specific field.
- Remaining accepted invalid refs are mainly `reasoning.notes` and report fallback entity refs; first fix likely belongs to AlembicAgent producer/knowledge validation coverage for all accepted candidate sourceRef-bearing fields, not to Test environment or Dashboard.

## Cannot Conclude

This run cannot prove:

- R4 sourceRef target pass.
- R5/two/full dimensions behavior.
- Alembic self-hosting behavior.
- Dashboard manual UX acceptance.
- delivery/wiki/project-skill export correctness.
- Future model determinism.

## Next Recommendation

Do not open R5 from P14. Total control should treat P14 as a live-AI regression/failure after P13: route and observability are sound, but accepted/producer sourceRef metrics miss the target. The next repair should focus on accepted candidate non-content-label surfaces (`reasoning.notes` / report fallback attribution) and whether entity-only refs should be canonicalized, rejected before accepted candidate creation, or excluded from accepted candidate validity only with a clear contract.
