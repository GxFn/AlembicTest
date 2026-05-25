# Dashboard live socket append rich content 最小复测

日期：2026-05-24
执行窗口：AlembicTest
测试单：Test-2026-05-24-03
真实测试项目：BiliDili

## 窗口定位与职责

- 当前窗口定位：`AlembicTest` 独立测试验证窗口。
- 本轮职责：只做 Dashboard Jobs 页面 live socket append rich content 最小复测。
- 明确不做：不修改 BiliDili 源码；不修 Alembic / Dashboard / Agent 产品源码；不扩大为完整 cold-start 回归；不 mock process events。

## 结论

结论：通过。Dashboard live socket append rich content 修复在真实 BiliDili cold-start job 中完成最小复测：late `tool` / `llm.output` / `llm.reflection` 通过同一打开的 Jobs 页面追加可见，未触发 React #31，structured `content.text` 可读。

- 当前 57136 旧 daemon 页面在复测前已经显示 `Minified React error #31`，判定为旧资产 / 旧失败态，不能作为修复后有效复测环境。
- 重启 Alembic 并通过 `dev:link` 重建 Dashboard assets 后，新 daemon `http://127.0.0.1:58264` 打开同一 Jobs 页面不再触发 React #31。
- 新 job 页面能直接展示已有 `llm.input` structured `content.text`，可见 `内容` 区块和 JSON 文本，没有 `[object Object]`。
- 页面保持打开期间先观察到 19 events 基线，随后 events API 从 19 增至 38，包含 `tool=3`、`llm.output=3`、`llm.reflection=4`。
- 未刷新页面后，Dashboard DOM 同步显示 `过程 Timeline 38 事件`，并可见 `kindtool`、`kindllm.output`、`kindllm.reflection` 及对应 rich text。
- console errors 为空，页面无 React #31 / `[object Object]`。

## 环境与版本证据

- AlembicDashboard HEAD：`c1c7a1a4fcd5d724d86734be47ef6fff745b262d`。
- Alembic HEAD：`0176a816cccfd4b89234569cd0f174b45d5bf6b9`。
- 重启命令：`npm --prefix AlembicTest run restart -- --project BiliDili --monitor-once --json`。
- 重启结果：新 daemon `pid=41300`，Dashboard `http://127.0.0.1:58264`，daemon health `version=2.0.0`。
- `dev:link` 证据：重启日志显示 build and copy Dashboard assets，生成 `dist/assets/index-DTUlVHfb.js` 并复制到 `Alembic/dashboard/dist`。
- BiliDili git 状态：`## main...origin/main`，无源码改动。

## Job 信息

- 旧失败态 job：`bootstrap_mpj8tcyc_b1080061`，旧 URL `http://127.0.0.1:57136/jobs?job=bootstrap_mpj8tcyc_b1080061`。
- 新复测 job：`bootstrap_mpja71u9_a069c7d4`。
- sessionId：`bs_1779597151668_9hrcy2`。
- Dashboard URL：`http://127.0.0.1:58264/jobs?job=bootstrap_mpja71u9_a069c7d4`。
- 新 job 请求参数：`maxFiles=24`、`contentMaxLines=80`、`skipGuard=false`。

## Kind counts

打开页面后的基线轮询为 19 events；最终迟到检查为 38 events：

```json
{
  "count": 38,
  "nextSequence": 38,
  "hiddenCount": 0,
  "retainedCount": 38,
  "counts": {
    "workflow": 10,
    "checkpoint": 1,
    "summary": 11,
    "llm.input": 6,
    "tool": 3,
    "llm.output": 3,
    "llm.reflection": 4
  }
}
```

关键 late event：`tool`、`llm.output`、`llm.reflection` 均真实产生并进入 events API。

## Dashboard DOM 证据

同一打开页面最终 DOM 摘要：

```json
{
  "timelineEvents": 38,
  "includesReact31": false,
  "includesObjectObject": false,
  "includesToolKind": true,
  "includesLlmOutputKind": true,
  "includesLlmReflectionKind": true,
  "includesToolText": true,
  "includesOutputText": true,
  "includesReflectionText": true
}
```

可见行为：

- 页面显示 `过程 Timeline 38 事件`。
- `llm.input` 卡片可见 `内容` 区块，structured JSON `content.text` 被渲染成文本。
- late `tool`、`llm.output`、`llm.reflection` 追加后可见 readable text。
- 页面未显示 React #31。

截图 / DOM 证据：

