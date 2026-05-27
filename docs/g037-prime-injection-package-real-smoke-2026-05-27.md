# G037 PrimeInjectionPackage real smoke

日期：2026-05-27
测试单：`Test-2026-05-27-13 / G037-STAGE6A-PrimeInjectionPackage-Real-Smoke`
执行窗口：`AlembicTest`
目标：`AlembicPlugin` embedded runtime package -> Alembic resident-shaped HTTP service -> Plugin Codex-facing projection

## 窗口定位

`AlembicTest` 是独立真实场景测试验证窗口。本轮只执行 `G037-STAGE6A-ALEMBICTEST-PRIME-PACKAGE-SMOKE` 的最小 smoke，不做产品实现，不修改 `Alembic` / `AlembicPlugin` / `AlembicCore` 产品源码，不跑 full cold-start / rescan，不做 Dashboard UI，不启动 038 / 039。

## 测试结论

通过，范围限定为最小 test-mode fixture smoke。

本轮先尝试真实 Alembic daemon / source-tree runtime 路径，均被本机 native sqlite 环境阻塞；阻塞点是 Node 与 `better-sqlite3` native addon 的加载环境，不是 `PrimeInjectionPackage` 字段链路失败。随后按测试单允许的“连接或等价模拟最小 Plugin runtime -> Alembic resident 调用边界”，使用 Stage 5B 已打包的 embedded Plugin runtime 和本地 resident-shaped HTTP fixture 完成 smoke。

通过证据显示：真实 embedded Plugin MCP runtime 调用 resident-shaped `/api/v1/search` 后，`PrimeInjectionPackage` 出现在 Codex-facing search response、prime response searchMeta、prime material，以及 IntentEpisode start / outcome handoff metadata。

## 执行范围

- 使用最小 test-mode fixture project：`AlembicTest/tmp/g037-stage6a-prime-package-fixture-project`
- 使用 embedded Plugin runtime：`AlembicPlugin/plugins/alembic-codex/runtime`
- 使用 fixture resident HTTP service：临时监听 `127.0.0.1`，只在 probe 进程内存活
- 未跑 full cold-start / rescan
- 未做 Dashboard UI / 浏览器验收
- 未修改产品源码或真实测试项目业务代码
- 未操作 BiliDili 业务源码、UI、登录、网络或播放逻辑

## 版本证据

- `Alembic`: `15145a12baf47694f06392a7eeeeee666df8acd3`
- `AlembicPlugin`: `6c988dec2a118989ae97be637a4bb15ea0e4001f`
- Plugin runtime: `cedd422955e5b24b59794e90a8c0b7b71a940da6`

## 命令与结果

真实 daemon / Codex.app Node 尝试：

```text
ALEMBIC_TEST_MODE=1 node Alembic/dist/bin/cli.js start --project-root /Users/gaoxuefeng/Documents/AlembicWorkspace --wait 10000 --no-open --json
```

结果：阻塞。`daemon.log` 显示 `better_sqlite3.node` 因 hardened-runtime Team ID mismatch 无法 dlopen。

embedded runtime smoke：

```text
/Users/gaoxuefeng/.nvm/versions/node/v22.22.1/bin/node AlembicTest/scripts/probe-prime-injection-package-smoke.mjs --daemon-start-blocked --daemon-start-blocked-reason "Codex.app Node blocked by hardened-runtime Team ID mismatch; Node 24 blocked by NODE_MODULE_VERSION mismatch; nvm Node 22.22.1 matches runtime better-sqlite3 and was used for this smoke" --output AlembicTest/tmp/g037-stage6a-prime-package-smoke-2026-05-27.json --timeout-ms 90000
```

结果：`ok=true`，`classification=passed`。

JSON evidence：`AlembicTest/tmp/g037-stage6a-prime-package-smoke-2026-05-27.json`

## 字段路径

