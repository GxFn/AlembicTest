# LLM Input Observation Ledger Test Mode Retest

日期：2026-05-25
测试单：`Test-2026-05-25-07 / LLMI-P6-Agent-Observation-Ledger-TestMode`
执行窗口：`AlembicTest`

## 结论

通过（test-mode / source runtime 范围内通过）。本轮没有启动 daemon，没有跑 full cold-start，没有操作 BiliDili 业务代码，也没有修改 AlembicAgent 产品源码。

关键结论：

- AlembicAgent 目标提交为 `8970327d73bf6c01476a1aeb5384f014483b68dd`，执行前后工作区保持 clean。
- `ALEMBIC_TEST_MODE=1` probe 通过，结论为 `retainedLlmInputLedger=passed`、`providerMessageLedger=passed`、`debugFieldContraction=passed`、`scratchpadPriority=passed`、`wave1Wave2Regression=passed`。
- AlembicAgent source targeted Vitest 通过 `13/13`，覆盖 `llm-input-correctness`、`llm-input-layering` 和 `ActiveContext`。
- AlembicTest runtime capture fixture 通过 `1/1`，直接捕获 retained `llm.input` 和 provider message 中的 `## Observation Ledger`。
- retained `llm.input` 与 provider-facing ledger 均包含 `evidence`、`readSet`、`searchSet`、`failureSet`、`nextHints` 五类语义，且默认不再出现 raw `之前的探索摘要`。
- provider-facing ledger 中 `callId`、`parentCallId`、`startedAt`、`durationMs`、`timestamp`、`diagnostics`、`structuredContent`、`_meta` 均为未出现。

## 执行范围

- 只使用 AlembicAgent source test-mode / minimal fixture。
- 未启动 Alembic daemon，未触发 cold-start / rescan。
- 未修改 `AlembicAgent`、`Alembic`、`AlembicCore`、`AlembicDashboard`、`AlembicPlugin` 产品源码。
- 未操作 BiliDili 产品源码、UI、登录、网络或播放逻辑。
- 新增 AlembicTest probe 脚本和测试报告；本轮未提交 commit。

## 使用配置

- `ALEMBIC_TEST_MODE=1`
- AlembicAgent package version：`0.2.0`
- AlembicAgent commit：`8970327d73bf6c01476a1aeb5384f014483b68dd`
- Probe 脚本：`AlembicTest/scripts/probe-llm-observation-ledger.mjs`
- 汇总 JSON：`AlembicTest/tmp/llm-input-observation-ledger-test-mode-2026-05-25.json`
- Targeted Vitest JSON：`AlembicTest/tmp/llm-input-observation-ledger-vitest-2026-05-25.json`
- Runtime capture JSON：`AlembicTest/tmp/llm-input-observation-ledger-runtime-capture-2026-05-25.json`
- Runtime capture Vitest JSON：`AlembicTest/tmp/llm-input-observation-ledger-runtime-capture-vitest-2026-05-25.json`

## 验证命令

```bash
node --check AlembicTest/scripts/probe-llm-observation-ledger.mjs
node AlembicTest/scripts/probe-llm-observation-ledger.mjs --help
npm --prefix AlembicTest run check
ALEMBIC_TEST_MODE=1 node AlembicTest/scripts/probe-llm-observation-ledger.mjs --out AlembicTest/tmp/llm-input-observation-ledger-test-mode-2026-05-25.json --vitest-output AlembicTest/tmp/llm-input-observation-ledger-vitest-2026-05-25.json --capture-output AlembicTest/tmp/llm-input-observation-ledger-runtime-capture-2026-05-25.json --capture-vitest-output AlembicTest/tmp/llm-input-observation-ledger-runtime-capture-vitest-2026-05-25.json
```

执行结果：

- `node --check`：通过。
- `probe --help`：通过。
- `npm --prefix AlembicTest run check`：通过，包含新 probe help。
- `probe-llm-observation-ledger.mjs`：通过，内部运行 AlembicAgent targeted Vitest `13/13` 和 runtime capture Vitest `1/1`。

## 关键证据

### Retained llm.input

`AlembicTest/tmp/llm-input-observation-ledger-runtime-capture-2026-05-25.json` 捕获：

