# PCVM R3 Baseline Analyze

Date: 2026-05-30
Window: AlembicTest
Task: Test-PCVM-AI-R3-001-ALEMBICTEST-BASELINE-ANALYZE
Project: BiliDili
Dimension: design-patterns

## Positioning

AlembicTest only performed real test validation and evidence backfill. This run did not modify product source, did not modify BiliDili business source, did not perform Dashboard manual acceptance, and did not start R4/R5/R6/R7.

## Verdict

Result envelope status: `partial(scope=live-ai-local)`.

R3 AI0-AI4 baseline is valid:

- AI0 readiness passed: BiliDili Ghost runtime was ready with internal AI provider `deepseek`, model `deepseek-v4-pro`, secret presence only, no secret printed.
- AI1 input assembly passed: one selected dimension `design-patterns`, stage map present, canonical `pcvStageNodeMap` / `pcvChainNodes` present, 24 source files, producer terminal tools blocked.
- AI2 analyze grounding passed: 23 grounding burns, 18 evidence-produced entries, 0 invalid-no-evidence entries, 25 referenced files, no degraded/fallback-only analyze result observed.
- AI3 quality gate passed: action `pass`, total score 97, no timeout, canonical node `pcvm:n9:quality_gate`.
- AI4 record repair was not applicable but linked: quality passed, `record_repair` canonical identity was available as `pcvm:n9:record_repair`, no repair phase needed.

Overall envelope is `partial` because the run naturally reached producer/sourceRef surfaces and exposed an R4-class blocker: N11 sourceRef validation reported 16 invalid refs out of 29, ratio `0.5517`, with `producer_source_refs_invalid`. That is not an R3 analyze failure; it is the next source-ref-validation optimization target.

Primary failure attribution for the full local-chain envelope: `source-ref-validation`.

## Runtime

- Dashboard/API URL: `http://127.0.0.1:56845`
- Data root: `/Users/gaoxuefeng/.asd/workspaces/02a25032`
- Job id: `bootstrap_mpsbnftk_dbfe22d0`
- Bootstrap session id: `bs_1780143791437_9jfho1`
- Job status: `completed`
- Timeline classification: `pass`
- Duration: `546177ms`

## Commands

Environment restart:

```bash
env ALEMBIC_TEST_MODE=1 ALEMBIC_TEST_BOOTSTRAP_DIMS=design-patterns ALEMBIC_TEST_RESCAN_DIMS=design-patterns \
  node AlembicTest/scripts/restart-alembic.mjs --project BiliDili --json --wait 20000 --monitor-once
```

The first preclean pass killed the old daemon and cleaned old logs, but returned the known preclean/SIGKILL classification. I did not treat that as product failure.

Successful daemon start used the same test-mode config with `--no-preclean`:

```bash
env ALEMBIC_TEST_MODE=1 ALEMBIC_TEST_BOOTSTRAP_DIMS=design-patterns ALEMBIC_TEST_RESCAN_DIMS=design-patterns \
  node AlembicTest/scripts/restart-alembic.mjs --project BiliDili --json --wait 20000 --monitor-once --no-preclean
```

Environment verification:

```bash
node AlembicTest/scripts/verify-test-environment.mjs --project BiliDili --url http://127.0.0.1:56845 --json
```

Cold-start timeline probe:

```bash
node AlembicTest/scripts/probe-cold-start-process-timeline.mjs \
  --project BiliDili \
  --url http://127.0.0.1:56845 \
  --data-root /Users/gaoxuefeng/.asd/workspaces/02a25032 \
  --max-files 24 \
  --content-max-lines 80 \
  --skip-guard \
  --timeout-ms 900000 \
  --poll-ms 2500 \
  --output AlembicTest/tmp/pcvm-ai-r3-001-baseline-analyze-timeline.json
```

## Fresh Agent Dist

The successful restart path ran Alembic dev-link, including `npm --prefix /Users/gaoxuefeng/Documents/AlembicWorkspace/AlembicAgent run build`.

- AlembicAgent commit: `8375f40e795bf22c412d72563db62769c1eeee63`
- Dist proof: `AlembicTest/tmp/pcvm-ai-r3-001-baseline-analyze-agent-dist-proof.txt`
- Dist proof includes hits for `pcvStageNodeMap`, `pcvChainNodes`, `record_repair`, and `PcvNodeEvidence` under `AlembicAgent/dist`.

