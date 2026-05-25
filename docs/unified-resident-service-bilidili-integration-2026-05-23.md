# Unified Resident Service BiliDili Integration Test - 2026-05-23

## 窗口定位与职责

- 当前窗口：`AlembicTest`
- 目标仓库：`AlembicTest`
- 真实项目：`BiliDili`，只读验证，不修改源码、不提交 BiliDili。
- 本轮职责：执行 `Test-2026-05-23-01`，验证 Plugin baseline、local Alembic resident enhancement、resident search、Dashboard handoff、job 边界、prime receipt shout 和旧桥接 / project control 负向证据。

## 测试结论

结论：通过。

`AlembicPlugin` 在 BiliDili 真实项目中表现符合 `unified resident service` 测试要求：

- daemon 不可用时，Plugin baseline 仍能交付项目知识，并明确把 resident search 标为已尝试但不可用 / 降级；未冒充本地 Alembic resident enhancement。
- 本地 Alembic daemon 重启后，`alembic_codex_status` 选择 `local-alembic-daemon`，resident service owner 为 `alembic`，Dashboard handoff 返回本地 URL。
- 直接 `alembic_search(auto/semantic)` 通过 Plugin-owned Codex-facing 工具执行，同时请求 resident `/api/v1/search`；payload 中保留 `residentSearch` / `residentVector`、`codexRequestedMode` / `residentRequestMode`、semantic/vector telemetry。
- `alembic_task prime` 保持 Plugin-owned，`residentServiceRequested=false`；可见喊话为 Recipe / Guard 摘要和后续判断依据，没有默认倾倒 evidenceRefs 路径 / 行号。
- `alembic_codex_job` 通过 resident service 读取 Alembic internal AI job 状态，job capability 为 `jobs.internal-ai.bootstrap/rescan`，与 embedded host-agent recoverable job 能力区分清楚。
- probe payload 和 MCP stderr 未出现 `/api/v1/mcp/call`、`/api/v1/projects/*` 或 `daemon-mcp-compat-bridge`。

## 执行范围

- BiliDili git：测试前后均为 `## main...origin/main`，无未提交变更。
- AlembicTest：新增只读 probe 脚本和报告；raw evidence 写入 ignored `AlembicTest/tmp/`。
- 未执行：未新建 bootstrap/rescan job，未跑完整冷启动，未修改 Alembic / AlembicPlugin / BiliDili 产品源码。

## 使用配置

- `AlembicTest/config/defaults.json`
- project：`BiliDili`
- Alembic repo：`Alembic`
- Plugin repo：`AlembicPlugin`
- restart：`preclean.enabled=true`、`stopAllServices=true`、`cleanLogs=true`、`devLink=true`、`waitMs=10000`
- probe：
  - `node AlembicTest/scripts/probe-unified-resident-service.mjs --phase baseline`
  - `node AlembicTest/scripts/probe-unified-resident-service.mjs --phase resident`

## 版本证据

- AlembicCore：`b5e3bd5496d8831ae167ecfa79598dd6d792b60b`
- Alembic：`70917fa509aed03cbd322d1d46acb1eb50f8f0cc`
- AlembicPlugin：`139a7edfde8149aba7c6a89c00066928b0cb9a40`
- Alembic package version：`0.2.0`
- Alembic Codex runtime package version：`0.2.0`
- runtime tgz sha256：`ea8a805a6fe1cac55498e47ede100debdc8883f54eecd233106c83ca7b23623f`

## 状态变化

Baseline 前：

- BiliDili workspace 已初始化，knowledge usable。
- local Alembic daemon state stale；resident service route 为 `unavailable`，owner 为 `alembic-plugin`。
- `alembic_codex_dashboard` fail-closed，原因是 active runtime unavailable / host project disconnected。

重启：

