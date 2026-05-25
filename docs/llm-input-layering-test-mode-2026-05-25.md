# LLM Input Layering Test Mode Retest

日期：2026-05-25
测试单：`Test-2026-05-25-06 / LLMI-P4-Agent-Input-Layering-TestMode`
执行窗口：`AlembicTest`

## 结论

通过（test-mode / source runtime 范围内通过）。本轮没有启动 daemon，没有跑 full cold-start，没有操作 BiliDili 业务代码，也没有修改 AlembicAgent 产品源码。

关键结论：

- AlembicAgent 目标提交为 `bf0a2c2cb0c3d760817ac699e5f47d83e0e5b4d9`，执行前后工作区保持 clean。
- `llm-input-layering` targeted Vitest 通过 `5/5`。
- AlembicTest runtime capture fixture 通过 `3/3`，直接捕获 Analyze / RECORD / PRODUCE 三类运行态 `llm.input.metadata` 和 provider runtime layer。
- Wave 1 regression probe 通过：无 `[object Promise]`，`code.read({ filePaths })` 未回退到 `Missing required param "path"`，batch partial failure 仍为 true。
- 发现遗留风险：AlembicAgent 当前 `dist/` 未刷新，`dist/agent/runtime/LLMInputAssembly.js` 不存在，`dist/agent/runtime/AgentRuntime.js` 仍是旧 dynamicContext-only 路径。该风险归口 `AlembicAgent` 发布 / 构建产物同步，不阻断本轮 source test-mode 复测结论，但会阻塞后续 package/runtime 级验证。

## 执行范围

- 只使用 AlembicAgent source test-mode / minimal fixture。
- 未启动 Alembic daemon，未触发 cold-start / rescan。
- 未修改 `AlembicAgent`、`Alembic`、`AlembicCore`、`AlembicDashboard`、`AlembicPlugin` 产品源码。
- 未操作 BiliDili 产品源码、UI、登录、网络或播放逻辑。
- 新增 AlembicTest probe 脚本和测试报告；当前测试单要求不得提交子仓库，本轮未提交 commit。

## 使用配置

- `ALEMBIC_TEST_MODE=1`
- AlembicAgent package version：`0.2.0`
- AlembicAgent commit：`bf0a2c2cb0c3d760817ac699e5f47d83e0e5b4d9`
- Probe 脚本：`AlembicTest/scripts/probe-llm-input-layering.mjs`
- 汇总 JSON：`AlembicTest/tmp/llm-input-layering-test-mode-2026-05-25.json`
- Targeted Vitest JSON：`AlembicTest/tmp/llm-input-layering-vitest-2026-05-25.json`
- Runtime capture JSON：`AlembicTest/tmp/llm-input-layering-runtime-capture-2026-05-25.json`
- Runtime capture Vitest JSON：`AlembicTest/tmp/llm-input-layering-runtime-capture-vitest-2026-05-25.json`
- Wave 1 regression JSON：`AlembicTest/tmp/llm-input-layering-wave1-regression-2026-05-25.json`

## 验证命令

```bash
node --check AlembicTest/scripts/probe-llm-input-layering.mjs
node AlembicTest/scripts/probe-llm-input-layering.mjs --help
npm --prefix AlembicTest run check
npm --prefix AlembicAgent test -- llm-input-layering --reporter=verbose
ALEMBIC_TEST_MODE=1 node AlembicTest/scripts/probe-llm-input-layering.mjs --out AlembicTest/tmp/llm-input-layering-test-mode-2026-05-25.json --vitest-output AlembicTest/tmp/llm-input-layering-vitest-2026-05-25.json --capture-output AlembicTest/tmp/llm-input-layering-runtime-capture-2026-05-25.json --capture-vitest-output AlembicTest/tmp/llm-input-layering-runtime-capture-vitest-2026-05-25.json --wave1-output AlembicTest/tmp/llm-input-layering-wave1-regression-2026-05-25.json
```

执行结果：

- `node --check`：通过。
- `probe --help`：通过。
- `npm --prefix AlembicTest run check`：通过，包含新 probe help。
- `npm --prefix AlembicAgent test -- llm-input-layering --reporter=verbose`：通过，`1` file / `5` tests。
- `probe-llm-input-layering.mjs`：通过，汇总结论为 `sourceTestModeRuntime=passed`、`wave1Regression=passed`、`distArtifactRisk=dist_not_refreshed_after_source_change`。

