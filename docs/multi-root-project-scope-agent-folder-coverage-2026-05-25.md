# Multi-root ProjectScope Agent Folder Coverage Retest

日期：2026-05-25
测试单：`Test-2026-05-25-04 / MRPS-P7-Agent-Folder-Coverage`
执行窗口：`AlembicTest`
结论：通过

## 窗口定位

`AlembicTest` 本轮只承担真实链路补测和证据整理：把 `AlembicAgent` 作为第五个 source folder 加入 `AlembicWorkspace` 的同一 `ProjectScope`，复测五个绑定 source folder 的 Plugin `health` / `prime` / `search` 执行、ProjectScope telemetry、Dashboard folder count 和 source folder 无写入。明确不修改 `AlembicAgent` 内部代码，不跑 full cold-start，不操作 BiliDili。

## 执行范围

- 复用当前 Alembic daemon / Dashboard：`http://127.0.0.1:58439`，Dashboard header 显示测试模式。
- 复用当前 ProjectScope：`project-scope-a8083fdb335c`，项目 `AlembicWorkspace`，ghost dataRoot `~/.asd/workspaces/ecf32806`。
- 先确认 P6 后的四 folder 状态，再通过 CLI 把 `AlembicAgent` 加入同一 ProjectScope。
- 从五个绑定 source folder 分别执行 Alembic Codex Plugin probe：`status` / `diagnostics` / `tools/list` / `alembic_health` / `alembic_task prime` / `alembic_search(auto/semantic)`。
- 通过右侧 in-app browser 验证 Dashboard 项目控制弹层显示 `5 个源文件夹`，并列出 `AlembicAgent`。
- 前后检查五个 source folder 下 `.asd/` / `Alembic/` runtime data 写入。

## 绑定清单

来源：`node Alembic/dist/bin/cli.js project-scope list --control-root . --json`

| Folder | folderId | role | state |
| --- | --- | --- | --- |
| `Alembic` | `folder-278cdc6c8560` | `primary-source` | `active` |
| `AlembicCore` | `folder-94c596418c32` | `source` | `active` |
| `AlembicAgent` | `folder-8cd66f5af7fc` | `source` | `active` |
| `AlembicPlugin` | `folder-13b22158ca25` | `source` | `active` |
| `AlembicDashboard` | `folder-b5c9f02bf50a` | `source` | `active` |

关键字段：

- `folderCount=5`
- `projectScopeId=project-scope-a8083fdb335c`
- `controlRoot=/Users/gaoxuefeng/Documents/AlembicWorkspace`
- `controlRootIncludedInFolders=false`
- `projectRootWriteAllowed=false`
- `standardWriteAllowed=false`
- `storageKind=ghost`
- `dataRoot=~/.asd/workspaces/ecf32806`

## 验证命令

```bash
git -C AlembicAgent status --short
git -C AlembicAgent rev-parse HEAD
node Alembic/dist/bin/cli.js project-scope list --control-root . --json
node Alembic/dist/bin/cli.js project-scope resolve AlembicAgent --json
find Alembic AlembicCore AlembicAgent AlembicPlugin AlembicDashboard -mindepth 1 -maxdepth 3 \( -path '*/.asd' -o -path '*/.asd/*' -o -name Alembic \) -exec stat -f '%N|%Sm|%z' -t '%Y-%m-%dT%H:%M:%S%z' {} \;
node Alembic/dist/bin/cli.js project-scope add AlembicAgent --control-root . --project-scope-id project-scope-a8083fdb335c --display-name AlembicAgent --role source --json
node AlembicTest/scripts/probe-multi-root-project-scope.mjs --folders Alembic,AlembicCore,AlembicAgent,AlembicPlugin,AlembicDashboard --output AlembicTest/tmp/mrps-p7-daemon-api.json --query 'ProjectScope five folders Alembic AlembicCore AlembicAgent AlembicPlugin AlembicDashboard controlRoot ghost dataRoot' --timeout-ms 15000
node AlembicTest/scripts/probe-resident-vector-search.mjs --project <folder> --prime-query '验证 MRPS-P7 五文件夹 ProjectScope' --search-query 'ProjectScope five source folders AlembicAgent health prime search controlRoot ghost dataRoot' --semantic-query 'ProjectScope resident-backed tools execution five folders AlembicAgent codexProjectScopeExecution' --active-file AGENTS.md --language typescript --search-limit 6 --output AlembicTest/tmp/mrps-p7-plugin-<folder>.json --timeout-ms 60000
```

