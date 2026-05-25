# LLM Input Package Runtime Integration

日期：2026-05-25
窗口：`AlembicTest`
测试单：`Test-2026-05-25-09 / LLMI-P11-Package-Runtime-Integration`
状态：通过，待总控验收

## 当前窗口定位和仓库职责

- 当前窗口定位：`AlembicTest` 独立测试验证窗口。
- 本轮职责：验证 `AlembicAgent` Wave 6A staged package/runtime artifact 能被下游以 package 形态真实消费。
- 明确边界：不改产品源码；不操作 BiliDili；不启动 full cold-start / rescan；不发布 npm package；只在 `AlembicTest` 增加 probe、报告和本轮本地证据。

## 测试结论

通过。`AlembicTest` package/runtime probe 使用 `ALEMBIC_TEST_MODE=1` 创建临时 `node_modules` harness，通过 public package subpath 导入 staged `@alembic/agent` runtime / memory / tools-v2 产物，完成以下断言：

- staged package manifest 为 `@alembic/agent@0.2.0`，`@alembic/core=0.2.0`，无 local `file:` / `link:` dependency。
- dry-run pack shasum 与 Wave 6A 证据一致：`dbd390be0d13cca816c1bdb6de354b1838aca55f`。
- package public imports 解析到临时 harness 的 `node_modules/@alembic/agent/dist/...`，实际 symlink 指向 `AlembicAgent/tmp/release/@alembic-agent`，未解析到 `src/`。
- staged runtime 产物包含并实际使用 `buildLlmInputAssembly`、`AgentRuntime`、`ActiveContext` Observation Ledger、Tool V2 `code.read({ filePaths })` batch read。
- batch read 运行结果 `requested=2 / succeeded=2 / failed=0`，没有 `Missing required param "path"` 回退。
- LLM input assembly 生成 `# LLM input runtime layer`，stage profile 为 `analyze`，provider messages 数量为 `2`，动态上下文包含 Observation Ledger。
- 输出序列化中没有 `[object Promise]`。

## 执行范围

- 使用 staged package：`AlembicAgent/tmp/release/@alembic-agent`。
- 使用 core package root：`AlembicCore`，作为本地 harness 依赖解析目标。
- 使用 probe：`AlembicTest/scripts/probe-package-runtime-integration.mjs`。
- 原始 JSON 证据：`AlembicTest/tmp/llm-input-package-runtime-integration.json`。
- 临时 harness 证据：`AlembicTest/tmp/package-runtime-integration-harness-2026-05-25T08-55-46-350Z/runtime-probe-output.json`。

## 使用配置

- `ALEMBIC_TEST_MODE=1`
- Node：本机 Codex Node 22 runtime
- `@alembic/agent` staged version：`0.2.0`
- `@alembic/core` dependency version：`0.2.0`
- `AlembicAgent` source commit：`8970327d73bf6c01476a1aeb5384f014483b68dd`
- `AlembicCore` source commit：`b72390f2066f6406ce432b7dc94448dcd05862a3`
- Dashboard URL：未使用
- job id / session id：不适用，本轮未启动 daemon job

## 关键证据

Manifest / package:

- staged manifest path：`AlembicAgent/tmp/release/@alembic-agent/package.json`
- `dependencies["@alembic/core"] = "0.2.0"`
- `localDependencies = []`
- `alembicRelease.sources["@alembic/agent"].sourceCommit = 8970327d73bf6c01476a1aeb5384f014483b68dd`
- pack preview：`alembic-agent-0.2.0.tgz`，entry count `417`，size `450194`，unpacked size `1736153`，shasum `dbd390be0d13cca816c1bdb6de354b1838aca55f`

Runtime file evidence:

| 产物 | 证据 |
| --- | --- |
| `dist/agent/runtime/LLMInputAssembly.js` | `buildLlmInputAssembly`、`# LLM input runtime layer`、`inputStageProfile` 均存在 |
| `dist/agent/runtime/AgentRuntime.js` | 导入并调用 `buildLlmInputAssembly`，生成 `kind: 'llm.input'` |
| `dist/agent/memory/ActiveContext.js` | 包含 `## Observation Ledger` 与 `#buildObservationLedgerSection` |
| `dist/tools/v2/handlers/code.js` | 包含 `MAX_BATCH_READ_FILES = 5`、`params.filePaths`、`path/filePaths` 互斥与缺参错误 |
| `dist/tools/v2/registry.js` | `code.read` 摘要为 single path or batch `filePaths` |

