# BiliDili Resident Vector Search VEC-5R Retest - 2026-05-22

状态：通过
测试单：Test-2026-05-22-01
执行窗口：AlembicTest
目标项目：BiliDili
触发入口：Alembic Codex MCP stdio runtime -> `alembic_task(operation=prime)` + `alembic_search(auto/semantic)`
测试时间：2026-05-22

## 测试目标

本次复测验证 VEC-5R 后，BiliDili 真实项目中的 resident vector search route 是否形成可证明闭环：

- direct `alembic_search(auto)` 不再把 Codex-facing `mode=auto` 原样传给 daemon，避免 `Query parameter validation failed`。
- direct `alembic_search(auto)` 的 resident metadata 能看出 `codexRequestedMode=auto`、`residentRequestMode=semantic`。
- direct `alembic_search(semantic)` 与 daemon `/api/v1/search?mode=semantic` 均返回 searchMeta telemetry。
- semantic/vector 真实使用时有 `semanticUsed=true` / `vectorUsed=true` 和 `residentVector.available=true`。
- `/api/v1/mcp/call` 与 `daemon-mcp-compat-bridge` 没有回归。
- `alembic_task(operation="prime")` 仍保持 Plugin-owned Codex-facing 边界，Codex 可见响应仍是知识摘要。
- BiliDili 测试前后 git 状态保持干净。

## 结论

测试通过，probe 分类为 `resident-success`。

关键证据：

- `alembic_task prime` 成功，`primeKnowledgeMaterial.status=delivered`，接收 5 条 Recipe 和 3 条 Guard。
- direct `alembic_search(auto)` 成功，actual mode 为 `semantic`，resident metadata 显示 `codexRequestedMode=auto`、`residentRequestMode=semantic`、`semanticUsed=true`、`vectorUsed=true`、`residentVector.available=true`。
- direct `alembic_search(semantic)` 成功，resident metadata 显示 `semanticUsed=true`、`vectorUsed=true`、`residentVector.available=true`。
- daemon `/api/v1/search` 只读探测返回 HTTP 200，`searchMeta` 包含 route / service / requestedMode / actualMode / semanticUsed / vectorUsed / residentVector / workspace 等字段。
- 负向扫描未发现 `/api/v1/mcp/call` 或 `daemon-mcp-compat-bridge`。
- Codex 可见响应没有默认倾倒 evidenceRefs、path:line 或 telemetry dump。
- BiliDili git 前后均为干净状态。

## 执行范围

执行了只读 probe，没有 cold-start，没有 rescan，没有重建向量，没有刷新 Codex plugin cache，也没有修改 BiliDili 业务源码、工程配置、登录、播放、网络、UI 或 Xcode 项目结构。

使用命令：

```bash
git -C BiliDili status --short --branch
npm --prefix AlembicTest run check
node AlembicTest/scripts/probe-resident-vector-search.mjs --output AlembicTest/tmp/bilidili-resident-vector-search-vec5r-probe-2026-05-22.json
git -C BiliDili status --short --branch
```

说明：probe 通过 workspace 内 `AlembicPlugin/dist/bin/codex-mcp.js` 启动 Codex MCP stdio runtime，并把 `ALEMBIC_PROJECT_DIR` 指向 workspace 内 `BiliDili`。由于 probe 需要读取 daemon state 并访问 localhost `/api/v1/search`，执行时使用了 Codex elevated sandbox permission。原始 JSON 保存在 `AlembicTest/tmp/`，长期报告只记录脱敏摘要。

## 版本证据

