# BiliDili Cold Start Bootstrap Analysis - 2026-05-21

状态：复盘完成  
维护窗口：AlembicTest  
测试对象：BiliDili 真实项目  
触发入口：Dashboard cold start / bootstrap  
Dashboard/API：`http://127.0.0.1:63030`  
Job ID：`bootstrap_mpf6tn10_c572b8a1`  
Session ID：`bs_1779349624495_scvvf0`  
证据根：Alembic 外部数据根 `02a25032`

## 结论摘要

这次冷启动不是完全失败，而是“主体完成 + 2 个维度超时失败”的部分成功状态。Bootstrap 最终产出 79 个候选知识，12/14 个维度完成，semantic memory 合并完成，wiki 已调度；但 Job API 最终状态是 `failed`，日志内 session 状态是 `completed_with_errors`。

主要问题不在候选生产能力本身，而在 Alembic 的长链路控制与观测层：

- `data-event-flow` 和 `ui-interaction` 都已经产生大量工具调用和中间记录，但失败诊断错误地显示为 `analyze` 阶段超时、`No analysis output`、工具调用不足 `0 < 3`。
- 失败维度的详细报告被清零，导致 postmortem 难以从 report 文件直接复原真实执行轨迹。
- compact Jobs API 在并发尾段出现状态、心跳和 active task 滞后，Dashboard/监控看到的状态和实际日志产出不一致。
- 部分成功维度也携带 `stage_timeout` cancel reason，说明维度级效率字段可能存在污染或语义混淆。
- 总运行耗时和 token/tool-call 成本偏高，超时维度在预算明显超线后仍继续消耗，压缩效果不足。

## 本次运行概况

| 项目 | 结果 |
| --- | --- |
| Job 状态 | `failed` |
| Session 状态 | `completed_with_errors` |
| 总耗时 | 5,655,972 ms，约 94.3 分钟 |
| 维度完成 | 12 completed / 2 failed / 0 cancelled |
| 候选产出 | 79 |
| 总工具调用 | 576 |
| token 输入 | 5,691,287 |
| token 输出 | 317,416 |
| reasoning tokens | 80,425 |
| cache hit tokens | 3,400,320 |
| duplicate tool calls | 11 |
| nudge / replan | 135 / 21 |
| final cancelReason | `stage_timeout` |

候选分布：

| 维度 | 候选数 |
| --- | ---: |
| agent-guidelines | 9 |
| architecture | 4 |
| coding-standards | 7 |
| concurrency-async | 8 |
| design-patterns | 8 |
| error-resilience | 7 |
| networking-api | 8 |
| observability-logging | 4 |
| performance-optimization | 6 |
| security-auth | 3 |
| swift-objc-idiom | 9 |
| testing-quality | 6 |

失败维度没有候选产出：

- `data-event-flow`
- `ui-interaction`

## 启动前清理与项目扫描

本次重启脚本先关闭 Alembic 相关服务并清理旧测试日志，然后启动新的 Alembic daemon 和监控。Bootstrap job 请求参数：

- `maxFiles: 500`
- `skipGuard: false`
- `contentMaxLines: 120`

Job 清理结果：

- `deletedRecipes: 1`
- `clearedTables: 12`
- `dbCleared: true`
- cleanup errors：无
- trash snapshot rows：`2198`

项目扫描结果：

- discoverer：`spm`
- targets：15
- files：127
- truncated：false
- AST：270 classes、21 protocols、64 categories
- code entity graph：364 entities、598 edges
- call graph：498 entities、1865 edges
- dependency graph：45 edges
- Guard audit：0 violations，未跳过

这说明冷启动前置清理和真实项目扫描链路基本可用。

## 维度结果