## 关键证据

### Analyze / retained llm.input

`AlembicTest/tmp/llm-input-layering-runtime-capture-2026-05-25.json` 捕获：

- `inputLayerAppended=true`
- `inputStageProfile="analyze"`
- `inputSectionIds=["identity","stagePolicy","toolContract","taskContext","evidenceContext","dynamicContext"]`
- `providerVisibleSectionIds=["identity","stagePolicy","toolContract","taskContext","evidenceContext","dynamicContext"]`
- developer-visible input section presence：`Identity`、`Stage policy`、`Tool contract`、`Task context`、`Evidence context`、`Dynamic context`、`Provider runtime layer` 均为 true。
- provider 最后一条 runtime layer 包含 `# LLM input runtime layer`、`## Stage policy`、`## Tool contract`、`## Task context`、`## Evidence context`、`## Dynamic context`。
- fixture secret 未出现在 developer-visible input。

### RECORD profile

Runtime capture 显示：

- `inputStageProfile="record"`
- `toolSchemaNames=["note_finding"]`
- provider layer 包含 `Record-only phase`
- `providerHasCodeExploreInstruction=false`
- `providerHasGraphExploreInstruction=false`

说明 RECORD / record-repair 仍是 note_finding / record-only 语义，没有重新注入 code / graph 探索要求。

### PRODUCE profile

Runtime capture 显示：

- `inputStageProfile="produce"`
- `toolSchemaNames=["code","knowledge"]`
- provider layer 包含 `stageProfile: produce` 和 `Producer phase`
- `systemPromptHasProducerBudget=true`
- `systemPromptHasAnalystExploration=false`
- `systemPromptHasStructuredQuery=false`
- producer tracker 为 `phase=PRODUCE`、`pipelineType=producer`

说明 PRODUCE / producer 使用 produce profile 和 Producer budget，没有继承 Analyst exploration / graph 搜索预算。

### Wave 1 regression

`AlembicTest/tmp/llm-input-layering-wave1-regression-2026-05-25.json` 显示：

- `noObjectPromiseInAnalystPrompt=true`
- `noObjectPromiseInRetainedInput=true`
- `noMissingPathRegression=true`
- `batchPartialFailure=true`

## Git 状态

- `AlembicAgent`：clean。
- `BiliDili`：clean。
- `Alembic` / `AlembicCore` / `AlembicPlugin` / `AlembicDashboard`：未参与本轮修改，抽查为 clean。
- `AlembicTest`：存在前序未提交材料；本轮新增 `scripts/probe-llm-input-layering.mjs` 和本报告，并更新 `package.json` / `scripts/README.md` 的 probe 入口。
- `AlembicWorkspace`：本轮回填当前文档；按 workspace 规则不由 AlembicTest 窗口提交。

## 失败归口

本轮 source test-mode 验证无失败。

遗留风险归口：

- `AlembicAgent` 发布 / 构建产物同步：当前 `dist/` 未包含 Wave 2 runtime input assembly。若后续用 package `dist` 或已安装 runtime 验证，必须先刷新 / 发布 dist，或在总控中明确 source-only 与 package runtime 的验收边界。

## 遗留风险

- 未覆盖 full cold-start / rescan。
- 未覆盖真实 provider 长任务、Dashboard 展示、Observation Ledger、完整 redacted prompt artifact 或 Recipe / Skill 质量回归。
- Runtime capture 使用 Vitest source transform 执行 AlembicAgent source，而不是当前 `dist/` 产物。
- Probe 输出位于 `AlembicTest/tmp/`，包含本机临时路径，仅作为本轮本地运行证据。

## 下一步建议

- 总控验收本测试单后，可以把 Wave 2 source test-mode 复测门标为通过。
- 在进入 package/runtime 或 cold-start 集成前，安排 `AlembicAgent` 刷新并验证 `dist/`，避免 source 通过但实际消费旧产物。
- 后续按原阶段进入 Wave 3 Observation Ledger；Dashboard / prompt artifact 保留到对应 Wave。
