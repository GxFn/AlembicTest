# PCV Canonical Source Baseline Test

测试单：`Test-2026-05-25-10 / PCVM-P2-Canonical-Source-Baseline`

窗口定位：`AlembicTest` 测试验证窗口。本轮只做 PCVM Test-01 的证据采集、probe、fixture、报告和回填；不做产品实现，不修改 `progressive-chain-validation`、`Alembic`、`AlembicPlugin` 或 `BiliDili`。

## 测试结论

结论：失败，失败归口为 `Alembic` consumer cleanup 未完全闭合。

已通过部分：

- `progressive-chain-validation` canonical source commit 符合测试单要求。
- PCV metrics contract、plan template、Alembic N9 baseline example 具备最小 scorecard 字段和 `blocked-by-observability-gap` 规则。
- `AlembicPlugin` 未发现旧内部 `skills/progressive-chain-validation` checkout / gitlink / submodule / path ref。
- `progressive-chain-validation`、`Alembic`、`AlembicPlugin`、`BiliDili` 工作区均保持 clean。

失败点：

- `Alembic` 仍有两个被 git 跟踪的 workflow path ref 指向旧内部目录：
  - `Alembic/.github/workflows/ci.yml:182`
  - `Alembic/.github/workflows/release.yml:37`
- 两处均为 `path: Alembic/skills/progressive-chain-validation`，说明 consumer cleanup 的 CI / release 消费路径未清理完。

N9 baseline verdict：触发 `blocked-by-observability-gap`。本轮只验证 canonical source shape 和 consumer cleanup，不存在真实 N9 artifact / trace / metric / source-ref / report field 与 node boundary 的稳定关联，因此未生成或推断质量分数。

## 执行范围

只读复核：

- `progressive-chain-validation/`
- `Alembic/`
- `AlembicPlugin/`
- `BiliDili/`

写入范围：

- `AlembicTest/scripts/probe-pcv-canonical-source-baseline.mjs`
- `AlembicTest/scripts/README.md`
- `AlembicTest/package.json`
- `AlembicTest/tmp/pcv-canonical-source-baseline.json`
- `AlembicTest/tmp/pcv-canonical-source-baseline-plan.md`
- `AlembicTest/docs/pcv-canonical-source-baseline-2026-05-25.md`

未执行：

- 未运行冷启动、rescan、Dashboard 或真实项目业务测试。
- 未修改产品源码。
- 未修改 BiliDili 业务代码。

## 使用配置

- 模式：`source-readonly-plus-alembic-test-fixture`
- `productSourceWrite=false`
- `fullColdStart=false`
- `bilidiliBusinessCodeWrite=false`
- Probe：`node AlembicTest/scripts/probe-pcv-canonical-source-baseline.mjs`

## 路径

- Fixture / plan：`AlembicTest/tmp/pcv-canonical-source-baseline-plan.md`
- JSON evidence：`AlembicTest/tmp/pcv-canonical-source-baseline.json`
- Report：`AlembicTest/docs/pcv-canonical-source-baseline-2026-05-25.md`
- Wave plan：`docs/workspace/current/progressive-chain-validation-metrics-wave-0-2026-05-25.md`

## Commit 证据

| Repository | Expected | Observed | Worktree |
|------------|----------|----------|----------|
| `progressive-chain-validation` | `badbf0aa23bbaaff2cf185491a6785a61b74c1d8` | `badbf0aa23bbaaff2cf185491a6785a61b74c1d8` | clean |
| `Alembic` | `d99d66d0af14fe6e8a51e683d963028ec9d0679a` | `d99d66d0af14fe6e8a51e683d963028ec9d0679a` | clean, branch ahead 1 |
| `AlembicPlugin` | `aa171f31734350ef49efaac56c34588b67f0d924` | `aa171f31734350ef49efaac56c34588b67f0d924` | clean, branch ahead 1 |
| `BiliDili` | n/a | `5b10fd4c72ccc8aeda2e9b84289748b7d883d804` | clean |

## Consumer Cleanup 复核

`Alembic`：

- `.gitmodules` 无 `progressive-chain-validation` entry：通过。
- `git submodule status` 无 `progressive-chain-validation`：通过。
- `git ls-files -s skills/progressive-chain-validation` 为空：通过。
- `git grep -n -- skills/progressive-chain-validation`：失败。

