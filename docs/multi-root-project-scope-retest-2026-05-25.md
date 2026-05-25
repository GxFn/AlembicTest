# Multi-root ProjectScope Retest

测试单：`Test-2026-05-25-02 / MRPS-P5-MultiRoot-Retest`

执行窗口：`AlembicTest`

结论：未通过。第四波修复后，API / daemon / Dashboard 通过，Plugin `status` / `diagnostics` / `tools/list` 已能识别绑定 folder 的 ProjectScope；但 `alembic_health`、`alembic_task prime` 和 `alembic_search` 在四个绑定 folder 中仍被 MCP preflight 以“排除项目”拦截，未产生 prime/search telemetry。

## 执行范围

- 控制根：AlembicWorkspace 根目录，仅作为 `controlRoot`。
- 绑定 source folders：`Alembic`、`AlembicCore`、`AlembicPlugin`、`AlembicDashboard`。
- 复测入口：Alembic daemon / `/api/v1/project-scope*` / `/api/v1/search`、Dashboard ProjectScope panel、AlembicPlugin MCP `tools/list` / `status` / `diagnostics` / `health` / `prime` / `search`。
- 未跑 full cold-start；未执行 folder remove / disable；未改 BiliDili；未修改产品源码。
- 本轮补强 AlembicTest 只读 probe：`AlembicTest/scripts/probe-resident-vector-search.mjs` 额外记录 diagnostics / health / ProjectScope identity 摘要。

## 使用配置

- `ALEMBIC_TEST_MODE=1`
- Alembic CLI / daemon version：`0.2.0`
- Dashboard URL：`http://127.0.0.1:51087`
- Daemon pid：`37436`
- Project id：`ecf32806`
- ProjectScope id：`project-scope-a8083fdb335c`
- Data root：`~/.asd/workspaces/ecf32806`
- Storage：`ghost`
- 复用旧 ProjectScope registry：是，未执行 remove / disable。

版本证据：

- `AlembicCore`：`b72390f`
- `Alembic`：`31788bb21b7bba49f571c00949dc02922d6d1c7e`
- `AlembicPlugin`：`4b7196c64a29cf19d8fad66c22ef76b0824067c5`
- `AlembicCodex` runtime artifact：`ff13a1a9b66c9c2ddc358de12b446199f6e85466`
- `AlembicDashboard`：`6621865105878b4b5cc01c4e223304ddf7e5b544`

## 验证命令

```bash
ALEMBIC_TEST_MODE=1 node AlembicTest/scripts/restart-alembic.mjs --project . --wait 20000 --json --no-status
node Alembic/dist/bin/cli.js project-scope list --control-root . --json
node AlembicTest/scripts/probe-multi-root-project-scope.mjs --output AlembicTest/tmp/mrps-p5-daemon-api.json --timeout-ms 15000
node AlembicTest/scripts/probe-resident-vector-search.mjs --project Alembic --output AlembicTest/tmp/mrps-p5-plugin-alembic.json
node AlembicTest/scripts/probe-resident-vector-search.mjs --project AlembicCore --output AlembicTest/tmp/mrps-p5-plugin-alembiccore.json
node AlembicTest/scripts/probe-resident-vector-search.mjs --project AlembicPlugin --output AlembicTest/tmp/mrps-p5-plugin-alembicplugin.json
node AlembicTest/scripts/probe-resident-vector-search.mjs --project AlembicDashboard --output AlembicTest/tmp/mrps-p5-plugin-alembicdashboard.json
node AlembicTest/scripts/probe-resident-vector-search.mjs --project AlembicTest/tmp/mrps-p5-baseline-unbound --output AlembicTest/tmp/mrps-p5-plugin-baseline-unbound.json
```

Dashboard 通过 Codex 右侧 in-app browser 打开 `http://127.0.0.1:51087/`，展开 Header 项目控制下拉后采集 DOM 与截图。

## ProjectScope 绑定清单

`project-scope list --control-root .` 返回同一 scope：