Package-shape runtime evidence:

- runtime import：`file://<workspace>/AlembicTest/tmp/package-runtime-integration-harness-2026-05-25T08-55-46-350Z/node_modules/@alembic/agent/dist/agent/runtime/index.js`
- memory import：`file://<workspace>/AlembicTest/tmp/package-runtime-integration-harness-2026-05-25T08-55-46-350Z/node_modules/@alembic/agent/dist/agent/memory/index.js`
- tools-v2 import：`file://<workspace>/AlembicTest/tmp/package-runtime-integration-harness-2026-05-25T08-55-46-350Z/node_modules/@alembic/agent/dist/tools/v2/index.js`
- symlink target：`node_modules/@alembic/agent -> AlembicAgent/tmp/release/@alembic-agent`
- public exports：`AgentRuntime=function`、`ActiveContext=function`、`ToolRouterV2=function`

Runtime capture:

- `code.read({ filePaths: ["package.json", "scripts/README.md"] })`：`mode=batch`，`requested=2`，`succeeded=2`，`failed=0`，`maxFiles=5`
- Observation Ledger excerpt 包含 `### evidence` / `### readSet` 与 `package.json`、`scripts/README.md`
- LLM input assembly：`stageProfile=analyze`，`inputLayerAppended=true`，`inputSectionIds=["identity","stagePolicy","toolContract","taskContext","evidenceContext","dynamicContext"]`
- regression guards：`noObjectPromise=true`，`noMissingRequiredPath=true`，`noSrcResolution=true`

## 验证命令

| 命令 | 结果 |
| --- | --- |
| `node --check AlembicTest/scripts/probe-package-runtime-integration.mjs` | 通过 |
| `node AlembicTest/scripts/probe-package-runtime-integration.mjs --help` | 通过 |
| `npm --prefix AlembicTest run check` | 通过，包含新 probe help |
| `ALEMBIC_TEST_MODE=1 node AlembicTest/scripts/probe-package-runtime-integration.mjs` | 通过，输出 `AlembicTest/tmp/llm-input-package-runtime-integration.json` |

## Git / 写入边界

- `AlembicAgent`：probe 前后 `git status --short` 为空。
- `AlembicCore`：probe 前后 `git status --short` 为空。
- `AlembicTest`：本轮新增 `scripts/probe-package-runtime-integration.mjs` 和本报告，并更新 `package.json`、`scripts/README.md`；同时保留前序 Test-07 / Test-08 未提交资产。
- `BiliDili`：本轮未操作。
- source runtime 写入：`AlembicAgent/.asd`、`AlembicCore/.asd`、`AlembicAgent/Alembic`、`AlembicCore/Alembic` 均不存在；本轮 runtime 输出只落在 `AlembicTest/tmp/`。

## 失败归口

无失败归口。本轮未发现需要 `AlembicAgent`、`Alembic`、`AlembicDashboard`、`AlembicPlugin` 或 AlembicTest harness 返工的问题。

## 遗留风险

- 本轮是 package/runtime 最小集成 probe，不覆盖 full cold-start、真实 provider 长任务或 Dashboard UI 展示。
- harness 为本地 package-shape symlink 验证，不等同于 npm registry install；但 dry-run pack shasum、manifest 依赖和 public import 路径已证明 staged package 形态可消费。
- `AlembicTest` 仓库仍有前序测试资产未提交，本轮未按用户要求执行封口提交。

## 下一步建议

- 总控验收 Test-09 后，可关闭 LLM 输入优化 Wave 6 package/runtime 下游集成验证门禁。
- 若后续需要 registry install 级别证据，应另起发布前 pack/install smoke，不应在本测试单内扩大到 npm publish 或 full cold-start。
