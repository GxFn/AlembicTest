# PCVM Wave 6F Fresh Report Canonical Projection

日期：2026-05-30
窗口：AlembicTest
任务：PCVM-W6F-ALEMBICTEST-FRESH-REPORT-CANONICAL-PROJECTION / after-click evidence
结论：partial pass / report canonical projection incomplete

## 窗口定位

本轮由 AlembicTest 执行受保护真实 / 默认 AI after-run 验证；不修改产品源码，不替总代控验收，不优化 Agent prompt，不做 Dashboard comparison UI。外部 provider 使用正确流程：AlembicTest 只启动 Alembic 并监控，真实 cold-start 由用户在 Dashboard 手动点击触发。

## 执行范围

- 目标项目：BiliDili Ghost workspace，`/Users/gaoxuefeng/Documents/AlembicWorkspace/BiliDili`。
- Dashboard：`http://127.0.0.1:58235/jobs?job=bootstrap_mprqk8s8_4e716dd3`
- job id：`bootstrap_mprqk8s8_4e716dd3`
- session id：`bs_1780108372581_oi5e7u`
- 触发方式：用户在 Dashboard 手动点击 cold-start；AlembicTest 做本机 daemon/API/log/report 监控。
- 使用配置：Ghost workspace AI 配置，provider `deepseek`，model `deepseek-v4-pro`，secret 仅确认 presence，未打印。
- 实际范围：`ALEMBIC_TEST_MODE=1` daemon，`architecture` 单维度；Dashboard 手动 cold-start request 为 `maxFiles=500`、`contentMaxLines=120`、`skipGuard=false`，不是 4 文件 probe。

## Fresh Dist Proof

- Alembic commit：`40cbe8c878688347190574e6b4a6d44474d97a8c`，包含总控已验收的 Wave 6F 代码侧修复提交 `3b7a13235a9c478fd65bed8764820b2d9e005f1e`。
- AlembicAgent commit：`8375f40e795bf22c412d72563db62769c1eeee63`
- Fresh build：`npm --prefix /Users/gaoxuefeng/Documents/AlembicWorkspace/AlembicAgent run build`，结果通过。
- Dist scan：`AlembicAgent/dist/agent/runtime/PcvNodeEvidence.js` 和 `AlembicAgent/dist/agent/strategies/PipelineStrategy.js` 命中 `pcvStageNodeMap` / `pcvChainNodes`。
- Runtime linkage：`Alembic/node_modules/@alembic/agent/package.json` realpath 指向 `/Users/gaoxuefeng/Documents/AlembicWorkspace/AlembicAgent/package.json`，`main` 为 `dist/index.js`。

## Runtime Evidence

- Final job API：`AlembicTest/tmp/pcvm-wave6f-fresh-report-canonical-projection/final-job-bootstrap_mprqk8s8_4e716dd3.json`
- Final events API：`AlembicTest/tmp/pcvm-wave6f-fresh-report-canonical-projection/final-events-bootstrap_mprqk8s8_4e716dd3.json`
- Health API：`AlembicTest/tmp/pcvm-wave6f-fresh-report-canonical-projection/final-health-bootstrap_mprqk8s8_4e716dd3.json`
- Combined log：`AlembicTest/tmp/pcvm-wave6f-fresh-report-canonical-projection/combined-final-bootstrap_mprqk8s8_4e716dd3.log`
- Daemon log：`AlembicTest/tmp/pcvm-wave6f-fresh-report-canonical-projection/daemon-final-bootstrap_mprqk8s8_4e716dd3.log`
- Canonical summary：`AlembicTest/tmp/pcvm-wave6f-fresh-report-canonical-projection/canonical-projection-summary.json`

Job 结果：

- status：`completed`
- duration：494179ms
- completed / failed：1 / 0
- candidates：6 created，1 rejected
- tool calls：23
- token usage：input 322478，output 23454，reasoning 9794，cacheHit 194688

事件计数：

- total developer views：66
- `workflow`：3
- `checkpoint`：1
- `llm.input`：23
- `llm.reflection`：10
- `llm.output`：23
- `tool`：1
- `summary`：4
- `artifact`：1

runtime events canonical / legacy term counts：

- `pcvStageNodeMap`：8
- `pcvChainNodes`：8
- `pcvm:n9:analyze`：296
- `pcvm:n9:quality_gate`：16
- `pcvm:n9:record_repair`：16
- `pcvm:n11:produce`：70
- legacy `N9-agent-analyze-quality`：28
- legacy `N11-produce`：0
- legacy `analyze-evidence-grounding-ledger`：0

解释：fresh Agent dist 后 canonical 四项均进入 runtime events，且旧 `N11-produce` / `analyze-evidence-grounding-ledger` 不再出现在 events 中。runtime 层已不是 stale dist 阻塞。

## Report Evidence