注：`project-scope add` 只写入本机 registry `~/.asd/project-scopes.json`，不修改产品仓库源码；五个 Plugin probe 分别覆盖 `Alembic`、`AlembicCore`、`AlembicAgent`、`AlembicPlugin`、`AlembicDashboard`。

## 验证结果

Daemon / API probe：`AlembicTest/tmp/mrps-p7-daemon-api.json`

- `daemonReady=true`
- `dashboardUrl=http://127.0.0.1:58439`
- `projectScopeAvailable=true`
- `folderCount=5`
- `allRequestedFoldersResolve=true`
- `sameProjectScopeAcrossFolders=true`
- `boundScopeIds=["project-scope-a8083fdb335c"]`
- `controlRootInFolders=false`
- `controlRootIncludedInFolders=false`
- `ghostStorage=true`
- `/api/v1/search` 返回 `searchMeta`

Alembic Codex status 复核同样返回 `packageVersion=0.2.0`、daemon ready、`projectScopeIdentity.mode=project-scope`、`folderCount=5`、`serviceScopeId=project-scope:project-scope-a8083fdb335c`。

## Plugin 五文件夹证据

| Folder | status / diagnostics | tools/list | health | prime | search auto | search semantic | currentFolderId |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `Alembic` | `project-scope` | 14 tools, contains `alembic_task` / `alembic_search` / `alembic_health` | success | success, `empty` | success | success | `folder-278cdc6c8560` |
| `AlembicCore` | `project-scope` | 14 tools, contains `alembic_task` / `alembic_search` / `alembic_health` | success | success, `empty` | success | success | `folder-94c596418c32` |
| `AlembicAgent` | `project-scope` | 14 tools, contains `alembic_task` / `alembic_search` / `alembic_health` | success | success, `empty` | success | success | `folder-8cd66f5af7fc` |
| `AlembicPlugin` | `project-scope` | 14 tools, contains `alembic_task` / `alembic_search` / `alembic_health` | success | success, `empty` | success | success | `folder-13b22158ca25` |
| `AlembicDashboard` | `project-scope` | 14 tools, contains `alembic_task` / `alembic_search` / `alembic_health` | success | success, `empty` | success | success | `folder-b5c9f02bf50a` |

原始证据：

- `AlembicTest/tmp/mrps-p7-plugin-alembic.json`
- `AlembicTest/tmp/mrps-p7-plugin-alembiccore.json`
- `AlembicTest/tmp/mrps-p7-plugin-alembicagent.json`
- `AlembicTest/tmp/mrps-p7-plugin-alembicplugin.json`
- `AlembicTest/tmp/mrps-p7-plugin-alembicdashboard.json`

备注：这些 probe 的旧版顶层 classifier 仍显示 `daemon-missing-searchmeta`，原因是脚本分类器沿用 P6 前的 daemonSearchSummary 判断；原始 tool result 字段已证明 `health` / `prime` / `search(auto/semantic)` 全部成功，且 `/api/v1/search` searchMeta 由 daemon probe 单独验证通过。本轮不把该旧 classifier 作为失败。

## ProjectScope Telemetry

五个 folder 的 `health` / `prime` / `search(auto)` / `search(semantic)` 均带同一 ProjectScope execution telemetry：

- `codexProjectScopeExecution.enabled=true`
- `projectScopeId=project-scope-a8083fdb335c`
- `serviceScopeId=project-scope:project-scope-a8083fdb335c`
- `dataRoot=~/.asd/workspaces/ecf32806`
- `mode=project-scope`
- `storageKind=ghost`

Search resident telemetry：

- `route=alembic-resident-service`
- `service=alembic-daemon`
- `attempted=true`
- `available=true`
- `actualMode=weighted`
- `resultCount=0`
- `fallbackReason=vector_store_unavailable_or_empty`

