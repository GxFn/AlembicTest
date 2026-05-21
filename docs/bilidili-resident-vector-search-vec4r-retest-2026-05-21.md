# BiliDili Resident Vector Search VEC-4R Retest - 2026-05-21

状态：测试失败，部分修复通过
测试单：Test-2026-05-21-06
执行窗口：AlembicTest
目标项目：BiliDili
触发入口：Alembic Codex MCP stdio runtime -> `alembic_task(operation=prime)` + `alembic_search(auto/semantic)`
测试时间：2026-05-21

## 测试目标

本次复测验证 VEC-4R 产品修复后，BiliDili 真实项目中的 direct `alembic_search` 是否离开已删除的 daemon MCP compat bridge，并通过 Plugin-owned handler 请求 Alembic resident `/api/v1/search`。

验收重点：

- direct `alembic_search(auto/semantic)` 不再请求 `POST /api/v1/mcp/call`，也不再出现 `daemon-mcp-compat-bridge`。
- direct search 由 Plugin-owned handler 执行，`serviceBoundary.executionPath=plugin-owned-codex-facing`。
- search payload 里有 resident metadata 或清晰 baseline fallback。
- daemon `/api/v1/search` 运行态应返回 `searchMeta` telemetry。
- `prime` 仍 delivered，Codex 可见响应仍是知识摘要。
- BiliDili 测试前后 git 状态保持干净。

## 结论

测试失败，但 VEC-4R 的关键修复已有部分通过。

通过的部分：

- direct `alembic_search(auto)` 与 `alembic_search(semantic)` 均 `success=true`，不再整体失败。
- 负向扫描未发现 `/api/v1/mcp/call`，也未发现 `daemon-mcp-compat-bridge`。
- 两次 direct search 的 `serviceBoundary.executionPath` 均为 `plugin-owned-codex-facing`，`owner=alembic-plugin`，`residentServiceRequested=true`。
- `semantic` 查询返回 `searchMeta.residentSearch.route=alembic-resident-service`，`attempted=true`，`available=true`，`used=true`，`resultCount=12`。
- `auto` 查询在 resident 请求失败时回到 embedded baseline search，仍返回 6 条结果，且 fallback 原因可见。

失败的部分：

- daemon `/api/v1/search` 只读探测返回 HTTP 200 和 6 条命中，但 `searchMetaKeys=[]`，没有 route / service / requestedMode / actualMode / semanticUsed / vectorUsed / residentVector / fallbackReason。
- direct `semantic` 的 resident metadata 是 `ResidentSearchClient` 包装出来的 `alembic-resident-service` 元信息，但内部 `searchMeta={}`，没有 daemon resident telemetry。
- direct `semantic` 未提供 `semanticUsed` / `vectorUsed` 字段，`residentVector.available=false` 且 reason 为 `null`，不能证明真实 vector route 被使用。

因此本次不满足 Test-06 的通过标准：“daemon `/api/v1/search` 返回 telemetry”与“semantic/vector used 或清晰 fallbackReason”仍未达成。

## 执行范围

执行了只读 probe，没有 cold-start，没有 rescan，没有重建向量，没有刷新 Codex plugin cache，也没有修改 BiliDili 业务源码、工程配置、登录、播放、网络、UI 或 Xcode 项目结构。

使用命令：

```bash
git -C BiliDili status --short --branch
npm --prefix AlembicTest run check
node AlembicTest/scripts/probe-resident-vector-search.mjs --output AlembicTest/tmp/bilidili-resident-vector-search-vec4r-probe-2026-05-21.json
git -C BiliDili status --short --branch
```

说明：probe 通过 workspace 内 `AlembicPlugin/dist/bin/codex-mcp.js` 启动 Codex MCP stdio runtime，并把 `ALEMBIC_PROJECT_DIR` 指向 workspace 内 `BiliDili`。由于 probe 需要读取 daemon state 并访问 localhost `/api/v1/search`，执行时使用了 Codex elevated sandbox permission。原始 JSON 保存在 `AlembicTest/tmp/`，长期报告只记录脱敏摘要。

## 版本证据