This distinguishes source facts from runtime artifact proof before judging runtime behavior.

## Evidence Paths

- Result envelope: `AlembicTest/tmp/pcvm-ai-r3-001-baseline-analyze-result-envelope.json`
- Timeline: `AlembicTest/tmp/pcvm-ai-r3-001-baseline-analyze-timeline.json`
- Events API: `AlembicTest/tmp/pcvm-ai-r3-001-baseline-analyze-events-full.json`
- Job API: `AlembicTest/tmp/pcvm-ai-r3-001-baseline-analyze-job-full.json`
- Job file: `AlembicTest/tmp/pcvm-ai-r3-001-baseline-analyze-job-file.json`
- Latest report API: `AlembicTest/tmp/pcvm-ai-r3-001-baseline-analyze-report-latest.json`
- Session report API: `AlembicTest/tmp/pcvm-ai-r3-001-baseline-analyze-report-session.json`
- Persisted latest report: `AlembicTest/tmp/pcvm-ai-r3-001-baseline-analyze-bootstrap-report-file.json`
- Persisted session report: `AlembicTest/tmp/pcvm-ai-r3-001-baseline-analyze-bootstrap-report-session-file.json`
- Report history index: `AlembicTest/tmp/pcvm-ai-r3-001-baseline-analyze-bootstrap-reports-index.json`
- Artifact manifest: `AlembicTest/tmp/pcvm-ai-r3-001-baseline-analyze-artifacts-manifest.json`
- Job artifact list: `AlembicTest/tmp/pcvm-ai-r3-001-baseline-analyze-job-artifacts-list.txt`
- Health: `AlembicTest/tmp/pcvm-ai-r3-001-baseline-analyze-health.json`
- Test mode: `AlembicTest/tmp/pcvm-ai-r3-001-baseline-analyze-test-mode.json`
- Verify environment: `AlembicTest/tmp/pcvm-ai-r3-001-baseline-analyze-verify-env.json`
- Combined log tail: `AlembicTest/tmp/pcvm-ai-r3-001-baseline-analyze-combined-tail.log`
- Agent commit: `AlembicTest/tmp/pcvm-ai-r3-001-baseline-analyze-agent-commit.txt`
- Agent dist proof: `AlembicTest/tmp/pcvm-ai-r3-001-baseline-analyze-agent-dist-proof.txt`
- Git status after: `AlembicTest/tmp/pcvm-ai-r3-001-baseline-analyze-git-status-after.txt`

Runtime canonical paths:

- Report: `/Users/gaoxuefeng/.asd/workspaces/02a25032/.asd/bootstrap-reports/bs_1780143791437_9jfho1.json`
- Latest report: `/Users/gaoxuefeng/.asd/workspaces/02a25032/.asd/bootstrap-report.json`
- History index: `/Users/gaoxuefeng/.asd/workspaces/02a25032/.asd/bootstrap-reports/index.json`
- Job file: `/Users/gaoxuefeng/.asd/workspaces/02a25032/.asd/jobs/bootstrap_mpsbnftk_dbfe22d0.json`
- Logs: `/Users/gaoxuefeng/.asd/workspaces/02a25032/.asd/logs/combined.log`

## PCVMLiveAILocalChainResult Summary

```json
{
  "contract": "PCVMLiveAILocalChainResult",
  "contractVersion": 1,
  "runId": "pcv-20260530-1515-alembic-cold-start",
  "roundId": "R3-baseline-analyze",
  "status": "partial",
  "verdictScope": "live-ai-local",
  "failureAttribution": "source-ref-validation",
  "runtimeIdentity": {
    "jobId": "bootstrap_mpsbnftk_dbfe22d0",
    "sessionId": "bs_1780143791437_9jfho1",
    "dimensionIds": ["design-patterns"]
  },
  "pcvScorecardSummary": {
    "dimensionCount": 1,
    "nodeCount": 5,
    "linkedNodes": 3,
    "blockedNodes": 1
  },
  "sourceRefValidity": {
    "totalSourceRefCount": 29,
    "validSourceRefCount": 13,
    "invalidSourceRefCount": 16,
    "invalidSourceRefRatio": 0.5517
  }
}
```

The full result envelope is saved at `AlembicTest/tmp/pcvm-ai-r3-001-baseline-analyze-result-envelope.json`.