- 命令：`npm --prefix AlembicTest run restart -- --monitor-once --json`
- preclean：发现 BiliDili ghost data root `02a25032`，移除 stale daemon state / pid / lock，清理旧 daemon log。
- dev link：`npm run dev:link` 成功，重建 AlembicCore / AlembicAgent / Alembic / Dashboard assets，global `alembic --version` 为 `0.2.0`。
- 新 daemon：pid `47933`，API / Dashboard URL `http://127.0.0.1:61828`。

Resident probe 后：

- `enhancementRoute.selected=local-alembic-daemon`
- `residentService.owner=alembic`
- `residentService.route=local-alembic-daemon`
- `daemon.ready=true`
- `hostProjectAlignment.connectionState=connected`
- Dashboard handoff：成功，URL `http://127.0.0.1:61828`

## Raw Evidence

- Baseline：`AlembicTest/tmp/unified-resident-service-baseline-2026-05-23T15-35-05-876Z.json`
- Resident：`AlembicTest/tmp/unified-resident-service-resident-2026-05-23T15-36-38-818Z.json`

这些 raw JSON 在 `AlembicTest/tmp/` 下，按仓库规则不提交；本报告保留长期摘要。

## 关键日志与 Payload 摘要

### Baseline

- classification：`pass-with-clear-fallback`
- packageVersion：`0.2.0`
- enhancementSelected：`local-alembic-install`
- residentService：`owner=alembic-plugin`、`route=unavailable`
- daemonReady：`false`
- Dashboard：`success=false`、`dashboardUrl=null`、error semantic 为 host project disconnected / active runtime unavailable。
- prime：`status=delivered`，收到 `5` 条 Recipe、`2` 条 Guard。
- direct search：
  - auto：`residentSearch.attempted=true`、`available=false`、`reason=route-unavailable`、`fallbackReason=vector_service_hybrid_unavailable`
  - semantic：`residentSearch.attempted=true`、`available=false`、`reason=route-unavailable`、`fallbackReason=embed_provider_unavailable`
- removed bridge scan：`containsMcpCallPath=false`、`containsProjectsApiPath=false`、`containsDaemonCompatBridge=false`

### Restart Monitor

- Dashboard/API：`http://127.0.0.1:61828`
- Monitor source：compact jobs API
- Latest bootstrap job：`bootstrap_mpf6tn10_c572b8a1`
- Latest bootstrap status：`failed`
- session id：`bs_1779349624495_scvvf0`
- 历史失败维度：`data-event-flow`、`ui-interaction`，原因 `stage_timeout`
- 本轮没有新建 bootstrap/rescan job；这里仅记录已有 job 状态用于 handoff/job 边界验证。

### Resident

- classification：`pass`
- packageVersion：`0.2.0`
- enhancementSelected：`local-alembic-daemon`
- residentService：`owner=alembic`、`route=local-alembic-daemon`
- availableFeatures：
  - `status.health`
  - `search.keyword`
  - `search.semantic`
  - `jobs.internal-ai.bootstrap`
  - `jobs.internal-ai.rescan`
  - `dashboard.handoff`
  - `file-monitor.git-worktree`
- unavailableFeatures：
  - `jobs.host-agent-recoverable.bootstrap`
  - `jobs.host-agent-recoverable.rescan`
- direct daemon `/api/v1/search`：
  - HTTP `200`
  - mode `semantic`
  - `searchMeta` keys include `residentVector`, `semanticUsed`, `vectorUsed`, `workspace`, `coreRoute`
  - `residentVector.available=true`
  - vector stats：`count=131`、`dimension=1024`、`hasIndex=true`
  - `semanticUsed=true`、`vectorUsed=true`
- direct `alembic_search(auto)`：
  - `residentSearch.route=alembic-resident-service`
  - `service=alembic-daemon`
  - `available=true`
  - `used=true`
  - `codexRequestedMode=auto`
  - `residentRequestMode=semantic`
  - `actualMode=semantic`
  - `semanticUsed=true`
  - `vectorUsed=true`
