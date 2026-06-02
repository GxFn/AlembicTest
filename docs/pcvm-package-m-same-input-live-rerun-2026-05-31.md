# PCVM Package M Same-Input Live Rerun Raw Evidence

## Scope

- Window: AlembicTest real validation only.
- Target: BiliDili / design-patterns / one-dimension / no-delivery.
- Config: maxFiles=24, contentMaxLines=80, skipGuard=true, ALEMBIC_TEST_MODE=1.
- Provider/model: deepseek/deepseek-v4-pro.
- SourceRef line: stopped; not exercised and not judged.
- Product source edits: none performed by AlembicTest.
- Final PCVM verdict: not provided here; this report only returns raw live-ai-local evidence.

## IDs And Paths

| Field | Value |
| --- | --- |
| job id | `bootstrap_mptmg4ep_8a6f5854` |
| session id | `bs_1780222392585_qizud3` |
| Dashboard | `http://127.0.0.1:61049/jobs?job=bootstrap_mptmg4ep_8a6f5854` |
| raw dir | `/Users/gaoxuefeng/Documents/AlembicWorkspace/AlembicTest/tmp/pcvm-package-m-same-input-live-rerun-2026-05-31` |
| report | `/Users/gaoxuefeng/.asd/workspaces/02a25032/.asd/bootstrap-reports/bs_1780222392585_qizud3.json` |
| persisted report copy | `/Users/gaoxuefeng/Documents/AlembicWorkspace/AlembicTest/tmp/pcvm-package-m-same-input-live-rerun-2026-05-31/persisted-bootstrap-report-session.json` |
| timeline | `/Users/gaoxuefeng/Documents/AlembicWorkspace/AlembicTest/tmp/pcvm-package-m-same-input-live-rerun-2026-05-31/timeline.json` |
| API events | `/Users/gaoxuefeng/Documents/AlembicWorkspace/AlembicTest/tmp/pcvm-package-m-same-input-live-rerun-2026-05-31/api-events.json` |
| per-round matrix | `/Users/gaoxuefeng/Documents/AlembicWorkspace/AlembicTest/tmp/pcvm-package-m-same-input-live-rerun-2026-05-31/per-round-content-matrix.json` |
| round highlights | `/Users/gaoxuefeng/Documents/AlembicWorkspace/AlembicTest/tmp/pcvm-package-m-same-input-live-rerun-2026-05-31/round-highlights.json` |
| raw summary | `/Users/gaoxuefeng/Documents/AlembicWorkspace/AlembicTest/tmp/pcvm-package-m-same-input-live-rerun-2026-05-31/package-m-raw-summary.json` |
| stored payload summary | `/Users/gaoxuefeng/Documents/AlembicWorkspace/AlembicTest/tmp/pcvm-package-m-same-input-live-rerun-2026-05-31/stored-recipe-payload-summary.json` |
| fresh proof | `/Users/gaoxuefeng/Documents/AlembicWorkspace/AlembicTest/tmp/pcvm-package-m-same-input-live-rerun-2026-05-31/fresh-build-dist-proof.json` |
| source boundary proof | `/Users/gaoxuefeng/Documents/AlembicWorkspace/AlembicTest/tmp/pcvm-package-m-same-input-live-rerun-2026-05-31/source-write-boundary.json` |
| daemon log copy | `/Users/gaoxuefeng/Documents/AlembicWorkspace/AlembicTest/tmp/pcvm-package-m-same-input-live-rerun-2026-05-31/combined.log` |
| job artifacts copy | `/Users/gaoxuefeng/Documents/AlembicWorkspace/AlembicTest/tmp/pcvm-package-m-same-input-live-rerun-2026-05-31/job-artifacts/` |
| Ghost candidates copy | `/Users/gaoxuefeng/Documents/AlembicWorkspace/AlembicTest/tmp/pcvm-package-m-same-input-live-rerun-2026-05-31/candidates-design-patterns/` |

## Fresh Build / Dist Proof

- Runtime fresh-proof AlembicAgent commit: `e7e4d146472185ffa76a7701c0570e4b77d8ad85`
- Runtime fresh-proof Alembic commit: `67a8b3f9f10b1a4e9346f28d50d9843ab5322f55`
- AlembicTest commit: `acfb8a84fd14537eeceb9deb25bd0d2b43cd8f33`
- BiliDili commit: `5b10fd4c72ccc8aeda2e9b84289748b7d883d804`
- Build commands: `npm --prefix ../AlembicAgent run build` passed; `npm --prefix ../Alembic run build` passed; restart route also ran dev-link/build before daemon ready.
- Runtime linkage: Alembic `node_modules/@alembic/agent` resolves to `/Users/gaoxuefeng/Documents/AlembicWorkspace/AlembicAgent`.
- Dist marker hits:
  - `AlembicAgent/dist/agent/runtime/LLMInputAssembly.js`: `Structured findings are the only candidate obligations`
  - `AlembicAgent/dist/agent/prompts/insight-analyst.js`: `最终 Markdown 报告只能围绕已记录的 note_finding 展开`
  - `AlembicAgent/dist/agent/prompts/insight-producer.js`: `最终 Markdown 摘要只作背景`
  - `AlembicAgent/dist/agent/context/ExplorationTracker.js`: `不要从最终 Markdown 摘要里新增候选主题`