| Folder | Role | State |
| --- | --- | --- |
| `Alembic` | `primary-source` | `active` |
| `AlembicCore` | `source` | `active` |
| `AlembicPlugin` | `source` | `active` |
| `AlembicDashboard` | `source` | `active` |

关键字段：

- `projectScopeId=project-scope-a8083fdb335c`
- `projectId=ecf32806`
- `folderCount=4`
- `storageKind=ghost`
- `dataRootSource=ghost-registry`
- `controlRootIncludedInFolders=false`
- `projectRootWriteAllowed=false`
- `supportsFolderRemove=false`
- `supportsFolderDisable=false`

## Daemon / API 证据

只读 API probe：`AlembicTest/tmp/mrps-p5-daemon-api.json`

摘要：

```json
{
  "ok": true,
  "daemonReady": true,
  "projectScopeAvailable": true,
  "folderCount": 4,
  "sameProjectScopeAcrossFolders": true,
  "controlRootInFolders": false,
  "controlRootIncludedInFolders": false,
  "ghostStorage": true,
  "searchHasMeta": true
}
```

`/api/v1/daemon/health` 继续显示：

- `residentScopeId=project-scope:project-scope-a8083fdb335c`
- `projectScopeId=project-scope-a8083fdb335c`
- `projectScopeCapabilityAvailable=true`

`/api/v1/project-scope/resolve-folder` 验证四个绑定 folder 都 resolve 到同一个 `projectScopeId` 和 ghost dataRoot。`/api/v1/search` 可访问并返回 `searchMeta`，新 ghost dataRoot 未跑 full cold-start，因此结果数为 `0`。

## Plugin 证据

原始 JSON：

- `AlembicTest/tmp/mrps-p5-plugin-alembic.json`
- `AlembicTest/tmp/mrps-p5-plugin-alembiccore.json`
- `AlembicTest/tmp/mrps-p5-plugin-alembicplugin.json`
- `AlembicTest/tmp/mrps-p5-plugin-alembicdashboard.json`

四个绑定 folder 均有以下通过点：

- `tools/list` 返回 14 个工具，包含 `alembic_task`、`alembic_search`、`alembic_health`。
- `status.projectScopeIdentity.mode=project-scope`
- `diagnostics.projectScopeIdentity.mode=project-scope`
- `projectScopeId=project-scope-a8083fdb335c`
- `serviceScopeId=project-scope:project-scope-a8083fdb335c`
- `dataRoot=~/.asd/workspaces/ecf32806`
- `hostProjectAlignment.handoffMismatch=null`
- `hostProjectAlignment.nextActions` 说明 Codex host project 已与 Alembic selected / active runtime project 对齐。

仍失败的部分：

- `alembic_health` 返回 `success=false`。
- `alembic_task(operation=prime)` 返回 `success=false`。
- `alembic_search(auto/semantic)` 返回 `success=false`。
- 三类 tool 的失败信息一致：当前绑定 folder 被判为 Alembic 源码仓库或 Alembic 生态项目，MCP server 拒绝在该目录创建运行时数据，并提示宿主传入正确 `ALEMBIC_PROJECT_DIR`。

归类判断：

- 第四波已修复旧的 `single-folder-baseline` / `selected-project-differs` 身份识别失败。
- 新断点位于 Plugin Codex-facing tool execution preflight：status / diagnostics 已拿到 ProjectScope identity，但 health / prime / search 仍按当前 folder 的 excluded-project 规则短路，没有把已解析出的 ProjectScope controlRoot / ghost dataRoot 作为 tool execution root 使用。
- 因 prime / search 没有执行到 resident route，本轮没有得到 `searchMeta.projectScopeId` 或 resident telemetry；验收标准仍未满足。

## Baseline 降级证据

原始 JSON：`AlembicTest/tmp/mrps-p5-plugin-baseline-unbound.json`

未绑定临时 folder 返回：

