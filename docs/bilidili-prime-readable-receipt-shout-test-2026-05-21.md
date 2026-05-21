# BiliDili Prime Readable Receipt Shout Test - 2026-05-21

状态：测试通过，待总控验收  
测试单：Test-2026-05-21-04  
执行窗口：AlembicTest  
目标项目：BiliDili  
触发入口：Alembic Codex MCP stdio runtime -> `alembic_task(operation=prime)`  
测试时间：2026-05-21

## 测试目标

本次复测验证 `AlembicPlugin` SHOUT-5 后，BiliDili 真实项目上下文中的 prime receipt shout 是否从 evidenceRefs 路径清单变成主动、有声量的知识摘要。

验收重点：

- prime tool result 后，下一条开发者可见响应仍然先做 receipt shout，再继续任何后续动作。
- delivered 态可见响应主动喊出 Recipe / Guard 知识摘要、模式、风险或后续判断依据。
- 默认不倾倒 evidenceRefs 路径 / 行号，也不把“缺少行号”当作可见重点。
- payload 仍结构化保留 evidenceRefs，供后续复核或用户要求引用。
- `hostResponse` 仍保留 immediate 时序字段，`serviceBoundary` 仍是 Plugin-owned Codex-facing。
- BiliDili 测试前后 git 状态保持干净。

## 执行范围

执行了只读插件 probe，没有启动 cold-start / rescan，没有修改 BiliDili 源码、工程配置、登录、播放、网络、UI 或 Xcode 项目结构。

使用命令：

```bash
git -C BiliDili status --short --branch
node AlembicTest/scripts/probe-codex-prime.mjs --output AlembicTest/tmp/bilidili-prime-readable-receipt-shout-probe-2026-05-21.json
git -C BiliDili status --short --branch
```

说明：probe 通过 workspace 内 `AlembicPlugin/dist/bin/codex-mcp.js` 启动 Codex MCP stdio runtime，并把 `ALEMBIC_PROJECT_DIR` 指向 workspace 内 `BiliDili`。原始 JSON 保存在 `AlembicTest/tmp/`，长期报告只记录脱敏摘要。

## 版本证据

| 组件 | 证据 |
| --- | --- |
| Codex plugin cache marker | `<codex-cache>/gxfn/alembic-codex/0.1.2/.alembic-dev-refresh.json` 显示 `gitHead=58b82f8526d68aef516d68477d7a0e505fc114e9`，`localMcpEntry` 指向 workspace `AlembicPlugin/dist/bin/codex-mcp.js`，`packageVersion=0.1.2` |
| AlembicPlugin 源仓库 | `58b82f8526d68aef516d68477d7a0e505fc114e9`，`fix: make prime receipt shout readable` |
| AlembicCodex runtime artifact | `df608057bd274ebb6b39f6a9c0e964f1b8517426`，`chore: refresh readable prime receipt runtime` |
| cache Skill | `<codex-cache>/gxfn/alembic-codex/0.1.2/skills/alembic/SKILL.md:25` 包含 `briefly and actively shout`，并要求 `do not dump paths or line numbers by default` |
| cache runtime Skill | `<codex-cache>/gxfn/alembic-codex/0.1.2/runtime/plugins/alembic-codex/skills/alembic/SKILL.md:25` 同步包含 readable receipt shout 文案 |
| cache runtime dist | `<codex-cache>/gxfn/alembic-codex/0.1.2/runtime/dist/lib/external/mcp/handlers/task.js:281,283` 包含 `shout a short, active knowledge receipt` 与 `do not list evidenceRefs paths or line numbers by default` |
| workspace Plugin dist | `AlembicPlugin/dist/lib/external/mcp/handlers/task.js:281,283` 包含同样的 readable receipt shout 约束 |
| 插件 package | `alembic-ai@0.1.2`；MCP profile `codex-plugin`；tool list 共 26 个工具，包含 `alembic_task`，不包含 `codex_host_response` |

## BiliDili 状态

测试前：

```text
## main...origin/main
```

测试后：

```text
## main...origin/main
```

结论：BiliDili 受 git 跟踪文件和未跟踪文件均未发生变化。

