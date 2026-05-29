# PCVM Wave 6E Fresh Agent Dist After-run

日期：2026-05-29
窗口：AlembicTest
任务：PCVM-W6E-ALEMBICTEST-FRESH-AGENT-DIST-AFTER-RUN
结论：partial pass / report canonical identity gap remains

## 窗口定位

本轮由 AlembicTest 执行受保护真实 / 默认 AI after-run 验证；不修改产品源码，不替总代控验收，不优化 Agent prompt，不做 Dashboard comparison UI。

## 执行范围

- 目标项目：BiliDili Ghost workspace，`/Users/gaoxuefeng/Documents/AlembicWorkspace/BiliDili`。
- Dashboard：`http://127.0.0.1:53688/jobs?job=bootstrap_mpr0rg8k_01f5bd68`
- job id：`bootstrap_mpr0rg8k_01f5bd68`
- session id：`bs_1780065039431_a3xvpc`
- 触发方式：Codex 只启动/确认 Alembic 并监控；真实 cold-start 由用户在 Dashboard 手动点击触发。
- 使用配置：Ghost workspace 默认 AI 配置，provider `deepseek`，model `deepseek-v4-pro`，secret 仅确认存在，未打印。
- 实际范围：`ALEMBIC_TEST_MODE=1` daemon，`architecture` 单维度；手动 Dashboard cold-start 没有使用 Codex probe 的 `maxFiles=4` / `contentMaxLines=40` / `skipGuard=true` 参数，报告显示项目文件数 127、引用文件 10。

## Fresh Dist Proof

- AlembicAgent commit：`c70094d0b3841c4fba56a3e155c4fecc14f38086`
- Alembic commit：`acd273eca051c569094781f868b0271e91622458`
- BiliDili commit：`5b10fd4c72ccc8aeda2e9b84289748b7d883d804`
- AlembicTest commit：`add68ee80acbaba2a4df6ee82d0f081641ecca20`
- Fresh build：`PATH="/Users/gaoxuefeng/.nvm/versions/node/v22.22.1/bin:$PATH" npm --prefix /Users/gaoxuefeng/Documents/AlembicWorkspace/AlembicAgent run build`
- Dist scan：`AlembicAgent/dist/agent/strategies/PipelineStrategy.js` 和 `AlembicAgent/dist/agent/runtime/PcvNodeEvidence.js` 均命中 `pcvStageNodeMap` / `pcvChainNodes`。
- Runtime linkage：`Alembic/node_modules/@alembic/agent/package.json` realpath 指向 `/Users/gaoxuefeng/Documents/AlembicWorkspace/AlembicAgent/package.json`，package main 为 `dist/index.js`。
- Git 状态：`AlembicAgent`、`Alembic`、`BiliDili`、`AlembicTest` 在执行后均无 tracked 变更。

## Runtime Evidence

- Final job API：`AlembicTest/tmp/pcvm-wave6e-final-job-bootstrap_mpr0rg8k_01f5bd68.json`
- Final events API：`AlembicTest/tmp/pcvm-wave6e-final-events-bootstrap_mpr0rg8k_01f5bd68.json`
- Health API：`AlembicTest/tmp/pcvm-wave6e-final-health-bootstrap_mpr0rg8k_01f5bd68.json`
- Combined log：`AlembicTest/tmp/pcvm-wave6e-combined-final-bootstrap_mpr0rg8k_01f5bd68.log`
- Daemon log：`AlembicTest/tmp/pcvm-wave6e-daemon-final-bootstrap_mpr0rg8k_01f5bd68.log`
- Canonical summary：`AlembicTest/tmp/pcvm-wave6e-canonical-summary.json`

事件计数：

- total：61
- `workflow`：3
- `checkpoint`：1
- `llm.input`：20
- `llm.reflection`：11
- `llm.output`：20
- `tool`：1
- `summary`：4
- `artifact`：1

runtime events 中的 canonical 命中：

- `pcvStageNodeMap`：8
- `pcvChainNodes`：8
- `pcvm:n9:analyze`：74
- `pcvm:n9:quality_gate`：16
- `pcvm:n9:record_repair`：16
- `pcvm:n11:produce`：54
- legacy `N9-agent-analyze-quality`：280
- legacy `N11-produce`：8

解释：fresh dist 后 canonical map 不再只停留在总控源码推断；它确实进入了 runtime process events。尤其是 initial dimension input 和后续 `pcvNodeEvidence` 中可见 canonical `pcvm:n9:analyze` / `pcvm:n11:produce`。但 `traceEnvelope`、`pcvN9Observability`、部分 runtime projection 仍保留 legacy `N9-agent-analyze-quality`。

