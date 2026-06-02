# PCVM P8 R4 SourceRef Candidate Comparison

Date: `2026-05-30`
Window: `AlembicTest`
Verdict: `partial`

## Scope

This run validates only the R4 SourceRef Candidate Comparison route after P7 source changes.

| Field | Value |
| --- | --- |
| Target project | `BiliDili` |
| Dimension | `design-patterns` |
| Provider / model class | `deepseek / deepseek-v4-pro` |
| Mode | `ALEMBIC_TEST_MODE=1` |
| Bootstrap / rescan dims | `design-patterns` |
| maxFiles / contentMaxLines / skipGuard | `24` / `80` / `true` |
| Delivery | no delivery / no project-skill export |
| Dashboard acceptance | not used |
| Job / session | `bootstrap_mpsfdbm6_fbdd6e7e` / `bs_1780150037790_l1xi02` |
| Dashboard URL | `http://127.0.0.1:60009/jobs?job=bootstrap_mpsfdbm6_fbdd6e7e` |

## Source Anchors

| Repository | Commit |
| --- | --- |
| AlembicAgent | `e71e61eae3f501ff1609e7d1d3c00dee77b92856` |
| Alembic | `02987aa6f6497be574efe7bbf963a7e7ab1fbc56` |
| BiliDili | `5b10fd4c72ccc8aeda2e9b84289748b7d883d804` |

Fresh runtime proof:

- `npm --prefix ../AlembicAgent run build` was executed by `AlembicTest/scripts/restart-alembic.mjs` through `devLink`.
- `AlembicAgent/dist` contains `sourceRefPolicy`, `canonicalSourceRefIndex`, `_strictSourceRefs`, and `sourceRefsMustComeFrom`.
- `Alembic/dist` contains `sourceRefValidation`, `repairedSourceRefs`, `rejectedSourceRefs`, `warningSourceRefs`, `validationPolicy`, and finalizer/report carry fields.

Raw proof: `AlembicTest/tmp/pcvm-p8-source-ref-candidate-comparison/dist-proof.txt`

## Evidence Paths

| Evidence | Path |
| --- | --- |
| Environment verification | `AlembicTest/tmp/pcvm-p8-source-ref-candidate-comparison/verify-env.json` |
| Health | `AlembicTest/tmp/pcvm-p8-source-ref-candidate-comparison/health.json` |
| Test mode proof | `AlembicTest/tmp/pcvm-p8-source-ref-candidate-comparison/test-mode.json` |
| Timeline probe | `AlembicTest/tmp/pcvm-p8-source-ref-candidate-comparison/timeline.json` |
| Job API snapshot | `AlembicTest/tmp/pcvm-p8-source-ref-candidate-comparison/job-full.json` |
| Events API snapshot | `AlembicTest/tmp/pcvm-p8-source-ref-candidate-comparison/events-full.json` |
| Report API snapshot | `AlembicTest/tmp/pcvm-p8-source-ref-candidate-comparison/report-session.json` |
| Job file | `AlembicTest/tmp/pcvm-p8-source-ref-candidate-comparison/job-file.json` |
| Bootstrap report file | `AlembicTest/tmp/pcvm-p8-source-ref-candidate-comparison/bootstrap-report-file.json` |
| Stage token summary | `AlembicTest/tmp/pcvm-p8-source-ref-candidate-comparison/stage-token-summary.json` |
| Candidate direct sourceRef validation | `AlembicTest/tmp/pcvm-p8-source-ref-candidate-comparison/candidate-source-ref-direct-validation.json` |
| Log tail | `AlembicTest/tmp/pcvm-p8-source-ref-candidate-comparison/combined-tail.log` |
| Git status before / after | `AlembicTest/tmp/pcvm-p8-source-ref-candidate-comparison/git-status-before.txt`, `git-status-after.txt` |

## Commands

```bash
env ALEMBIC_TEST_MODE=1 ALEMBIC_TEST_BOOTSTRAP_DIMS=design-patterns ALEMBIC_TEST_RESCAN_DIMS=design-patterns \
  node /Users/gaoxuefeng/Documents/AlembicWorkspace/AlembicTest/scripts/restart-alembic.mjs \
  --project BiliDili --json --wait 20000 --monitor-once
```

The first restart hit the known preclean classification issue after killing the old daemon. This was treated as test-environment classification, not product failure. The same configuration then started cleanly with `--no-preclean`:

```bash
env ALEMBIC_TEST_MODE=1 ALEMBIC_TEST_BOOTSTRAP_DIMS=design-patterns ALEMBIC_TEST_RESCAN_DIMS=design-patterns \
  node /Users/gaoxuefeng/Documents/AlembicWorkspace/AlembicTest/scripts/restart-alembic.mjs \
  --project BiliDili --json --wait 20000 --monitor-once --no-preclean
```

