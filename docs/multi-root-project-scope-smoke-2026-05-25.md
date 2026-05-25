# Multi-root ProjectScope Smoke

测试单：`Test-2026-05-25-01 / MRPS-P4-MultiRoot-Smoke`

执行窗口：`AlembicTest`

结论：未通过，producer / Dashboard 通过，Plugin bound-folder consumer 失败。

## 执行范围

- 控制根：`AlembicWorkspace` 根目录，仅作为 `controlRoot`。
- 显式绑定 source folders：`Alembic`、`AlembicCore`、`AlembicPlugin`、`AlembicDashboard`。
- 未执行 full cold-start，未执行 folder remove / disable。
- 未修改产品源码，未修改 BiliDili，未提交任何子仓库。
- 本轮新增 AlembicTest 只读 probe：`AlembicTest/scripts/probe-multi-root-project-scope.mjs`。

## 使用配置

- `ALEMBIC_TEST_MODE=1`
- Alembic CLI / daemon version：`0.2.0`
- Dashboard URL：`http://127.0.0.1:49619`
- Daemon pid：`3484`
- Project id：`ecf32806`
- ProjectScope id：`project-scope-a8083fdb335c`
- Data root：`~/.asd/workspaces/ecf32806`
- Storage：`ghost`

版本证据：

- `AlembicCore`：`b72390f`
- `Alembic`：`31788bb21b7bba49f571c00949dc02922d6d1c7e`
- `AlembicPlugin`：`96f941803d71d93b76a4f85fe4014fdbe9257c58`
- `AlembicDashboard`：`bd6f4050c18e3b441b87d10efa7734135600fce6`

## 执行命令

```bash
ALEMBIC_TEST_MODE=1 node AlembicTest/scripts/restart-alembic.mjs --project . --wait 15000 --json --no-status
node Alembic/dist/bin/cli.js setup --ghost --dir .
node Alembic/dist/bin/cli.js project-scope add Alembic --control-root . --role primary-source --json
node Alembic/dist/bin/cli.js project-scope add AlembicCore --project-scope-id project-scope-a8083fdb335c --json
node Alembic/dist/bin/cli.js project-scope add AlembicPlugin --project-scope-id project-scope-a8083fdb335c --json
node Alembic/dist/bin/cli.js project-scope add AlembicDashboard --project-scope-id project-scope-a8083fdb335c --json
ALEMBIC_TEST_MODE=1 node AlembicTest/scripts/restart-alembic.mjs --project . --wait 15000 --json --no-status --no-dev-link
node AlembicTest/scripts/probe-multi-root-project-scope.mjs --output AlembicTest/tmp/mrps-p4-daemon-api.json
node AlembicTest/scripts/probe-resident-vector-search.mjs --project Alembic --output AlembicTest/tmp/mrps-p4-plugin-alembic.json
node AlembicTest/scripts/probe-resident-vector-search.mjs --project AlembicCore --output AlembicTest/tmp/mrps-p4-plugin-alembiccore.json
node AlembicTest/scripts/probe-resident-vector-search.mjs --project AlembicTest/tmp/mrps-baseline-unbound --output AlembicTest/tmp/mrps-p4-plugin-baseline-unbound.json
```

## ProjectScope 绑定清单

`node Alembic/dist/bin/cli.js project-scope list --control-root . --json` 返回：

| Folder | Role | State |
| --- | --- | --- |
| `Alembic` | `primary-source` | `active` |
| `AlembicCore` | `source` | `active` |
| `AlembicPlugin` | `source` | `active` |
| `AlembicDashboard` | `source` | `active` |

关键字段：

- `projectScopeId=project-scope-a8083fdb335c`
- `folderCount=4`
- `storageKind=ghost`
- `dataRootSource=ghost-registry`
- `controlRootIncludedInFolders=false`
- `projectRootWriteAllowed=false`
- `supportsFolderRemove=false`
- `supportsFolderDisable=false`

## Daemon / API 证据

只读 API probe：`AlembicTest/tmp/mrps-p4-daemon-api.json`

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

`/api/v1/daemon/health` 关键字段：

- `capabilities.projectScope.available=true`
- `projectScopeId=project-scope-a8083fdb335c`
- `residentService.serviceScope.scopeId=project-scope:project-scope-a8083fdb335c`
- `residentService.serviceScope.projectIdentity.projectScope.folderCount=4`
- `residentService.serviceScope.projectIdentity.projectScope.controlRootIncludedInFolders=false`

`/api/v1/project-scope/resolve-folder` 验证 `Alembic`、`AlembicCore`、`AlembicPlugin`、`AlembicDashboard` 均 resolve 到同一个 `projectScopeId` 和同一个 ghost dataRoot。

`/api/v1/search` 可访问，返回 `searchMeta`，关键 keys 包括 `route`、`service`、`requestedMode`、`actualMode`、`residentVector`、`workspace`。本轮没有跑 full cold-start，因此结果数为 `0` 属于新 ghost dataRoot 的预期空知识库状态。

## Dashboard 证据

- 截图：`AlembicTest/tmp/mrps-p4-dashboard-projectscope.png`
- DOM：`AlembicTest/tmp/mrps-p4-dashboard-projectscope-dom.txt`

Dashboard 项目控制下拉展示：

- `ProjectScope 范围`
- `控制根`：`.../AlembicWorkspace`
- `数据根`：`.../.asd/workspaces/ecf32806`
- `存储`：`ghost`
- `Scope ID`：`project-scope-a8083fdb335c`
- `源文件夹` 数量：`4`
- source folders：`Alembic`、`AlembicCore`、`AlembicPlugin`、`AlembicDashboard`