| 维度 | accepted | rejected | 耗时 | 工具调用 | 备注 |
| --- | ---: | ---: | ---: | ---: | --- |
| architecture | 4 | 5 | 18.4m | 39 | 成功 |
| swift-objc-idiom | 9 | 2 | 22.7m | 57 | 成功，但 efficiency 带 `stage_timeout` |
| design-patterns | 8 | 1 | 19.2m | 41 | 成功 |
| networking-api | 8 | 3 | 21.9m | 53 | 成功，但 efficiency 带 `stage_timeout` |
| coding-standards | 7 | 8 | 22.0m | 53 | 成功，拒绝数偏高 |
| concurrency-async | 8 | 0 | 15.9m | 51 | 成功 |
| error-resilience | 7 | 5 | 17.9m | 63 | 成功，拒绝数偏高 |
| security-auth | 3 | 0 | 10.8m | 34 | 成功 |
| testing-quality | 6 | 2 | 15.7m | 50 | 成功 |
| observability-logging | 4 | 0 | 10.3m | 29 | 成功 |
| agent-guidelines | 9 | 0 | 12.4m | 40 | 成功 |
| performance-optimization | 6 | 6 | 16.0m | 66 | 成功，尾段耗时高 |
| data-event-flow | 0 | 0 | report 中为 0 | report 中为 0 | 实际执行后超时，report 丢失细节 |
| ui-interaction | 0 | 0 | report 中为 0 | report 中为 0 | 实际执行后超时，report 丢失细节 |

## 失败维度深挖

### data-event-flow

日志事实：

- filling started：`combined.log:L1075`
- LLM calls：21 starts / 20 completes
- 工具调用：59
- 阶段轨迹：`SCAN 1`、`EXPLORE 10`、`VERIFY 8`、`RECORD 1`、`SUMMARIZE 1`
- 在 RECORD 阶段已收到 3 个 `note_finding`：`combined.log:L1428-L1435`
- 已从 RECORD 进入 SUMMARIZE：`combined.log:L1436`
- SUMMARIZE LLM call 失败：`combined.log:L1466`
- abortSignal fired：`combined.log:L1467`
- child result 标记 `stage_timeout`：`combined.log:L1470-L1473`

矛盾点：

- `runIssue.diagnostics.timedOutStages` 显示 `["analyze"]`
- `gateFailures` 显示 `No analysis output`
- warning 显示 `工具调用不足: 0 < 3`
- 但实际已有 59 次工具调用，并且 3 个 `note_finding` 已成功 recorded 到 activeContext

判断：这是高优先级观测/诊断 bug。真实失败发生在 SUMMARIZE 被 abort，而不是 analyze 无输出。当前诊断会误导修复方向。

### ui-interaction

日志事实：

- filling started：`combined.log:L1651`
- LLM calls：24 starts / 23 completes
- 工具调用：71
- 阶段轨迹：`SCAN 1`、`EXPLORE 19`、`VERIFY 4`
- 在 VERIFY 阶段已收到 3 个 `note_finding`：`combined.log:L2038-L2045`
- VERIFY LLM call 失败：`combined.log:L2102`
- abortSignal fired：`combined.log:L2103`
- child result 标记 `stage_timeout`：`combined.log:L2106-L2109`

矛盾点：

- `runIssue.diagnostics.timedOutStages` 显示 `["analyze"]`
- `gateFailures` 显示 `No analysis output`
- warning 显示 `工具调用不足: 0 < 3`
- 但实际已有 71 次工具调用，并且 3 个 `note_finding` 已成功 recorded 到 activeContext

判断：同样是高优先级观测/诊断 bug。真实失败发生在 VERIFY 长链路超时，不是 analyze 阶段完全无产出。

## 监控与 Dashboard/API 观察

监控脚本使用 compact Jobs API：

- `/api/v1/jobs?kind=bootstrap&limit=1&compact=true`

本次 watch 期间观察到 compact API 在并发尾段出现明显滞后：

- API 一度长时间显示 `completed=9 failed=2 filling=3 tools=441`，active task 停留在 `performance-optimization`。
- 同期 `combined.log` 和候选文件已经显示 `observability-logging`、`agent-guidelines` 继续推进，候选数从 60 以后继续增长。
- 后续 API 才追到 `completed=10`、`completed=11`，最终到 `completed=12 failed=2 tools=576`。

判断：监控脚本本身在 API 可用时按设计读取 compact API，不是本次现象的主因。问题更可能在 job compact summary 的刷新频率、active task 聚合逻辑或 heartbeat/status 写入时机。

## 候选质量抽样

抽查 `performance-optimization/lazy-var-uicomponents.md`：

- frontmatter 完整，包含 `source: bootstrap`、`dimensionId: performance-optimization`、质量评分 `overall: 0.902`、`grade: A`
- 内容引用真实 BiliDili source files，例如 Following、VideoFeed、LiveChat 的 ViewController
- 正文能给出具体项目约定、禁止项和示例代码

发现一个轻微数据质量风险：

- 该 performance candidate 的 tags 包含 `data-event-flow`
- 如果这是 auto-discovered related tag，需要确认是否有跨维度污染；如果只是相关性标签，应在 UI 或 schema 中区分主维度和相关标签，避免用户误以为失败维度也产出了候选

