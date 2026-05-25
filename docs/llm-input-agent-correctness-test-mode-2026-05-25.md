# LLM Input Agent Correctness Test Mode

日期：2026-05-25
执行窗口：AlembicTest
测试单：`Test-2026-05-25-05 / LLMI-P2-Agent-Correctness-TestMode`
结论：通过

## 窗口定位

本轮由 `AlembicTest` 承接真实链路验证和证据整理。职责是用最小 test-mode fixture 验证 Alembic internal Agent Wave 1 correctness，不做产品实现修复、不跑 full cold-start、不修改 BiliDili 或 Alembic 系列产品源码。

## 执行范围

- 验证目标：`[object Promise]` retained input 缺口、`code.read({ filePaths })` missing path 缺口、batch partial failure、SCAN planning / `toolChoice=none` 文案一致性。
- 运行方式：`ALEMBIC_TEST_MODE=1`，使用 AlembicAgent dist in-process `AgentRuntime` fixture 和 targeted Vitest。
- 未执行：full cold-start、真实 provider 长任务、Dashboard UI 专项、section 化 input assembly、Observation Ledger、完整 redacted prompt artifact。

## 使用配置

- `ALEMBIC_TEST_MODE=1`
- AlembicAgent package version：`0.2.0`
- AlembicAgent commit：`6cff8beac414ca55eab4af85b31dfad0d1898711`
- Probe 脚本：`AlembicTest/scripts/probe-llm-input-agent-correctness.mjs`
- Probe JSON：`AlembicTest/tmp/llm-input-agent-correctness-test-mode-2026-05-25.json`
- Vitest JSON：`AlembicTest/tmp/llm-input-agent-correctness-vitest-2026-05-25.json`

## 验证命令

```bash
node AlembicTest/scripts/probe-llm-input-agent-correctness.mjs --help
npm --prefix AlembicAgent test -- llm-input-correctness AgentRuntime --reporter=verbose
npm --prefix AlembicAgent test -- llm-input-correctness AgentRuntime --reporter=json --outputFile ../AlembicTest/tmp/llm-input-agent-correctness-vitest-2026-05-25.json
ALEMBIC_TEST_MODE=1 node AlembicTest/scripts/probe-llm-input-agent-correctness.mjs --out AlembicTest/tmp/llm-input-agent-correctness-test-mode-2026-05-25.json
rg -n "\\[object Promise\\]|Missing required param \"path\"|visibleInputSecret12345|同一轮|立即开始执行" AlembicTest/tmp/llm-input-agent-correctness-test-mode-2026-05-25.json
rg -n "containsAsyncGraphContext|containsObjectPromise|containsVisibleInputSecret|requestedToolChoice|effectiveToolChoice|partialFailure|job-retained" AlembicTest/tmp/llm-input-agent-correctness-test-mode-2026-05-25.json
git -C AlembicAgent status --short
git -C BiliDili status --short
```

## 命令结果

- Probe help：通过。
- Targeted Vitest：通过，`13` tests passed；覆盖 `test/llm-input-correctness.test.ts` 和 `test/AgentRuntime.test.ts`。
- Test-mode probe：通过，输出 `ok=true`，写入 `AlembicTest/tmp/llm-input-agent-correctness-test-mode-2026-05-25.json`。
- Negative grep：无匹配，说明证据 JSON 未出现 `[object Promise]`、`Missing required param "path"`、fixture secret、`同一轮`、`立即开始执行`。
- Positive grep：命中 `containsAsyncGraphContext=true`、`containsObjectPromise=false`、`containsVisibleInputSecret=false`、`requestedToolChoice=none`、`effectiveToolChoice=none`、`partialFailure=true`、`job-retained`。

## 关键证据

Retained process events：

- `retainedProcessEvents.kinds=["llm.input","llm.output"]`
- `llmInput.retention="job-retained"`
- `llmInput.sourceClass="developer-facing"`
- `llmInput.phase="analyze"`
- `llmInput.metadata.requestedToolChoice="none"`
- `llmInput.metadata.effectiveToolChoice="none"`
- `llmInput.assertions.containsAsyncGraphContext=true`
- `llmInput.assertions.containsObjectPromise=false`
- `llmInput.assertions.containsVisibleInputSecret=false`

`code.read({ filePaths })`：

- Registry schema：`required=[]`，同时保留 `path` 和 `filePaths` properties，description 包含 `partial failure`。
- Batch result：`requested=3`、`succeeded=1`、`failed=2`、`partialFailure=true`。
- Per-file 结果：`src/a.ts` 成功；`src/missing.ts` 返回 per-file ENOENT；`../outside.ts` 返回 per-file outside project root。
- Negative evidence：JSON 中没有 `Missing required param "path"`。

SCAN planning：

- `phase="SCAN"`
- `toolChoice="none"`
- nudge 明确“制定计划后等待下一轮开始执行第 1 步；如果当前阶段开放工具，再调用对应工具”
- JSON 断言：`saysNextRound=true`、`saysSameRound=false`、`claimsImmediateExecution=false`

## 四项结论

| 目标 | 结论 | 证据 |
| --- | --- | --- |
| `[object Promise]` | 通过 | `buildAnalystPrompt` await async graph context；retained `llm.input` 包含 async graph context 且 `containsObjectPromise=false`。 |
| `filePaths` missing path | 通过 | `code.read` schema `required=[]`；probe batch 调用无 `Missing required param "path"`。 |
| batch partial failure | 通过 | 3 文件 batch 中 1 成功、2 失败，整体保留 per-file data 和 `partialFailure=true`。 |
| SCAN planning / `toolChoice=none` | 通过 | SCAN nudge 不再要求同一轮立即执行工具，表达下一轮 / 工具开放阶段执行。 |

## 失败归口

无失败归口。本轮未发现需要 `AlembicAgent`、`Alembic` 或 `AlembicTest harness` 返工的 correctness 缺口。

## Git 状态

- `AlembicAgent`：clean。
- `BiliDili`：clean。
- `Alembic`、`AlembicCore`、`AlembicPlugin`、`AlembicDashboard`：clean。
- `AlembicTest`：保留前序未提交测试文档 / 脚本变更；本轮新增 `scripts/probe-llm-input-agent-correctness.mjs` 和本报告。
- `AlembicWorkspace`：本轮回填当前 workspace 文档，待总控统一提交。

## 遗留风险

- 本轮是最小 test-mode correctness 复测，不覆盖 full cold-start、真实 provider 长任务或 Dashboard 展示。
- 本轮复测证明 Agent correctness 已闭合，但不关闭后续 Wave 的 section 化 input assembly、Observation Ledger、完整 redacted prompt artifact 和 Dashboard artifact 展示目标。
- Probe 证据 JSON 位于 `AlembicTest/tmp/`，其中包含本机临时目录路径，仅作为本轮本地运行证据，不作为长期脱敏 fixture。

## 下一步建议

- 总控可将 `Test-2026-05-25-05` 标为通过，并关闭 Wave 1 correctness test-mode 复测门。
- 后续按既定阶段进入 Wave 2 / Agent input layering，再推进 Observation Ledger、artifact storage 和 Dashboard 展示。