DOM 搜索 `删除|移除|禁用|remove|disable` 未发现 ProjectScope remove / disable 入口；只有 `解析`、`添加` 和项目运行时控制按钮。

## Plugin / Codex 证据

绑定 folder probe：

- `AlembicTest/tmp/mrps-p4-plugin-alembic.json`
- `AlembicTest/tmp/mrps-p4-plugin-alembiccore.json`

从 `Alembic` 和 `AlembicCore` 两个已绑定 folder 启动 Plugin MCP 后，`tools/list` 只返回 11 个基础工具，不包含 `alembic_task` 和 `alembic_search`。`alembic_codex_status` 的 `projectScopeIdentity` 均为：

```json
{
  "mode": "single-folder-baseline",
  "available": false,
  "projectScopeId": null,
  "source": "plugin-single-folder-baseline",
  "reason": "resident project scope unavailable: daemon is not started"
}
```

同时 `hostProjectAlignment` 显示：

```json
{
  "activeRoot": "<workspace>",
  "hostRoot": "<workspace>/Alembic 或 <workspace>/AlembicCore",
  "reason": "selected-project-differs",
  "selectedRoot": "<workspace>"
}
```

Prime / search 结果：

- `alembic_task(operation=prime)` 未执行到 ProjectScope telemetry，返回 `CODEX_ALEMBIC_KNOWLEDGE_REQUIRED`。
- `alembic_search(auto/semantic)` 同样返回 `CODEX_ALEMBIC_KNOWLEDGE_REQUIRED`。
- `daemonSearchSummary.reason=daemon_state_path_or_url_missing`，说明 Plugin 从 bound folder 仍查找 folder-local daemon state，而没有通过 active workspace daemon / ProjectScope resolve 进入 resident route。

控制根自身 `alembic_codex_status(projectRoot=<workspace>)` 是连通的：`residentService.route=local-alembic-daemon`，`serviceScope.scopeId=project-scope:project-scope-a8083fdb335c`，说明 daemon / controlRoot 路径可用，失败集中在 bound-folder Plugin consumer。

Baseline 证据：

- `AlembicTest/tmp/mrps-p4-plugin-baseline-unbound.json`
- 未绑定临时 folder 返回 `single-folder-baseline`，无崩溃；这满足 baseline 降级“不报错”的部分。
- 但已绑定 folder 也落到同样 baseline，无法满足测试单对 bound folder ProjectScope identity 的要求。

## 真实项目 Git 状态

测试前后 `Alembic`、`AlembicCore`、`AlembicPlugin`、`AlembicDashboard`、`BiliDili` 均保持 clean。

`AlembicWorkspace` 和 `AlembicTest` 存在用户/前序任务留下的未提交文档与脚本变更；本轮只新增：

- `AlembicTest/scripts/probe-multi-root-project-scope.mjs`
- `AlembicTest/docs/multi-root-project-scope-smoke-2026-05-25.md`
- `AlembicTest/tmp/mrps-p4-*` ignored raw evidence

## 失败归口

主要归口：`AlembicPlugin`

判断依据：

- Alembic CLI / daemon / HTTP ProjectScope producer 正常。
- Dashboard ProjectScope consumer 正常展示同一 `projectScopeId` 和 source folders。
- Plugin 从 bound folder 进入时没有使用 active runtime controlRoot 的 ProjectScope resolve 结果，而是把 hostRoot 与 selectedRoot 不一致直接判为 mismatch，并继续查找 folder-local `.asd/daemon.json`。

建议修复方向：

- `AlembicPlugin` 的 resident discovery / `HostProjectAlignment` / status diagnostics 需要 ProjectScope-aware：当 active runtime 是 controlRoot 且 hostRoot 是其 source folder 时，应调用 active daemon `/api/v1/project-scope/resolve-folder` 或消费 health `capabilities.projectScope`，把该 hostRoot 视为同一 ProjectScope。
- bound folder 的 `projectScopeIdentity` 应在 status / diagnostics 阶段就显示 `mode=project-scope`、`projectScopeId`、`serviceScopeId`、`dataRoot` 和 current folder，而不是等知识库可用后才进入。
- `alembic_task` / `alembic_search` 的可见性门禁需要区分“ProjectScope resident 已连通但知识库为空”和“ProjectScope resident 不可用”。当前两者都表现为工具隐藏，影响 smoke 判断。

## 遗留风险

- 本轮为最小 smoke，没有跑 full cold-start；ProjectScope ghost dataRoot 为空，所以 search 有 `searchMeta` 但结果数为 `0`。
- 为启动 workspace controlRoot daemon，执行了 `setup --ghost --dir .`，只写入外置 `~/.asd` registry / ghost dataRoot，不写入 source folders。
- 绑定 registry 留在本机 `~/.asd/project-scopes.json`，未执行 remove / disable。
- Plugin metadata diagnostics 仍报告 `PLUGIN_RUNTIME_PIN_MISMATCH` / `PLUGIN_METADATA_INCOMPLETE`，这不是本次 ProjectScope producer 的原因，但会影响插件发布前健康度。

## 下一步建议

1. 派发 `AlembicPlugin` 修复 bound-folder ProjectScope-aware resident discovery / host alignment。
2. 修复后用本报告中的 `probe-multi-root-project-scope.mjs` 和三个 Plugin probes 复测。
3. 复测通过后再决定是否补一个小样本知识库初始化，以验证 prime/search 在空库之外的 `searchMeta.projectScopeIdentity`。
