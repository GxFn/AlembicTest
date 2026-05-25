# Scan Progress Semantic Richness Test Mode Report - 2026-05-24

## Window And Scope

- Window: `AlembicTest`
- Test case: `Test-2026-05-24-06 / SPSR-P3-TestMode-Validation`
- Real test project: `BiliDili`
- Scope: test-mode cold-start, one small `architecture` dimension, 8 files, `skipGuard=true`
- Non-goals: no full cold-start run, no BiliDili source edits, no Alembic product-code fixes from this window

## Conclusion

Result: passed for API events and Jobs Timeline frontend visibility, with one UI observation left as residual risk.

The test-mode bootstrap completed successfully. `/api/v1/jobs/:jobId/events` exposed semantic nudge/reflection events and a findings digest. The Dashboard Jobs Timeline rendered developer-visible labels/chips for `Nudge`, `阶段转换`, `反思`, `关键发现`, `planning-nudge`, `continue-nudge`, `reflection-nudge`, `transition-nudge`, and `phase=dimension-findings`.

The `Candidates` page after job completion did not retain a cold-start progress card with recent key semantic events; it showed the resulting candidates instead. This is recorded as a verification gap for the active cold-start card state, not as an API/Timeline failure.

## Runtime Configuration

- Dashboard/API: `http://127.0.0.1:53991`
- Test mode endpoint: `success=true`
- Test mode enabled: `true`
- `bootstrapDims`: `["architecture"]`
- `rescanDims`: `["architecture"]`
- Terminal toolset: `terminal-run`
- Sandbox: `mode=enforce`, `available=true`
- Daemon health: `jobs.processEvents.available=true`, supported kinds include `workflow`, `llm.input`, `llm.reflection`, `llm.output`, `tool`, `artifact`, `checkpoint`, `error`, `summary`

## Version Evidence

- `AlembicAgent`: `18af90800d1a835ccfde9bdf2c6e56289ebc5151`
- `Alembic`: `b504a3e8ad101cf673b0221d1dc06e6ac286709c`
- `AlembicDashboard`: `a5a9c1a8e961a81dd94af32dfa4aa0327eea8ad3`
- `BiliDili`: `5b10fd4c72ccc8aeda2e9b84289748b7d883d804`
- Runtime was restarted through `AlembicTest` with `ALEMBIC_TEST_MODE=1`, `ALEMBIC_TEST_BOOTSTRAP_DIMS=architecture`, `ALEMBIC_TEST_RESCAN_DIMS=architecture`; `dev:link` rebuilt local Alembic, Agent, and Dashboard assets.
- Observation: `AlembicDashboard` had unrelated uncommitted changes in `scripts/dashboard-contract.test.mjs` and `src/components/Layout/Header.tsx` during validation. The semantic Timeline evidence is still from the local built runtime, but the exact Dashboard runtime is HEAD plus dirty working tree.

## Job Evidence

- Job id: `bootstrap_mpjnppg3_6e71a895`
- Session id: `bs_1779619856790_6kosny`
- Dashboard job page: `http://127.0.0.1:53991/jobs?job=bootstrap_mpjnppg3_6e71a895`
- Status: `completed`
- Progress: `1/1`, `100%`, `failed=0`, `cancelled=0`
- Duration: `377624ms`
- Total tool calls: `36`
- Efficiency summary: `nudgeCount=9`, `replanCount=1`, `maxCompactionLevel=0`
- Produced: `5` candidates, `1` skill, `3` findings in report/session store

## API Event Counts

Source file: `AlembicTest/tmp/spsr-p3-events-bootstrap_mpjnppg3_6e71a895.json`

- Total developer views: `64`
- Retained count: `64`
- Hidden count: `0`

By `kind`:

- `workflow`: `5`
- `checkpoint`: `1`
- `llm.input`: `21`
- `llm.reflection`: `10`
- `llm.output`: `21`
- `tool`: `1`
- `summary`: `4`
- `artifact`: `1`

By semantic metadata:

- `planning-nudge`: `2`
- `continue-nudge`: `2`
- `reflection-nudge`: `1`
- `transition-nudge`: `4`
- `dimension-findings-digest`: `1`

Key event samples:

- Sequence `22`: `llm.reflection`, `phase=VERIFY`, title `Agent 阶段转换 Nudge: VERIFY`, `semanticKind=transition-nudge`, `nudgeType=phase_transition`
- Sequence `27`: `llm.reflection`, `phase=RECORD`, title `Agent 阶段转换 Nudge: RECORD`, `semanticKind=transition-nudge`
- Sequence `34`: `llm.reflection`, `phase=SUMMARIZE`, title `Agent 阶段转换 Nudge: SUMMARIZE`, `semanticKind=transition-nudge`
- Sequence `51`: `llm.reflection`, `phase=produce`, title `Agent 继续执行 Nudge`, `semanticKind=continue-nudge`
- Sequence `60`: `summary`, `phase=dimension-findings`, title `Bootstrap 架构与设计 findings digest`, `projection=dimension-findings-digest`, `findingCount=8`, `findingSources=["dimension-digest","analysis-report"]`

## Frontend Evidence

Jobs Timeline expanded DOM evidence:

```text
- text: Nudge
- generic: Agent 计划检查 Nudge
- generic: 语义planning-nudge
- generic: Nudge 类型planning
- text: Nudge
- generic: Agent 继续执行 Nudge
- generic: 语义continue-nudge
- generic: Nudge 类型continue
- text: Nudge
- generic: Agent 停滞反思
- generic: 语义reflection-nudge
- generic: Nudge 类型reflection
- text: 阶段转换
- generic: "Agent 阶段转换 Nudge: VERIFY"
- generic: 语义transition-nudge
- generic: Nudge 类型phase_transition
- text: 阶段转换
- generic: "Agent 阶段转换 Nudge: RECORD"
- generic: 语义transition-nudge
- text: 反思
- text: 关键发现
- generic: Bootstrap 架构与设计 findings digest
- paragraph: 8 developer-facing key findings projected for 架构与设计.
- generic: phasedimension-findings
```

Screenshot evidence:

- `AlembicTest/tmp/spsr-p3-jobs-expanded-bootstrap_mpjnppg3_6e71a895.png`
- `AlembicTest/tmp/spsr-p3-jobs-semantic-visible-bootstrap_mpjnppg3_6e71a895.png`
- `AlembicTest/tmp/spsr-p3-jobs-findings-visible-bootstrap_mpjnppg3_6e71a895.png`
- `AlembicTest/tmp/spsr-p3-jobs-timeline-bootstrap_mpjnppg3_6e71a895.png`
- `AlembicTest/tmp/spsr-p3-jobs-timeline-final-bootstrap_mpjnppg3_6e71a895.png`
- `AlembicTest/tmp/spsr-p3-candidates-cold-start-bootstrap_mpjnppg3_6e71a895.png`

Browser console:

- Jobs page errors: none captured.
- Candidates page errors: none captured.

Cold-start card observation:

- After completion, `Candidates` page did not show an active cold-start progress card; it showed candidate cards and candidate repair buttons.
- This means active cold-start card semantic priority was not conclusively verified in this run. Jobs Timeline did verify semantic rendering and findings display.

## Hidden Raw Secret Boundary

- Events endpoint reported `hiddenCount=0`.
- No raw provider payload was exposed in `llm.input`; input summary had `rawProviderPayload=false`.
- LLM token usage in `llm.output` metadata was redacted as `[redacted-secret]`.
- `hasHiddenReasoningContent=true` appeared only as metadata; hidden reasoning content itself was not exposed in developer-facing text.

## Real Project Git State

`git -C BiliDili status --short`: clean before and after the run.

No BiliDili source files were modified by this test. Runtime data and reports were written under Alembic's external ghost data root and `AlembicTest/tmp`.

## Verification Commands

```bash
ALEMBIC_TEST_MODE=1 ALEMBIC_TEST_BOOTSTRAP_DIMS=architecture ALEMBIC_TEST_RESCAN_DIMS=architecture npm --prefix AlembicTest run restart -- --project BiliDili --json --wait 12000
curl -sS --max-time 5 http://127.0.0.1:53991/api/v1/modules/test-mode
curl -sS --max-time 5 http://127.0.0.1:53991/api/v1/daemon/health
curl -sS --max-time 10 -X POST -H 'Content-Type: application/json' --data '{"maxFiles":8,"contentMaxLines":40,"skipGuard":true}' http://127.0.0.1:53991/api/v1/jobs/bootstrap
curl -sS --max-time 10 'http://127.0.0.1:53991/api/v1/jobs/bootstrap_mpjnppg3_6e71a895/events?limit=200'
curl -sS --max-time 10 'http://127.0.0.1:53991/api/v1/jobs/bootstrap_mpjnppg3_6e71a895?compact=true'
git -C BiliDili status --short
```

Browser verification used the Codex in-app browser against `http://127.0.0.1:53991/jobs` and `http://127.0.0.1:53991/candidates`.

## Failure Logs And Recoveries

Product/runtime failures: none observed. The bootstrap job completed successfully with `failed=0`, `cancelled=0`, `aiErrorCount=0`, `degraded=false`.

Command-side recoveries:

- An unquoted `?compact=true` curl URL was rejected by zsh globbing; rerun with quotes succeeded.
- A sandboxed `node -e fetch(...)` poll hit `EPERM` for local `127.0.0.1`; rerun with approved escalation succeeded.
- Direct Browser runtime screenshot write into `AlembicTest/tmp` hit `EPERM`; screenshot was written to the browser runtime temp directory and copied into `AlembicTest/tmp`.

Daemon log signals:

- `[Bootstrap] Session bs_1779619856790_6kosny started with 1 tasks [TEST MODE]`
- `[AgentRuntime] injected planning nudge`
- `[AgentRuntime] injected reflection nudge`
- `[AgentRuntime] injected phase_transition nudge (VERIFY/RECORD/SUMMARIZE)`
- `[SessionStore] Stored report for "architecture": 3 findings, 10 files`
- `[Bootstrap] Session bs_1779619856790_6kosny finished: 1 completed, 0 failed`
- `[Insight-v3] Pipeline complete`

## Residual Risk

- Active cold-start card semantic priority was not conclusively captured. The completed `Candidates` page no longer showed the active progress card; only Jobs Timeline was verified for semantic labels/chips and findings display.
- `AlembicDashboard` working tree was dirty during `dev:link`, so the exact tested Dashboard runtime is not a clean commit-only build. This should be closed by the Dashboard window or total control before formal release validation.
- Events endpoint default retrieval appears capped in the UI/polling path; explicit `events?limit=200` was needed for full `64` event accounting.

## Next Suggestions

- Accept this test for producer -> bridge -> events API -> Jobs Timeline semantic richness.
- Add a targeted active-card test: open `Candidates` before/during a test-mode job and capture the cold-start progress card while the job is running, or add a Dashboard contract fixture that renders `pickKeyProcessEvents` output inside the card.
- Have the Dashboard owning window close or explain its current dirty working tree before release tagging.