- `projectScopeIdentity.mode=single-folder-baseline`
- `available=false`
- `projectScopeId=null`
- `reason=resident project scope unavailable: daemon is not started`
- `tools/list` 不包含 `alembic_task` / `alembic_search` / `alembic_health`
- prime/search 返回“knowledge tools are hidden until this project has a usable Alembic knowledge base”

该 baseline 没有崩溃，符合未绑定 / 无 resident 场景的可读降级预期。

## Dashboard 证据

截图：

- `AlembicTest/tmp/mrps-p5-dashboard-summary.png`
- `AlembicTest/tmp/mrps-p5-dashboard-details.png`

DOM：

- `AlembicTest/tmp/mrps-p5-dashboard-summary-dom.txt`
- `AlembicTest/tmp/mrps-p5-dashboard-details-dom.txt`

外层摘要通过：

- 只展示 `AlembicWorkspace`、`就绪`、`ghost`、`4 个源文件夹`、`已绑定` 和 `查看详情与管理`。
- 摘要 DOM 中没有 `控制根` / `数据根` 技术字段。

详情展开通过：

- 展开后可见 `控制根`、`数据根`、`SCOPE ID=project-scope-a8083fdb335c`、4 个 source folders、`管理源文件夹`、`解析`、`添加`。
- `解析` / `添加` 在输入为空时为 disabled，这是预期的操作状态。
- DOM 搜索 `删除|移除|禁用|remove|disable` 未发现 ProjectScope remove / disable 操作；命中项仅来自非 ProjectScope 项目控制按钮的 `[disabled]` 状态。

## 真实项目 Git 状态

测试后以下仓库保持 clean：

- `Alembic`
- `AlembicCore`
- `AlembicPlugin`
- `AlembicDashboard`
- `BiliDili`

`AlembicWorkspace` 和 `AlembicTest` 存在前序未提交文档 / 脚本变更。本轮新增或修改：

- `AlembicTest/docs/multi-root-project-scope-retest-2026-05-25.md`
- `AlembicTest/scripts/probe-resident-vector-search.mjs`
- `AlembicTest/tmp/mrps-p5-*` ignored raw evidence
- workspace 当前状态 / 测试交流 / wave 回填文档

提交 hash：无。本轮为 AlembicTest 复测和文档回填，未提交仓库。

## 失败归口

主要归口：`AlembicPlugin`

原因：

- Alembic producer、daemon API 和 ProjectScope resolve 均通过。
- Dashboard 新摘要与详情展开路径通过。
- Plugin status / diagnostics 已证明 bound folder 能解析到 ProjectScope。
- Plugin tool execution 仍在 prime / search / health 阶段按当前 folder 的 excluded-project preflight 拒绝执行，未使用已解析的 ProjectScope controlRoot / ghost dataRoot 作为真实执行上下文。

## 遗留风险

- `GTODO-2026-05-24-036` 仍未完成，主线不能归档。
- `GTODO-2026-05-25-001` Dashboard 侧可视 smoke 已通过，可由总控验收关闭。
- ProjectScope ghost dataRoot 仍为空；修复 Plugin tool execution 后，prime/search 仍可能返回 0 条语义结果，但必须带 ProjectScope telemetry。
- 本机 `~/.asd/project-scopes.json` 保留本次绑定 registry，未执行 remove / disable。
- 本轮重启执行了 dev link 和 Dashboard asset build；产品仓库测试后仍为 clean。

## 下一步建议

1. 派发 `AlembicPlugin` 继续返修：当 `status` / `diagnostics` 已解析到 `project-scope` identity 时，`alembic_health` / `alembic_task` / `alembic_search` 的 preflight 应使用 ProjectScope controlRoot / ghost dataRoot，而不是继续以当前 Alembic source folder 的 excluded-project 规则拒绝。
2. 修复后复跑本报告中的四个绑定 folder Plugin probes；验收重点是 health / prime / search success，以及 search/prime telemetry 包含同一 `projectScopeId`。
3. Dashboard 本轮不需要返修；若 Plugin 修复后复测，保留同一摘要 + 详情展开检查即可。
