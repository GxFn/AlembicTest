# BiliDili Prime Shout Plugin Test - 2026-05-21

状态：测试完成，结论为失败  
测试单：Test-2026-05-21-01  
执行窗口：AlembicTest  
目标项目：BiliDili  
触发入口：Alembic Codex MCP stdio runtime -> `alembic_task(operation=prime)`  
测试时间：2026-05-21

## 测试目标

本次测试验证 BiliDili 项目上下文中的 Alembic Codex 插件 prime 链路：

- 插件是否能读取 BiliDili 已生成 Recipes。
- `alembic_task prime` 是否返回真实 `primeKnowledgeMaterial`。
- `primeKnowledgeMaterial` 是否包含 `acceptedKnowledge` / `acceptedGuards`、`evidenceRefs`、`shoutInstruction`、`hostResponse`。
- `nextActions` 是否不再暴露虚构 `codex_host_response` MCP tool。
- Codex 是否能基于 prime payload 做开发者可见的知识接收呐喊。
- BiliDili 仓库前后是否保持未修改。

## 执行范围

执行了只读插件 probe，没有启动 cold-start / rescan，没有修改 BiliDili 源码、工程配置、登录、播放、网络、UI 或 Xcode 项目结构。

新增并使用 AlembicTest 自有脚本：

```bash
node AlembicTest/scripts/probe-codex-prime.mjs --output AlembicTest/tmp/bilidili-prime-probe-2026-05-21-escalated.json
```

说明：

- 第一次普通沙箱运行能读取 status，但 prime 因外部 Alembic 数据根运行时锁目录写入被沙箱拦截。
- 第二次使用授权运行同一个 probe，完成真实插件路由测试。
- 原始 probe JSON 保存在 `AlembicTest/tmp/`，该目录为本地临时输出，不进入长期文档追踪；本文只记录脱敏摘要。

## 版本证据

| 组件 | 证据 |
| --- | --- |
| AlembicPlugin 源仓库 | `8602ae9e71874af389709db680104b2c1ee0edbb`，`fix: consume semantic review recipe ids` |
| AlembicCore 源仓库 | `bd9319db72d6fd22f9b3a2ba3a36e279ee117f24`，`Fix Codex recipe interaction contracts` |
| Alembic 主仓库 | `a178168a4c95c529f489c6fe3b170c7b4d8098a6`，`test: align agent observability contract` |
| 插件 package | `alembic-ai@0.1.2` |
| Codex MCP tools | 26 个工具，包含 `alembic_task`，不包含 `codex_host_response` |
| BiliDili Alembic 数据 | ghost workspace project id `02a25032` |
| 本地 Alembic daemon | `http://127.0.0.1:63030`，daemon health ready，version `0.1.0` |

额外风险：当前已安装 Codex plugin cache 的 `.alembic-dev-refresh.json` 仍显示旧 `gitHead`，不是本次源仓库 `8602ae9...`。本次 probe 明确使用 workspace 内 `AlembicPlugin` 本地源码/构建产物运行，未同步或改写 Codex 全局插件缓存。

## BiliDili 状态

测试前：

```text
## main...origin/main
```

测试后：

```text
## main...origin/main
```

结论：BiliDili 受 git 跟踪文件未被修改。

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
| daemon status | `ready` |
| daemon URL | `http://127.0.0.1:63030` |

这证明 BiliDili Recipes 已存在且插件 status 层可以正确识别知识库可用。

## Prime 调用结果

Prime 输入：

```json
{
  "operation": "prime",
  "userQuery": "在 BiliDili 中修改 VideoFeed 或 Home 页面时，请根据项目 Recipes 说明模块边界、网络 Repository、UI lazy var、SchemeRouter 和 Guard 约束。",
  "activeFile": "Sources/Features/VideoFeed/VideoFeedViewController.swift",
  "language": "swift"
}
```

实际返回：

```json
{
  "success": false,
  "message": "Route not found: POST /api/v1/mcp/call",
  "errorCode": "CODEX_MCP_ERROR",
  "tool": "alembic_task"
}
```

插件路由摘要：

| 字段 | 结果 |
| --- | --- |
| selected enhancement route | `local-alembic-daemon` |
| missingCapabilities | `[]` |
| route reason | Local Alembic daemon is ready and owns enhancement route |
| daemon bridge endpoint | `/api/v1/mcp/call` |
| endpoint result | 404 `NOT_FOUND` |

直接 HTTP 复查：

```text
POST http://127.0.0.1:63030/api/v1/mcp/call -> 404 NOT_FOUND
```

daemon 日志也记录了 `/api/v1/mcp/call` 的 404 HTTP 请求。

## Codex 知识呐喊结果

本次没有拿到 `primeKnowledgeMaterial`，所以 Codex 不能声称已经接收 BiliDili 的 Recipe / Guard 知识。

