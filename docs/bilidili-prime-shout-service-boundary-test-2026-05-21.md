# BiliDili Prime Shout Service Boundary Test - 2026-05-21

状态：测试通过，待总控验收  
测试单：Test-2026-05-21-02  
执行窗口：AlembicTest  
目标项目：BiliDili  
触发入口：Alembic Codex MCP stdio runtime -> `alembic_task(operation=prime)`  
测试时间：2026-05-21

## 测试目标

本次复测验证 AlembicPlugin service request 边界修复后，BiliDili 真实项目上下文中的 Codex-facing `prime` 是否留在 Plugin 侧执行，并返回可供 Codex 直接呐喊的知识材料。

验收重点：

- `alembic_task prime` 不再因 local Alembic daemon ready 而转发到 daemon MCP bridge。
- payload 包含 `data.primeKnowledgeMaterial`、`hostResponse`、`shoutInstruction` 和 `data.serviceBoundary`。
- `serviceBoundary.executionPath === "plugin-owned-codex-facing"`。
- Codex 能基于 payload 做开发者可见的知识接收呐喊。
- payload / tool list 不暴露虚构 `codex_host_response` MCP tool。
- BiliDili 测试前后 git 状态保持干净。

## 执行范围

执行了只读插件 probe，没有启动 cold-start / rescan，没有修改 BiliDili 源码、工程配置、登录、播放、网络、UI 或 Xcode 项目结构。

使用命令：

```bash
node AlembicTest/scripts/probe-codex-prime.mjs --output AlembicTest/tmp/bilidili-prime-service-boundary-probe-2026-05-21.json
```

说明：该命令通过 AlembicPlugin 本地 `dist/bin/codex-mcp.js` 启动 Codex MCP stdio runtime，并把 `ALEMBIC_PROJECT_DIR` 指向 workspace 内 `BiliDili`。命令需要访问 Alembic 外部数据根，因此在 Codex 沙箱中使用授权运行。

## 版本证据

| 组件 | 证据 |
| --- | --- |
| AlembicPlugin | `c083c3c3c5b690a9b0f9711b3a5abe214bde0109`，`fix: keep codex task ownership in plugin` |
| AlembicCore | `bd9319db72d6fd22f9b3a2ba3a36e279ee117f24`，`Fix Codex recipe interaction contracts` |
| Alembic | `ae52f823d0ab0bb4bbb846c5cdeaed76924e3cf3`，`fix: tolerate missing bootstrap child usage metrics` |
| 插件 package | `alembic-ai@0.1.2` |
| local daemon | `http://127.0.0.1:63030`，ready，version `0.1.0` |

补充说明：总控测试单列出的 Alembic daemon bridge 修复提交是 `83130a6add9806c124d334281a0ec7f219afd33e`；当前 Alembic 工作树 HEAD 已前进到 `ae52f823...`，可视为包含后续提交的测试环境。

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
| sourceRefs | `196 active / 196 total` |
| vector status | `ready` |
| daemon status | `ready` |
| daemon URL | `http://127.0.0.1:63030` |

这证明本次复测是在 BiliDili 已生成 Recipes 且 Alembic 知识可读的真实项目上下文中执行。

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
| `hostResponse.required` | `true` |
| `shoutInstruction` | 存在 |
| `nextActions` | 仅包含 `alembic_task` / `operation=create` 建议 |
| `codex_host_response` | 未出现在 tool list 或 `nextActions` |

返回的知识包括：

- `@schemerouter-url-decoupling`：SchemeRouter URL 路由解耦 Feature 模块，证据包括 `BiliDili/AppCoordinator.swift`、`BiliDili/Modules/RouterModule.swift`、`BiliDili/SceneDelegate.swift`、`docs/Architecture.md`。
- `@route-error-eight-cases`：URL 路由层 8 种错误 case，证据 `Packages/AOXFoundationKit/Sources/AOXFoundationKit/ModuleKit/SchemeRoute.swift:8`。
- `@analytics-middleware-tracker`：闭包注入式路由埋点中间件，证据 `Packages/AOXFoundationKit/Sources/AOXFoundationKit/ModuleKit/RouteMiddleware.swift`。
- `@lazy-var-uicomponents`：Feature ViewController lazy var UI 延迟初始化，证据包括 Following、LiveChat、VideoFeed ViewController。
- `@modulemanager-priority-lifecycle`：ModuleManager 优先级生命周期管理，证据包括 `BiliDili/AppDelegate.swift`、Account/Network/Router module。
- Guard `@protocol-naming-suffixes`：Protocol 三层命名后缀约定，证据包括 AOXFoundationKit protocols 与 `Sources/Core/ServiceKit/ServiceProtocols.swift`。

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