## Status Probe 结果

`alembic_codex_status` 在 BiliDili 上下文中成功：

| 字段 | 结果 |
| --- | --- |
| `initialized` | `true` |
| knowledge status | `knowledge_ready` |
| recipeCount | `79` |
| skillCount | `3` |
| sourceRefs | `196 active` |
| vector status | `ready` |
| projectRoot source | `ALEMBIC_PROJECT_DIR` |
| runtime profile | `codex-plugin` |
| local daemon | `stale` / unavailable；不影响本次 Plugin-owned prime 路径 |

这证明本次 prime 在 BiliDili 已生成 Recipes 且知识可读的真实项目上下文中执行。

## Prime Payload 摘要

Prime 输入：

```json
{
  "operation": "prime",
  "userQuery": "在 BiliDili 中修改 VideoFeed 或 Home 页面时，请根据项目 Recipes 说明模块边界、网络 Repository、UI lazy var、SchemeRouter 和 Guard 约束。",
  "activeFile": "Sources/Features/VideoFeed/VideoFeedViewController.swift",
  "language": "swift"
}
```

Prime 返回：

| 字段 | 结果 |
| --- | --- |
| `success` | `true` |
| `primeKnowledgeMaterial.status` | `delivered` |
| acceptedKnowledge | `5` |
| acceptedGuards | `1` |
| evidenceRefs | `18`，payload 中保留 |
| `hostResponse.action` | `shout_prime_knowledge_receipt` |
| `hostResponse.receiptId` | `prime-mpfgywqc-1` |
| `hostResponse.timing` | `immediate_after_prime` |
| `hostResponse.required` | `true` |
| `hostResponse.requiredBeforeNextAction` | `true` |
| `hostResponse.visibility` | `developer_visible` |
| `nextActions` | 仅包含可选 `alembic_task(operation=create)` 建议 |
| `codex_host_response` | 未出现在 tool list 或 `nextActions` |

返回知识：

- `@schemerouter-url-decoupling`：跨 Feature 页面导航、deep link、push 路由通过 SchemeRouter 解耦。
- `@route-error-eight-cases`：URL 路由失败用 RouteError / RouteResult 结构表达。
- `@analytics-middleware-tracker`：路由埋点通过闭包注入，避免框架层绑定具体 analytics 后端。
- `@lazy-var-uicomponents`：Feature ViewController UI 子视图继续使用 lazy var 延迟初始化。
- `@modulemanager-priority-lifecycle`：Module 启动拆分为同步注册与延迟重初始化，按优先级管理。
- Guard `@protocol-naming-suffixes`：Protocol 命名按 DI service、Repository、client capability 三层后缀守边界。

## Shout Instruction 摘要

payload 中 `shoutInstruction` 明确要求：

- prime tool result 后，在任何后续 tool call、code reading、edit、Guard check 或 final summary 前，先做 developer-visible receipt shout。
- 使用 short / active knowledge receipt 风格，像真正的呐喊一样先说收到的 Recipe / Guard 约束。
- 讲出有用模式、guardrails，以及它们如何影响下一步判断。
- 使用 trigger、actionHint、title、summary 让呐喊可读。
- 不默认列 evidenceRefs 路径或行号，也不默认点出缺少行号。
- evidenceRefs 只留给后续代码阅读、验证或用户要求引用时使用。

## Service Boundary 摘要

payload 中 `data.serviceBoundary` 为：

```json
{
  "executionPath": "plugin-owned-codex-facing",
  "operation": "prime",
  "owner": "alembic-plugin",
  "reason": "alembic_task owns Codex intent lifecycle and prime host-response payloads; local daemon readiness must not transfer tool ownership.",
  "residentServiceRequested": false,
  "sharedContractCandidate": true,
  "tool": "alembic_task"
}
```

结论：通过。`prime` 明确由 Plugin 拥有，未请求 resident service。

## Codex 可见呐喊

prime tool result 后，下一条开发者可见响应先做 readable receipt shout，再继续读取 JSON、复核 git 和写报告。可见响应摘要如下：