- Latest report API：`AlembicTest/tmp/pcvm-wave6f-fresh-report-canonical-projection/latest-report-bootstrap_mprqk8s8_4e716dd3.json`
- Session report API：`AlembicTest/tmp/pcvm-wave6f-fresh-report-canonical-projection/session-report-api-bs_1780108372581_oi5e7u.json`
- Persisted bootstrap report：`AlembicTest/tmp/pcvm-wave6f-fresh-report-canonical-projection/persisted-bootstrap-report.json`
- Persisted session report：`AlembicTest/tmp/pcvm-wave6f-fresh-report-canonical-projection/persisted-session-report-bs_1780108372581_oi5e7u.json`
- Reports index：`AlembicTest/tmp/pcvm-wave6f-fresh-report-canonical-projection/reports-index-bootstrap_mprqk8s8_4e716dd3.json`

latest / session / persisted report term counts are identical for the checked PCVM terms:

- `pcvStageNodeMap`：0
- `pcvChainNodes`：0
- `pcvm:n9:analyze`：3
- `pcvm:n9:quality_gate`：0
- `pcvm:n9:record_repair`：0
- `pcvm:n11:produce`：3
- legacy `N9-agent-analyze-quality`：0
- legacy `N11-produce`：0
- legacy `analyze-evidence-grounding-ledger`：0
- `pcvScorecard`：1
- `pcvNodeEvidence`：1

Persisted report `pcvScorecard`:

- summary：`blockedNodes=1`，`linkedNodes=2`，`nodeCount=3`
- processMetrics.analyzeGrounding：`nodeIds=["pcvm:n9:analyze"]`，`chainNodeIds=["pcvm:cold-start:n9"]`，`status=linked`
- nodes.n11：`nodeIds=["pcvm:n11:produce"]`，`chainNodeIds=["pcvm:cold-start:n11"]`，`status=blocked-by-observability-gap`
- n11 sourceRefValidity：8/9 valid，invalid ref 为 `main.swift`，reason `file-not-found`

解释：Wave 6F report projection 已经把 report / persisted report 从 legacy `N11-produce` 与 `analyze-evidence-grounding-ledger` 推进到 canonical `pcvm:n9:analyze` / `pcvm:n11:produce`。但当前 report surface 仍未承接 `pcvm:n9:quality_gate` / `pcvm:n9:record_repair`，也未保留 `pcvStageNodeMap` / `pcvChainNodes`。按测试单完整成功条件，本轮不能判为全绿。

## 结果判断

成功部分：

- 用户手动 Dashboard cold-start 完成，job/session 均成功。
- fresh `AlembicAgent/dist` 与 runtime linkage 已确认。
- runtime events 中 canonical `pcvStageNodeMap` / `pcvChainNodes` / `pcvm:n9:*` / `pcvm:n11:produce` 均可见。
- latest/session/persisted report 已出现 canonical `pcvm:n9:analyze` 与 `pcvm:n11:produce`。
- report / persisted report 不再被 legacy `N11-produce` 或 `analyze-evidence-grounding-ledger` 覆盖。

失败 / 缺口部分：

- latest/session/persisted report 未出现 `pcvm:n9:quality_gate`。
- latest/session/persisted report 未出现 `pcvm:n9:record_repair`。
- report / persisted report 未出现 `pcvStageNodeMap` / `pcvChainNodes`。
- N11 scorecard 因 producer source ref `main.swift` file-not-found 标为 `blocked-by-observability-gap`，这是本轮新增可见的 sourceRef validity 风险。

## 边界

本轮能推出：

- Wave 6F 的 report projection 修复部分生效：canonical N9 analyze / N11 produce 已进入 latest/session/persisted report。
- Wave 6E 的 stale dist 风险已排除；若继续缺 `quality_gate` / `record_repair`，优先回到 Alembic report projection / scorecard 汇总边界，而不是判定 Agent dist 陈旧。
- 外部 provider 正确流程可执行：AlembicTest 启动并监控，用户手动触发，之后本机证据完整落盘。

本轮不能推出：

- 不能推出 Wave 6F 完整成功，因为测试单要求的 canonical `quality_gate` / `record_repair` 未进入 report surface。
- 不能推出 full PCVM N0-N14 全链路完成。
- 不能推出 Dashboard comparison UI 行为。
- 不能推出 4 文件 Codex probe 参数等价于本次 Dashboard 手动 cold-start。

## 仓库状态

- BiliDili：无 tracked 变更。
- AlembicAgent：无 tracked 变更。
- AlembicTest：本报告为新增 tracked 变更；runtime JSON/log 证据保存在 ignored `tmp/`。
- Alembic：本轮未修改产品源码；daemon 运行生成 Ghost data root 运行态。

## 遗留风险与下一步

- 风险：真实 AI 输出非确定；本轮只覆盖 BiliDili Ghost workspace 的 `architecture` 单维度。
- 风险：Dashboard 手动 cold-start 使用正常 request 参数，不是 4 文件 probe。
- 风险：N11 sourceRefs 出现 `main.swift` invalid，可能影响后续 N11 scorecard 全绿，应由总控归口到 Agent output / Alembic sourceRef validation 边界判断。
- 下一步建议：总控验收后，若完整目标仍要求 `quality_gate` / `record_repair` 出现在 latest/session/persisted report，应派 `Alembic` 继续检查 report scorecard 汇总是否只投影 analyze grounding 与 N11 produce。
- 下一步建议：如果 sourceRef validity 是下一优化点，应单独建立 N11 sourceRef grounding 修复 / 复测，不要混入本轮 report canonical projection 结论。
