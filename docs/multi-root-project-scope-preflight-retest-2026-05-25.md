# Multi-root ProjectScope Preflight Retest

测试单：`Test-2026-05-25-03 / MRPS-P6-Preflight-Retest`

执行窗口：`AlembicTest`

结论：通过。四个已绑定 source folder `Alembic`、`AlembicCore`、`AlembicPlugin`、`AlembicDashboard` 的 Plugin `status` / `diagnostics` / `tools/list` / `alembic_health` / `alembic_task prime` / `alembic_search(auto/semantic)` 均可执行，并指向同一 `projectScopeId=project-scope-a8083fdb335c`、同一 ghost dataRoot `~/.asd/workspaces/ecf32806`。P5 的 excluded-project preflight 拦截未再出现。

## 执行范围

- 控制根：AlembicWorkspace 根目录，仅作为 `controlRoot`。
- 绑定 source folders：`Alembic`、`AlembicCore`、`AlembicPlugin`、`AlembicDashboard`。
- 复测入口：Alembic daemon / `/api/v1/project-scope*` / `/api/v1/search`、Dashboard 页面、AlembicPlugin MCP `tools/list` / `status` / `diagnostics` / `health` / `prime` / `search`。
- 未跑 full cold-start；未执行 folder remove / disable；未改 BiliDili；未修改产品源码。

## 使用配置

- `ALEMBIC_TEST_MODE=1`
- Alembic CLI / daemon version：`0.2.0`
- Dashboard / API URL：`http://127.0.0.1:58439`
- Daemon pid：`76180`
- Project id：`ecf32806`
- ProjectScope id：`project-scope-a8083fdb335c`
- Data root：`~/.asd/workspaces/ecf32806`
- Storage：`ghost`
- 复用旧 ProjectScope registry：是，未执行 remove / disable。

版本证据：

- `AlembicPlugin` 当前 HEAD：`56370cac0a9991e79da04a767d26bd697146f16c`，包含 P6 修复提交 `2108a36db88bee4805a56b54f04bcfedb37b6cba`，其后追加 CI retrigger 提交。
- `AlembicPlugin/plugins/alembic-codex` runtime artifact：`ced1bcc091eac2e980c09449e13d98abdda9bc79`
- 本机 Codex plugin cache marker：`gitHead=2108a36db88bee4805a56b54f04bcfedb37b6cba`
- `runtime.tgz` SHA-256：`b964d707e8636e8f1574c72bd7b5ffce44359f76164812e7d1f2e13565ec63fa`
- `alembic_codex_status` 显示 resident service route 为 `local-alembic-daemon`，service scope 为 `project-scope:project-scope-a8083fdb335c`。

## 验证命令

```bash
ALEMBIC_TEST_MODE=1 node AlembicTest/scripts/restart-alembic.mjs --project . --wait 20000 --json --no-status
ALEMBIC_TEST_MODE=1 node AlembicTest/scripts/restart-alembic.mjs --project . --wait 20000 --json --no-status
node AlembicTest/scripts/probe-multi-root-project-scope.mjs --output AlembicTest/tmp/mrps-p6-daemon-api.json --timeout-ms 15000
node AlembicTest/scripts/probe-resident-vector-search.mjs --project Alembic --prime-query "验证 AlembicWorkspace multi-root ProjectScope preflight，说明 Plugin health prime search 应使用同一 ProjectScope controlRoot ghost dataRoot。" --search-query "ProjectScope controlRoot ghost dataRoot plugin preflight health prime search" --semantic-query "ProjectScope resident-backed tools execution preflight codexProjectScopeExecution" --active-file AGENTS.md --language typescript --search-limit 6 --output AlembicTest/tmp/mrps-p6-plugin-alembic.json --timeout-ms 60000
node AlembicTest/scripts/probe-resident-vector-search.mjs --project AlembicCore --prime-query "验证 AlembicWorkspace multi-root ProjectScope preflight，说明 Plugin health prime search 应使用同一 ProjectScope controlRoot ghost dataRoot。" --search-query "ProjectScope controlRoot ghost dataRoot plugin preflight health prime search" --semantic-query "ProjectScope resident-backed tools execution preflight codexProjectScopeExecution" --active-file AGENTS.md --language typescript --search-limit 6 --output AlembicTest/tmp/mrps-p6-plugin-alembiccore.json --timeout-ms 60000
node AlembicTest/scripts/probe-resident-vector-search.mjs --project AlembicPlugin --prime-query "验证 AlembicWorkspace multi-root ProjectScope preflight，说明 Plugin health prime search 应使用同一 ProjectScope controlRoot ghost dataRoot。" --search-query "ProjectScope controlRoot ghost dataRoot plugin preflight health prime search" --semantic-query "ProjectScope resident-backed tools execution preflight codexProjectScopeExecution" --active-file AGENTS.md --language typescript --search-limit 6 --output AlembicTest/tmp/mrps-p6-plugin-alembicplugin.json --timeout-ms 60000
node AlembicTest/scripts/probe-resident-vector-search.mjs --project AlembicDashboard --prime-query "验证 AlembicWorkspace multi-root ProjectScope preflight，说明 Plugin health prime search 应使用同一 ProjectScope controlRoot ghost dataRoot。" --search-query "ProjectScope controlRoot ghost dataRoot plugin preflight health prime search" --semantic-query "ProjectScope resident-backed tools execution preflight codexProjectScopeExecution" --active-file AGENTS.md --language typescript --search-limit 6 --output AlembicTest/tmp/mrps-p6-plugin-alembicdashboard.json --timeout-ms 60000
node AlembicTest/scripts/probe-resident-vector-search.mjs --project AlembicTest/tmp/mrps-p6-baseline-unbound --prime-query "验证未绑定目录 baseline 不暴露 ProjectScope resident tools。" --search-query "ProjectScope baseline unbound resident tools hidden" --semantic-query "ProjectScope baseline no resident service fallback" --active-file AGENTS.md --language typescript --search-limit 6 --output AlembicTest/tmp/mrps-p6-plugin-baseline-unbound.json --timeout-ms 60000
find Alembic AlembicCore AlembicPlugin AlembicDashboard -mindepth 1 -maxdepth 3 \( -path '*/.asd' -o -path '*/.asd/*' -o -name Alembic \) -exec stat -f '%N|%Sm|%z' -t '%Y-%m-%dT%H:%M:%S%z' {} \;
```