## Codex 知识呐喊

本次 probe 根据 `primeKnowledgeMaterial` 生成的可见呐喊摘要：

```text
我已从 Alembic prime 接收到 BiliDili 项目知识：5 条 Recipe，1 条 Guard。
- SchemeRouter URL 路由解耦 Feature 模块：用于跨 Feature 页面导航、deep link、push 路由；证据 BiliDili/AppCoordinator.swift、BiliDili/Modules/RouterModule.swift、BiliDili/SceneDelegate.swift。
- RouteError URL 路由层 8 种错误 case：用于 URL scheme 路由错误表达；证据 Packages/AOXFoundationKit/Sources/AOXFoundationKit/ModuleKit/SchemeRoute.swift:8。
- AnalyticsMiddleware 闭包注入式路由埋点中间件：用于解耦路由埋点和具体 analytics 后端；证据 Packages/AOXFoundationKit/Sources/AOXFoundationKit/ModuleKit/RouteMiddleware.swift。
- Feature ViewController lazy var UI 组件延迟初始化：用于延迟构建 UICollectionView/UITableView/UILabel 等 UI；证据 Sources/Features/Following、LiveChat、VideoFeed ViewController。
- ModuleManager 优先级生命周期管理：用于 Module 注册和重初始化拆分；证据 BiliDili/AppDelegate.swift、AccountModule、NetworkModule、RouterModule。
- Protocol 三层命名后缀 Guard：DI service 使用 Providing，Repository 使用 RepositoryProtocol，client capability 使用 Protocol；证据 AOXFoundationKit protocols 与 Sources/Core/ServiceKit/ServiceProtocols.swift。
hostResponse 要求先完成知识接收呐喊，status=delivered。
```

这满足“Codex 必须先告诉开发者接收到了哪些 Recipe / Guard，并引用路径 / 行号证据”的可见行为要求。部分 evidenceRef 没有行号，呐喊中按 `shoutInstruction` 要求如实标注为行号缺失。

## Daemon Bridge 观察

运行前日志中 `/api/v1/mcp/call` 记录：

- `combined.log`：2 次，均来自上一轮失败测试。
- `daemon.log`：0 次。

运行后日志中 `/api/v1/mcp/call` 记录：

- `combined.log`：仍为 2 次。
- `daemon.log`：仍为 0 次。

本次 prime 同时在日志中出现 Plugin 本地初始化、Search index built、QueryRouter 搜索和 sparse-only fallback 信号；没有新增 `/api/v1/mcp/call`。结合 `serviceBoundary.executionPath === "plugin-owned-codex-facing"`，可以判定 Codex-facing prime 已绕开 daemon MCP bridge。

## 验收结果

| 检查项 | 结果 |
| --- | --- |
| `alembic_task prime` 成功 | 通过 |
| `primeKnowledgeMaterial.status === delivered` | 通过 |
| accepted knowledge / guard 非空 | 通过 |
| evidence refs 非空 | 通过 |
| `hostResponse.action === shout_prime_knowledge_receipt` | 通过 |
| `shoutInstruction` 存在 | 通过 |
| `serviceBoundary.executionPath === plugin-owned-codex-facing` | 通过 |
| `serviceBoundary.owner === alembic-plugin` | 通过 |
| `residentServiceRequested === false` | 通过 |
| `codex_host_response` 不在 tool list / nextActions | 通过 |
| BiliDili git 前后干净 | 通过 |
| 未启动 cold-start / rescan | 通过 |

## 遗留风险

- 本次测试使用 workspace 内 AlembicPlugin 本地 `dist` 入口执行；全局 Codex plugin cache 的 refresh marker 仍可能是旧 git head。若要验证“用户真实 Codex 已安装插件态”，需要单独授权同步/刷新缓存后再测。
- 搜索日志显示 embedding 在插件运行时不可用并降级到 sparse-only：`AI execution is provided by the host agent and is not bundled in AlembicPlugin.` 本次结果仍 delivered，但语义召回质量可能受影响；后续可作为质量优化项，不阻塞本测试通过。
- 多个 evidenceRef 没有行号。payload 和呐喊已如实暴露“行号缺失”，但如果总控希望强制行号级证据，需回到 Recipe/sourceRefs 生成链路补强。

## 下一步建议

- 总控可将 Test-2026-05-21-02 标记为通过 / 已完成。
- 如需验证真实 Codex 安装态，建议由总控授权 `AlembicPlugin` 或 `AlembicTest` 执行插件 cache refresh 后再跑同一 probe。
- 后续产品优化可交给 `AlembicPlugin`：在 status/report 中更清晰展示 sparse-only fallback 与 evidenceRef 行号缺失，但这不影响当前 service boundary 修复验收。

