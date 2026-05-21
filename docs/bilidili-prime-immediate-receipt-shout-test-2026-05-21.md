# BiliDili Prime Immediate Receipt Shout Test - 2026-05-21

状态：测试通过，待总控验收  
测试单：Test-2026-05-21-03  
执行窗口：AlembicTest  
目标项目：BiliDili  
触发入口：Alembic Codex MCP stdio runtime -> `alembic_task(operation=prime)`  
测试时间：2026-05-21

## 测试目标

本次复测验证 Alembic Codex prime immediate receipt shout 在 BiliDili 真实项目上下文中的可见行为：

- `prime` tool result 后，下一条开发者可见响应必须先声明接收到的 Recipe / Guard / evidenceRefs，再继续任何后续动作。
- payload 必须包含 `hostResponse.action === "shout_prime_knowledge_receipt"`、`timing === "immediate_after_prime"`、`requiredBeforeNextAction === true`、`visibility === "developer_visible"`。
- installed Codex plugin cache / Skill / MCP runtime 覆盖 `AlembicPlugin` 提交 `829f838704159c7ed205f93ecd986c6234173721` 和 AlembicCodex runtime artifact `682e5d32b9442c1caba9df87f61efb8b0835e870`。
- `serviceBoundary` 仍保持 `plugin-owned-codex-facing`，不出现虚构 `codex_host_response` tool。
- BiliDili 测试前后保持 git 干净。

## 执行范围

执行了只读插件 probe，没有启动 cold-start / rescan，没有修改 BiliDili 源码、工程配置、登录、播放、网络、UI 或 Xcode 项目结构。

使用命令：

```bash
git -C BiliDili status --short --branch
node AlembicTest/scripts/probe-codex-prime.mjs --output AlembicTest/tmp/bilidili-prime-immediate-receipt-shout-probe-2026-05-21.json
git -C BiliDili status --short --branch
```

说明：probe 通过 workspace 内 `AlembicPlugin/dist/bin/codex-mcp.js` 启动 Codex MCP stdio runtime，并把 `ALEMBIC_PROJECT_DIR` 指向 workspace 内 `BiliDili`。原始 JSON 只保存在 `AlembicTest/tmp/`，长期报告只记录脱敏摘要。

## 版本证据

| 组件 | 证据 |
| --- | --- |
| Codex plugin cache marker | `<codex-cache>/gxfn/alembic-codex/0.1.2/.alembic-dev-refresh.json` 显示 `gitHead=829f838704159c7ed205f93ecd986c6234173721`，`localMcpEntry` 指向 workspace `AlembicPlugin/dist/bin/codex-mcp.js`，`packageVersion=0.1.2` |
| AlembicPlugin 源仓库 | 当前 HEAD `681b8b6db02b0cd82b4e85e91574faa1e4572547`，包含目标提交 `829f838704159c7ed205f93ecd986c6234173721` |
| AlembicCodex runtime artifact | `AlembicPlugin/plugins/alembic-codex` HEAD 为 `682e5d32b9442c1caba9df87f61efb8b0835e870` |
| cache Skill | `<codex-cache>/gxfn/alembic-codex/0.1.2/skills/alembic/SKILL.md:25` 要求 prime tool result 后下一条可见响应先做 receipt shout |
| cache runtime Skill | `<codex-cache>/gxfn/alembic-codex/0.1.2/runtime/plugins/alembic-codex/skills/alembic/SKILL.md:25` 同步包含 immediate receipt shout 文案 |
| cache runtime dist | `<codex-cache>/gxfn/alembic-codex/0.1.2/runtime/dist/lib/external/mcp/handlers/task.js:307,309,310` 包含 `immediate_after_prime`、`requiredBeforeNextAction`、`developer_visible` |
| workspace Plugin dist | `AlembicPlugin/dist/lib/external/mcp/handlers/task.js:307,309,310` 包含同样的新时序字段 |
| 插件 package | `alembic-ai@0.1.2`；MCP profile `codex-plugin`；tool list 共 26 个工具，包含 `alembic_task`，不包含 `codex_host_response` |

补充说明：本次实际 MCP entry 由 cache marker 指向 workspace `AlembicPlugin/dist/bin/codex-mcp.js`，符合总控前置条件。`AlembicPlugin` 源仓库 HEAD 已前进到 `681b8b6...`，但 `829f838...` 是其祖先提交，当前工作区状态干净。

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
| usable | `true` |
| recipeCount | `79` |
| skillCount | `3` |
| sourceRefs | `196 active / 196 total` |
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
| evidenceRefs | `18` |
| `hostResponse.action` | `shout_prime_knowledge_receipt` |
| `hostResponse.receiptId` | `prime-mpffae1u-1` |
| `hostResponse.timing` | `immediate_after_prime` |
| `hostResponse.required` | `true` |
| `hostResponse.requiredBeforeNextAction` | `true` |
| `hostResponse.visibility` | `developer_visible` |
| `shoutInstruction` | 存在，明确要求在任何后续 tool call / code reading / edit / Guard / final summary 前先可见呐喊 |
| `nextActions` | 仅包含可选 `alembic_task(operation=create)` 建议 |
| `codex_host_response` | 未出现在 tool list 或 `nextActions` |

返回知识：