```text
Prime 收到了 BiliDili 的关键知识包：5 条 Recipe 和 1 条 Guard 已就位。接下来判断任何 VideoFeed/Home 相关改动时，我会先守住这些模式：跨 Feature 跳转走 SchemeRouter，不硬耦合页面；路由错误用 RouteError/RouteResult 表达；路由埋点通过闭包注入保持后端解耦；Feature UI 继续用 lazy var 延迟构建；ModuleManager 负责按优先级拆开同步注册和延迟初始化；Protocol 命名按 DI、Repository、Client capability 三层后缀守边界。证据 refs 已保留在 payload 里，需要复核时再展开。
```

观察结论：

- 可见响应先于后续读 JSON、复核 git、写报告。
- 默认没有倾倒 evidenceRefs 路径 / 行号。
- 没有把“缺少行号”作为可见重点。
- 正文主动喊出了 Recipe / Guard 摘要、模式和后续判断依据。

## 日志与运行信号

| 信号 | 结果 |
| --- | --- |
| MCP stderr tail | `Alembic Codex MCP ready — 26 tools` |
| probe duration | `6711ms` |
| status policy | local Alembic daemon `stale`；本次 prime payload 由 Plugin-owned path 成功返回 |
| local daemon bridge | 未请求；`serviceBoundary.residentServiceRequested === false` |
| tool list | 26 个工具，包含 `alembic_task`，不包含 `codex_host_response` |
| probe readable checks | `shoutInstructionReadable=true`，`shoutInstructionNoDefaultEvidenceDump=true`，`codexVisibleShoutDefaultsDumpEvidenceRefs=false` |

## 验收结果

| 检查项 | 结果 |
| --- | --- |
| BiliDili 上下文成功触发 `alembic_task prime` | 通过 |
| `primeKnowledgeMaterial.status === delivered` | 通过 |
| accepted knowledge / guard 非空 | 通过 |
| payload 中 evidenceRefs 保留 | 通过 |
| `hostResponse.action === shout_prime_knowledge_receipt` | 通过 |
| `hostResponse.timing === immediate_after_prime` | 通过 |
| `hostResponse.requiredBeforeNextAction === true` | 通过 |
| `hostResponse.visibility === developer_visible` | 通过 |
| `shoutInstruction` 要求 short / active / readable | 通过 |
| `shoutInstruction` 禁止默认列 evidenceRefs 路径 / 行号 | 通过 |
| 下一条开发者可见响应先做 readable receipt shout | 通过 |
| 可见响应主动喊出 Recipe / Guard 摘要、模式、后续判断依据 | 通过 |
| 可见响应默认不倾倒 evidenceRefs 路径 / 行号 | 通过 |
| 可见响应不把缺少行号当作重点 | 通过 |
| `serviceBoundary.executionPath === plugin-owned-codex-facing` | 通过 |
| `residentServiceRequested === false` | 通过 |
| `codex_host_response` 不在 tool list / nextActions | 通过 |
| BiliDili git 前后干净 | 通过 |
| 未启动 cold-start / rescan | 通过 |

## 遗留风险

- payload 中仍有部分 evidenceRefs 没有行号；SHOUT-5 的验收目标是不把缺行号当作可见重点，当前已通过。若后续希望证据复核更精确，仍需回到 Recipe/sourceRefs 生成链路补强。
- `alembic_codex_status` 报告 local Alembic daemon stale；本测试目标是 Plugin-owned Codex-facing prime readable receipt shout，且 `residentServiceRequested=false`，因此不阻塞本测试。Dashboard/daemon handoff 仍需另建测试单覆盖。
- 原始 probe JSON 位于 `AlembicTest/tmp/`，包含本机运行路径和已脱敏的 provider 状态；长期报告只保留脱敏摘要，避免把用户本机细节写入长期文档。

## 下一步建议

- 总控可将 Test-2026-05-21-04 标记为通过 / 待验收。
- 若需要进一步提升 evidenceRef 精度，建议后续交给 Alembic/AlembicCore 知识生成链路补强。
- 若需要验证 Dashboard handoff 或 daemon ready 状态，建议另建独立测试单，不纳入本次 readable receipt shout 范围。