## 问题清单

### P0/P1：失败诊断与真实执行轨迹不一致

影响：

- 会把已经执行到 VERIFY/RECORD/SUMMARIZE 的维度误报为 analyze 无输出
- 会把真实工具调用数误报成 0
- 会误导修复者去查 analyze prompt 或 tool availability，而不是查超时预算、abort 归因和 partial result 处理

建议：

- child result 构造时保留最后真实 phase、最后 successful phase、工具调用累计数、note_finding 记录数
- abort 后不要用默认 `No analysis output` 覆盖已有阶段事实
- `timedOutStages` 应记录真实超时/abort 所在阶段，例如 `summarize` 或 `verify`

### P1：失败维度 report 被清零

影响：

- `bootstrap-reports/bs_...json` 中两个失败维度显示 duration/toolCalls/stages 都为 0
- 真实日志里已有大量有效轨迹，但 report 无法直接支持复盘

建议：

- 即使维度最终失败，也要落盘 partial stage report
- report 中增加 `partial: true`、`lastPhase`、`lastSuccessfulPhase`、`toolCallsBeforeAbort`、`recordedFindingsBeforeAbort`

### P1：partial success 状态表达不清

影响：

- 日志 session 状态是 `completed_with_errors`
- Job finalization 写成 `status: failed`
- Dashboard 候选页能看到 79 个候选，但 job 状态容易被理解成整次冷启动不可用

建议：

- 对 UI/API 增加或保留 `completed_with_errors` 作为可展示状态
- Job status 可继续用于机器失败判断，但 summary/status label 应明确 `12/14 dimensions completed, 79 candidates produced`

### P1：compact Jobs API 状态刷新滞后

影响：

- 监控和 Dashboard 会显示 active task/heartbeat stale
- 用户可能误以为 daemon 卡死或尾段没有进展

建议：

- compact summary 刷新应绑定候选落盘、dimension complete、task heartbeat 等事件
- active task 不应只显示旧任务；并发 filling 时至少给出 active task 列表或最近更新时间
- monitor 可增加“API summary stale，但 candidate files/logs 仍在增长”的诊断提示

### P2：成功维度携带 stage_timeout cancel reason

影响：

- `swift-objc-idiom`、`networking-api` 成功完成，但维度 efficiency 中仍带 `stage_timeout`
- 这会污染后续效率统计和失败分析

建议：

- 区分“阶段曾触发 forced summary/timeout nudge”与“最终失败 cancelReason”
- 成功维度的 final cancelReason 应为 null，历史 warning 另列

### P2：预算压缩效果不足

影响：

- `data-event-flow` 在 session `479643/345600` 后进入 SUMMARIZE，`ui-interaction` 在 `590404/345600` 后仍继续 VERIFY
- L1 compact 出现 `removed 0 items`
- 最终总耗时 94 分钟、576 工具调用、569 万 input tokens

建议：

- 在预算超过阈值前强制 summary 或转 partial success
- 调整每维度 search/explore 上限，尤其是 UI/data-flow 这种容易扩散的维度
- L1/L4 压缩如果无法减少上下文，应输出明确诊断并切换策略

### P2：RECORD 阶段仍出现自然语言正文

影响：

- transition nudge 要求 RECORD 阶段只调用 `note_finding`
- `data-event-flow` RECORD 调用有 `hasText: true`、`textChars: 27`
- 这不是本次失败主因，但说明 prompt/tool-choice 约束仍不够硬

建议：

- RECORD 阶段如果出现 text + tool calls，应仅计 warning，不影响成功
- 若需要严格治理，可在 system prompt 或 runtime parser 层忽略文本并记录违规

## 后续建议

建议 Alembic 源仓库优先修复以下闭环：

1. 修复 timeout/abort 后的真实阶段归因和 diagnostics 汇总。
2. 修复失败维度 partial report 落盘，避免 report 清零。
3. 修复 `completed_with_errors` 与 Job `failed` 的 UI/API 表达差异。
4. 调整 compact Jobs API 的状态刷新和 active task 聚合。
5. 对 `data-event-flow`、`ui-interaction` 单独做重跑或 targeted bootstrap，验证修复后是否能从 partial 超时恢复为候选产出。

本次 AlembicTest 未修改 BiliDili 业务代码，未修改 Alembic 产品源码。

