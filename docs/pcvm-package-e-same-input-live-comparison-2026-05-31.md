# PCVM Package E Same-Input Live AI Comparison Raw Evidence

Date: 2026-05-31
Window: AlembicTest
Scope: raw evidence only; not a PCVM final verdict.

## Boundary

- Target project: BiliDili
- Dimension: design-patterns
- Route: one-dimension / no-delivery / no source writes
- Provider/model: deepseek / deepseek-v4-pro
- Config: `ALEMBIC_TEST_MODE=1`, `ALEMBIC_TEST_BOOTSTRAP_DIMS=design-patterns`, `maxFiles=24`, `contentMaxLines=80`, `skipGuard=true`
- Prohibited work respected: no BiliDili source edits, no product source edits, no SourceRef optimization, no delivery/wiki/project-skill export, no final product acceptance.

## IDs And Paths

- Job id: `bootstrap_mptfvl61_f75bdcb6`
- Session id: `bs_1780211356238_xiafi2`
- Dashboard URL: `http://127.0.0.1:52276/jobs?job=bootstrap_mptfvl61_f75bdcb6`
- Report path: `/Users/gaoxuefeng/.asd/workspaces/02a25032/.asd/bootstrap-reports/bs_1780211356238_xiafi2.json`
- Latest report path: `/Users/gaoxuefeng/.asd/workspaces/02a25032/.asd/bootstrap-report.json`
- Timeline/process evidence: `/Users/gaoxuefeng/Documents/AlembicWorkspace/AlembicTest/tmp/pcvm-package-e-same-input-live-comparison-2026-05-31/timeline.json`
- Raw summary: `/Users/gaoxuefeng/Documents/AlembicWorkspace/AlembicTest/tmp/pcvm-package-e-same-input-live-comparison-2026-05-31/package-e-raw-summary.json`
- Job JSON: `/Users/gaoxuefeng/.asd/workspaces/02a25032/.asd/jobs/bootstrap_mptfvl61_f75bdcb6.json`
- Log tail evidence: `/Users/gaoxuefeng/Documents/AlembicWorkspace/AlembicTest/tmp/pcvm-package-e-same-input-live-comparison-2026-05-31/combined-log-tail.txt`

## Raw Metrics

| Metric | Value |
| --- | ---: |
| analyze input tokens | 348915 |
| analyze output tokens | 13242 |
| producer input tokens | 171785 |
| producer output tokens | 24993 |
| route total input tokens | 520700 |
| route total output tokens | 38235 |
| route total reasoning tokens | 8238 |
| route cache-hit tokens | 302336 |
| route totalModelTokens | 567173 |

## N11 / Quality Counts

| Metric | Value |
| --- | ---: |
| N11 submitted count | 14 |
| N11 accepted count | 13 |
| N11 rejected count | 1 |
| producer tool calls | 15 |
| knowledge tool calls | 14 |
| meta tool calls | 1 |
| `pcvAnalyzeGroundingInvalidNoEvidence` | 0 |

Source notes:

- N11 counts came from `combined.log` producer line: `submitted=14, accepted=13, rejected=1`.
- Report dimension counters are consistent with accepted/rejected storage: `candidatesSubmitted=13`, `candidatesRejected=1`.
- QualityGate raw result: `action=pass`, total/depth/breadth/evidence/coherence all `100`.

## Timeline Evidence

- Timeline probe classification: `pass` for event-chain completeness only.
- Event kind counts: `workflow=5`, `checkpoint=1`, `llm.input=29`, `llm.reflection=13`, `llm.output=29`, `tool=1`, `summary=4`, `artifact=1`.
- Socket append observed: true.
- REST events API returned developer views: true.
- Missing producer event kinds: none.
- Job status: completed.
- Duration: 745395ms.

## Commands

```bash
ALEMBIC_TEST_MODE=1 ALEMBIC_TEST_BOOTSTRAP_DIMS=design-patterns ALEMBIC_TEST_RESCAN_DIMS=design-patterns node scripts/restart-alembic.mjs --project BiliDili --wait 30000 --stop-wait 5000 --status-timeout 5000 --no-dev-link --no-preclean --monitor-once --json
node scripts/verify-test-environment.mjs --project BiliDili --url http://127.0.0.1:52276 --json
node scripts/probe-cold-start-process-timeline.mjs --project BiliDili --url http://127.0.0.1:52276 --data-root /Users/gaoxuefeng/.asd/workspaces/02a25032 --max-files 24 --content-max-lines 80 --skip-guard --timeout-ms 900000 --poll-ms 2500 --output tmp/pcvm-package-e-same-input-live-comparison-2026-05-31/timeline.json
```

Key output summary:

- Restart ready: `dashboardUrl=http://127.0.0.1:52276`, `dataRoot=/Users/gaoxuefeng/.asd/workspaces/02a25032`.
- Environment verification: `verdict=ready`, test mode enabled, bootstrap/rescan dims both `design-patterns`.
- Probe output: `ok=true`, `classification=pass`, `jobId=bootstrap_mptfvl61_f75bdcb6`.

## Source-Write Boundary

- `git -C /Users/gaoxuefeng/Documents/AlembicWorkspace/BiliDili status --short`: clean.
- `/Users/gaoxuefeng/Documents/AlembicWorkspace/BiliDili/.asd`: absent.
- `/Users/gaoxuefeng/Documents/AlembicWorkspace/BiliDili/Alembic`: absent.
- Runtime candidate writes were under BiliDili Ghost data root, not BiliDili source tree.

## AlembicTest Reading

This report only backfills raw Package E evidence. It does not decide whether the token-efficiency same-input comparison passes or fails; PCVM should read the raw evidence and make the scoped verdict.
