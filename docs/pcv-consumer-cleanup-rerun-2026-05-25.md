# PCV Consumer Cleanup Rerun Report

- Test id: `Test-2026-05-25-10`
- Task package: `PCVM-P2R-ALEMBICTEST-CONSUMER-CLEANUP-RERUN`
- Execution window: `AlembicTest`
- Executed at: `2026-05-25 20:48:24 CST`

## Window Scope

AlembicTest 只重跑 Test-2026-05-25-10 的最小 consumer cleanup probe。本轮不做产品实现，不修改 `progressive-chain-validation`、`Alembic`、`AlembicPlugin` 或 BiliDili 业务源码，不运行全量 cold-start / rescan。

## Conclusion

重测通过。`Alembic` 在 cleanup 修复提交 `92bd976162fb9c1dbc19da1f8afef8756c976c27` 后不再保留 `skills/progressive-chain-validation` workflow / checkout 路径残留；`AlembicPlugin` 继续保持无内部 checkout 路径残留。PCV canonical source baseline 可用，consumer cleanup 复核通过。

N9 baseline scorecard 字段仍按 PCV contract 生成，但由于本轮只做 source-readonly + fixture probe，没有真实 N9 artifact / trace / metric / source-ref link，`observabilityGapVerdict` 仍正确触发为 `blocked-by-observability-gap`，没有伪造质量分。

## Execution Range

- 使用 `AlembicTest/scripts/probe-pcv-canonical-source-baseline.mjs` 重跑最小 probe。
- 仅增加 probe 的 `--expected-*-commit` 覆盖参数，支持把重测绑定到修复后的 consumer commit。
- 生成独立 rerun evidence / fixture，未覆盖前次失败证据。
- 直接复核 `Alembic` / `AlembicPlugin` 的 git grep 和 gitlink 状态。

## Config

- Mode: `source-readonly-plus-alembic-test-fixture`
- Product source write: `false`
- Full cold-start: `false`
- BiliDili business code write: `false`
- Expected PCV source commit: `badbf0aa23bbaaff2cf185491a6785a61b74c1d8`
- Expected Alembic cleanup commit: `92bd976162fb9c1dbc19da1f8afef8756c976c27`
- Expected AlembicPlugin cleanup commit: `aa171f31734350ef49efaac56c34588b67f0d924`

## Evidence Paths

- JSON evidence: `AlembicTest/tmp/pcv-canonical-source-baseline-rerun.json`
- Plan fixture: `AlembicTest/tmp/pcv-canonical-source-baseline-rerun-plan.md`
- Historical first-run report: `AlembicTest/docs/pcv-canonical-source-baseline-2026-05-25.md`
- This rerun report: `AlembicTest/docs/pcv-consumer-cleanup-rerun-2026-05-25.md`

## Commands

```bash
node --check AlembicTest/scripts/probe-pcv-canonical-source-baseline.mjs
node AlembicTest/scripts/probe-pcv-canonical-source-baseline.mjs --help
npm --prefix AlembicTest run check
node AlembicTest/scripts/probe-pcv-canonical-source-baseline.mjs --expected-alembic-commit 92bd976162fb9c1dbc19da1f8afef8756c976c27 --out AlembicTest/tmp/pcv-canonical-source-baseline-rerun.json --plan AlembicTest/tmp/pcv-canonical-source-baseline-rerun-plan.md
git -C Alembic grep -n -- skills/progressive-chain-validation
git -C AlembicPlugin grep -n -- skills/progressive-chain-validation
git -C Alembic ls-files -s skills/progressive-chain-validation
git -C AlembicPlugin ls-files -s skills/progressive-chain-validation
git -C Alembic grep -n -- progressive-chain-validation
git -C AlembicPlugin grep -n -- progressive-chain-validation
```

## Results

- Probe conclusion: `pass-source-baseline-with-scoring-blocked-by-observability-gap`
- Consumer cleanup passed: `true`
- PCV canonical source usable: `true`
- Scorecard fields: `usefulUnit`, `qualityGate`, `stageLoss`, `baseline`, `evidenceLinks`, `verdict`
- Observability gap verdict: `triggered=true`, `verdict=blocked-by-observability-gap`, `noQualityScoreAssigned=true`

## Consumer Cleanup Review

### Alembic

- HEAD: `92bd976162fb9c1dbc19da1f8afef8756c976c27`
- `git grep -n -- skills/progressive-chain-validation`: no hits, exit 1 by git grep convention.
- `git ls-files -s skills/progressive-chain-validation`: no output.
- Probe checks: `noGitmodulesPcvEntry=true`, `noSubmodulePcvEntry=true`, `noSkillGitlink=true`, `noInternalPathRefs=true`.
- Remaining name-only reference: `test/unit/SkillAdapter.test.ts:111` searches query text `progressive-chain-validation`; this is not an internal checkout path and is acceptable.

### AlembicPlugin

- HEAD: `aa171f31734350ef49efaac56c34588b67f0d924`
- `git grep -n -- skills/progressive-chain-validation`: no hits, exit 1 by git grep convention.
- `git ls-files -s skills/progressive-chain-validation`: no output.
- Probe checks: `noGitmodulesPcvEntry=true`, `noSubmodulePcvEntry=true`, `noSkillGitlink=true`, `noInternalPathRefs=true`.
- `git grep -n -- progressive-chain-validation`: no hits.

## Git State

- `progressive-chain-validation`: `## main...origin/main`, clean.
- `Alembic`: `## main...origin/main`, clean.
- `AlembicPlugin`: `## main...origin/main [ahead 1]`, clean working tree.
- `BiliDili`: `## main...origin/main`, clean.
- `AlembicTest`: has expected uncommitted test asset changes for this report / probe; no product source changes.

## Residual Risk

- N9 quality score remains intentionally blocked until a real producer emits node-local artifact / trace / metric / source-ref linkage for N9. This is not a consumer cleanup failure.
- `AlembicPlugin` is clean but ahead of `origin/main` by one commit; publish / push status is outside this minimal rerun scope.

## Next Recommendation

总控可以把 `PCVM-P2R-ALEMBICTEST-CONSUMER-CLEANUP-RERUN` 标记为重测通过并关闭 Test-2026-05-25-10 的 consumer cleanup 阻塞。若要推进真实 N9 分数，需要另开 producer observability gap 任务，不应在本轮 source-readonly rerun 中补做。
