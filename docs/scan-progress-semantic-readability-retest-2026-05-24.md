# Scan Progress Semantic Readability Retest

状态：已完成 / 待总控验收
执行窗口：AlembicTest
测试日期：2026-05-24
测试单：Test-2026-05-24-07 / SPSR-P5-TestMode-Readability-Retest

## 窗口定位

本轮由 AlembicTest 执行真实链路测试：使用 BiliDili 真实项目、Alembic test mode 小维度 cold-start，复测 Dashboard P4 后的过程 Timeline 可读性和 live append 表现。测试只做验证、截图、日志和文档回填；未修改 BiliDili 源码，也未修 Alembic / Dashboard 产品代码。

## 结论

总体结论：通过，带 live append 观感遗留风险。

- 阶段转换默认展示：通过。`Agent 阶段转换 Nudge: VERIFY` 的正文默认可见，没有显示为 `内容已收起`。
- 短 LLM 默认展示：通过。多条短 `llm.output` 默认直接展示正文，例如 sequence `21` / `25` / `27`。
- 长内容折叠：通过。长 `llm.input` 和长 planning nudge 默认折叠，显示 `展开内容` / `内容已收起`。
- 颜色可读：通过。深色 UI 下标题、摘要、正文、metadata chips 和按钮可读；截图覆盖阶段转换和内容区域。
- active card / summary：通过。运行中 `Candidates` 页面 cold-start 卡片展示 Nudge 摘要、job id、任务详情入口、test mode 和当前维度。
- live append：部分通过。右侧 Jobs 页面无需刷新即可从 running 追加到 completed，但可见节奏不是严格一条一条：观测到 `33->35`、`42->44`、`44->46`、`58->61`、`69->78` 等成批落屏。当前归因为 producer / socket cadence 或 React 批渲染把同一时间附近的事件一起显示；前端未触发 React #31，REST 刷新不是恢复完成态的必要条件。

## 使用配置

- 真实项目：BiliDili
- Dashboard/API：`http://127.0.0.1:55797`
- job id：`bootstrap_mpjpm6yq_f5da9bdb`
- session id：`bs_1779623052105_eqfmi1`
- test mode：enabled
- test mode dimensions：`bootstrapDims=["architecture"]`、`rescanDims=["architecture"]`
- bootstrap request：`maxFiles=8`、`contentMaxLines=40`、`skipGuard=true`
- job 结果：completed，`1/1` 维度，耗时 `7m 52s`，工具调用 `46`

## 版本和工作区状态

- Alembic daemon health：`version=0.2.0`，Dashboard capability enabled，process events endpoint available。
- Dashboard 基线 commit：`37b6f7948333a4e97c043ffba1823866660ec5d2`。
- Dashboard dirty tree：`scripts/dashboard-contract.test.mjs`、`src/components/Views/JobsView.tsx`。
- 影响判断：`npm --prefix AlembicTest run restart` 的 `dev:link` 构建了当前本地 `AlembicDashboard` dirty working tree，因此本报告验证对象是 `37b6f79 + 2 个未提交小 UI/contract 调整`，不是纯 commit。读屏和截图证据有效；发布封口仍应由 Dashboard 窗口处理 dirty tree。
- BiliDili git 状态：测试前后 `git -C BiliDili status --short` 均无输出。

## 事件统计

来自 `AlembicTest/tmp/spsr-p5-events-bootstrap_mpjpm6yq_f5da9bdb.json`：

- total：`78`
- by kind：`workflow=5`、`checkpoint=1`、`llm.input=27`、`llm.reflection=12`、`llm.output=27`、`tool=1`、`summary=4`、`artifact=1`
- semanticKind：`planning-nudge=3`、`continue-nudge=2`、`reflection-nudge=1`、`transition-nudge=4`、`convergence-nudge=1`
- projection：`dimension-findings-digest=1`
- displayPolicy：`full=76`、`summary-only=2`
- sourceClass：`developer-facing=78`
- hidden/raw/secret：`0`

关键事件：

- sequence `22`：`kind=llm.reflection`，`metadata.semanticKind=transition-nudge`，`metadata.nudgeType=phase_transition`，`phase=VERIFY`，title `Agent 阶段转换 Nudge: VERIFY`。
- sequence `21`：短 `llm.output`，`Received 60 visible character(s)`，正文默认展示。
- sequence `7`：长 `llm.input`，正文默认折叠。
- sequence `74`：`phase=dimension-findings`，`metadata.projection=dimension-findings-digest`，保留关键发现摘要。

## 前端证据

- active card：`AlembicTest/tmp/spsr-p5-active-card-bootstrap_mpjpm6yq_f5da9bdb.png`
  - 运行中 `Candidates` 卡片显示 `项目扫描进度`、`Job bootstrap_mpjpm6yq_f5da9bdb · running`、`任务详情` 入口、Nudge 摘要和 `架构模式` filling。
- 阶段转换和短 LLM 默认展示：`AlembicTest/tmp/spsr-p5-transition-default-bootstrap_mpjpm6yq_f5da9bdb.png`
  - sequence `21` 短 `LLM output received` 正文默认可见。
  - sequence `22` `Agent 阶段转换 Nudge: VERIFY` 正文默认可见，未折叠。
  - 同图覆盖深色 UI 颜色可读性。
