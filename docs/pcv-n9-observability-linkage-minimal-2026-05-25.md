# PCV N9 Observability Linkage Minimal Report

- Test id: `Test-2026-05-25-11`
- Task package: `PCVM-P3B-N9-Observability-Linkage-Minimal`
- Execution window: `AlembicTest`
- Executed at: `2026-05-25 22:14:09 CST`

## Window Scope

AlembicTest 本轮只做最小 test-mode 验证：验证 `AlembicAgent` nested `metadata.pcvNodeEvidence` 与 `Alembic` job-level carry / artifact API 是否能形成真实 N9 baseline linkage。本轮未跑 full cold-start / rescan，未修改 `AlembicAgent`、`Alembic`、PCV source 或 BiliDili 业务源码。

## Conclusion

测试未通过，失败归口为 `Alembic` consumer extraction。

`AlembicAgent` nested `pcvNodeEvidence` 可读取且字段完整：包含 `inputAssemblyRef`、`ledgerRefs`、`acceptedFindingRefs`、`sourceRefs`、`qualityGate`、`repair` 和空 `missingLinkReasons`。`Alembic` 的 carry 也能在顶层字段 control case 中形成 `linked` verdict，并且既有 `DaemonJobRunner.test.ts` 覆盖 artifact readback。

但当 event 只携带真实 / 等价的 nested `metadata.pcvNodeEvidence` 时，`Alembic` carry 没有读取 nested `pcvNodeEvidence.sourceRefs` / `nodeId`，只通过 host `inputStageProfile=analyze` 推断 N9，最终 `sourceRefs=[]`，`linkageStatus=blocked-by-observability-gap`，`missingLinkReasons=["source_ref_missing"]`。因此 N9 scorecard 还不能从 gap 进入真实 baseline。

## Execution Range

- 新增 AlembicTest probe：`AlembicTest/scripts/probe-pcv-n9-observability-linkage.mjs`。
- Probe 生成临时 Vitest fixture，直接调用真实 `AlembicAgent` evidence helper 和真实 `Alembic` carry helper。
- 运行 `AlembicAgent` targeted tests 复核 producer。
- 运行 `Alembic` targeted unit 复核 job-level carry 与 artifact readback。
- 生成 fixture / JSON evidence / plan 并按失败 verdict 输出 missing-link reason。

## Config

- Mode: `test-mode-minimal-fixture`
- Full cold-start: `false`
- Product source write: `false`
- BiliDili business code write: `false`
- AlembicAgent commit: `7ab94575ed9b475dc57253c88738e1f061a3c547`
- Alembic commit: `647a42fc9e499fc9bbbd166e1b9db2a9c96f99f9`
- PCV source commit: `badbf0aa23bbaaff2cf185491a6785a61b74c1d8`

## Evidence Paths

- Generated test fixture: `AlembicTest/tmp/pcv-n9-observability-linkage.generated.test.ts`
- Generated Vitest config: `AlembicTest/tmp/pcv-n9-observability-linkage.vitest.config.mjs`
- Fixture / carry JSON: `AlembicTest/tmp/pcv-n9-observability-linkage-fixture.json`
- JSON evidence: `AlembicTest/tmp/pcv-n9-observability-linkage.json`
- Plan / scorecard: `AlembicTest/tmp/pcv-n9-observability-linkage-plan.md`
- This report: `AlembicTest/docs/pcv-n9-observability-linkage-minimal-2026-05-25.md`

## Commands

```bash
node --check AlembicTest/scripts/probe-pcv-n9-observability-linkage.mjs
node AlembicTest/scripts/probe-pcv-n9-observability-linkage.mjs --help
npm --prefix AlembicTest run check
node AlembicTest/scripts/probe-pcv-n9-observability-linkage.mjs
npm test -- AgentRuntime llm-input-layering evidence-recording-phase-chain
npm run test:unit -- DaemonJobRunner.test.ts
node Alembic/node_modules/vitest/vitest.mjs run --config AlembicTest/tmp/pcv-n9-observability-linkage.vitest.config.mjs --reporter=verbose
```

`node AlembicTest/scripts/probe-pcv-n9-observability-linkage.mjs` 退出码为 `1`，这是本轮目标链路未贯通的测试结论；该命令仍成功写出 JSON evidence / fixture / plan。其内部三条 targeted test / generated fixture 命令均通过。

## Nested Evidence Read Result

- `nodeId`: `N9-agent-analyze-quality`
- `inputAssemblyRef`: present, `llm-input:p3b-n9`
- `ledgerRefs`: present, `active-context:dim-n9`
- `acceptedFindingRefs`: present, `finding:source-backed`, `artifact-finding:a5217bb68250`
- `sourceRefs`: present, `src/index.ts:42`
- `qualityGate`: present, `pass=true`, `status=pass`
- nested evidence missing links: `[]`

## Alembic Carry Result

Nested-only event:

- `artifactRefs`: present, `/api/v1/jobs/job_pcv_p3b/artifacts/llm-input-full-redacted-n9.md`
- `traceId`: present, `trace-p3b`
- `metricsPath`: present, `metadata.llmMetrics`
- `sourceRefs`: missing, `[]`
- `nodeIdentitySource`: `host-stage-profile`
- `linkageStatus`: `blocked-by-observability-gap`
- `missingLinkReasons`: `source_ref_missing`

Top-level control event:

- Same artifact / trace / metrics.
- Top-level `sourceRefs=["src/index.ts:42"]` and `traceEnvelope.chainNodeId=N9-agent-analyze-quality` produce `linkageStatus=linked`.
- This proves Alembic carry can link when fields are top-level, while nested Agent evidence is not consumed.

## N9 Scorecard Verdict

- Verdict: `blocked-by-observability-gap`
- Missing-link reason: `source_ref_missing`
- First fix: `Carry file-level sourceRefs or referencedFiles used by N9 note_finding evidence.`
- Suggested owner: `Alembic`
- Specific fix target: `Alembic/lib/daemon/PcvObservabilityLinkage.ts` should extract `nodeId` / `chainNodeId` / `sourceRefs` from `metadata.pcvNodeEvidence` before falling back to host-stage inference and top-level refs.

## Git State

- `AlembicAgent`: `## main...origin/main [ahead 1]`, clean.
- `Alembic`: `## main...origin/main [ahead 1]`, clean.
- `progressive-chain-validation`: `## main...origin/main`, clean.
- `BiliDili`: `## main...origin/main`, clean.
- `AlembicTest`: expected uncommitted test script / report changes.

## Residual Risk

- This is test-mode evidence, not full cold-start / rescan evidence.
- The generated fixture proves the current cross-shape handoff gap; it does not attempt to patch Alembic.
- After Alembic consumer extraction is fixed, Test-11 should be rerun with the same fixture to confirm nested evidence reaches `linked`.

## Next Recommendation

派 `Alembic` 最小返修：让 `PcvObservabilityLinkage` 读取 `metadata.pcvNodeEvidence.nodeId / chainNodeId / sourceRefs`，并补 nested-only unit。返修后由 AlembicTest 重跑本 probe；只有 rerun 得到 `linked`，Wave 4 Agent / LLM before-after 优化才应启动。
