# Cold-start LLM 信息前端显示实时监控

日期：2026-05-24
执行窗口：AlembicTest
真实测试项目：BiliDili
Dashboard：`http://127.0.0.1:61043`

## 监控职责

- 旁路观察用户手动执行 cold-start 验证，不主动触发 cold-start。
- 记录 Dashboard 前端显示 LLM 信息相关问题、证据和 TODO。
- 关注 Jobs timeline、events API、socket append、LLM input / output / reflection / tool rich content、React #31、刷新恢复和日志信号。
- 不修改 BiliDili 源码，不修产品代码，不清理测试产物。

## 初始状态

- 监控启动时间：2026-05-24 15:04 CST。
- daemon：`pid=61654`，version `0.2.0`。
- API source：`jobs-compact-api`。
- 当前 latest job：`bootstrap_mpja71u9_a069c7d4`，状态 completed，progress 100%，completed 14 / failed 0 / cancelled 0，tools 646。
- 当前 candidates：48。
- 初始日志信号：`Error tracker initialized`、`[UiStartupTasks] All tasks completed in 118ms`。

## 实时观察

| 时间 | 观察 | 证据 | 判断 |
| --- | --- | --- | --- |
| 15:04 CST | live API 监控启动成功。 | `monitor-alembic-bootstrap.mjs --url http://127.0.0.1:61043 --watch --keep-going`，Source=`jobs-compact-api`。 | 可以开始用户手动 cold-start 验证。 |
| 15:04-15:06 CST | 未观察到新 cold-start job。 | latest job 持续为 `bootstrap_mpja71u9_a069c7d4` completed，heartbeat stale 132-134m，candidates 48，无新的 queued / running / sessionId。 | 如果用户已点击启动，需检查前端按钮是否成功提交 bootstrap 请求。 |
| 15:07 CST | 用户启动的新 cold-start job 已出现。 | jobId=`bootstrap_mpjfps1y_8b15b2e0`，sessionId=`bs_1779606427334_aoodkh`，状态 running，14 tasks，concurrency=3；fullReset trash-bin mode 完成，tables=12，movedItems=14。 | 冷启动触发链路可达，后续重点转为 LLM / tool events 生产与前端显示。 |
| 15:07-15:08 CST | 首轮只看到 LLM call start，还未观察到 `llm.input` / `llm.output` / `llm.reflection` / `tool` kind 增量；heartbeat 开始 stale。 | `architecture` 与 `swift-objc-idiom` 均记录 `[AgentRuntime] LLM call start model=deepseek:deepseek-v4-pro iter=1 ... requestedToolChoice=none toolSchemaCount=0`；15:08 heartbeat stale 1m，progress 0，tools 0。 | 先按正常慢响应观察；若持续无事件增量，应归为 producer/runtime 或 provider waiting gap，而非前端显示问题。 |
| 15:09 CST | 按用户要求取消本轮 cold-start。 | `POST /api/v1/modules/bootstrap/cancel` 返回 session `aborted`，14 tasks 全部 `cancelled`；随后 `POST /api/v1/jobs/bootstrap_mpjfps1y_8b15b2e0/cancel` 返回 job `cancelled`。 | 冷启动已停止，取消链路可达。 |
| 15:09 CST | 取消后 events API 末态可读。 | `/api/v1/jobs/bootstrap_mpjfps1y_8b15b2e0/events?limit=240`：count=12，retained=12，hidden=0，kind counts=`workflow:7`、`checkpoint:1`、`llm.input:2`、`summary:2`。末尾包含 `Bootstrap session completed` aborted、`Bootstrap job cancelled`、`Daemon job cancellation requested`。 | 本轮已经产生 `llm.input`，但因用户取消，未能继续验证 `llm.output` / `llm.reflection` / `tool` 前端显示。 |

## 问题 / TODO

| ID | 状态 | 问题 / TODO | 证据 | 建议 |
| --- | --- | --- | --- | --- |
| CLM-2026-05-24-01 | 已完成 | 等待用户启动新的 cold-start job。 | 15:07 CST 观察到 `bootstrap_mpjfps1y_8b15b2e0` running，sessionId=`bs_1779606427334_aoodkh`。 | 已转入该 job 的事件与前端显示监控。 |
| CLM-2026-05-24-02 | 观察中 | 15:04-15:06 CST 未见新 job；若用户已点击启动，可能存在前端启动按钮未提交或请求失败。 | `jobs-compact-api` latest job 未变化，日志只有 `Error tracker initialized` / `UiStartupTasks`。 | 若用户确认已点击，检查浏览器 network / console / Jobs 页面按钮状态。 |
| CLM-2026-05-24-03 | 本轮中止 | 确认本轮 job 是否真实生产 `llm.input` / `llm.output` / `llm.reflection` / `tool` events。 | 取消前 events API 已有 `llm.input:2`；取消后总计 12 events，无 `llm.output` / `llm.reflection` / `tool`。 | 本轮因用户要求停止，不判定为前端问题；下一轮 cold-start 继续验证 LLM output/reflection/tool rich content。 |
| CLM-2026-05-24-04 | 待下轮 | 验证 Dashboard Jobs 页面取消后是否立即显示 cancelled 末态，以及取消 summary 是否通过 socket append 或 REST recovery 可见。 | API 末态已确认；本轮未做 DOM / 截图取证。 | 下轮若关注前端取消反馈，补 Jobs DOM / screenshot 证据。 |