失败证据：

```text
.github/workflows/ci.yml:182:          path: Alembic/skills/progressive-chain-validation
.github/workflows/release.yml:37:          path: Alembic/skills/progressive-chain-validation
```

`AlembicPlugin`：

- `.gitmodules` 无 `progressive-chain-validation` entry：通过。
- `git submodule status` 无 `progressive-chain-validation`：通过。
- `git ls-files -s skills/progressive-chain-validation` 为空：通过。
- `git grep -n -- skills/progressive-chain-validation` 无输出：通过。

## N9 Baseline Scorecard 字段

本轮 fixture 生成了以下字段：

- `usefulUnit`
- `qualityGate`
- `stageLoss`
- `baseline`
- `evidenceLinks`
- `verdict`

Fixture 摘要：

```yaml
nodeId: N9-agent-analyze-quality
usefulUnit: quality-gated analysis finding with file-level source evidence
qualityGate:
  status: blocked
stageLoss:
  missingSourceRefs: unknown
  fallbackOnlyFindings: unknown
  vagueReasonCount: unknown
  unlinkedArtifactCount: blocked
  qualityGateRejectCount: unknown
baseline:
  fixtureId: pcv-p2-canonical-source-baseline-doc-fixture
  sourceCommit: badbf0aa23bbaaff2cf185491a6785a61b74c1d8
verdict: blocked-by-observability-gap
```

## Observability Gap Verdict

触发：是。

原因：本轮是 source baseline 和 consumer cleanup 最小复核，不包含真实 N9 analyze-quality run，也没有 artifact / trace / metrics / source-ref / report field 与 `N9-agent-analyze-quality` node boundary 的稳定关联。

处理：按 PCV metrics contract 记录 `blocked-by-observability-gap`，不推断 `pass`、`improved`、`regression` 或质量分数。

第一修复建议：

- 在 N9 analyze artifact / report producer 中写入稳定 `nodeId`、`runId`、`artifactPath`。
- 将 Observation Ledger 记录关联到 accepted / rejected finding id。
- 写入 trace id、metrics path，或明确 `trace-unavailable` reason。
- 用同一个 N9 fixture 重跑后再评分。

## 验证命令

```bash
node --check AlembicTest/scripts/probe-pcv-canonical-source-baseline.mjs
node AlembicTest/scripts/probe-pcv-canonical-source-baseline.mjs --help
node AlembicTest/scripts/probe-pcv-canonical-source-baseline.mjs
git -C progressive-chain-validation status --short --branch
git -C Alembic status --short --branch
git -C AlembicPlugin status --short --branch
git -C BiliDili status --short --branch
```

结果：

- `node --check`：通过。
- `--help`：通过。
- Probe：退出码 `1`，符合本轮发现的 cleanup 失败；已写出 JSON evidence 和 fixture。
- 四个真实项目 status：均 clean；`Alembic` 和 `AlembicPlugin` 分支各自 ahead 1，但工作区无 dirty 文件。

## 遗留风险

- `Alembic` CI / release workflow 仍指向旧内部 skill path，可能在远端 CI 或 release 链路中重新拉取 / 依赖旧布局。
- 当前 N9 baseline 只验证字段与阻塞规则，无法给出质量分数；需要 observability producer 修复后再做真实 N9 baseline scoring。
- `Alembic` 中 `test/unit/SkillAdapter.test.ts` 仍包含 `progressive-chain-validation` 名称搜索用例；本轮判断为名称查询，不是内部 path ref，但后续修复时可确认该测试语义是否仍合理。

## 下一步建议

1. 由 `Alembic` 实现窗口清理 `.github/workflows/ci.yml` 与 `.github/workflows/release.yml` 中的旧 `Alembic/skills/progressive-chain-validation` checkout path。
2. 保持 `progressive-chain-validation` 作为 canonical source；consumer 侧不要恢复内部 checkout。
3. 另起后续测试单验证 N9 artifact / trace / metrics / source-ref / report field 稳定关联后，再解除 `blocked-by-observability-gap` 并做真实 baseline scorecard。