P8 probe:

```bash
node /Users/gaoxuefeng/Documents/AlembicWorkspace/AlembicTest/scripts/probe-cold-start-process-timeline.mjs \
  --project BiliDili \
  --url http://127.0.0.1:60009 \
  --data-root /Users/gaoxuefeng/.asd/workspaces/02a25032 \
  --max-files 24 \
  --content-max-lines 80 \
  --skip-guard \
  --timeout-ms 900000 \
  --poll-ms 2500 \
  --output /Users/gaoxuefeng/Documents/AlembicWorkspace/AlembicTest/tmp/pcvm-p8-source-ref-candidate-comparison/timeline.json
```

Probe result: `ok=true`, `classification=pass`, duration `503169ms`.

## Boundary Proof

- Test mode was enabled and limited to `design-patterns`.
- API request parameters were `maxFiles=24`, `contentMaxLines=80`, `skipGuard=true`.
- Events produced `workflow`, `checkpoint`, `llm.input`, `llm.output`, `llm.reflection`, `tool`, `summary`, and `artifact`.
- No BiliDili source writes: BiliDili git status was clean before and after.
- No product source writes: Alembic, AlembicAgent, AlembicCore, AlembicDashboard, and AlembicPlugin git status were clean after the run.
- No delivery writes were used for the verdict. Report totals show `skills=0`; log contains `Project delivery retired for Alembic main package` and `Auto Wiki generation: 0 pages`.
- Secret values were not printed.

## Before / After SourceRef Table

| Run | total | valid | invalid | invalid ratio | reason taxonomy |
| --- | ---: | ---: | ---: | ---: | --- |
| R3 baseline | 29 | 13 | 16 | `0.5517` | wrong extension; missing repo-relative prefix; package/module mismatch; entity/file confusion |
| P8 after P7 | 34 | 27 | 7 | `0.2059` | `entity-not-file: 7` |

P8 invalid refs:

| Ref | Reason | Source |
| --- | --- | --- |
| `RouteMiddleware.swift` | `entity-not-file` | `report-fallback` |
| `MiddlewareInterceptor.swift` | `entity-not-file` | `report-fallback` |
| `AppCoordinator.swift` | `entity-not-file` | `report-fallback` |
| `SessionPool.swift` | `entity-not-file` | `report-fallback` |
| `AccountManager.swift` | `entity-not-file` | `report-fallback` |
| `AccountModule.swift` | `entity-not-file` | `report-fallback` |
| `AppModule.swift` | `entity-not-file` | `report-fallback` |

AlembicTest reading:

- SourceRef validity improved from `0.5517` invalid ratio to `0.2059`, a real improvement.
- The target `invalidSourceRefRatio <= 0.10` was not met.
- The remaining failures are shorter entity/file basenames, not the broader R3 mix of wrong extension, missing prefix, and package mismatch.
- N11 still uses `validationMode=report-fallback`, and `validationPolicy=null`; this means the final report sees the problem, but P8 does not prove strict producer-time sourceRef validation is fully carrying through the report.

## Candidate Counts

| Metric | Value |
| --- | --- |
| Producer submitted count | `8` |
| Accepted count | `7` |
| Rejected count | `1` |
| Candidate files persisted | `7` |
| Accepted candidates findable in SessionStore | `7/7` |
| Producer terminal tool calls | `0` |
| Producer tool calls | `19` (`code=10`, `knowledge=8`, `meta=1`) |

Accepted candidate titles:

1. `Singleton：static let shared + private init() 统一规范`
2. `RouteMiddleware 洋葱模型中间件链`
3. `AppCoordinator 协调器模式：导航集中化 + TabBarLoginGuard 登录拦截`
4. `SessionPool 工厂模式：三层 API 唯一会话工厂`
5. `AccountManager 观察者模式：NotificationCenter 跨模块广播 + @Published 局部绑定`
6. `ServiceProtocols 策略模式：协议抽象 + 闭包注入实现依赖反转`
7. `AppModule 模块注册模式：声明式两阶段生命周期 + 优先级排序`

Direct candidate markdown validation found `5/7` accepted candidates with all directly extractable `.swift` refs resolving to real repo-relative paths. This is a secondary AlembicTest heuristic because N11 invalid refs have `candidates=[]` and cannot currently map invalid report-fallback refs back to candidate ids.

| Candidate | Direct ref result |
| --- | --- |
| Singleton | all valid |
| RouteMiddleware | invalid basename `RouteMiddleware.swift` |
| AppCoordinator | all valid |
| SessionPool | invalid basename `SessionPool.swift` |
| AccountManager | all valid |
| ServiceProtocols | all valid |
| AppModule | all valid |

