# BiliDili Resident Vector Search Route Test - 2026-05-21

状态：测试失败，取证完成
测试单：Test-2026-05-21-05
执行窗口：AlembicTest
目标项目：BiliDili
触发入口：Alembic Codex MCP stdio runtime -> `alembic_task(operation=prime)` + `alembic_search(auto/semantic)`
测试时间：2026-05-21

## 测试目标

本次复测验证 resident vector search 发布线在 BiliDili 真实项目中的闭环：

- `alembic_task(operation=prime)` 能保留 resident route metadata，或清楚说明降级原因。
- direct `alembic_search` 的 `auto` / `semantic` 查询能通过 Alembic resident service 获取 semantic/vector metadata。
- resident 不可用时，fallback 分类应清楚，不能误报为 Plugin embedding provider failure。
- Codex 可见行为仍是知识摘要，不默认倾倒 evidenceRefs 或 resident telemetry。
- BiliDili 测试前后 git 状态保持干净。

## 结论

测试失败。BiliDili 上下文可成功 prime，且 `alembic_task prime` 仍保持 Plugin-owned Codex-facing 边界；但 direct `alembic_search` 没有进入 resident search metadata 链路。

关键断点：

- `alembic_search(auto)` 与 `alembic_search(semantic)` 均返回 `success=false`。
- 两次 direct search 均被路由到 `daemon-mcp-compat-bridge`，请求 `POST /api/v1/mcp/call`，daemon 返回 `Route not found: POST /api/v1/mcp/call`。
- direct search payload 没有 `searchMeta.residentSearch` 或 `residentVector`，也没有 baseline fallback 结果。
- 只读探测 daemon `/api/v1/search` 能返回 6 条语义命中，但返回体没有 `searchMeta` 字段，因此没有 `route`、`semanticUsed`、`vectorUsed`、`residentVector` 或 fallbackReason。

这不满足 Test-05 的通过标准：direct `alembic_search` 没有可观察 resident route success，也没有清楚的 resident fallback metadata。

## 执行范围

执行了只读 probe，没有启动 cold-start / rescan，没有重建向量，没有刷新 plugin cache，也没有修改 BiliDili 业务源码、工程配置、登录、播放、网络、UI 或 Xcode 项目结构。

使用命令：

```bash
git -C BiliDili status --short --branch
npm --prefix AlembicTest run check
node AlembicTest/scripts/probe-resident-vector-search.mjs --output AlembicTest/tmp/bilidili-resident-vector-search-probe-2026-05-21.json
git -C BiliDili status --short --branch
```

说明：probe 通过 workspace 内 `AlembicPlugin/dist/bin/codex-mcp.js` 启动 Codex MCP stdio runtime，并把 `ALEMBIC_PROJECT_DIR` 指向 workspace 内 `BiliDili`。由于 direct search 需要读取 Alembic daemon state 并访问 localhost daemon，最终取证命令在 Codex 中使用了 elevated sandbox permission；原始 JSON 保存在 `AlembicTest/tmp/`，长期报告只记录脱敏摘要。

## 版本证据

| 组件 | 证据 |
| --- | --- |
| AlembicPlugin 源仓库 | `7a81721061bbaaba437343876a56eec62356297a` |
| AlembicCodex runtime artifact | `c160c062e95329ff0126cb98f1a9c36bbd451678` |
| AlembicCore 源仓库 | `39bcebe94c451f92e405b0da38d2cbe67e8e0f82` |
| Alembic 源仓库 | `2cfd935b83241ee72263e18528c9647ded65dec7` |
| Codex plugin cache marker | cache marker 仍显示 `gitHead=58b82f8526d68aef516d68477d7a0e505fc114e9`，但 `localMcpEntry` 指向 workspace `AlembicPlugin/dist/bin/codex-mcp.js`；本次 probe 实际使用 workspace local MCP entry |
| Alembic daemon | health ready，`version=0.1.0`，`mode=daemon`，project 指向 BiliDili，schema migration 为 `009_knowledge_dimension_id` |
| MCP tool list | 26 个工具，包含 `alembic_task` / `alembic_search`，不包含 `codex_host_response` |

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