- `AlembicTest/tmp/live-socket-append-rich-content-test-03-2026-05-24/baseline-old-57136-react31.png`
- `AlembicTest/tmp/live-socket-append-rich-content-test-03-2026-05-24/new-job-open.png`
- `AlembicTest/tmp/live-socket-append-rich-content-test-03-2026-05-24/final-no-append.png`
- `AlembicTest/tmp/live-socket-append-rich-content-test-03-2026-05-24/final-no-append.dom.txt`
- `AlembicTest/tmp/live-socket-append-rich-content-test-03-2026-05-24/final-no-append.page.json`
- `AlembicTest/tmp/live-socket-append-rich-content-test-03-2026-05-24/events-final-late-check.json`
- `AlembicTest/tmp/live-socket-append-rich-content-test-03-2026-05-24/success-late-append.png`
- `AlembicTest/tmp/live-socket-append-rich-content-test-03-2026-05-24/success-late-append.dom.txt`
- `AlembicTest/tmp/live-socket-append-rich-content-test-03-2026-05-24/success-late-append.page.json`

## 延迟观察

本轮曾在 12:35-12:39 CST 观察到 events API 和 DOM 暂停在 19 events；同期日志显示 new job 后端正在产生真实 internal AI 活动：

- `combined.log` 04:34:15：`[AgentRuntime] LLM call complete ... dim=ui-interaction ... functionCallNames=["code","graph"]`
- `combined.log` 04:35:12：`[PipelineStrategy] Stage "produce" ... dim=security-auth`
- `combined.log` 04:36:03：`Knowledge entry created`，`Alembic/candidates/security-auth/cookie-userdefaults-plaintext.md`
- `combined.log` 04:38:27：`Knowledge entry created`，`Alembic/candidates/ui-interaction/snapkit-dsl-layout.md`
- `combined.log` 04:39:15：`Knowledge entry created`，`Alembic/candidates/testing-quality/zero-test-targets.md`

最终在 04:41:52 UTC events API 和 Dashboard DOM 均推进到 38 events，说明后续 rich events 不是逐工具实时写入，而是以较粗粒度 / 批量方式刷新到 job events。该延迟不影响本次 Test-03 的通过标准，但建议后续明确实时性预期。


## 验证命令与日志路径

- `git -C AlembicDashboard rev-parse HEAD`
- `git -C Alembic rev-parse HEAD`
- `npm --prefix AlembicTest run restart -- --project BiliDili --monitor-once --json`
- `curl -sS http://127.0.0.1:58264/api/v1/health`
- `curl -sS -X POST -H 'content-type: application/json' -d '{"maxFiles":24,"contentMaxLines":80,"skipGuard":false}' http://127.0.0.1:58264/api/v1/jobs/bootstrap`
- `curl -sS 'http://127.0.0.1:58264/api/v1/jobs/bootstrap_mpja71u9_a069c7d4/events?limit=240'`
- `curl -sS 'http://127.0.0.1:58264/api/v1/jobs/bootstrap_mpja71u9_a069c7d4?compact=true'`
- `git -C BiliDili status --short --branch`

日志 / 原始证据：

- `AlembicTest/tmp/live-socket-append-rich-content-test-03-2026-05-24/combined.log`
- `AlembicTest/tmp/live-socket-append-rich-content-test-03-2026-05-24/daemon.log`
- `AlembicTest/tmp/live-socket-append-rich-content-test-03-2026-05-24/events-poll-01.json`
- `AlembicTest/tmp/live-socket-append-rich-content-test-03-2026-05-24/events-poll-05.json`
- `AlembicTest/tmp/live-socket-append-rich-content-test-03-2026-05-24/events-final-late-check.json`
- `AlembicTest/tmp/live-socket-append-rich-content-test-03-2026-05-24/job-poll-05.json`
- `AlembicTest/tmp/live-socket-append-rich-content-test-03-2026-05-24/success-late-append.page.json`

## 遗留风险

- live append 是迟到批量出现：页面打开后先停在 19 events，随后推进到 38 events；若产品要求逐 tool call 近实时展示，仍需另开实时性专项。
- 旧 57136 daemon 页面能复现 React #31，说明未重启 / 未 dev-link 的旧资产仍会失败；测试前必须保证加载当前 Dashboard build。
- 当前新 job 仍处于 running，且 daemon log 仍可能继续产生 internal AI 活动；本轮未取消 job 或停止 daemon，因为测试单未授权关闭服务。
- 本轮重启会把旧 job `bootstrap_mpj8tcyc_b1080061` 标记为 `DAEMON_SHUTDOWN`，该旧 job 不再作为 Test-03 有效样本。

## 下一步建议

1. 总控可将 `Test-2026-05-24-03` 判定为通过，关闭 live socket append React #31 缺口。
2. 可把“late event 批量延迟刷新 / progress 延迟”作为后续观察或单独 P1/P2 TODO，不阻塞本次 rich content renderer 封口。
3. 后续若继续复测，应先确认 daemon 已加载当前 Dashboard assets，避免旧 57136 页面这种 stale asset 假失败。