| 组件 | 证据 |
| --- | --- |
| AlembicPlugin 源仓库 | `f46e28179aac306e7fff12fe9d7d68965494c1d8` |
| AlembicCodex runtime artifact | `daec908a340f4dbe60a8cec643efdc126cf9ff77` |
| Alembic 源仓库 | `d725bae3ae6ef9ab168a0a444ad832b6a2fc2f10` |
| AlembicCore 源仓库 | `39bcebe94c451f92e405b0da38d2cbe67e8e0f82` |
| Codex plugin cache marker | cache marker 仍显示 `gitHead=58b82f8526d68aef516d68477d7a0e505fc114e9`，但 `localMcpEntry` 指向 workspace `AlembicPlugin/dist/bin/codex-mcp.js`；本次 probe 实际使用 workspace local MCP entry |
| Alembic daemon health | ready，`version=0.1.0`，`mode=daemon`，project 指向 BiliDili，schema migration `009_knowledge_dimension_id` |
| daemon process evidence | `ps -axo pid,command` 显示 pid `90465` 运行 `/Users/gaoxuefeng/Documents/AlembicWorkspace/Alembic/dist/bin/daemon-server.js` |
| daemon dist evidence | `Alembic/dist/lib/http/routes/search.js` 与 `daemon.js` 均包含 resident telemetry 代码；文件 mtime 为 2026-05-21 23:00:37 |
| MCP tool list | 26 个工具，包含 `alembic_task` / `alembic_search`，不包含 `codex_host_response` |

补充说明：daemon health 的 `startedAt=2026-05-21T07:46:15.220Z`，早于当前 VEC-4R dist 文件 mtime；因此裸 daemon `/api/v1/search` 缺少 `searchMeta` 可能是运行中 daemon 尚未重启加载最新 dist。按测试单非目标，本次没有重启 daemon 或触发 cold-start/rescan，只记录实际运行态证据。

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

## Prime Payload 摘要

Prime 返回：

| 字段 | 结果 |
| --- | --- |
| `success` | `true` |
| `primeKnowledgeMaterial.status` | `delivered` |
| acceptedKnowledge | `5` |
| acceptedGuards | `3` |
| `hostResponse.action` | `shout_prime_knowledge_receipt` |
| `hostResponse.timing` | `immediate_after_prime` |
| `hostResponse.requiredBeforeNextAction` | `true` |
| `hostResponse.visibility` | `developer_visible` |
| `serviceBoundary.executionPath` | `plugin-owned-codex-facing` |
| `serviceBoundary.owner` | `alembic-plugin` |
| `serviceBoundary.residentServiceRequested` | `false` |
| `codex_host_response` | 未出现在 tool list 或 `nextActions` |

Prime 没有携带 resident search metadata；本测试主要以 direct search 和 daemon endpoint 观察 resident route。

## Direct `alembic_search` 摘要

### auto 查询

查询：`VideoFeedViewController lazy var UI SchemeRouter route guard`

| 字段 | 结果 |
| --- | --- |
| `success` | `true` |
| actual mode | `auto(weighted-fallback,conf=15)` |
| result count | `6` |
| service boundary | `plugin-owned-codex-facing` / `alembic-plugin` |
| resident route | `alembic-resident-service` |
| resident attempted | `true` |
| resident available / used | `false` / `false` |
| resident reason | `Query parameter validation failed` |
| fallbackReason | `vector_service_hybrid_unavailable` |
| residentVector | `available=false`，reason `Query parameter validation failed` |
| baseline fallback | 有，返回 6 条 embedded search 结果 |

代表性命中：

- `@schemerouter-url-decoupling`
- `@base-viewcontroller-template`
- `@main-thread-ui-dispatch`
- `@continuation-once-guard`
- `@route-error-eight-cases`

### semantic 查询

查询：`BaseViewController setupUI bindViewModel video URL preloader cache`

| 字段 | 结果 |
| --- | --- |
| `success` | `true` |
| actual mode | `semantic` |
| result count | `6` |
| service boundary | `plugin-owned-codex-facing` / `alembic-plugin` |
| resident route | `alembic-resident-service` |
| resident attempted | `true` |
| resident available / used | `true` / `true` |
| resident resultCount | `12` |
| resident fallbackReason | `null` |
| semanticUsed / vectorUsed | 未返回 |
| residentVector | `available=false`，reason `null`，stats `null` |
| resident inner `searchMeta` | `{}` |

代表性命中：

- `@base-viewcontroller-template`
- `@video-url-preloader-cache`
- `@lazy-var-uicomponents`
- `@builder-urlrequest-image`
- `@session-pool-ignore-urlcache`

## Daemon `/api/v1/search` 只读探测

probe 使用 daemon token 做一次只读 semantic 查询，长期报告不记录 token。

| 字段 | 结果 |
| --- | --- |
| endpoint | `/api/v1/search` |
| HTTP status | `200` |
| `success` | `true` |
| requested mode | `semantic` |
| actual mode | `semantic` |
| itemCount | `6` |
| `searchMetaKeys` | `[]` |
| route / service | 未返回 |
| semanticUsed / vectorUsed | 未返回 |
| residentVector | 未返回 |
| fallbackReason | 未返回 |