- direct `alembic_search(semantic)`：
  - `codexRequestedMode=semantic`
  - `residentRequestMode=semantic`
  - `actualMode=semantic`
  - `semanticUsed=true`
  - `vectorUsed=true`
- `alembic_codex_job`：
  - all job ids include `rescan_mpglyoov_9914f878`, `rescan_mpglxee1_3024586a`, `rescan_mpglw42o_818db59e`, `bootstrap_mpf6tn10_c572b8a1`, `bootstrap_mpf39w99_e3e8a6e8`
  - bootstrap job ids include `bootstrap_mpf6tn10_c572b8a1`, `bootstrap_mpf39w99_e3e8a6e8`, `bootstrap_mpf1927v_9a1fffb4`, `bootstrap_mpeyrlwx_c0e96fdf`, `bootstrap_mpewj2f5_06bfb92c`
  - rescan job ids include `rescan_mpglyoov_9914f878`, `rescan_mpglxee1_3024586a`, `rescan_mpglw42o_818db59e`, `rescan_mpde2fs1_63fbe469`
  - `residentService.owner=alembic`
  - `residentService.route=local-alembic-daemon`
  - features：`jobs.internal-ai.bootstrap` / `jobs.internal-ai.rescan`

## Codex 可见呐喊摘要

Probe 构造的下一条开发者可见响应摘要：

> 我已接收到 BiliDili 的 5 条 Recipe / 2 条 Guard 摘要，会先按模块边界、路由解耦、UI lazy var、Repository 网络层和 Guard 约束判断后续动作。Resident service 已接通，payload 里保留 alembic-resident-service 的 searchMeta / residentVector 证据；可见响应只喊知识摘要和判断依据，不默认倾倒 evidenceRefs 路径或行号。

Prime payload 证据：

- `hostResponse.action=shout_prime_knowledge_receipt`
- `hostResponse.requiredBeforeNextAction=true`
- `hostResponse.visibility=developer_visible`
- `serviceBoundary.tool=alembic_task`
- `serviceBoundary.owner=alembic-plugin`
- `serviceBoundary.residentServiceRequested=false`

## 验证命令

```bash
git -C BiliDili status --short --branch
npm --prefix AlembicTest run check
node AlembicTest/scripts/probe-unified-resident-service.mjs --phase baseline
npm --prefix AlembicTest run restart -- --monitor-once --json
node AlembicTest/scripts/probe-unified-resident-service.mjs --phase resident
git -C AlembicTest diff --check
git -C BiliDili status --short --branch
```

说明：resident probe 需要本机 daemon pid 探活能力。sandbox 内运行会把 pid 误判为 not alive；最终有效 resident evidence 使用 elevated AlembicTest probe 路径采集。

## 遗留风险

- `AlembicTest/tmp/` raw evidence 不提交；长期复核以本报告摘要为准。
- Dashboard URL 和 daemon pid 是本次运行瞬时值，后续重启会变化。
- 本轮没有新建 internal AI bootstrap/rescan job，只读验证现有 job 列表和 resident job route；避免把本测试扩大成完整冷启动。
- 历史 bootstrap/rescan job 仍包含 failed/cancelled 记录，其中 `bootstrap_mpf6tn10_c572b8a1` 的失败原因是旧冷启动的 `stage_timeout`；这不是本轮 resident service 行为回归。
- `runtimeBoundary` compatibility 仍保留在 status diagnostics 中，但 canonical `residentService` 已存在；删除 compatibility fallback 仍应由后续产品计划处理。

## 下一步建议

- 总控可将 `Test-2026-05-23-01` 标为通过 / 待验收。
- AlembicTest 可提交本次新增 probe 脚本、README/check 更新和本报告。
- 后续若要验证新建 internal AI job enqueue，应创建单独测试单，避免把本次 read-only resident integration 验证扩大为冷启动或 rescan 长跑。