Prime 输入：

```json
{
  "operation": "prime",
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
| acceptedGuards | `3` |
| `searchMeta.residentSearch` | 未出现 |
| `searchMeta.residentVector` | 未出现 |
| `serviceBoundary.executionPath` | `plugin-owned-codex-facing` |
| `serviceBoundary.owner` | `alembic-plugin` |
| `serviceBoundary.residentServiceRequested` | `false` |
| `codex_host_response` | 未出现在 tool list 或 `nextActions` |

Prime 仍证明 Codex-facing prime 边界没有回退成 daemon MCP ownership bridge；但它没有交付 resident route telemetry，无法证明 prime payload 已携带 resident search metadata。

## Direct `alembic_search` Payload 摘要

direct search 查询：

```json
[
  {
    "tool": "alembic_search",
    "mode": "auto",
    "query": "VideoFeedViewController lazy var UI SchemeRouter route guard"
  },
  {
    "tool": "alembic_search",
    "mode": "semantic",
    "query": "BaseViewController setupUI bindViewModel video URL preloader cache"
  }
]
```

两次调用结果一致：

| 字段 | auto | semantic |
| --- | --- | --- |
| `success` | `false` | `false` |
| `message` | `Route not found: POST /api/v1/mcp/call` | `Route not found: POST /api/v1/mcp/call` |
| `serviceBoundary.executionPath` | `daemon-mcp-compat-bridge` | `daemon-mcp-compat-bridge` |
| `serviceBoundary.owner` | `alembic-resident-service` | `alembic-resident-service` |
| `serviceBoundary.residentServiceRequested` | `true` | `true` |
| `searchMeta.residentSearch` | 无 | 无 |
| `residentVector` | 无 | 无 |
| fallback 结果 | 无 baseline 结果 | 无 baseline 结果 |

结论：direct `alembic_search` 当前没有走到 Plugin resident search client，也没有直接打到 daemon `/api/v1/search`；它选择了 daemon MCP compat bridge，但当前 daemon 不提供 `POST /api/v1/mcp/call`，因此 search 工具调用整体失败。

## Daemon `/api/v1/search` 只读探测

为区分 direct MCP bridge 与 daemon resident endpoint 本体，probe 使用 daemon token 做了一次只读 `GET /api/v1/search` semantic 查询。长期报告不记录 token。

结果摘要：

| 字段 | 结果 |
| --- | --- |
| endpoint | `/api/v1/search` |
| HTTP status | `200` |
| `success` | `true` |
| requested mode | `semantic` |
| actual mode | `semantic` |
| itemCount | `6` |
| `searchMeta` keys | `[]` |
| `route` / `service` | 未返回 |
| `semanticUsed` / `vectorUsed` | 未返回 |
| `residentVector` | 未返回 |
| fallbackReason | 未返回 |

代表性命中：

- `Feature ViewController 统一 lazy var UI 组件延迟初始化`，trigger `@lazy-var-uicomponents`，score `0.46337594255873304`
- `SchemeRouter URL 路由解耦 Feature 模块`，trigger `@schemerouter-url-decoupling`，score `0.44246182592656225`
- `async/await Repository 层与 RxSwift UI 层通过 AsyncRxBridge 桥接`，trigger `@async-await-repository-bridge`，score `0.4331474423225961`
- `DispatchQueue.main.async 统一 UI 线程调度 + @MainActor 标注`，trigger `@main-thread-ui-dispatch`，score `0.4231474423225961`
- `BaseViewController Template Method：setupUI() → bindViewModel() 模板流程`，trigger `@base-viewcontroller-template`，score `0.42254752241414567`

结论：daemon search 本体能返回相关 BiliDili 知识命中，但当前运行态没有返回 resident telemetry，因此无法证明 semantic/vector route 是否真实使用。

## Codex 可见行为

prime tool result 后的下一条开发者可见响应先做了知识摘要，不默认倾倒 evidenceRefs 或 resident telemetry。摘要如下：

```text
Prime 收到了 BiliDili 的 5 条 Recipe 和 3 条 Guard；我后续会先按这些项目约束判断，而不是先散开去读路径清单。最终证据包确认：MCP direct search 被错误桥接到 POST /api/v1/mcp/call，daemon /api/v1/search 能返回 6 条语义命中但没有 resident telemetry，这一轮 Test-05 结论会是失败而不是通过。
```

观察结论：

- 可见响应先于后续写报告和回填。
- 没有默认列 evidenceRefs 路径 / 行号。
- 没有把 resident telemetry 当作可见呐喊主体。
- 对 direct search 失败做了开发者可见的明确归类。

## 验收结果

| 检查项 | 结果 |
| --- | --- |
| BiliDili 上下文成功触发 `alembic_task prime` | 通过 |
| prime 保持 Plugin-owned Codex-facing 边界 | 通过 |
| prime payload 包含 resident search metadata | 失败 |
| direct `alembic_search auto` 成功 | 失败 |
| direct `alembic_search semantic` 成功 | 失败 |
| direct search 包含 `searchMeta.residentSearch` / `residentVector` | 失败 |
| resident ready 且命中时体现 `route=alembic-resident-service` | 失败 |
| resident 不可用时 baseline fallback 继续可用且原因清晰 | 失败 |
| daemon `/api/v1/search` 返回 BiliDili 命中 | 通过 |
| daemon `/api/v1/search` 返回 resident telemetry | 失败 |
| Codex 可见行为仍是知识摘要 | 通过 |
| `codex_host_response` 未出现 | 通过 |
| BiliDili git 前后干净 | 通过 |
| 未 cold-start / rescan / 改 BiliDili | 通过 |

## 问题归属判断

建议归属 `AlembicPlugin` / `Alembic` 共同排查：

- `AlembicPlugin` direct `alembic_search` 当前在 local daemon ready 时选择 `daemon-mcp-compat-bridge`，但当前 daemon 没有 `/api/v1/mcp/call`；这使 direct search 工具无法返回 baseline 或 resident metadata。
- `Alembic` 当前运行态 `/api/v1/search` 虽能返回命中，但没有返回 resident telemetry；与源仓库中 `search.ts` 的 resident telemetry 预期不一致，可能是运行态 daemon 未覆盖目标 dist、运行态入口未刷新，或 route 返回层仍是旧实现。
- Codex plugin cache marker 仍是 SHOUT-5 commit，但本次实际 MCP entry 是 workspace local `AlembicPlugin/dist/bin/codex-mcp.js`，该入口符合测试单允许的 local MCP entry 路径；cache refresh 本身不是本测试目标。

## 遗留风险

- 本次不允许冷启动、rescan 或刷新 cache，因此未验证重启 daemon 后是否会暴露新的 `/api/v1/search` telemetry。
- direct `alembic_search` 未进入 baseline fallback，导致无法判断 fallback 分类在成功降级路径中是否完整。
- daemon `/api/v1/search` 返回 6 条语义命中，但没有 `semanticUsed` / `vectorUsed`；这些命中可能来自现有 search engine 的 semantic mode，也可能是非 telemetry 旧路径，不能作为 resident vector success 证据。
- 原始 probe JSON 位于 `AlembicTest/tmp/`，包含本机运行路径；长期报告只保留脱敏摘要。

## 下一步建议

- 总控应将 Test-2026-05-21-05 标记为失败 / 待产品修复，不建议继续在 BiliDili 扩大测试范围。
- `AlembicPlugin` 优先修正 `alembic_search` 的 local daemon ready 路由：对于 direct search，应走 Plugin resident search client 或 daemon `/api/v1/search`，并返回 `searchMeta.residentSearch` / `residentVector`；不要请求当前不存在的 `/api/v1/mcp/call`。
- `Alembic` 需要确认实际 daemon runtime 是否已覆盖 `2cfd935b83241ee72263e18528c9647ded65dec7` 的 `/api/v1/search` telemetry；若运行态落后，应由对应窗口按发布计划处理，不在 AlembicTest 中刷新。
- 产品修复后再重跑本脚本，验收 direct `alembic_search auto/semantic` 是否出现 `route=alembic-resident-service`、`semanticUsed`、`vectorUsed`、`residentVector` 和清晰 fallbackReason。