| 组件 | 证据 |
| --- | --- |
| AlembicPlugin 源仓库 | `2c98f69b1388c478bbbb255e487c51fde621cff7` |
| AlembicCodex runtime artifact | `33689ec1cd0266023fab2d7c1bebf7ad6fd59732` |
| Alembic 源仓库 | `d725bae3ae6ef9ab168a0a444ad832b6a2fc2f10` |
| AlembicCore 源仓库 | `39bcebe94c451f92e405b0da38d2cbe67e8e0f82` |
| Codex plugin cache marker | cache marker 仍显示 `gitHead=58b82f8526d68aef516d68477d7a0e505fc114e9`，但 `localMcpEntry` 指向 workspace `AlembicPlugin/dist/bin/codex-mcp.js`；本次 probe 实际使用 workspace local MCP entry |
| Alembic daemon health | ready，`version=0.1.0`，`mode=daemon`，project 指向 BiliDili，schema migration `009_knowledge_dimension_id` |
| daemon process evidence | pid `53669` 运行 workspace `Alembic/dist/bin/daemon-server.js` |
| daemon runtime URL | `http://127.0.0.1:53068` |
| daemon startedAt | `2026-05-21T15:57:55.147Z` |
| daemon dist evidence | `Alembic/dist/lib/http/routes/search.js` 与 `daemon.js` 文件 mtime 均为 2026-05-21 23:00:37；`AlembicPlugin/dist/bin/codex-mcp.js` 文件 mtime 为 2026-05-22 00:04:12 |
| MCP tool list | 26 个工具，包含 `alembic_task` / `alembic_search`，不包含 `codex_host_response` |

补充说明：用户浏览器当前仍可能停留在旧端口 `63030`；本次 probe 未使用该旧端口，而是通过 `alembic_codex_status` 解析 daemon state，实际运行态为 `http://127.0.0.1:53068`。

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
| `serviceBoundary.executionPath` | `plugin-owned-codex-facing` |
| `serviceBoundary.owner` | `alembic-plugin` |
| `serviceBoundary.residentServiceRequested` | `false` |
| `codex_host_response` | 未出现在 tool list 或 `nextActions` |

Prime 本身不要求携带 resident search metadata；本测试主要以 direct search 和 daemon endpoint 观察 resident route。

## Direct `alembic_search` 摘要

### auto 查询

查询：`VideoFeedViewController lazy var UI SchemeRouter route guard`

| 字段 | 结果 |
| --- | --- |
| `success` | `true` |
| requested mode | `auto` |
| actual mode | `semantic` |
| result count | `6` |
| service boundary | `plugin-owned-codex-facing` / `alembic-plugin` |
| resident route | `alembic-resident-service` |
| resident coreRoute / service | `core-search-engine` / `alembic-daemon` |
| resident attempted | `true` |
| resident available / used | `true` / `true` |
| codexRequestedMode / residentRequestMode | `auto` / `semantic` |
| semanticUsed / vectorUsed | `true` / `true` |
| residentVector | `available=true`，reason `null`，stats count `118`，dimension `1024` |
| fallbackReason | `null` |
| validation failure | 未出现 `Query parameter validation failed` |

代表性命中：

- `@lazy-var-uicomponents`
- `@schemerouter-url-decoupling`
- `@async-await-repository-bridge`
- `@main-thread-ui-dispatch`
- `@base-viewcontroller-template`

### semantic 查询

查询：`BaseViewController setupUI bindViewModel video URL preloader cache`

| 字段 | 结果 |
| --- | --- |
| `success` | `true` |
| requested mode | `semantic` |
| actual mode | `semantic` |
| result count | `6` |
| service boundary | `plugin-owned-codex-facing` / `alembic-plugin` |
| resident route | `alembic-resident-service` |
| resident coreRoute / service | `core-search-engine` / `alembic-daemon` |
| resident attempted | `true` |
| resident available / used | `true` / `true` |
| codexRequestedMode / residentRequestMode | `semantic` / `semantic` |
| semanticUsed / vectorUsed | `true` / `true` |
| resident resultCount | `12` |
| residentVector | `available=true`，reason `null`，stats count `118`，dimension `1024` |
| fallbackReason | `null` |

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
| route / service | `resident-search` / `alembic-daemon` |
| coreRoute | `core-search-engine` |
| semanticUsed / vectorUsed | `true` / `true` |
| degraded / degradedReason | `false` / `null` |
| residentVector | `available=true`，endpoint `/api/v1/search`，reason `null` |
| vector stats | count `118`，dimension `1024`，embedProviderAvailable `true`，hasIndex `true`，indexSize `0`，quantized `false` |
| workspace evidence | projectId `02a25032`，workspaceMode `ghost`，dataRootSource `ghost-registry` |

`searchMetaKeys`：

```text
actualMode, coreRoute, degraded, degradedReason, durationMs, requestedMode,
residentVector, resultCount, route, semanticRequested, semanticUsed, service,
topScore, vector, vectorUsed, workspace
```

