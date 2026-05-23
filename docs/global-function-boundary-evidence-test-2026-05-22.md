# AlembicTest Global Function Boundary Evidence - 2026-05-22

状态：已回填，待总控验收
任务包：GFBD-P1-T
执行窗口：AlembicTest
范围：只挖掘 AlembicTest 自身规则、docs/config/scripts 和测试交接文档关系
日期：2026-05-22

## 完成范围

本轮只做证据采集和职责边界判断，没有操作 BiliDili，没有运行真实项目测试，没有修改 Alembic / AlembicCore / AlembicAgent / AlembicDashboard / AlembicPlugin 产品源码，也没有移动目录、删除兼容层或清理 runtime 数据。

已读取和扫描：

- `AlembicTest/AGENTS.md`
- `AlembicTest/README.md`
- `AlembicTest/docs/README.md`
- `AlembicTest/docs/testing-operation-policy.md`
- `AlembicTest/config/README.md`
- `AlembicTest/config/defaults.json`
- `AlembicTest/scripts/README.md`
- `AlembicTest/scripts/restart-alembic.mjs`
- `AlembicTest/scripts/monitor-alembic-bootstrap.mjs`
- `AlembicTest/scripts/probe-codex-prime.mjs`
- `AlembicTest/scripts/probe-resident-vector-search.mjs`
- `docs/workspace/current/alembic-test-exchange.md`
- `docs/workspace/global-function-boundary-design-workspace-plan-2026-05-22.md`

## 关键代码证据

### 规则与窗口定位

- `AlembicTest/AGENTS.md:3-7` 明确 AlembicTest 是测试验证窗口，不是产品源码仓库；不能复制 Alembic 系列仓库或真实测试项目的产品实现，发现产品问题必须回到源仓库修复。
- `AlembicTest/AGENTS.md:15-21` 要求长期测试材料写入 `AlembicTest/docs/`，跨仓库计划和阶段状态仍由 workspace `docs/workspace/` 挂载，测试配置归 `AlembicTest/config/`，长期文档不得写入密钥、token、登录态或设备信息。
- `AlembicTest/AGENTS.md:25-29` 规定本窗口承接复现、冒烟、回归、冷启动监控、跨仓库集成验证和证据整理，不替代 Alembic / Core / Agent / Dashboard / Plugin / BiliDili 开发窗口。
- `AlembicTest/AGENTS.md:33-37` 划定可做 API 状态检查、Dashboard 行为记录、日志观察和真实项目只读扫描；禁止在本目录实现 runtime/UI/MCP/Core/API 或为了测试通过改坏真实项目。
- `AlembicTest/AGENTS.md:41-47` 要求测试前读取总控文档和真实入口；验证 BiliDili 时默认只读，不改业务代码；无法运行命令时必须记录原因。
- `AlembicTest/AGENTS.md:51-57` 给出文件归属：规则在 `AGENTS.md`，配置在 `config/`，脚本在 `scripts/`，临时输出在 `tmp/`，长期验证报告在 `docs/`，跨仓库当前计划在 workspace `docs/workspace/`。

### README 与长期策略

- `AlembicTest/README.md:3-10` 将 AlembicTest 定位为 Alembic 真实链路测试工作区，保存测试脚本、可复用配置、复现记录、监控记录和验证证据；BiliDili 是真实 iOS/Swift 项目，产品修复属于对应 Alembic 或 BiliDili 仓库。
- `AlembicTest/README.md:14-23` 明确不得复制产品实现、不得保存密钥或本机私有 runtime 数据、不得为了测试便利修改 BiliDili；默认 restart preflight 只停 daemon / stale monitor 和清旧日志，不删除数据库、候选、设置、密钥或源码。
- `AlembicTest/docs/testing-operation-policy.md:9-17` 明确总控定义测试目标和验收，AlembicTest 执行启动/重启、cold-start/rescan/clean rebuild 触发、Dashboard/Jobs/日志监控、BiliDili smoke/复现/回归和失败记录。
- `AlembicTest/docs/testing-operation-policy.md:21-28` 指定测试默认配置归 `AlembicTest/config/defaults.json`，一次性差异用 CLI 参数，不把本机绝对路径、密钥、token 或临时端口写入长期配置。
- `AlembicTest/docs/testing-operation-policy.md:32-40` 明确真实项目测试脚本归 `AlembicTest/scripts/`，workspace 根脚本只做总控治理；长期测试报告归 `AlembicTest/docs/`，workspace 控制文档只链接或引用测试证据，不承载执行细节。
- `AlembicTest/docs/testing-operation-policy.md:44-53` 给出回填字段，包括测试目标、配置、job/session/Dashboard 摘要、状态变化、日志信号、失败/取消/timeout/completed 分类、是否改动真实项目、遗留风险和建议。