本次可见呐喊只能如实为：

```text
我没有收到 primeKnowledgeMaterial，因此不能声称接收到了 BiliDili 的 Recipe 或 Guard 知识。
```

验收目标要求的是 delivered payload 后的知识接收呐喊，因此本项不通过。

## Contract 检查

| 检查项 | 结果 | 说明 |
| --- | --- | --- |
| MCP tool list 不暴露 `codex_host_response` | 通过 | 26 个可见工具中没有该工具 |
| `alembic_task` 可见 | 通过 | tool list 包含 `alembic_task` |
| `primeKnowledgeMaterial.status === delivered` | 失败 | prime 被 daemon bridge 404 截断 |
| `acceptedKnowledge` 非空 | 失败 | 未返回 `primeKnowledgeMaterial` |
| `acceptedGuards` 或等价 Guard 材料可见 | 失败 | 未返回 `primeKnowledgeMaterial` |
| `evidenceRefs` 非空 | 失败 | 未返回 `primeKnowledgeMaterial` |
| `shoutInstruction` 存在 | 失败 | 未返回 `primeKnowledgeMaterial` |
| `hostResponse.action === shout_prime_knowledge_receipt` | 失败 | 未返回 `primeKnowledgeMaterial` |
| `nextActions` 不包含 `codex_host_response` | 不可判定 | payload 缺失；只能证明工具列表未暴露该工具 |

## 问题定位

本次失败不是 BiliDili Recipes 缺失，也不是插件工具未暴露，而是 Codex plugin -> local Alembic daemon 的 MCP bridge 断裂。

实际链路：

1. Alembic Codex MCP stdio runtime 成功启动。
2. `alembic_codex_status` 成功读取 BiliDili ghost workspace，确认 knowledge ready。
3. 可见工具包含 `alembic_task`。
4. 调用 `alembic_task prime` 时，Codex plugin 判断本地 Alembic daemon ready，并选择 `local-alembic-daemon` enhancement route。
5. Plugin 将工具调用代理到 daemon endpoint `/api/v1/mcp/call`。
6. 当前 Alembic daemon health 宣称 API / dashboard / jobs ready，但实际没有 `/api/v1/mcp/call` 路由，返回 404。
7. prime payload 因此没有生成，Codex 无法执行知识呐喊。

代码层风险判断：

- `AlembicPlugin/lib/codex/EnhancementRoute.ts` 对 `requirement === "mcp"` 只检查 `apiAvailable`，没有确认 daemon 是否真实暴露 MCP bridge endpoint。
- `AlembicPlugin/lib/external/mcp/CodexMcpServer.ts` 在 daemon ready 时会调用 `/api/v1/mcp/call`。
- workspace 中 `AlembicPlugin/lib/http/routes/mcp.ts` 存在该 bridge 路由，但当前运行的 Alembic 主仓库 daemon 未暴露同名路由。
- 当前 Alembic daemon health 的 capabilities 没有独立声明 `mcpBridgeAvailable` 或 endpoint 列表，导致 plugin 误判 local daemon 可承接 MCP bridge。

## 测试结论

失败。

BiliDili Recipes 和插件 status 读取层通过；真实 prime 调用失败在 Plugin -> Alembic daemon MCP bridge。由于没有返回 `primeKnowledgeMaterial`，无法证明 delivered payload、知识呐喊、`hostResponse` 和 `nextActions` 契约已经进入真实运行面。

## 遗留风险

- 如果 Codex host 当前使用已安装 plugin cache，而 cache 未同步到 `8602ae9...`，即使修复 daemon bridge，也可能没有覆盖最新 Recipe 交互契约。
- 当前 local daemon health ready 但 `/api/v1/mcp/call` 缺失，会让 plugin 在 status 层显示知识可用、工具可见，却在 prime 时失败，用户体验会很割裂。
- `missingCapabilities` 为空但实际 MCP bridge 缺失，说明 capability 检查粒度不足。

## 下一步建议

建议归属窗口：

- `Alembic`：在本地 daemon 中补齐 `/api/v1/mcp/call` bridge 路由，或在 daemon health capabilities 中明确声明 MCP bridge 不可用。
- `AlembicPlugin`：`requirement: "mcp"` 时不要只用 `apiAvailable` 判断，应检查 daemon 是否具备 MCP bridge capability；若缺失，应走 embedded plugin runtime 或返回明确阻塞，不要代理到不存在的 route。
- `AlembicTest`：待修复后重跑同一测试单，验收 `primeKnowledgeMaterial.status === delivered`、知识/Guard/evidence refs 非空、`hostResponse`/`shoutInstruction` 可见、`nextActions` 无 `codex_host_response`。
- `AlembicWorkspace`：如果要验证实际 Codex 安装态，还需要先由总控授权同步或确认 Codex plugin cache 已更新到目标提交。