说明：第一次 restart 杀掉旧 pid 并清理运行态后返回预期的旧进程状态错误；第二次 restart 成功，生成本轮 daemon / Dashboard URL。local daemon / MCP probe 访问 127.0.0.1 时需要在当前 Codex 沙箱外执行。

Dashboard 已按 AlembicTest 规则在右侧 in-app browser 打开 `http://127.0.0.1:58439/recipes`，页面可见 `AlembicWorkspace`、本地 Alembic 和测试模式。

## ProjectScope 绑定清单

只读 API probe：`AlembicTest/tmp/mrps-p6-daemon-api.json`

摘要：

```json
{
  "ok": true,
  "daemonReady": true,
  "dashboardUrlPresent": true,
  "projectScopeAvailable": true,
  "folderCount": 4,
  "allRequestedFoldersResolve": true,
  "sameProjectScopeAcrossFolders": true,
  "controlRootInFolders": false,
  "controlRootIncludedInFolders": false,
  "ghostStorage": true,
  "searchHasMeta": true
}
```

绑定 folders：

| Folder | Folder id | Role | State |
| --- | --- | --- | --- |
| `Alembic` | `folder-278cdc6c8560` | `primary-source` | `active` |
| `AlembicCore` | `folder-94c596418c32` | `source` | `active` |
| `AlembicPlugin` | `folder-13b22158ca25` | `source` | `active` |
| `AlembicDashboard` | `folder-b5c9f02bf50a` | `source` | `active` |

关键字段：

- `projectScopeId=project-scope-a8083fdb335c`
- `serviceScopeId=project-scope:project-scope-a8083fdb335c`
- `projectId=ecf32806`
- `folderCount=4`
- `storageKind=ghost`
- `dataRoot=~/.asd/workspaces/ecf32806`
- `controlRootIncludedInFolders=false`

## Plugin 执行证据

原始 JSON：

- `AlembicTest/tmp/mrps-p6-plugin-alembic.json`
- `AlembicTest/tmp/mrps-p6-plugin-alembiccore.json`
- `AlembicTest/tmp/mrps-p6-plugin-alembicplugin.json`
- `AlembicTest/tmp/mrps-p6-plugin-alembicdashboard.json`

| Source folder | tools/list | status / diagnostics | health | prime | search(auto) | search(semantic) | execution |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `Alembic` | 14 tools，含 `alembic_task` / `alembic_search` / `alembic_health` | `project-scope` | `success=true` | `success=true`, `primeStatus=empty` | `success=true` | `success=true` | `codexProjectScopeExecution.enabled=true` |
| `AlembicCore` | 14 tools，含 `alembic_task` / `alembic_search` / `alembic_health` | `project-scope` | `success=true` | `success=true`, `primeStatus=empty` | `success=true` | `success=true` | `codexProjectScopeExecution.enabled=true` |
| `AlembicPlugin` | 14 tools，含 `alembic_task` / `alembic_search` / `alembic_health` | `project-scope` | `success=true` | `success=true`, `primeStatus=empty` | `success=true` | `success=true` | `codexProjectScopeExecution.enabled=true` |
| `AlembicDashboard` | 14 tools，含 `alembic_task` / `alembic_search` / `alembic_health` | `project-scope` | `success=true` | `success=true`, `primeStatus=empty` | `success=true` | `success=true` | `codexProjectScopeExecution.enabled=true` |