### 配置与脚本边界

- `AlembicTest/config/defaults.json:2-24` 当前只维护测试默认目标、Alembic 仓库路径、restart wait/stop/status 时间、preclean 开关、monitor interval/timeout/tail/signals；它是测试配置，不是产品 runtime 配置。
- `AlembicTest/scripts/README.md:3-14` 将脚本定位为 real-project smoke、cold-start monitoring、runtime restart checks 和 evidence collection；脚本应从 workspace root 运行、避免密钥和用户绝对路径、输出足够状态，并避免修改源仓库，除非总控或用户明确授权。
- `AlembicTest/scripts/README.md:18-27` 的 `probe-codex-prime.mjs` 是只读 Codex MCP prime probe：启动本地 AlembicPlugin MCP，指向目标项目，调用 `alembic_codex_status` 和 `alembic_task(operation=prime)`，将 JSON 证据写入 `AlembicTest/tmp/`。
- `AlembicTest/scripts/README.md:28-41` 的 `probe-resident-vector-search.mjs` 是只读 resident search probe：调用 `alembic_task prime`、direct `alembic_search(auto/semantic)` 和 daemon `/api/v1/search`，摘要 resident metadata、fallback、service boundary 和 removed bridge 负向证据。
- `AlembicTest/scripts/README.md:42-57` 的 `restart-alembic.mjs` 是测试运行时重启脚本，包含 clean-environment preflight、`npm run dev:link`、Alembic CLI `start --restart --no-open --json` 和可选 monitor handoff；其 destructive-ish 操作只在用户或总控授权的测试重启场景内使用。
- `AlembicTest/scripts/README.md:58-65` 的 `monitor-alembic-bootstrap.mjs` 是只读 bootstrap monitor，不启动、停止、取消或 kill Alembic；只解析 daemon URL/data root、poll compact Jobs API、统计候选文件并 tail 关键日志信号。

### 脚本实现证据

- `AlembicTest/scripts/restart-alembic.mjs:21-39` 从 `AlembicTest/config/defaults.json` 加载测试参数，说明测试配置归 AlembicTest 管，不散落到总控。
- `AlembicTest/scripts/restart-alembic.mjs:62-94` 提供 `--dry-run`、`--no-preclean`、`--no-stop-all-services`、`--no-clean-logs`、`--monitor` 等开关，说明它是可控测试工具，不是无条件清理脚本。
- `AlembicTest/scripts/restart-alembic.mjs:378-459` 会按 daemon state 停旧 daemon 并移除 `daemon.json` / `daemon.pid` / `daemon.lock`；这是测试重启前的 runtime 状态清理候选，不能迁到产品仓库作为常规业务逻辑，也不能在无授权任务中运行。
- `AlembicTest/scripts/restart-alembic.mjs:462-513` 通过 `ps` 兜底识别 Alembic daemon 和 stale AlembicTest monitor，并只匹配 Alembic-owned command，避免误杀其它 node 服务；这属于测试清洁环境能力。
- `AlembicTest/scripts/restart-alembic.mjs:539-563` 只清旧 `daemon.log` 和 `.asd/logs/`，不删除数据库、候选、设置、密钥或项目源码；这与 `README.md:20-23` 的保护口径一致。
- `AlembicTest/scripts/restart-alembic.mjs:761-775` 真实启动路径仍调用 Alembic 仓库 `dist/bin/cli.js start --restart --no-open --json`，说明 AlembicTest 不实现 daemon/CLI，只编排源仓库入口。
- `AlembicTest/scripts/restart-alembic.mjs:928-955` 启动后只读调用 compact jobs status，并可把监控交给 `monitor-alembic-bootstrap.mjs`。
- `AlembicTest/scripts/monitor-alembic-bootstrap.mjs:193-230` 解析已有 daemon records、projectRoot、dataRoot 和 URL，体现 monitor 是运行态观察者。
- `AlembicTest/scripts/monitor-alembic-bootstrap.mjs:232-264` 用 `curl` 读取 API，并在 localhost 被 sandbox 阻断时给出诊断提示，不伪造成测试通过。
- `AlembicTest/scripts/monitor-alembic-bootstrap.mjs:309-324` 从本地 job 文件补充 latest bootstrap job，`347-361` tail `combined.log` / `daemon.log` 里的关键日志信号，均属于证据采集。
- `AlembicTest/scripts/probe-codex-prime.mjs:39-60` 通过 `StdioClientTransport` 启动 workspace AlembicPlugin MCP，并用 `ALEMBIC_PROJECT_DIR` / `CODEX_WORKSPACE_DIR` 指向目标项目，说明 probe 是测试入口编排，不是 Plugin 实现。
- `AlembicTest/scripts/probe-codex-prime.mjs:96-104` 调用 `alembic_codex_status` 和 `alembic_task(operation=prime)`；`119-179` 汇总 delivered、hostResponse、shoutInstruction、serviceBoundary、evidenceRefs 和 `codex_host_response` 负向证据。
- `AlembicTest/scripts/probe-resident-vector-search.mjs:42-63` 同样通过 workspace AlembicPlugin MCP 启动 probe；`106-145` 调用 `alembic_codex_status`、`alembic_task prime`、`alembic_search(auto)`、`alembic_search(semantic)` 和只读 daemon search。
- `AlembicTest/scripts/probe-resident-vector-search.mjs:171-230` 将 resident metadata、service boundary、fallback、mode normalization、daemon searchMeta 和 bridge removal 归类为可回填 checks。
- `AlembicTest/scripts/probe-resident-vector-search.mjs:310-340` 读取 daemon `/api/v1/search` 时不写入 token 到报告，只保留 endpoint 路径语义和 searchMeta 摘要。