## Stage Evidence

| Stage | Result | Evidence |
| --- | --- | --- |
| AI0-readiness | pass | `verify-test-environment` returned `verdict=ready`; test-mode enabled with bootstrap/rescan dims `design-patterns`; health shows internal AI provider/model and Ghost BiliDili runtime. |
| AI1-input-assembly | pass | First `llm.input` retained canonical `pcvStageNodeMap` and `pcvChainNodes`; source file count 24; stage order `analyze`, `quality_gate`, `produce`, `rejection_gate`; producer terminal tools 0. |
| AI2-analyze-grounding | pass | Report `groundingLedger`: burnCount 23, evidenceProducedCount 18, invalidNoEvidenceCount 0, toolSchemasVisibleCount 21; no degraded fallback recorded. |
| AI3-quality-gate | pass | `qualityGate.action=pass`, total 97, depth 100, breadth 100, evidence 90, coherence 100; no timeout; node `pcvm:n9:quality_gate`. |
| AI4-record-repair | not-applicable / linked | Quality passed, no repair phase was required; report still carried `pcvm:n9:record_repair` with action `stage-map-available`. |
| AI5-producer | natural-only | Producer submitted 10, accepted 10, rejected 0, terminal calls 0. Not used as R4 acceptance. |
| AI6-source-ref-validation | natural-only blocker | 16/29 invalid sourceRefs, invalid ratio 0.5517; missing reason `producer_source_refs_invalid`. |
| AI7-consumer-persistence | natural-only linked | N12 reports 10/10 accepted candidates findable in SessionStore. |
| AI8-report-observability | natural-only partial | Report-level scorecard has 1 dimension, 5 nodes, 3 linked, 1 blocked. Legacy host findings digest metadata still shows artifact/trace/metrics observability gap. |

## Event Counts

Process events API returned 71 retained developer-facing events:

```json
{
  "workflow": 5,
  "checkpoint": 1,
  "llm.input": 24,
  "llm.reflection": 11,
  "llm.output": 24,
  "tool": 1,
  "summary": 4,
  "artifact": 1
}
```

Hidden event count was 0. Raw provider payload was not retained in the developer-facing input event.

## Boundary

- BiliDili source writes: false.
- Product source writes: false.
- Delivery/wiki/project-skill export: not validated and not performed as an acceptance target.
- Candidates were written to the Alembic Ghost data root as part of the bootstrap pipeline; this is not a BiliDili source write.
- Logs show `Project delivery retired for Alembic main package` and `Auto Wiki generation: 0 pages`. A finalizer WikiGenerator compose path appeared in logs, but no wiki pages were generated for this test conclusion.
- Dashboard was opened only in Codex in-app browser for environment visibility, not for manual UI acceptance.

## Git Status

Before the report write, the relevant repositories were clean:

- Alembic `75274eb90441c0e1b2e20fcb858f5a1eb0feccff`
- AlembicCore `f2d76a192377b2064fdb62803bf5ac9a289ed6a4`
- AlembicAgent `8375f40e795bf22c412d72563db62769c1eeee63`
- AlembicDashboard `ce850a752bccb0414170a7b54fe5cbc17d02e76e`
- AlembicPlugin `ce9d593ed5dd2a79c28d8d22d22f18ba3f20166d`
- BiliDili `5b10fd4c72ccc8aeda2e9b84289748b7d883d804`
- AlembicTest `acfb8a84fd14537eeceb9deb25bd0d2b43cd8f33`

After this report, AlembicTest has expected report/test-exchange documentation changes; product repos and BiliDili remain clean.

## Cannot Conclude

- This does not prove full-dimension cold-start stability.
- This does not validate Dashboard manual observation.
- This does not validate delivery/wiki/project-skill export.
- This does not close R4 producer/sourceRef quality, even though producer evidence naturally appeared.
- This does not prove future DeepSeek runs are deterministic.

## Next

Recommended next action: do not rerun R3 for AI0-AI4. Treat this as the baseline and move to an R4 producer/sourceRef-focused task, or create a scoped repair package for sourceRef normalization / validation before R4 candidate comparison.

Suggested ownership for the next issue: total control should decide between AlembicAgent prompt/sourceRef shaping and Alembic runtime sourceRef validation/reporting. AlembicTest should only retest after a scoped fix or explicit R4 test order.