`codexProjectScopeExecution` 共同字段：

- `projectScopeId=project-scope-a8083fdb335c`
- `serviceScopeId=project-scope:project-scope-a8083fdb335c`
- `mode=project-scope`
- `controlRoot=~/Documents/AlembicWorkspace`
- `dataRoot=~/.asd/workspaces/ecf32806`
- `reason=ProjectScope resident identity is ready; Plugin-owned Codex tool execution uses the resident ghost dataRoot instead of creating runtime data in the bound source folder.`

各 folder 的 `currentFolderId` / `currentFolderPath`：

| Source folder | currentFolderId | currentFolderPath |
| --- | --- | --- |
| `Alembic` | `folder-278cdc6c8560` | `~/Documents/AlembicWorkspace/Alembic` |
| `AlembicCore` | `folder-94c596418c32` | `~/Documents/AlembicWorkspace/AlembicCore` |
| `AlembicPlugin` | `folder-13b22158ca25` | `~/Documents/AlembicWorkspace/AlembicPlugin` |
| `AlembicDashboard` | `folder-b5c9f02bf50a` | `~/Documents/AlembicWorkspace/AlembicDashboard` |

Search resident telemetry：

- `route=alembic-resident-service`
- `service=alembic-daemon`
- `attempted=true`
- `available=true`
- `requestedMode=auto`
- `residentRequestMode=semantic`
- `actualMode=weighted`
- `resultCount=0`
- `fallbackReason=vector_store_unavailable_or_empty`
- `projectScopeIdentity.projectScopeId=project-scope-a8083fdb335c`

结果数为 0 是预期边界：本轮没有跑 full cold-start，ghost dataRoot 当前 knowledge/vector 为空；验收重点是 tool execution、resident route 和 telemetry，不是语义命中数量。

注意：`probe-resident-vector-search.mjs` 的顶层 `ok=false / classification=daemon-missing-searchmeta` 是旧 BiliDili resident vector search probe 的总分规则，要求 status 阶段附带 `daemonSearchSummary`。P6 的验收目标是四个 bound source folder 的 `health` / `prime` / `search` 能执行且带 ProjectScope execution telemetry；原始 JSON 中这些字段均通过，因此不判为 P6 失败。

## Baseline 降级证据

原始 JSON：`AlembicTest/tmp/mrps-p6-plugin-baseline-unbound.json`

未绑定临时 folder 返回：

- `toolCount=11`
- `tools/list` 不包含 `alembic_task` / `alembic_search` / `alembic_health`
- `projectScopeIdentity.mode=single-folder-baseline`
- `available=false`
- `reason=resident project scope unavailable: daemon is not started`
- prime/search 未暴露 resident tools，符合未绑定 baseline 降级预期。

## Source Folder 写入证据

执行前后对四个 source folders 运行同一 `find ... stat` 检查；前后输出一致。

观察结果：

- `Alembic/.asd` 和 `AlembicPlugin/.asd` 是历史遗留目录，mtime 分别早于本轮复测，且本轮前后 stat 完全一致。
- `AlembicCore` 和 `AlembicDashboard` 下没有 `.asd/`。
- 四个 source folders 下没有新增 `Alembic/` runtime data 目录。
- 本轮 P6 probe 没有在 source folder 创建或修改 `.asd/` / `Alembic/` runtime data。

本轮复测后仍可见的历史目录：

```text
Alembic/.asd|2026-05-20T02:39:50+0800|128
Alembic/.asd/context|2026-05-20T02:39:50+0800|96
Alembic/.asd/context/index|2026-05-20T02:39:50+0800|64
Alembic/.asd/logs|2026-05-20T02:39:42+0800|160
Alembic/.asd/logs/error.log|2026-05-23T14:06:17+0800|27888
Alembic/.asd/logs/audit.log|2026-05-20T02:39:42+0800|0
Alembic/.asd/logs/combined.log|2026-05-23T14:06:17+0800|259726
AlembicPlugin/.asd|2026-05-22T01:44:43+0800|128
AlembicPlugin/.asd/context|2026-05-21T23:16:40+0800|96
AlembicPlugin/.asd/context/index|2026-05-21T23:16:40+0800|64
AlembicPlugin/.asd/logs|2026-05-22T01:44:43+0800|160
AlembicPlugin/.asd/logs/error.log|2026-05-25T00:57:16+0800|51706
AlembicPlugin/.asd/logs/audit.log|2026-05-22T01:44:43+0800|0
AlembicPlugin/.asd/logs/combined.log|2026-05-25T00:57:16+0800|437403
```