- `containsRuntimeLayer=true`
- `containsObservationLedger=true`
- `containsRawPreviousSummary=false`
- `categoryPresence.evidence=true`
- `categoryPresence.readSet=true`
- `categoryPresence.searchSet=true`
- `categoryPresence.failureSet=true`
- `categoryPresence.nextHints=true`
- `scratchpadBeforeLedger=true`
- `debugFieldPresenceInLedger.callId=false`
- `debugFieldPresenceInLedger.parentCallId=false`
- `debugFieldPresenceInLedger.startedAt=false`
- `debugFieldPresenceInLedger.durationMs=false`
- `debugFieldPresenceInLedger.timestamp=false`
- `debugFieldPresenceInLedger.diagnostics=false`
- `debugFieldPresenceInLedger.structuredContent=false`
- `debugFieldPresenceInLedger._meta=false`

Ledger preview 摘要：

```text
## Observation Ledger
### evidence
- [R1|code] Read src/agent/memory/ActiveContext.ts
- [R1|code] Read src/agent/runtime/AgentRuntime.ts
- [R1|code] Searched Observation Ledger in src/agent/**
- [R1|code] Searched dynamic context in src/agent/**
- [R1|code] Attempted read src/agent/memory/Missing.ts
### readSet
- [R1|code] src/agent/memory/ActiveContext.ts
- [R1|code] src/agent/runtime/AgentRuntime.ts
- [R1|code] src/agent/memory/Missing.ts
### searchSet
- [R1|code] Observation Ledger in src/agent/**
- [R1|code] dynamic context in src/agent/**
### failureSet
- [R1|code] code.read failed: message: Cannot read file
### nextHints
- [R1|code] Read src/agent/memory/ActiveContext.ts before retrying missing evidence.
```

### Provider message

同一 runtime capture 显示：

- `containsRuntimeLayer=true`
- `containsDynamicContext=true`
- `containsObservationLedger=true`
- `containsRawPreviousSummary=false`
- `categoryPresence` 五类均为 true。
- `debugFieldPresenceInLedger` 八个 debug 字段均为 false。
- `scratchpadBeforeLedger=true`，provider message 中 `## 📌 已确认的关键发现` 的索引小于 `## Observation Ledger`。

### Wave 1 / Wave 2 regression

Runtime capture 显示：

- `containsObjectPromise=false`
- `containsMissingRequiredPath=false`
- `inputLayerAppended=true`
- `inputStageProfile="analyze"`

Targeted Vitest JSON 显示 `13/13` tests passed，覆盖已有 `llm-input-correctness`、`llm-input-layering` 和 `ActiveContext observation ledger` 回归。

## Git 状态

- `AlembicAgent`：clean。
- `BiliDili`：clean。
- `Alembic` / `AlembicCore` / `AlembicPlugin` / `AlembicDashboard`：本轮只读抽查，均为 clean。
- `AlembicTest`：本轮新增 `scripts/probe-llm-observation-ledger.mjs` 和本报告，并更新 `package.json` / `scripts/README.md` 的 probe 入口。
- `AlembicWorkspace`：已有总控文档变更，本轮只回填当前测试单和 Wave 3 状态；按 workspace 规则不由 AlembicTest 窗口提交。

## 失败归口

本轮 source test-mode 验证无失败，不需要归口 `AlembicAgent` / `Alembic` / `AlembicTest harness` 返工。

## 遗留风险

- 未覆盖 full cold-start / rescan。
- 未覆盖真实 provider 长任务、Dashboard 展示、完整 redacted prompt artifact、trace envelope、metrics 或 Recipe / Skill 质量回归。
- Runtime capture 使用 Vitest source transform 执行 AlembicAgent source，不代表当前 package `dist` 产物。
- `AlembicAgent/dist` 未刷新仍保留为 `GTODO-2026-05-25-002`，进入 package/runtime 或 cold-start 集成验证前必须处理。
- Probe 输出位于 `AlembicTest/tmp/`，包含本机临时路径，仅作为本轮本地运行证据。

## 下一步建议

- 总控验收本测试单后，可以关闭 Wave 3 source test-mode 复测门。
- 下一波按总控计划启动 `Alembic` prompt / output artifact、trace envelope 和 metrics；再由 Dashboard 接 Timeline 摘要与 artifact 详情。
- 在进入 package/runtime 或 cold-start 集成前，安排 `AlembicAgent` 刷新并验证 `dist/`。