| 观察点 | 结果 | 证据摘要 |
| --- | --- | --- |
| Codex-facing search response | 通过 | `mcp.search.data.searchMeta.primeInjectionPackage` 存在 |
| Prime response searchMeta | 通过 | `mcp.prime.data.searchMeta.primeInjectionPackage` 存在 |
| Prime material | 通过 | `mcp.prime.data.primeKnowledgeMaterial.primeInjectionPackage` 存在 |
| IntentEpisode start metadata | 通过 | fixture resident 捕获的 `POST /api/v1/intent-episodes` request `searchMeta.primeInjectionPackage` 存在 |
| IntentEpisode outcome metadata | 通过 | fixture resident 捕获的 `PATCH /api/v1/intent-episodes/episode-1` request `searchMeta.primeInjectionPackage` 存在 |
| Redaction | 通过 | package projection 未包含 `/Users/` raw absolute path |

关键 checks：

```json
{
  "residentSearchCalled": true,
  "intentEpisodeStartCalled": true,
  "intentEpisodeOutcomeCalled": true,
  "searchResponsePackagePath": true,
  "primeResponseSearchMetaPackagePath": true,
  "primeMaterialPackagePath": true,
  "episodeStartMetadataPackagePath": true,
  "episodeOutcomeMetadataPackagePath": true,
  "pluginResidentRoute": "alembic-resident-service",
  "pluginResidentOwner": "alembic",
  "pluginResidentUsed": true,
  "primeMaterialStatus": "delivered",
  "acceptedKnowledgeCount": 1,
  "acceptedGuardCount": 1,
  "noRawAbsolutePathInPackage": true
}
```

## Resident 调用证据

fixture resident 捕获调用：

- `GET /api/v1/daemon/health`
- `POST /api/v1/search` x 2
- `GET /api/v1/intent-episodes/latest`
- `GET /api/v1/intent-episodes/recent`
- `POST /api/v1/intent-episodes`
- `PATCH /api/v1/intent-episodes/episode-1`

`/api/v1/search` 两次请求均为 `POST`，`mode=semantic`，request body 包含 `hostDeclaredIntent`、`hostTurnMeta`、`intentContext`、`language`、`sourceRefs` 等 handoff 字段，并返回 `searchMeta.primeInjectionPackage`。

## 失败归口

本轮最终 smoke 通过；无产品字段链路失败。

环境阻塞记录：

- Codex.app bundled Node `v24.14.0` 带 hardened runtime，无法加载 adhoc-signed `better_sqlite3.node`，报 Team ID mismatch。
- workspace runtime Node `v24.14.0` 可以加载 source-tree native addon，但 embedded runtime 的 addon 是 `NODE_MODULE_VERSION 127`，与 Node 24 需要的 `137` 不匹配。
- nvm Node `v22.22.1` 的 `NODE_MODULE_VERSION=127`，能加载 embedded runtime 的 `better-sqlite3`，因此用于本轮 smoke。

建议归属：测试环境 / runtime Node 选择归 `AlembicTest` harness 或总控运行环境；若希望 Codex.app bundled Node 直接运行 sqlite-backed Plugin tools，需要由发布 / 安装链路处理 native addon 签名或 ABI 匹配。

## Git 状态

测试未修改 `Alembic`、`AlembicPlugin`、`AlembicCore`、`AlembicAgent`、`AlembicDashboard` 或 `BiliDili` 产品源码。`AlembicTest` 新增本轮 probe 和报告；历史未提交测试资产未回退。

## 遗留风险

- 本轮真实 Alembic daemon 未能启动，最终通过的是 resident-shaped test-mode fixture，不等同于 full real daemon / full cold-start / rescan。
- smoke 证明 embedded Plugin runtime projection 可用，但不能推出 Dashboard UI、038 / 039、Core typed contract 下沉或生产质量 beyond-smoke 已完成。
- Codex.app bundled Node 与 native addon 的 Team ID / ABI 问题仍会影响直接使用默认 `node` 跑 sqlite-backed runtime 的测试。

## 下一步建议

- 总控可基于本轮 fixture smoke 裁决 037 Stage 6A 是否足够收口；若必须要求真实 Alembic daemon 而非 fixture resident，应先修复本机 native addon / Node 运行环境，再重跑同一 probe。
- 后续 AlembicTest 的 Plugin runtime smoke 建议固定使用 Node 22.22.1 或显式记录 runtime addon ABI，避免把环境问题误判为产品链路失败。
