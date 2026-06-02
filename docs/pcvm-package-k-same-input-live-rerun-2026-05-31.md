# PCVM Package K Same-Input Live Rerun Raw Evidence

## Scope

- Window: AlembicTest real validation only.
- Target: BiliDili / design-patterns / one-dimension / no-delivery.
- Config: maxFiles=24, contentMaxLines=80, skipGuard=true, ALEMBIC_TEST_MODE=1.
- Provider/model: deepseek/deepseek-v4-pro.
- SourceRef line: not exercised and not judged.
- Product source edits: none performed by AlembicTest.

## IDs And Paths

| Field | Value |
| --- | --- |
| job id | `bootstrap_mptk1wmf_acf5ee00` |
| session id | `bs_1780218369370_ypny01` |
| Dashboard | `http://127.0.0.1:56824/jobs?job=bootstrap_mptk1wmf_acf5ee00` |
| raw dir | `/Users/gaoxuefeng/Documents/AlembicWorkspace/AlembicTest/tmp/pcvm-package-k-same-input-live-rerun-2026-05-31` |
| report | `/Users/gaoxuefeng/.asd/workspaces/02a25032/.asd/bootstrap-reports/bs_1780218369370_ypny01.json` |
| timeline | `/Users/gaoxuefeng/Documents/AlembicWorkspace/AlembicTest/tmp/pcvm-package-k-same-input-live-rerun-2026-05-31/timeline.json` |
| API events | `/Users/gaoxuefeng/Documents/AlembicWorkspace/AlembicTest/tmp/pcvm-package-k-same-input-live-rerun-2026-05-31/api-events.json` |
| per-round matrix | `/Users/gaoxuefeng/Documents/AlembicWorkspace/AlembicTest/tmp/pcvm-package-k-same-input-live-rerun-2026-05-31/per-round-content-matrix.json` |
| fresh proof | `/Users/gaoxuefeng/Documents/AlembicWorkspace/AlembicTest/tmp/pcvm-package-k-same-input-live-rerun-2026-05-31/fresh-build-dist-proof.json` |

## Fresh Build / Dist Proof

- AlembicAgent commit: `e7e4d146472185ffa76a7701c0570e4b77d8ad85`
- Alembic commit: `70532e7bc5c959630234eda6c85eea1c7fe7438a`
- Runtime linkage: Alembic `node_modules/@alembic/agent` resolves to `/Users/gaoxuefeng/Documents/AlembicWorkspace/AlembicAgent`.
- Build commands: AlembicAgent `npm run build` passed; Alembic `npm run build` passed; restart `dev:link` rebuilt AlembicAgent/Alembic/Dashboard and started daemon.
- Dist markers checked: `promptRef: initial-user-message`, producer `inputProjection`, `targetMemoryFindingCount`, broad 5-6 finding prompt, producer completion detection, provider input budget compaction.

## Stage Totals

| Stage | input | output | reasoning | cacheHit | iterations | tool calls |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| analyze | 174988 | 12214 | 4923 | 82176 | 16 | 38 |
| producer | 85823 | 13530 | 2893 | 44288 | 9 | 14 |
| route total | 260811 | 25744 | 7816 | 126464 | - | 52 |

Route total model tokens: **294371**.

## Recipe Counts And Unit Metrics

| Metric | Value |
| --- | ---: |
| submitted | 6 |
| accepted | 6 |
| rejected | 0 |
| route total model / accepted | 49061.83 |
| route total model / submitted | 49061.83 |
| stored payload avg approx tokens | 1997.4 |

## Package E / I / K Comparison

| Package | route total model | accepted | submitted | rejected | total model / accepted | analyze input | producer input | invalid-no-evidence |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| E | 567173 | 13 | 14 | 1 | 43628.69 | 348915 | 171785 | 0 |
| I | 299497 | 4 | 4 | 0 | 74874.25 | 154821 | 118548 | 0 |
| K | 294371 | 6 | 6 | 0 | 49061.83 | 174988 | 85823 | 0 |

## Per-Round Matrix Highlights

- Peak analyze input by model tokens: iteration 12, input 21770.
- Peak analyze input by original chars: iteration 12, chars 64158.
- First note_finding round: stage analyze, phase EXPLORE, iteration 8.
- First RECORD phase round: stage analyze, iteration 15.
- Final summarize round: analyze iteration 16, retained chars 6000.
- Producer complete/final round: producer iteration 9, candidate delta 0.
- Full matrix: `/Users/gaoxuefeng/Documents/AlembicWorkspace/AlembicTest/tmp/pcvm-package-k-same-input-live-rerun-2026-05-31/per-round-content-matrix.json`.

## Pass Gate Reading

| Check | Result |
| --- | --- |
| totalModelPerAcceptedLowerThanPackageI | true |
| totalModelPerAcceptedLowerThanPackageE | false |
| acceptedRecipeCountNoPackageICollapse | true |
| acceptedRecipeCountRecoveredToPackageE | false |
| analyzeInputLowerThanPackageE | true |
| routeInputLowerThanPackageE | true |
| producerInputNoRegressionVsPackageI | true |
| pcvAnalyzeGroundingInvalidNoEvidenceZero | true |
| qualityNotLowerThanPackageI | true |

Scoped verdict: **partial(scope=live-ai-local)**.

Interpretation: Package K improves route input, producer input, accepted count, quality and invalid-no-evidence versus Package I, but it does not restore Package E accepted count or Package E unit economics. This is raw AlembicTest evidence for PCVM; it is not final PCVM acceptance.

## Source / Delivery Boundary

- BiliDili git status: clean.
- BiliDili .asd exists: false.
- BiliDili Alembic folder exists: false.
- Report skills: 0; candidate files are under Ghost dataRoot only.

## Conclusions

Success proves: On the same BiliDili/design-patterns no-delivery live route, current Package J runtime reduces route input below Package E and Package I, improves accepted count from Package I 4 to 6, keeps pcvAnalyzeGroundingInvalidNoEvidence at 0, and restores analyze QualityGate/memoryFinding evidence to 100/6.

Failure/partial proves: It does not restore Package E accepted count or Package E totalModel-per-accepted unit economics; K totalModel/accepted improves versus Package I but remains worse than Package E.

Cannot prove: This does not prove final PCVM acceptance, SourceRef behavior, full-dimension behavior, delivery/wiki/project-skill export behavior, or Dashboard manual UX correctness.