Target result:

- `invalidSourceRefRatio <= 0.10`: not reached (`0.2059`).
- `accepted all-valid candidates >= 8/10`: not reached. Official accepted count is `7`; direct all-valid heuristic is `5/7`.
- `producer terminal tool calls = 0`: reached.

## Repaired / Rejected / Warning Taxonomy Carry

| Field | P8 value |
| --- | --- |
| `repairedSourceRefCount` | `0` |
| `repairedSourceRefs` | `[]` |
| `rejectedSourceRefCount` | `0` |
| `rejectedSourceRefs` | `[]` |
| `warningSourceRefCount` | `0` |
| `warningSourceRefs` | `[]` |
| `sourceRefValidationMode` | `report-fallback` |
| `sourceRefValidationPolicy` | `null` |
| `sourceRefValidityStatus` | `invalid` |
| `missingLinkReasons` | `producer_source_refs_invalid` |

AlembicTest reading:

- The P7 report-carry fields exist in runtime/report evidence.
- This run did not demonstrate repaired/rejected/warning taxonomy being populated for the rejected producer submission.
- The rejected reason is not clear enough in the report-level N11 evidence: `rejectedCount=1` is visible, but rejected sourceRef details are empty and the remaining invalid refs are all report-fallback entries with no candidate mapping.

## N11 / N12 / AI8 Carry

| Node | Result |
| --- | --- |
| N11 | `sourceRefValidityStatus=invalid`; `blocked-by-observability-gap`; `producer_source_refs_invalid`; total `34`, valid `27`, invalid `7`, ratio `0.2059` |
| N12 | `linked`; `7/7` accepted candidates findable; `failureDetailsPersisted=true`; `sessionStoreSnapshotAvailable=true` |
| AI8/report observability | natural report evidence present; scorecard summary `dimensionCount=1`, `nodeCount=5`, `linkedNodes=3`, `blockedNodes=1` |

## Stage Token Usage

`totalModelTokens` here means `input + output + reasoning`.

| Stage | LLM calls | Input | Output | Reasoning | Cache-hit | totalModelTokens | Max input/call | Max output/call | Duration |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| analyze | 12 | 170549 | 10201 | 3171 | 83968 | 183921 | 21744 | 4497 | 198743ms |
| produce | 16 | 338098 | 16635 | 4606 | 215552 | 359339 | 28731 | 1714 | 300485ms |

Included stage ids: `analyze`, `quality_gate`, `produce`, `rejection_gate`. Quality gate and rejection gate did not make separate LLM calls in this report.

Total no-delivery route usage:

| Provider/model | Input | Output | Reasoning | Cache-hit | totalModelTokens |
| --- | ---: | ---: | ---: | ---: | ---: |
| `deepseek/deepseek-v4-pro` | 508647 | 26836 | 7777 | 299520 | 543260 |

## Original Observations

- New job/session/report evidence exists and is internally consistent.
- The route stayed one-dimensional and no-delivery.
- P8 produced fewer accepted candidates than R3: `7` accepted vs R3 `10`.
- SourceRef invalid ratio improved substantially but remains over target.
- Remaining invalid refs are basename/entity refs surfaced by report fallback.
- N12 persistence did not regress for accepted candidates.
- N11 remains blocked by sourceRef validity.

## AlembicTest Judgment

Verdict: `partial`.

P7 improved the sourceRef producer/validation loop, but not enough to pass R4 targets. The strongest improvement is invalid ratio `0.5517 -> 0.2059`; the strongest remaining gap is that invalid basenames still survive into report-fallback N11 and are not represented as repaired/rejected/warning sourceRef taxonomy tied to candidate ids.

This should not be called a full product failure of P7, because the fresh dist was verified and the live route shows measurable improvement. It should also not be called pass, because two target gates are clearly missed: ratio `<=0.10` and all-valid accepted candidates `>=8/10`.

## Needs AlembicWorkspace Judgment

- Decide whether the next repair belongs first to AlembicAgent strict producer rejection/repair, Alembic report projection, or both.
- Decide whether `candidate-level invalid/ref repair mapping` is required for R4 pass. P8 evidence suggests it is necessary for actionable rejected reason clarity.
- Decide whether the accepted candidate target should remain `>=8/10` when the stricter sourceRef contract may intentionally reject more candidates, or whether the next target should be `>=8 accepted attempts with rejected invalid refs explainable`.

## Residual Risk

- The N11 invalid refs have `candidates=[]`, so candidate-level attribution cannot be proven from report evidence alone.
- The rejected producer submission has no clear rejected sourceRef reason in final report carry.
- P8 isolated sourceRef delta only; it intentionally does not validate full dimensions, delivery, Dashboard UI, project skill export, or Alembic self-hosting.