### 总控交接证据

- `docs/workspace/global-function-boundary-design-workspace-plan-2026-05-22.md:63` 明确 GFBD-P1-T 的动作是读取 AlembicTest 自身规则、docs/config/scripts，不运行真实项目，回填测试职责、禁止事项、证据格式和与 `alembic-test-exchange.md` 的关系。
- `docs/workspace/global-function-boundary-design-workspace-plan-2026-05-22.md:74-87` 显示 AlembicTest 本轮待启动且 BiliDili 无任务，证明真实 iOS 项目不参与本轮边界证据采集。
- `docs/workspace/current/alembic-test-exchange.md` 是测试单创建、回填和总控验收入口；历史 Test-2026-05-21 / 2026-05-22 条目证明 AlembicTest 把详细报告写到 `AlembicTest/docs/`，并把摘要、结论、证据、commit 或风险回填到 workspace 计划文档。

## 职责边界判断

### 应留在 AlembicTest

- 真实项目测试编排脚本：restart、monitor、probe、smoke、回归、复现和只读 API / log evidence collection。
- 测试默认配置：默认目标项目、等待时间、轮询间隔、日志 tail 大小、signal pattern、preclean 开关。
- 长期测试证据：测试报告、复现记录、冷启动监控分析、验证结论、失败分类和后续建议。
- 总控测试单的执行层：读取 workspace `docs/workspace/` 测试单，执行被授权的测试动作，回填摘要和报告路径。
- 真实项目保护逻辑：测试前后 git 状态检查、只读扫描、运行态产生物记录、不得改 BiliDili 业务代码。

### 不应进入 AlembicTest

- Alembic daemon、HTTP/API、Dashboard server、ProjectRegistry、JobStore、file monitor、internal AI jobs 的产品实现。
- AlembicCore 的确定性 headless 共享能力、parser、repository、search/vector core contract。
- AlembicAgent 的 AI provider、runtime、tool system、memory/context/prompt、执行循环。
- AlembicDashboard 的前端 UI、API client、路由、样式、i18n 和用户界面状态。
- AlembicPlugin 的 Codex MCP server、Skill、channel/cache/runtime、Codex-facing tool handler、resident service client 和 Guard/prime/search 产品逻辑。
- BiliDili 的业务源码、工程配置、UI、登录、播放、网络或 Xcode 项目结构。

### 与 workspace 总控的边界

- workspace 总控负责提出测试目标、派发测试单、维护跨仓库计划、汇总验收和决定后续修复窗口。
- AlembicTest 负责执行授权测试、记录证据、保存长期测试报告、回填摘要；不得自行把测试发现的问题改在产品仓库，也不得自行提交 workspace 根文档。
- `alembic-test-exchange.md` 应继续作为总控与 AlembicTest 的当前测试单交换入口；详细执行材料继续挂到 `AlembicTest/docs/`。

## 删除 / 下沉 / 不得移动候选

### 删除候选

- 当前未发现 AlembicTest 内有应立即删除的产品实现副本。现有 `scripts/` 均是测试编排或证据采集，`docs/` 是报告，`config/` 是测试默认配置。
- 若后续发现 `AlembicTest/tmp/` 中有长期保留的本机绝对路径、token、daemon state 或大日志，应作为清理候选，但本轮没有读取或修改 `tmp/`。

