# PCV N9 Observability Linkage Rerun Report

Date: 2026-05-25
Window: AlembicTest
Task: `PCVM-P3D-ALEMBICTEST-N9-LINKAGE-RERUN`
Test: `Test-2026-05-25-11 / PCVM-P3B-N9-Observability-Linkage-Minimal`

## Window Scope

This run is an AlembicTest verification pass only. It reruns the same minimal
test-mode probe after the Alembic Wave 3C fix, and does not implement product
source changes, run full cold-start / rescan, or modify BiliDili business code.

The probe harness was adjusted in AlembicTest so the generated fixture no longer
hard-codes the earlier `blocked-by-observability-gap` result. It now records the
real carry verdict and lets the outer probe decide pass / fail.

## Conclusion

Result: passed.

`Alembic` commit `ae9531ac3315a4491e22e3df156cb05e13fc0879` closes the nested
evidence consumer gap found in the previous Test-11 run. The nested
`metadata.pcvNodeEvidence.nodeId / chainNodeId / sourceRefs` now enters
job-level carry. The N9 scorecard verdict is `linked`.

## Execution Range

- Minimal test-mode probe / fixture only.
- No full cold-start / rescan.
- No product source edits in `Alembic`, `AlembicAgent`, PCV source, or BiliDili.
- No BiliDili business code, UI, login, network, playback, or project structure changes.

## Config

- Probe: `AlembicTest/scripts/probe-pcv-n9-observability-linkage.mjs`
- Agent commit: `7ab94575ed9b475dc57253c88738e1f061a3c547`
- Alembic commit: `ae9531ac3315a4491e22e3df156cb05e13fc0879`
- PCV source commit: `badbf0aa23bbaaff2cf185491a6785a61b74c1d8`
- BiliDili HEAD observed: `5b10fd4c72ccc8aeda2e9b84289748b7d883d804`

## Evidence Paths

- JSON evidence: `AlembicTest/tmp/pcv-n9-observability-linkage-rerun.json`
- Fixture JSON: `AlembicTest/tmp/pcv-n9-observability-linkage-rerun-fixture.json`
- Generated Vitest: `AlembicTest/tmp/pcv-n9-observability-linkage-rerun.generated.test.ts`
- Generated Vitest config: `AlembicTest/tmp/pcv-n9-observability-linkage-rerun.vitest.config.mjs`
- Plan: `AlembicTest/tmp/pcv-n9-observability-linkage-rerun-plan.md`
- Report: `AlembicTest/docs/pcv-n9-observability-linkage-rerun-2026-05-25.md`

## Commands

```bash
node --check AlembicTest/scripts/probe-pcv-n9-observability-linkage.mjs
node AlembicTest/scripts/probe-pcv-n9-observability-linkage.mjs --help
node AlembicTest/scripts/probe-pcv-n9-observability-linkage.mjs --expected-alembic-commit ae9531ac3315a4491e22e3df156cb05e13fc0879 --fixture AlembicTest/tmp/pcv-n9-observability-linkage-rerun-fixture.json --generated-test AlembicTest/tmp/pcv-n9-observability-linkage-rerun.generated.test.ts --generated-config AlembicTest/tmp/pcv-n9-observability-linkage-rerun.vitest.config.mjs --out AlembicTest/tmp/pcv-n9-observability-linkage-rerun.json --plan AlembicTest/tmp/pcv-n9-observability-linkage-rerun-plan.md
```

Probe result:

```json
{
  "conclusion": "pass-linked",
  "missingLinkReasons": [],
  "nestedEvidenceConsumedByCarry": true,
  "verdict": "linked"
}
```

The probe internally ran the AlembicAgent targeted test, the Alembic
`DaemonJobRunner.test.ts` unit, and the generated Vitest fixture; all passed.

## Agent Nested Evidence

- `nodeId`: `N9-agent-analyze-quality`
- `inputAssemblyRef`: present
- `ledgerRefs`: present
- `acceptedFindingRefs`: present
- `qualityGate`: present
- `sourceRefs`: `["src/index.ts:42"]`
- Producer-side `missingLinkReasons`: `[]`

## Alembic Carry

Nested-only carry result:

- `linkageStatus`: `linked`
- `nodeId`: `N9-agent-analyze-quality`
- `nodeIdentitySource`: `agent-explicit`
- `artifactRefs`: `["/api/v1/jobs/job_pcv_p3b/artifacts/llm-input-full-redacted-n9.md"]`
- `traceId`: `trace-p3b`
- `metricsPath`: `metadata.llmMetrics`
- `sourceRefs`: `["src/index.ts:42"]`
- `missingLinkReasons`: `[]`
- `firstFix`: `[]`

Top-level control carry also remains `linked`, so the earlier control path did
not regress.

Artifact readback is covered by the Alembic targeted `DaemonJobRunner.test.ts`
that the probe ran successfully. This rerun did not start a live daemon API.

## N9 Scorecard Verdict

Verdict: `linked`.

The generated plan includes artifact, trace, metrics, and source evidence links:

```yaml
stageLoss:
  nestedEvidenceConsumed: true
  missingLinkReasons: []
evidenceLinks:
  - artifact:/api/v1/jobs/job_pcv_p3b/artifacts/llm-input-full-redacted-n9.md
  - trace:trace-p3b
  - metrics:metadata.llmMetrics
  - source:src/index.ts:42
verdict: linked
```

## Missing Link

Missing-link reason: none.

First fix: none for this rerun.

Suggested owner: none for this specific linkage gap; `Alembic` Wave 3C fix is
validated. Any broader cold-start / rescan or Dashboard comparison work should
be scheduled as a separate phase.

## Git State

- `Alembic`: `main...origin/main [ahead 2]`, clean, HEAD `ae9531ac3315a4491e22e3df156cb05e13fc0879`.
- `AlembicAgent`: `main...origin/main [ahead 1]`, clean, HEAD `7ab94575ed9b475dc57253c88738e1f061a3c547`.
- `progressive-chain-validation`: `main...origin/main`, clean, HEAD `badbf0aa23bbaaff2cf185491a6785a61b74c1d8`.
- `BiliDili`: `main...origin/main`, clean, HEAD `5b10fd4c72ccc8aeda2e9b84289748b7d883d804`.

AlembicTest has expected local test assets and report/script changes for this
verification window.

## Residual Risk

- This is a minimal test-mode fixture; it does not prove full cold-start /
  rescan, live daemon artifact route behavior, or Dashboard comparison UI.
- The generated fixture imports local source directly, so package/runtime
  publication is outside this run.
- AlembicTest probe/report assets remain local until an explicit closeout commit.

## Next Recommendation

Mark Wave 3D as passed and let total control decide whether to proceed to the
next PCVM phase. Do not start full Agent / LLM optimization from this test alone
unless the next phase explicitly defines the baseline comparison fixture and
verification scope.