- `@schemerouter-url-decoupling`：SchemeRouter URL 路由解耦 Feature 模块。证据：`BiliDili/AppCoordinator.swift`、`BiliDili/Modules/RouterModule.swift`、`BiliDili/SceneDelegate.swift`、`docs/Architecture.md`，均缺行号。
- `@route-error-eight-cases`：URL 路由层 8 种错误 case。证据：`Packages/AOXFoundationKit/Sources/AOXFoundationKit/ModuleKit/SchemeRoute.swift:8`。
- `@analytics-middleware-tracker`：闭包注入式路由埋点中间件。证据：`Packages/AOXFoundationKit/Sources/AOXFoundationKit/ModuleKit/RouteMiddleware.swift`，缺行号。
- `@lazy-var-uicomponents`：Feature ViewController lazy var UI 组件延迟初始化。证据：Following、LiveChat、VideoFeed ViewController，均缺行号。
- `@modulemanager-priority-lifecycle`：ModuleManager 优先级生命周期管理。证据：AppDelegate、AccountModule、NetworkModule、RouterModule、`docs/LaunchFlow.md`，均缺行号。
- Guard `@protocol-naming-suffixes`：Protocol 三层命名后缀约定。证据：AOXFoundationKit protocols、`Sources/Core/ServiceKit/ServiceProtocols.swift`、`Sources/Infrastructure/WebSocket/WebSocketClient.swift`，均缺行号。

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

prime tool result 后，下一条开发者可见响应已经先做 receipt shout，再继续读取 JSON、复核 git 和写报告。可见响应摘要如下：

```text
我已从 Alembic prime 接收到 BiliDili 项目知识：5 条 Recipe，1 条 Guard。收到的内容包括 SchemeRouter URL 路由解耦、RouteError 的 8 种路由错误 case、AnalyticsMiddleware 闭包注入式路由埋点、Feature ViewController lazy var UI 延迟初始化、ModuleManager 优先级生命周期管理，以及 Protocol 三层命名后缀 Guard。证据里 Packages/AOXFoundationKit/Sources/AOXFoundationKit/ModuleKit/SchemeRoute.swift:8 带行号；其余多条 evidenceRefs 只有路径没有行号，我不会把它们伪装成精确行号。payload 要求的 receipt shout 已在继续任何后续验证动作前完成，receipt=prime-mpffae1u-1。
```

probe 生成的完整 shout 文本也保存在 `AlembicTest/tmp/bilidili-prime-immediate-receipt-shout-probe-2026-05-21.json` 的 `codexVisibleShout` 字段。

结论：通过。可见行为满足“先呐喊，再继续任务”。

## 日志与运行信号

| 信号 | 结果 |
| --- | --- |
| MCP stderr tail | `Alembic Codex MCP ready — 26 tools` |
| probe duration | `4990ms` |
| status policy | `CODEX_DAEMON_STALE` warning；local daemon 不可用，但本次 prime payload 由 Plugin-owned path 成功返回 |
| local daemon bridge | 未请求；`serviceBoundary.residentServiceRequested === false` |
| tool list | 26 个工具，包含 `alembic_task`，不包含 `codex_host_response` |

## 验收结果

| 检查项 | 结果 |
| --- | --- |
| BiliDili 上下文成功触发 `alembic_task prime` | 通过 |
| `primeKnowledgeMaterial.status === delivered` | 通过 |
| accepted knowledge / guard 非空 | 通过 |
| evidence refs 非空 | 通过 |
| `hostResponse.action === shout_prime_knowledge_receipt` | 通过 |
| `hostResponse.timing === immediate_after_prime` | 通过 |
| `hostResponse.requiredBeforeNextAction === true` | 通过 |
| `hostResponse.visibility === developer_visible` | 通过 |
| `shoutInstruction` 明确 prime 后立即可见呐喊 | 通过 |
| 下一条开发者可见响应先做 receipt shout | 通过 |
| `serviceBoundary.executionPath === plugin-owned-codex-facing` | 通过 |
| `residentServiceRequested === false` | 通过 |
| `codex_host_response` 不在 tool list / nextActions | 通过 |
| BiliDili git 前后干净 | 通过 |
| 未启动 cold-start / rescan | 通过 |

## 遗留风险

- 多数 `evidenceRefs` 只有路径没有行号；payload 和可见呐喊已按 Skill 要求如实说明行号缺失，不阻塞本测试通过。若总控希望所有证据达到行号级，需要回到 Recipe/sourceRefs 生成链路补强。
- `alembic_codex_status` 报告 local Alembic daemon stale；本测试目标是 Plugin-owned Codex-facing prime immediate receipt shout，且 `residentServiceRequested=false`，因此不阻塞本测试。Dashboard/daemon handoff 仍需在其它测试单覆盖。
- 原始 probe JSON 位于 `AlembicTest/tmp/`，包含本机运行路径和已脱敏的 provider 状态；长期报告只保留脱敏摘要，避免把用户本机细节写入长期文档。

## 下一步建议

- 总控可将 Test-2026-05-21-03 标记为通过 / 待验收。
- 若需要提升证据精度，建议后续交给 Alembic/AlembicCore 知识生成链路补强 evidenceRef 行号。
- 若需要验证 Dashboard handoff 或 daemon ready 状态，建议另建独立测试单，不纳入本次 immediate receipt shout 范围。