### 下沉候选

- 没有发现应下沉到 AlembicCore / Alembic / Plugin 的稳定产品 API。AlembicTest 脚本里的 helper 是测试编排逻辑，不应作为公共 contract。
- 仅有可能抽象为总控通用模板的是“测试报告字段结构 / 回填字段模板”，但它已经通过 `templates/alembic-test-handoff-template.md` 和 workspace 流程承载，不应从 AlembicTest 中抽走执行报告。

### 不得移动候选

- `AlembicTest/scripts/probe-codex-prime.mjs`、`probe-resident-vector-search.mjs`：不得迁入 AlembicPlugin 产品仓库来“方便测试”，否则会混淆测试脚本和 Codex MCP 实现。
- `AlembicTest/scripts/restart-alembic.mjs`：不得迁入 Alembic 产品 runtime 作为默认启动逻辑；它包含测试用 preclean、停止旧服务和日志清理，必须保留在测试窗口并受授权约束。
- `AlembicTest/scripts/monitor-alembic-bootstrap.mjs`：不得迁入 Dashboard 或 Alembic daemon；它是外部观察器，用于测试窗口从用户角度监控 Jobs API / logs。
- `AlembicTest/config/defaults.json`：不得合并到 workspace 根配置或产品配置；它只代表 AlembicTest 的测试默认值。
- `AlembicTest/docs/*.md` 验证报告：不得搬入产品仓库 docs，除非总控另行决定把其中某个结论整理成产品用户文档或发布说明。

## 验证命令

本轮只运行只读扫描和格式检查，没有运行真实项目测试。

```bash
git -C AlembicTest status --short --branch
rg --files AlembicTest
rg -n "ALEMBIC_PROJECT_DIR|CODEX_WORKSPACE_DIR|StdioClientTransport|callJsonTool|writeFileSync|tmp|restart|preclean|cleanLogs|monitor|jobs|daemon|BiliDili|fetch\\(|statePath|readFileSync|kill|spawn|execFile" AlembicTest/scripts AlembicTest/docs AlembicTest/config AlembicTest/README.md AlembicTest/AGENTS.md
rg -n "Test-2026|AlembicTest|report|报告|回填|BiliDili|git status|cold-start|resident|prime" docs/workspace/current/alembic-test-exchange.md AlembicTest/docs/*.md
git -C AlembicTest diff --check
```

## 验证结果

- `git -C AlembicTest status --short --branch`：任务开始前为 `## main...origin/main`，无未提交变更。
- `rg --files AlembicTest`：确认 AlembicTest 当前结构为 `AGENTS.md`、`README.md`、`package.json`、`config/`、`docs/`、`scripts/`；未发现产品源码目录。
- `rg` 定向扫描：确认脚本职责集中在 test config、restart、monitor、prime probe、resident search probe、tmp JSON evidence 和报告回填。
- `git -C AlembicTest diff --check`：通过。
- 未运行 `npm --prefix AlembicTest run check`、`restart`、`monitor`、`probe-*` 或 BiliDili git/test 命令，因为 GFBD-P1-T 明确禁止本轮运行真实项目测试。

## 遗留风险

- `restart-alembic.mjs` 包含 stop daemon、remove daemon runtime state 和 clean logs 能力；它在测试重启场景中合理，但必须继续依赖总控或用户授权，不能被普通证据采集任务误运行。
- `probe-*` 脚本会启动 AlembicPlugin MCP stdio runtime，并可能访问 localhost daemon；它们适合真实测试单，不适合本轮职责边界扫描。
- 历史报告中为复盘需要可能包含 localhost 端口、pid、projectId、daemon startedAt 等运行态摘要；长期报告已避免 token/key，但未来仍需持续避免写入本机私密路径、token 或登录态。
- 当前只完成 AlembicTest 自身边界证据；全局职责契约仍需等待 Alembic / Core / Agent / Dashboard / Plugin 窗口回填后，由总控统一收敛。

## 下一步建议

- 总控可将 GFBD-P1-T 标记为待验收或已回填，并在 GFBD-2 汇总时将 AlembicTest 定义为“独立测试验证窗口”，只承接授权测试、证据整理、报告和回填。
- 长期职责契约中应明确：真实项目测试脚本留在 `AlembicTest/scripts/`，总控治理脚本留在 workspace 根 `scripts/`，产品能力不得因测试便利复制到 AlembicTest。
- 后续若需要新增测试能力，应先写清测试目标、真实入口、授权范围、输出证据和禁止事项；若脚本涉及 stop/clean/restart，应保留 dry-run / no-preclean 等安全开关。