## Report Evidence

- Latest report API：`AlembicTest/tmp/pcvm-wave6e-latest-report-bootstrap_mpr0rg8k_01f5bd68.json`
- Session report API：`AlembicTest/tmp/pcvm-wave6e-session-report-api-bs_1780065039431_a3xvpc.json`
- Persisted bootstrap report：`AlembicTest/tmp/pcvm-wave6e-persisted-bootstrap-report-bootstrap_mpr0rg8k_01f5bd68.json`
- Persisted session report：`AlembicTest/tmp/pcvm-wave6e-persisted-session-report-bs_1780065039431_a3xvpc.json`
- Reports index：`AlembicTest/tmp/pcvm-wave6e-reports-index-bootstrap_mpr0rg8k_01f5bd68.json`

latest/session/persisted report term counts:

- `pcvStageNodeMap`：0
- `pcvChainNodes`：0
- `pcvm:n9:analyze`：0
- `pcvm:n9:quality_gate`：0
- `pcvm:n9:record_repair`：0
- `pcvm:n11:produce`：0
- legacy `N11-produce`：4
- `analyze-evidence-grounding-ledger`：4

Persisted report `pcvScorecard`:

- summary：`blockedNodes=0`，`linkedNodes=3`，`nodeCount=3`
- `n8.nodeId`：`N8-stage-factory-tool-policy`
- `groundingLedger.nodeId`：`analyze-evidence-grounding-ledger`，`burnCount=19`，`evidenceProducedCount=14`
- `n11.nodeId`：`N11-produce`，`acceptedCount=10`，`sourceRefValidityStatus=valid`
- `n12.nodeId`：`N12-consumers-persistence`

解释：report / persisted report 尚未承接 canonical `pcvm:*` identity。fresh Agent dist 排除后，缺口不应再归因于 stale dist；下一步应检查 `AlembicAgent` traceEnvelope / observability projection 与 `Alembic` report projection / persistence 哪一层仍使用 legacy node id。

## 结果判断

成功部分：

- Alembic 服务启动并完成用户手动 Dashboard cold-start。
- fresh `AlembicAgent/dist` 已证明有效，runtime linkage 指向 fresh dist。
- runtime events 真实产生 `llm.input` / `llm.output` / `llm.reflection` / `tool` / `summary` / `artifact`。
- canonical `pcvStageNodeMap` / `pcvChainNodes` 与 `pcvm:n9:*` / `pcvm:n11:produce` 已进入 process events。
- N11 producer sourceRefs 在 persisted report 中为 valid，10/10 accepted candidates findable。

失败 / 缺口部分：

- latest report / session report / persisted report 均未出现 canonical `pcvm:n9:*` 或 `pcvm:n11:produce`。
- report `pcvScorecard` 仍显示 legacy `N11-produce` 和 `analyze-evidence-grounding-ledger`。
- runtime `traceEnvelope` 和 `pcvN9Observability` 中仍大量出现 legacy `N9-agent-analyze-quality`。
- 由于本轮改为用户手动 Dashboard cold-start，不能证明 Codex probe 的 4 文件小样本参数链路；本轮证明的是同一 fresh dist daemon 下的真实 UI cold-start after-run。

## 边界

本轮能推出：

- stale `AlembicAgent/dist` 已被排除为唯一原因。
- fresh dist 后 canonical identity 至少进入 runtime process events。
- report / persisted report 仍没有 canonical identity，后续需要继续收 trace / report projection carry。

本轮不能推出：

- 不能推出 full PCVM N0-N14 全链路完成。
- 不能推出 Dashboard comparison UI 行为。
- 不能推出 4 文件 Codex probe 参数等价于本次手动 Dashboard cold-start。
- 不能推出真实 AI 输出稳定性。

## 遗留风险与下一步

- 风险：用户手动触发 cold-start 发送了 BiliDili 项目上下文给 DeepSeek；本报告只记录 provider/model 和 key presence，不记录 secret。
- 风险：Ghost data root 中生成 candidates、skills、semantic memory 和 reports；BiliDili git tree 本身保持 clean。
- 下一步建议：由总控裁决是否派 `AlembicAgent` 检查 `traceEnvelope` / `pcvN9Observability` legacy fallback，或派 `Alembic` 检查 report / persisted report projection 对 canonical `pcvNodeEvidence` 的消费。
- 下一步建议：如果仍需严格 4 文件小样本，需要产品侧提供不外发真实源码的安全 fixture / local mock provider，或由用户在受信任环境手动运行并提供 raw evidence。
