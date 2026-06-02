# PCVM Package I Same-Input Live Rerun

Run: `pcv-20260530-1515-alembic-cold-start`
Window: `AlembicTest`
Date: `2026-05-31`
Scope: Package I raw evidence only; PCVM owns final verdict.

## Boundary

- Target project: `BiliDili`
- Dimension: `design-patterns`
- Route: one-dimension / no-delivery / no source writes
- Fixed params: `maxFiles=24`, `contentMaxLines=80`, `skipGuard=true`
- Provider/model: `deepseek/deepseek-v4-pro`
- Test mode: enabled, `bootstrapDims=["design-patterns"]`
- SourceRef line: not used as an optimization target or verdict metric.

Authorization: current user request explicitly assigned Package I live rerun and allowed sending BiliDili content to the configured external provider. BiliDili is treated as the configured open-source real test project; secrets were not printed.

## Fresh Build / Dist Proof

- AlembicAgent commit: `e7e4d146472185ffa76a7701c0570e4b77d8ad85`
- Alembic commit: `70532e7bc5c959630234eda6c85eea1c7fe7438a`
- AlembicTest commit: `acfb8a84fd14537eeceb9deb25bd0d2b43cd8f33`
- BiliDili commit: `5b10fd4c72ccc8aeda2e9b84289748b7d883d804`
- Build command: `npm --prefix ../AlembicAgent run build`
- Runtime refresh command: `restart-alembic.mjs --project BiliDili --json --wait 30000 --no-preclean`, with `dev:link` rebuilding AlembicCore, AlembicAgent, Alembic and Dashboard.
- Runtime linkage: `../Alembic/node_modules/@alembic/agent` realpath points to `../AlembicAgent`.
- Dist hits: `inputSizeEstimate`, `inputProjection`, `compactForProviderInputBudget`, `providerHistoryEstimatedTokens`, and `Analyst 分析摘要`.

Raw proof: `/Users/gaoxuefeng/Documents/AlembicWorkspace/AlembicTest/tmp/pcvm-package-i-same-input-live-rerun-2026-05-31/fresh-build-dist-proof.json`

## Raw Evidence

- Raw dir: `/Users/gaoxuefeng/Documents/AlembicWorkspace/AlembicTest/tmp/pcvm-package-i-same-input-live-rerun-2026-05-31`
- Job id: `bootstrap_mptide7s_a086f60e`
- Session id: `bs_1780215546262_fmbz5b`
- Dashboard URL: `http://127.0.0.1:54618/jobs?job=bootstrap_mptide7s_a086f60e`
- Timeline: `/Users/gaoxuefeng/Documents/AlembicWorkspace/AlembicTest/tmp/pcvm-package-i-same-input-live-rerun-2026-05-31/timeline.json`
- Raw report API snapshot: `/Users/gaoxuefeng/Documents/AlembicWorkspace/AlembicTest/tmp/pcvm-package-i-same-input-live-rerun-2026-05-31/api-report-latest.json`
- Persisted report: `/Users/gaoxuefeng/.asd/workspaces/02a25032/.asd/bootstrap-reports/bs_1780215546262_fmbz5b.json`
- Job file: `/Users/gaoxuefeng/.asd/workspaces/02a25032/.asd/jobs/bootstrap_mptide7s_a086f60e.json`
- Log tail: `/Users/gaoxuefeng/Documents/AlembicWorkspace/AlembicTest/tmp/pcvm-package-i-same-input-live-rerun-2026-05-31/combined-log-tail.txt`
- Raw summary: `/Users/gaoxuefeng/Documents/AlembicWorkspace/AlembicTest/tmp/pcvm-package-i-same-input-live-rerun-2026-05-31/package-i-raw-summary.json`

Probe result: `ok=true`, `classification=pass`, event kinds include `llm.input`, `llm.output`, `llm.reflection`, `tool`, `summary`, and `artifact`.

## Package E vs Package I

| Metric | Package E | Package I | Delta |
| --- | ---: | ---: | ---: |
| analyze input tokens | 348915 | 154821 | -194094 (-55.63%) |
| analyze output tokens | 13242 | 9342 | -3900 (-29.45%) |
| producer input tokens | 171785 | 118548 | -53237 (-30.99%) |
| producer output tokens | 24993 | 10231 | -14762 (-59.06%) |
| route input tokens | 520700 | 273369 | -247331 (-47.50%) |
| route output tokens | 38235 | 19573 | -18662 (-48.81%) |
| route reasoning tokens | 8238 | 6555 | -1683 (-20.43%) |
| route total model tokens | 567173 | 299497 | -267676 (-47.19%) |
| accepted candidates | 13 | 4 | -9 (-69.23%) |
| submitted candidates | 14 | 4 | -10 (-71.43%) |
| rejected candidates | 1 | 0 | -1 |
| quality score | 100 | 97 | -3 |
| `pcvAnalyzeGroundingInvalidNoEvidence` | 0 | 0 | 0 |

Normalized:

| Metric | Package E | Package I | Delta |
| --- | ---: | ---: | ---: |
| route input / accepted Recipe | 40053.85 | 68342.25 | +28288.40 (+70.63%) |
| route total model / accepted Recipe | 43628.69 | 74874.25 | +31245.56 (+71.62%) |
| stored payload avg approx tokens / accepted Recipe | 1008.8 | 883.7 | -125.1 |
| model-to-payload amplification | 43.25x | 84.74x | worse |

## Runtime Signals

Package I live events carry Package F/G/H evidence:

- `llm.input` metadata includes `inputSizeEstimate`.
- `llm.input` metadata includes `inputProjection`; one observed record input projected from 34 messages to 8 messages.
- Producer stage used reduced raw input versus Package E.
- Producer accepted output count was materially lower than Package E.

## Scoped AlembicTest Verdict

`partial(scope=live-ai-local, package=I, reason=route-token-total-improved-but-unit-cost-and-accepted-count-regressed)`

What improved:

- Route total tokens and every raw stage token bucket improved versus Package E.
- `pcvAnalyzeGroundingInvalidNoEvidence` stayed `0`.
- The job completed without timeout or daemon failure.

What failed or needs PCVM judgment:

- Accepted candidates dropped from `13` to `4`.
- Per accepted Recipe route input and total model tokens regressed.
- Quality score dropped from `100` to `97`, although the quality gate still passed.

## Cannot Conclude

- This is not final product acceptance.
- This does not reopen or judge the stopped SourceRef optimization line.
- This does not prove Package F-G-H are sufficient as product changes; it proves the same-input live route now has lower raw route token totals but weaker useful-output unit economics.
- This does not prove Dashboard UI behavior; this run used API/probe evidence, not manual Dashboard verification.

## Repository Boundary

- BiliDili git status after run: clean.
- BiliDili `.asd/` and `Alembic/` source-folder writes: absent.
- Alembic git status: clean after dev-link/build.
- AlembicAgent contains the Package F-G-H source changes under test; they were not modified by AlembicTest.
- AlembicTest wrote only this report and raw evidence under its own `tmp/`/`docs/`.

## Recommended PCVM Next Step

`metric refinement / root-cause`

Reason: Package I clears the raw route-token regression but introduces a useful-output regression. PCVM should decide whether Package G early convergence is too aggressive, whether candidate-count/quality gates need a minimum accepted Recipe target, and whether per accepted/submitted Recipe cost should become the primary live gate.
