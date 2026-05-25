# LLM Output Completeness Test Mode Report

日期：2026-05-24
执行窗口：AlembicTest
测试单：Test-2026-05-24-08 / LOTB-P2-Output-Completeness-TestMode
真实项目：BiliDili

## 结论

核心修复验证通过，另有两个遗留缺口需要归口。

- 通过：真实 test mode job 中 `llm.output` developerView 已包含 `visibleTextChars`、`outputCompleteness`、`finishReason`、`reasoningContentOmitted`、`contentTruncated`、`contentOriginalChars`、`contentRetainedChars` 等关键 metadata。
- 通过：Dashboard Jobs Timeline live 页面可以展示“可见输出 / Reasoning 已省略 / 结束原因 / Alembic 已截断”，短 visible output 不再只能被理解成无声截断。
- 通过：hidden reasoning 未进入 `content.text` 或 DOM；API 中 reasoning tokens 仍为 `[redacted-secret]`，Dashboard 只展示省略提示。
- 通过：真实事件自然触发 Alembic bridge 截断：`contentTruncated=true`、`contentOriginalChars=11005`、`contentRetainedChars=6000`、`contentTruncationSource=alembic-process-event-bridge`；Dashboard 同步显示 `Alembic 已截断: 6000 字 / 11005 字`。
- 未自然触发：provider `finishReason=length`。本轮只在 Dashboard contract test / source contract 中确认 `finishReason`、`providerOutputTruncated` 与 `contentTruncated` 展示路径仍被覆盖。
- 遗留缺口：daemon 重启恢复后，旧 job 的 process events API 返回 0 条，说明 process events REST recovery 仍有持久化缺口；运行中 job status/progress 长时间停在 `filling/0%`，虽然 events API 持续增长。

## 执行范围

- 只操作 AlembicTest 测试脚本、BiliDili 项目的 Alembic daemon / Dashboard、Workspace 回填文档。
- 未修改 BiliDili 源码。
- 未修改 Alembic / AlembicAgent / AlembicDashboard 产品源码。
- 二次 test mode job 在输出完整性证据覆盖后主动取消，避免继续跑完整 cold-start。

## 使用配置

- Dashboard URL：`http://127.0.0.1:60559/jobs?job=bootstrap_mpjspdvu_23e95d13`
- Test mode：`ALEMBIC_TEST_MODE=1`
- 维度过滤：`ALEMBIC_TEST_BOOTSTRAP_DIMS=architecture`
- 二次 job 请求：`maxFiles=4`、`contentMaxLines=25`、`skipGuard=true`
- Health / test mode API：`/api/v1/daemon/health`、`/api/v1/modules/test-mode`

## Job 记录

首次 job：

- job id：`bootstrap_mpjsgko1_86455289`
- session id：`bs_1779627828685_mpe0kj`
- Dashboard URL：`http://127.0.0.1:58372/jobs?job=bootstrap_mpjsgko1_86455289`
- 结果：中途采集到 live `llm.output` 后，为恢复 Dashboard/API 启动同项目 daemon；旧 job 最终被标记为 `failed`，错误为 `DAEMON_SHUTDOWN`。
- 证据：`AlembicTest/tmp/lotb-p2-log-summary-bootstrap_mpjsgko1_86455289.json`、`AlembicTest/tmp/lotb-p2-live-llm-output-bootstrap_mpjsgko1_86455289.png`、`AlembicTest/tmp/lotb-p2-recovered-failed-job-bootstrap_mpjsgko1_86455289.png`。

二次 job：

- job id：`bootstrap_mpjspdvu_23e95d13`
- session id：`bs_1779628239822_8c4uxa`
- Dashboard URL：`http://127.0.0.1:60559/jobs?job=bootstrap_mpjspdvu_23e95d13`
- 最终状态：`cancelled`
- 取消原因：`LOTB-P2 evidence captured; stop minimal test-mode rerun`
- 取消时间：`2026-05-24T13:20:04.261Z`
- 说明：取消前已进入 produce 阶段并覆盖本测试单要求的 output completeness 证据。

## API 证据摘要

最终 events API 摘要见 `AlembicTest/tmp/lotb-p2-events-summary-bootstrap_mpjspdvu_23e95d13.json`：

- event 总数：72
- kind counts：`workflow=6`、`checkpoint=1`、`llm.input=27`、`llm.output=25`、`llm.reflection=11`、`summary=2`
- 短输出示例：sequence 10，`summary=Received 480 visible character(s)`，`visibleTextChars=480`，`outputCompleteness=visible_text_complete`，`contentTruncated=false`，`finishReason=stop`
- tool-call-only 示例：sequence 13，`visibleTextChars=0`，`outputCompleteness=tool_call_only`，`finishReason=tool_calls`，`reasoningContentOmitted=true`，`contentTruncated=false`
- hidden reasoning 示例：sequence 16，`visibleTextChars=45`，`reasoningContentOmitted=true`，`reasoningContentChars=1037`，`contentTruncated=false`
- Alembic bridge 截断示例：sequence 57，`visibleTextChars=11005`，`contentTruncated=true`，`contentOriginalChars=11005`，`contentRetainedChars=6000`，`contentTruncatedChars=5005`，`contentTruncationLimit=6000`，`contentTruncationSource=alembic-process-event-bridge`
- Provider 截断：未自然触发；最终事件中 `providerOutputTruncated=false`，`finishReason` 只出现 `stop` / `tool_calls`