代表性命中：

- `@lazy-var-uicomponents`
- `@schemerouter-url-decoupling`
- `@async-await-repository-bridge`
- `@main-thread-ui-dispatch`
- `@base-viewcontroller-template`

结论：daemon search 本体可返回 BiliDili 知识命中，但运行态 telemetry 缺失，按 Test-06 标准记为失败。

## `/api/v1/mcp/call` 负向证据

probe 对 direct search payload 和 MCP stderr 做字符串扫描：

```json
{
  "containsMcpCallPath": false,
  "containsDaemonCompatBridge": false
}
```

结论：VEC-4R bridge removal 在 direct search 路径上生效；本次失败不再是 `/api/v1/mcp/call` route 404。

## Codex 可见行为

prime tool result 后，下一条开发者可见响应先做了知识摘要，并没有默认倾倒 evidenceRefs 或 resident telemetry。摘要如下：

```text
Prime 收到了 BiliDili 的关键约束：5 条 Recipe 和 3 条 Guard 已就位；接下来判断会先守住 SchemeRouter 解耦、RouteError/RouteResult、AnalyticsMiddleware 注入、lazy var UI、ModuleManager 生命周期和 Protocol 命名后缀。Resident search 证据留在 payload 中：VEC-4R 已经不再碰 `/api/v1/mcp/call`，direct search 改为 Plugin-owned；但 daemon `/api/v1/search` 只读探测仍缺 searchMeta，所以这次结论会更像“部分修复通过、整体测试失败”。
```

观察结论：

- 可见响应先于后续报告和回填。
- 默认没有列 evidenceRefs 路径 / 行号。
- 没有把 resident telemetry 当作可见呐喊主体。
- 明确区分了 bridge removal 通过与 daemon telemetry 失败。

## 验收结果

| 检查项 | 结果 |
| --- | --- |
| BiliDili 上下文成功触发 `alembic_task prime` | 通过 |
| prime delivered | 通过 |
| prime 保持 Plugin-owned Codex-facing 边界 | 通过 |
| direct `alembic_search auto` 成功 | 通过 |
| direct `alembic_search semantic` 成功 | 通过 |
| direct search 不再出现 `/api/v1/mcp/call` | 通过 |
| direct search 不再出现 `daemon-mcp-compat-bridge` | 通过 |
| direct search serviceBoundary 为 Plugin-owned | 通过 |
| direct search 返回 resident metadata | 部分通过 |
| auto resident failure 有 fallback | 通过 |
| semantic resident available / used | 通过 |
| semantic/vector used telemetry | 失败 |
| daemon `/api/v1/search` 返回 `searchMeta` | 失败 |
| Codex 可见行为仍是知识摘要 | 通过 |
| `codex_host_response` 未出现 | 通过 |
| BiliDili git 前后干净 | 通过 |
| 未 cold-start / rescan / 改 BiliDili | 通过 |

## 遗留风险

- 当前 daemon 进程可能未加载 VEC-4R 后的最新 `Alembic/dist`，因为 health `startedAt` 早于 dist mtime；本测试按非目标没有重启 daemon，因此只记录现有运行态。
- `auto` 模式 resident 请求返回 `Query parameter validation failed`，但 baseline fallback 可用；仍建议产品侧确认 resident endpoint 是否应接受 `mode=auto` 或由 Plugin 转译为 daemon 支持的 mode。
- `semantic` 模式 resident available / used，但没有 `semanticUsed` / `vectorUsed`，`residentVector.available=false` 且 reason 为 `null`；这会影响总控判断是否真实使用 vector。
- cache marker 仍是 SHOUT-5，但本轮实际使用 workspace local MCP entry；cache refresh 属于后续 VEC-6，不在本测试中执行。

## 下一步建议

- 总控应将 Test-2026-05-21-06 标记为失败 / 待产品或运行态修复。
- 建议 `Alembic` 窗口确认 running daemon 是否需要重启加载 `d725bae3ae6ef9ab168a0a444ad832b6a2fc2f10`，并复核 `/api/v1/search` 是否稳定返回 `searchMeta`。
- 建议 `AlembicPlugin` 窗口确认 `alembic_search(auto)` resident request 的 mode 参数是否要转译，避免 daemon validation failure。
- 修复或刷新运行态后，重新运行 `AlembicTest/scripts/probe-resident-vector-search.mjs --output AlembicTest/tmp/bilidili-resident-vector-search-vec4r-probe-2026-05-21.json`。