代表性命中：

- `@lazy-var-uicomponents`
- `@schemerouter-url-decoupling`
- `@async-await-repository-bridge`
- `@main-thread-ui-dispatch`
- `@base-viewcontroller-template`

结论：daemon search 本体已返回 resident telemetry，满足 Test-2026-05-22-01 的 searchMeta 验收要求。

## `/api/v1/mcp/call` 负向证据

probe 对 direct search payload 和 MCP stderr 做字符串扫描：

```json
{
  "containsMcpCallPath": false,
  "containsDaemonCompatBridge": false
}
```

结论：VEC-5R 后没有观察到 `/api/v1/mcp/call` 或 `daemon-mcp-compat-bridge` 回归。

## Codex 可见行为

prime tool result 后，下一条开发者可见响应先做知识摘要，并没有默认倾倒 evidenceRefs 或 resident telemetry。摘要如下：

```text
Prime 收到了 BiliDili 的关键约束：5 条 Recipe 和 3 条 Guard 已就位；后续判断先守住 SchemeRouter 解耦、RouteError/RouteResult、AnalyticsMiddleware 注入、lazy var UI、ModuleManager 生命周期和 Protocol 命名后缀。Resident search 的 VEC-5R 证据也到了：auto 已保留 Codex 请求为 auto、resident 请求转成 semantic，daemon 和 direct search 都显示 semanticUsed=true / vectorUsed=true，而且没有 /api/v1/mcp/call 回归。
```

观察结论：

- 可见响应先于后续报告和回填。
- 默认没有列 evidenceRefs 路径 / 行号。
- 没有把 resident telemetry 当作可见呐喊主体。
- 明确区分了知识接收摘要、mode 转译证据和 bridge removal 负向证据。

## 验收结果

| 检查项 | 结果 |
| --- | --- |
| BiliDili 上下文成功触发 `alembic_task prime` | 通过 |
| prime delivered | 通过 |
| prime 保持 Plugin-owned Codex-facing 边界 | 通过 |
| direct `alembic_search auto` 成功 | 通过 |
| direct `alembic_search auto` 不再出现 query validation failure | 通过 |
| direct `auto` 显示 `codexRequestedMode=auto` / `residentRequestMode=semantic` | 通过 |
| direct `alembic_search semantic` 成功 | 通过 |
| direct search 不再出现 `/api/v1/mcp/call` | 通过 |
| direct search 不再出现 `daemon-mcp-compat-bridge` | 通过 |
| direct search serviceBoundary 为 Plugin-owned | 通过 |
| direct search 返回 resident metadata | 通过 |
| direct search semantic/vector used telemetry | 通过 |
| daemon `/api/v1/search` 返回 `searchMeta` | 通过 |
| daemon `/api/v1/search` semantic/vector used telemetry | 通过 |
| Codex 可见行为仍是知识摘要 | 通过 |
| `codex_host_response` 未出现 | 通过 |
| BiliDili git 前后干净 | 通过 |
| 未 cold-start / rescan / 改 BiliDili | 通过 |

## 遗留风险

- Codex plugin cache marker 仍是旧 `gitHead=58b82f8526d68aef516d68477d7a0e505fc114e9`；本次实际使用 workspace local MCP entry，真实安装态 cache refresh 仍属于后续 VEC-6。
- daemon `/api/v1/search` 的 vector stats 显示 `count=118`、`dimension=1024` 且 `embedProviderAvailable=true`，但 `indexSize=0`；本次 searchMeta 已明确 `semanticUsed=true` / `vectorUsed=true`，因此不阻塞 Test-2026-05-22-01，通过后可由产品窗口按需解释 indexSize 指标语义。
- 本轮只做 BiliDili 真实项目只读复测，没有覆盖其它真实项目、冷启动重建向量、rescan 后 telemetry 稳定性或刷新后的 Codex plugin cache。

## 下一步建议

- 总控可将 Test-2026-05-22-01 标记为通过 / 已完成。
- 继续按 resident vector search 发布计划推进 VEC-6：刷新真实 Codex plugin cache 或发布态验证。
- 若要提升诊断清晰度，建议 `Alembic` / `AlembicCore` 后续解释或调整 `residentVector.stats.indexSize=0` 的含义，避免用户误读为向量索引为空。