`resultCount=0` 属于预期：本轮不跑 full cold-start，当前 ghost ProjectScope knowledge / vector store 为空；验收点是 resident route、ProjectScope telemetry 和 execution preflight 不回退。

## Dashboard 证据

右侧 in-app browser 打开 `http://127.0.0.1:58439/recipes`，点击 header 的 `AlembicWorkspace` 项目控制按钮后：

- 弹层显示 `ProjectScope 范围`
- 选中项目 `AlembicWorkspace`
- 状态 `就绪`
- storage `ghost`
- 显示 `5 个源文件夹`
- 列表包含 `Alembic`、`AlembicAgent`、`AlembicCore`、`AlembicDashboard`、`AlembicPlugin`
- 同一弹层还能看到未运行的 `BiliDili`，但它不属于本轮五个 source folder 复测对象
- 弹层正文未出现 `remove` / `disable` / `移除` / `删除` / `禁用` / `停用`

证据文件：

- `AlembicTest/tmp/mrps-p7-dashboard-projectscope-popover-body.txt`
- `AlembicTest/tmp/mrps-p7-dashboard-projectscope-popover-dom.html`
- `AlembicTest/tmp/mrps-p7-dashboard-projectscope-popover.png`

## Source Folder 写入检查

写入检查命令前后输出一致，仅发现 P7 前已有的历史 runtime 目录：

- `Alembic/.asd/**`
- `AlembicPlugin/.asd/**`

未发现以下新增或修改：

- `AlembicAgent/.asd/`
- `AlembicAgent/Alembic/`
- `AlembicCore/.asd/`
- `AlembicCore/Alembic/`
- `AlembicDashboard/.asd/`
- `AlembicDashboard/Alembic/`
- 五个 source folder 中新增 `Alembic/` runtime data

本轮新增的持久状态仅为本机 `~/.asd/project-scopes.json` 中的 `AlembicAgent` folder binding。

## Git 状态

测试收口时以下真实项目 / 产品仓库均为 clean：

- `Alembic`
- `AlembicCore`
- `AlembicAgent`
- `AlembicPlugin`
- `AlembicDashboard`
- `BiliDili`

`AlembicTest` 保留前序测试脚本 / 报告未提交变更，本轮新增本报告和 P7 tmp 证据。`AlembicWorkspace` 也保留总控文档未提交变更；按 workspace 规则，本窗口只回填文档路径和证据，不提交 workspace 仓库。

AlembicAgent 版本证据：`bdd77335e1904a8bc91342a71d6348a64862eafe`。

## 结论

`Test-2026-05-25-04 / MRPS-P7-Agent-Folder-Coverage` 通过。`AlembicAgent` 已加入 `AlembicWorkspace` 同一 ProjectScope，五个 Alembic 系列 source folder 都解析到 `project-scope-a8083fdb335c`，Plugin resident-backed tools 在五个 folder 下均可执行并携带 ProjectScope telemetry，Dashboard 显示 `5 个源文件夹`，且本轮未在 source folders 下新增或修改 `.asd/` / `Alembic/` runtime data。

## 遗留风险

- 当前 ghost ProjectScope knowledge / vector store 为空，`primeStatus=empty`、search `resultCount=0`；本轮不验证 full cold-start 语义命中质量。
- `probe-resident-vector-search.mjs` 顶层 classifier 仍有 P6 前遗留判断，和原始 tool result 成功状态不一致；建议后续单独修正 probe 分类器，避免误报。
- `~/.asd/project-scopes.json` 已持久加入 `AlembicAgent`，后续验收 / 清理时如需恢复四 folder 状态，应由总控明确授权。
- Project-level skill visibility mount 仍属于 `GTODO-2026-05-24-030`，不在本轮范围内。

## 下一步建议

- 总控可验收并关闭 `GTODO-2026-05-24-036` 的 multi-root ProjectScope 主线完成门。
- 后续若启动 project-level skill visibility mount，应以 `projectScopeId=project-scope-a8083fdb335c` 的项目级语义为前提，不按 folder 拆分 skill 语义。