## Stage Totals

| Stage | input | output | reasoning | cacheHit | total model | iterations | tool calls |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| analyze | 175870 | 11826 | 4058 | 76800 | 191754 | 14 | 25 |
| produce | 103057 | 10457 | 2499 | 61056 | 116013 | 10 | 12 |
| route total | 278927 | 22283 | 6557 | 137856 | 307767 | - | 37 |

## Recipe Counts And Payload Metrics

| Metric | Value |
| --- | ---: |
| submitted | 5 |
| accepted | 5 |
| rejected | 0 |
| route total model / accepted | 61553.40 |
| route total model / submitted | 61553.40 |
| stored payload total approx tokens | 10636 |
| stored payload avg approx tokens | 2127.2 |
| model-to-payload amplification | 28.94x |
| pcvAnalyzeGroundingInvalidNoEvidence | 0 |

Accepted Recipe titles:

- ServiceRegistry 线程安全 DI 容器 + 全局单例复合模式
- MetricsCollector Delegate 模式 + OSAllocatedUnfairLock 线程安全
- AppCoordinator 导航协调器模式 + SchemeRouter 路由驱动
- Repository 协议依赖反转模式
- Input/Output 结构体 MVVM 变体模式

## Package E / I / K / M Comparison

| Package | job id | input | output | reasoning | cacheHit | total model | accepted | submitted | rejected | total model / accepted |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| E | `bootstrap_mptfvl61_f75bdcb6` | 520700 | 38235 | 8238 | 302336 | 567173 | 13 | 14 | 1 | 43628.69 |
| I | `bootstrap_mptide7s_a086f60e` | 273369 | 19573 | 6555 | 141312 | 299497 | 4 | 4 | 0 | 74874.25 |
| K | `bootstrap_mptk1wmf_acf5ee00` | 260811 | 25744 | 7816 | 126464 | 294371 | 6 | 6 | 0 | 49061.83 |
| M | `bootstrap_mptmg4ep_8a6f5854` | 278927 | 22283 | 6557 | 137856 | 307767 | 5 | 5 | 0 | 61553.40 |

## Per-Round Behavior

- Analyzer structured findings: 5; accepted candidates: 5. Candidate obligations aligned as 5 structured findings -> 5 accepted candidates.
- Producer submission iterations: 3, 4, 5, 6, 7.
- Producer iteration 8 used `meta` self-check after all 5 submissions: `所有 5 个 Analyst 结构化发现均已提交。执行自检确认无遗漏。`
- Producer iteration 9 emitted terminal completion text with no tool/function calls and reported 5 submitted / 0 missing.
- After iteration 9, event sequence 63 emitted a continue nudge: `请继续调用 knowledge 提交结构化发现对应的知识候选。候选义务只来自 Analyst note_finding 结构化发现；不要从最终 Markdown 摘要里新增候选主题。`
- Producer iteration 10 emitted an extra no-tool final-status message; no knowledge/evidence/code tool was called after the terminal completion report.

Reading:

- Package M produced live-ai-local evidence.
- Package M does not show Package-K-style post-completion evidence/tool-check round.
- Candidate obligations appear constrained to structured `note_finding`; no extra candidate from Analyzer final Markdown was observed.
- Direct termination is not fully proven because the first terminal completion report still received a continue nudge and one extra no-tool final-status round.

## Source / Delivery Boundary

- BiliDili git status: clean.
- BiliDili forbidden write surfaces: no `.asd/` or `Alembic/` folder found at maxdepth 2.
- Source writes observed: false.
- Delivery writes observed: false.
- Candidates were written only under Ghost dataRoot `/Users/gaoxuefeng/.asd/workspaces/02a25032/Alembic/candidates/design-patterns`.
- Source-boundary snapshot recorded BiliDili and Alembic clean; fresh-proof JSON captured AlembicAgent Package L source/unit work at build time.
- Final post-report check observed BiliDili, Alembic, and AlembicAgent `git status --short` empty. Current post-run HEADs may have moved from runtime anchors, so PCVM should use `fresh-build-dist-proof.json` as the Package M runtime linkage proof.
- AlembicTest has ongoing report/script changes, including this Package M report.

## Scoped Conclusion

Scoped verdict: **partial(scope=live-ai-local)**.

Success evidence: Package M ran the same BiliDili/design-patterns no-delivery live route with fresh AlembicAgent/Alembic runtime linkage, generated raw report/events/matrix artifacts, submitted and accepted 5 Recipes, kept `pcvAnalyzeGroundingInvalidNoEvidence=0`, constrained Producer obligations to structured findings, and eliminated Package-K-style completion-afterward evidence/tool checking.

Partial/failure evidence: Package M does not prove direct termination after the first terminal completion-like Producer output. The route still produced a continue nudge and one extra no-tool final-status LLM round after the iteration 9 terminal completion report. Token/useful-output also regressed versus Package K on total model tokens, accepted count, and total model / accepted Recipe.

Cannot prove: This report does not prove final PCVM acceptance, SourceRef behavior, full-dimension behavior, delivery/wiki/project-skill export behavior, or Dashboard manual UX correctness.