## Dashboard 证据

- 右侧 in-app browser 已打开 `http://127.0.0.1:58439/recipes`。
- 页面可见 `AlembicWorkspace`、`本地 Alembic`、`测试模式` 和 Recipes 空状态。
- 本轮只做最小 Dashboard 存活与 ProjectScope 摘要可见检查；P5 已完成摘要 / 详情展开 / 无 remove-disable 的完整 DOM 与截图检查，本轮未发现回退迹象。

## Git 状态

测试期间未修改产品源码。收口时以下仓库 `git status --short` 为空：

- `Alembic`
- `AlembicCore`
- `AlembicPlugin`
- `AlembicDashboard`
- `BiliDili`

`AlembicWorkspace` 和 `AlembicTest` 仍存在前序未提交文档 / 脚本变更；本轮新增或回填的 P6 产物为：

- `AlembicTest/docs/multi-root-project-scope-preflight-retest-2026-05-25.md`
- `AlembicTest/tmp/mrps-p6-daemon-api.json`
- `AlembicTest/tmp/mrps-p6-plugin-alembic.json`
- `AlembicTest/tmp/mrps-p6-plugin-alembiccore.json`
- `AlembicTest/tmp/mrps-p6-plugin-alembicplugin.json`
- `AlembicTest/tmp/mrps-p6-plugin-alembicdashboard.json`
- `AlembicTest/tmp/mrps-p6-plugin-baseline-unbound.json`

提交 hash：无。本轮为 AlembicTest 复测和文档回填，未提交仓库。

## 收口校验

```bash
git diff --check -- docs/workspace/current/alembic-test-exchange.md docs/workspace/current/global-todo-board.md docs/workspace/current/index.md docs/workspace/current/multi-root-project-scope-wave-5-2026-05-25.md docs/workspace/current/workspace-current-status.md docs/workspace/index.md
git -C AlembicTest diff --check -- docs scripts README.md package.json AGENTS.md
rg -n '[ \t]$' AlembicTest/docs/multi-root-project-scope-preflight-retest-2026-05-25.md
node scripts/verify-workspace-docs.mjs --all-workspace
node scripts/check-workspace-current-layout.mjs
node scripts/check-dispatch-coverage.mjs docs/workspace/current/workspace-current-status.md
node scripts/check-todo-board.mjs --plan docs/workspace/current/multi-root-project-scope-wave-5-2026-05-25.md --require
```

结果：

- 两个 `git diff --check` 通过。
- 新报告无行尾空白。
- `verify-workspace-docs` 通过，检查 260 个 Markdown links。
- `check-workspace-current-layout` 通过。
- `check-dispatch-coverage` 通过，当前发送名单为无。
- `check-todo-board` 通过。

## 失败归口

无 P6 阻断失败。`GTODO-2026-05-24-036` 的 Plugin execution preflight 真实复测门已通过，可交给总控验收关闭当前主线。

需要单独记录的非阻断项：

- ProjectScope ghost dataRoot 仍为空，prime 为 `empty`，search 返回 0 条并带 `vector_store_unavailable_or_empty`。这是未跑 full cold-start 的预期，不影响 P6 execution preflight 结论。
- 旧 probe 顶层分类仍显示 `daemon-missing-searchmeta`，不适合作为 P6 pass/fail 总分，后续可补一个 P6 专用 probe 或更新分类规则。
- `Alembic/.asd` 与 `AlembicPlugin/.asd` 有历史遗留目录；本轮只能证明没有新增或修改 source folder runtime data，不能证明历史目录不存在。

## 遗留风险

- `GTODO-2026-05-24-030` project-level skill visibility mount 仍待排期，不属于本轮。
- ProjectScope ghost knowledge/vector 为空，后续若要验证跨 folder 共享知识命中，需要另建小样本或冷启动复测。
- 本轮重启执行了 dev link 和 Dashboard asset build；需以最终 git status 确认产品仓库无非预期改动。

## 下一步建议

1. 总控验收 `Test-2026-05-25-03 / MRPS-P6-Preflight-Retest` 为通过，并关闭 `GTODO-2026-05-24-036` 当前硬门禁。
2. 把 `GTODO-2026-05-24-030` project-level skill visibility mount 保持为后续独立主线，不并入 P6。
3. 后续测试工具层建议新增 P6 专用判定，避免旧 resident vector search probe 的 `daemon-missing-searchmeta` 顶层分类干扰 ProjectScope execution preflight 结论。