## Dashboard / DOM 证据

live DOM 证据见：

- `AlembicTest/tmp/lotb-p2-dom-bootstrap_mpjspdvu_23e95d13.txt`
- `AlembicTest/tmp/lotb-p2-dom-final-bootstrap_mpjspdvu_23e95d13.txt`

关键 DOM 摘要：

```text
LLM output received
Received 480 visible character(s)
输出完整性:
可见输出: 480 字
结束原因: stop

LLM output received
Received 1 tool call(s) without visible text
输出完整性:
可见输出: 0 字
Reasoning 已省略: 142 字
结束原因: tool_calls

LLM output received
Received 11005 visible character(s)
输出完整性:
可见输出: 11005 字
结束原因: stop
Alembic 已截断: 6000 字 / 11005 字
```

截图证据：

- `AlembicTest/tmp/lotb-p2-live-bootstrap_mpjspdvu_23e95d13.png`
- `AlembicTest/tmp/lotb-p2-final-bootstrap_mpjspdvu_23e95d13.png`

Browser console error 读取结果：`[]`，未观察到 React #31 或其它前端 console error。

## Hidden / Raw / Secret 边界

- `content.text` 中只出现 developer-visible 文本或 tool-call fallback；未出现 raw hidden reasoning。
- API summary 中 `reasoningTokens` 为 `[redacted-secret]`。
- Dashboard DOM 只显示 `Reasoning 已省略` 及字符数，不显示 reasoning 原文。
- 受控读取未发现 `raw provider payload` 或 secret 进入截图 / DOM。

## REST / Socket 观察

- live 页面在不手动刷新详情页的情况下追加显示 `llm.output` 输出完整性提示，证明 socket append 路径能消费相同 metadata。
- 同一 job 的 REST events API 最终返回 72 条事件，并包含与 DOM 相同的短输出、hidden reasoning omission 和 bridge truncation metadata。
- 缺口：首次 job 通过 daemon 恢复后，旧 job events API 返回 0 条，说明 process events 尚未跨 daemon restart 持久恢复；这不阻塞本轮 output completeness UI 验证，但需要归口到 Alembic events persistence / recovery。

## 受控验证

命令：`npm --prefix AlembicDashboard run test`

结果：通过，11 个 Dashboard contract tests 全部 pass。

补充证据：

- `AlembicDashboard/scripts/dashboard-contract.test.mjs` 覆盖 `getLlmOutputCompletenessHints`、`visibleTextChars`、`reasoningContentOmitted`、`finishReason`、`providerOutputTruncated`、`contentTruncated` 和 `aria-label={text.outputCompleteness}`。
- `AlembicDashboard/src/utils/jobProcessEvents.ts` 会在 `finishReason` 表明 provider length 时把 provider 截断提示标为 warning；当 `contentTruncated=true` 时显示 `Alembic 已截断`。

## Git 状态

- BiliDili：`git status --short` 干净。
- Alembic：`git status --short` 干净。
- AlembicAgent：`git status --short` 干净。
- AlembicDashboard：`git status --short` 干净。
- AlembicTest：测试前已有未提交改动和历史未跟踪测试文档 / 脚本；本轮新增本报告和 `AlembicTest/tmp/lotb-p2-*` 证据文件。`tmp/` 不进入 git status。
- 提交 hash：无。本轮为测试验证与文档回填，未提交代码。

## 验证命令

- `npm --prefix AlembicTest run restart -- --project BiliDili --json --wait 12000`
- `curl http://127.0.0.1:60559/api/v1/modules/test-mode`
- `curl -X POST http://127.0.0.1:60559/api/v1/jobs/bootstrap`
- `curl http://127.0.0.1:60559/api/v1/jobs/bootstrap_mpjspdvu_23e95d13/events?limit=500`
- `curl http://127.0.0.1:60559/api/v1/jobs/bootstrap_mpjspdvu_23e95d13`
- `curl -X POST http://127.0.0.1:60559/api/v1/jobs/bootstrap_mpjspdvu_23e95d13/cancel`
- `npm --prefix AlembicDashboard run test`
- `git -C BiliDili status --short`
- `git -C Alembic status --short`
- `git -C AlembicAgent status --short`
- `git -C AlembicDashboard status --short`
- `git -C AlembicTest status --short`

## 遗留风险

- Provider `finishReason=length` 未自然出现，本轮不能证明真实 provider length 场景；需要后续提供可控 provider fixture 或专用 test job。
- daemon restart 后旧 job events API 返回 0 条，REST recovery 对 process events 仍有缺口。
- 运行中 job status/progress 长时间停在 `filling/0%`，与 events API 持续增长不一致。
- 二次 job 是主动取消，不作为完整 cold-start 成功证据；本报告只证明 LOTB 输出完整性展示链路。

## 下一步建议

- `Alembic` 归口补 process events 持久化 / restart recovery，至少保证 job restart 后能恢复 retained process events。
- `Alembic` 或 `AlembicAgent` 提供 provider length 可控测试入口，避免依赖自然触发。
- 后续如要验收完整 cold-start 成功，应另开完整 job lifecycle 测试，不与本轮 LOTB 最小复测混合。