- 长内容折叠：`AlembicTest/tmp/spsr-p5-long-folded-bootstrap_mpjpm6yq_f5da9bdb.png`
  - sequence `7` 长 `Bootstrap 架构与设计 input prepared` 显示 `展开内容` / `内容已收起`。
- 完成态 summary：`AlembicTest/tmp/spsr-p5-final-jobs-bootstrap_mpjpm6yq_f5da9bdb.png`
  - Jobs 页面显示 completed、`78` 事件、`session: bs_1779623052105_eqfmi1`、效率和诊断摘要。
- DOM / cadence：`AlembicTest/tmp/spsr-p5-final-dom-bootstrap_mpjpm6yq_f5da9bdb.txt`、`AlembicTest/tmp/spsr-p5-live-cadence-bootstrap_mpjpm6yq_f5da9bdb.json`
  - 记录了无需刷新从 `20` 到 `78` 的 DOM 变化和批量 append 节奏。

## live append 观察

右侧 in-app browser 保持在 Jobs 页面观察，不做刷新：

- 19:44:42 左右：DOM 显示 `20` 事件，job running。
- 19:44:54：DOM 显示 `28` 事件，出现 sequence `21-28`，包含短 LLM、阶段转换和后续 input/output。
- 19:45:30 到 19:45:57：`33 -> 35`，一次 +2。
- 19:47:36 到 19:48:19：`42 -> 44 -> 46 -> 48`，多次 +2。
- 19:48:40 到 19:50:12：`48 -> 50 -> 52 -> 54 -> 56`，多次 +2。
- 19:50:23 到 19:52:06：`58 -> 61 -> 63 -> 66 -> 69 -> 78`，最终完成态一次 +9。

判断：socket/live recovery 主链路可用，页面无需刷新即可从 running 进入 completed；但用户期望的“像终端一样一条一条出现”没有严格达成，后续若要优化，应进入 `GTODO-2026-05-24-029` 的实时性专项，重点区分 producer 同 tick 广播、Socket.io delivery、React 批渲染和 Timeline row 动画策略。

## 验证命令

- `ALEMBIC_TEST_MODE=1 ALEMBIC_TEST_BOOTSTRAP_DIMS=architecture ALEMBIC_TEST_RESCAN_DIMS=architecture npm --prefix AlembicTest run restart -- --project BiliDili --json --wait 12000`
  - 第一次 preclean 停止旧 PID 后脚本以失败退出；确认无 Alembic 进程残留后重跑成功，Dashboard/API `http://127.0.0.1:55797`。
- `curl -sS http://127.0.0.1:55797/api/v1/daemon/health`
  - 通过，process events capability available。
- `curl -sS http://127.0.0.1:55797/api/v1/modules/test-mode`
  - 通过，`enabled=true`，小维度参数生效。
- `curl -sS -X POST -H 'Content-Type: application/json' --data '{"maxFiles":8,"contentMaxLines":40,"skipGuard":true}' http://127.0.0.1:55797/api/v1/jobs/bootstrap`
  - 通过，创建 `bootstrap_mpjpm6yq_f5da9bdb`。
- `curl -sS 'http://127.0.0.1:55797/api/v1/jobs/bootstrap_mpjpm6yq_f5da9bdb/events?limit=200'`
  - 通过，最终 `78` events。
- `git -C BiliDili status --short`
  - 测试前后均为空。

## 失败日志和恢复

- 产品运行失败：无。job `completed`，`failed=0`，`cancelled=0`。
- 前端错误：`tab.dev.logs({ levels: ["error"] })` 返回空数组，未观察到 React #31。
- 命令侧问题：
  - 第一次 restart preclean 退出，原因是旧 daemon PID stop 记录为失败；旧进程实际已停止，重跑 restart 成功。
  - 第一次 bootstrap curl payload 未正确引用 JSON，daemon 返回 JSON parse error；使用带引号的 `--data` 重跑成功。
  - Browser runtime 不能直接写 `AlembicTest/tmp` 截图，先写 runtime temp，再复制到 `AlembicTest/tmp`。

## 遗留风险

- live append 严格逐条出现未达成，当前只能证明无需刷新和实时恢复；建议总控把“更细粒度近实时显示”留在 `GTODO-2026-05-24-029`，等用户再次要求时专项处理。
- Dashboard dirty tree 参与本次 dev build；虽然用户确认不阻塞主线，报告仍建议 Dashboard 后续封口或提交这些小 UI/contract 调整，避免验收对象与发布 commit 不一致。
- 本轮只跑 test mode `architecture` 小样本，覆盖 P4 可读性目标；不代表全量 cold-start 长链路的所有阶段都有同样节奏。

## 下一步建议

总控可验收 `SPSR-P5-TestMode-Readability-Retest` 的阅读体验主项；若完成定义坚持 live append 必须严格单行逐条，需要把 `GTODO-2026-05-24-029` 从观察提升为独立实时性优化主线。
