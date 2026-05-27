# VAD single-window visible heartbeat validation

日期：2026-05-26
测试单：`Test-2026-05-26-12 / VAD-P4-Single-Window-Visible-Heartbeat-Validation`
执行窗口：`AlembicTest`
目标：`AlembicWorkspace` Visible Automation Dispatch 单窗口可见 heartbeat 验证

## 窗口定位

`AlembicTest` 是独立测试验证窗口。本轮只验证 `visible-dispatch` 本地状态机与 Codex heartbeat automation 的真实可见投递链路，不做产品实现，不修改 Alembic 产品源码，不运行 full cold-start / rescan，不操作 BiliDili 或其它真实项目业务源码。

## 测试结论

未通过，归类为阻塞。

本轮成功验证了本地状态机的 `queued -> armed`、`record-arm` 落账、真实 Codex heartbeat automation 创建、暂停和删除；但临时 heartbeat 在 3 分钟以上观察窗口内没有投递到当前 `AlembicTest` 可见线程执行 `claim`，队列未进入 `claimed` / `completed`，也没有产生 backfill evidence。

失败归口优先为 Codex heartbeat delivery / visible thread routing 或当前测试 harness 的“同一活跃线程等待 automation 投递”限制；不是 `visible-dispatch` queue / record-arm 状态机本身的失败。

## 执行范围

- 使用当前总控计划：`docs/workspace/current/visible-automation-dispatch-wave-4-2026-05-26.md`
- 使用测试交流文档：`docs/workspace/current/alembic-test-exchange.md`
- 使用 runtime state：`.workspace-local/visible-dispatch/`
- 使用 Codex automation id：`vad-p4-alembictest-heartbeat`
- 未启动 Alembic daemon / Dashboard。
- 未运行 full cold-start / rescan。
- 未修改 `Alembic`、`AlembicCore`、`AlembicAgent`、`AlembicDashboard`、`AlembicPlugin` 或 `BiliDili`。

## 使用配置

- `stateDir`: `.workspace-local/visible-dispatch`
- `mode`: `enabled` during arm, then `disabled` during cleanup
- target window: `AlembicTest`
- task id: `visible-automation-dispatch-wave-4-2026-05-26__AlembicTest`
- heartbeat kind: `heartbeat`
- heartbeat destination: current thread
- heartbeat rrule: `FREQ=MINUTELY;INTERVAL=1`
- heartbeat status: `ACTIVE -> PAUSED -> deleted`
- heartbeat config evidence: `$CODEX_HOME/automations/vad-p4-alembictest-heartbeat/automation.toml` existed with `kind=heartbeat`, `status=ACTIVE`, and a real `target_thread_id`; the thread id is intentionally not copied into this long-term report.
- JSON evidence: `AlembicTest/tmp/vad-single-window-visible-heartbeat-validation-2026-05-26.json`

## 状态变化

| 状态 | 结果 | 证据摘要 |
| --- | --- | --- |
| `queued` | 发生 | `enqueue --from-plan --write --json` created 1 task for `AlembicTest` at `2026-05-25T16:16:08.112Z`. |
| `armed` | 发生 | `record-arm` wrote automation id `vad-p4-alembictest-heartbeat` at `2026-05-25T16:16:29.819Z`; `armLeaseUntil=2026-05-25T16:26:29.819Z`. |
| `claimed` | 未发生 | 00:17、00:18、00:20 CST 多轮 `tick/status/queue` 均显示 task 仍为 `armed`，无 `automationClaimedAt`。 |
| `completed` | 未发生 | task 无 `completedAt`，无 backfill。 |

## 命令与 JSON 摘要

关键命令：

```text
node scripts/visible-dispatch.mjs mode --enable --write --reason Test-2026-05-26-12 --json
node scripts/visible-dispatch.mjs register --window AlembicTest --thread current-codex-thread --cwd <workspace> --source Test-2026-05-26-12 --write --json
node scripts/visible-dispatch.mjs enqueue --from-plan --plan docs/workspace/current/visible-automation-dispatch-wave-4-2026-05-26.md --write --json
node scripts/visible-dispatch.mjs tick --json
node scripts/visible-dispatch.mjs arm --task visible-automation-dispatch-wave-4-2026-05-26__AlembicTest --json
codex_app.automation_update create heartbeat vad-p4-alembictest-heartbeat
node scripts/visible-dispatch.mjs record-arm --task visible-automation-dispatch-wave-4-2026-05-26__AlembicTest --automation-id vad-p4-alembictest-heartbeat --automation-status ACTIVE --lease-minutes 10 --write --json
codex_app.automation_update update status=PAUSED vad-p4-alembictest-heartbeat
codex_app.automation_update delete vad-p4-alembictest-heartbeat
node scripts/visible-dispatch.mjs mode --disable --write --reason Test-2026-05-26-12-cleanup --json
node scripts/visible-dispatch.mjs cleanup --json
```

`tick` before arming:

```json
{
  "mode": "enabled",
  "topAction": "arm",
  "waitCounts": { "ready": 1 },
  "actionCounts": { "arm": 1 },
  "tasks": [{ "status": "queued", "nextAction": "arm" }]
}
```

`tick` after `record-arm`:

```json
{
  "mode": "enabled",
  "topAction": "wait",
  "waitCounts": { "waiting": 1 },
  "actionCounts": { "waitForClaim": 1 },
  "tasks": [{ "status": "armed", "automationId": "vad-p4-alembictest-heartbeat" }]
}
```

final observed `status`:

```json
{
  "mode": "disabled",
  "loopEnabled": false,
  "registeredWindows": 1,
  "taskCounts": { "armed": 1 },
  "automationRuns": 1
}
```

`cleanup` after deleting the real automation:

```json
{
  "mode": "disabled",
  "shouldStop": true,
  "staleTasks": [],
  "activeAutomationRuns": [
    {
      "taskId": "visible-automation-dispatch-wave-4-2026-05-26__AlembicTest",
      "automationId": "vad-p4-alembictest-heartbeat"
    }
  ],
  "automationRuns": 1
}
```

说明：`cleanup --json` 仍列出本地 `automation-runs.json` 中的 active run，因为脚本当前没有 `record-stop` / `mark-stopped` 命令；真实 Codex automation 已删除，`$CODEX_HOME/automations/vad-p4-alembictest-heartbeat/automation.toml` 不存在。

## 真实项目 git 状态

以下真实项目 / 产品仓库在测试后均为 clean：

- `BiliDili`
- `Alembic`
- `AlembicCore`
- `AlembicAgent`
- `AlembicDashboard`
- `AlembicPlugin`

`AlembicWorkspace` 本轮只写入 ignored runtime state `.workspace-local/visible-dispatch/` 和按总控要求回填文档；该 runtime state 已由 `.gitignore` 忽略。`AlembicTest` 新增本报告和临时 JSON evidence；其它既有未提交测试资产为历史状态，本轮未回退。

## 遗留风险

- 真实 heartbeat 没有在观察窗口内投递到当前可见线程，无法证明 visible dispatch 的核心用户目标已经闭环。
- 同一 Codex 线程在当前 assistant turn 活跃时，heartbeat automation 可能不会并发插入可见消息；需要由总控确认 automation 调度机制是否要求当前 turn 结束后才触发。
- `visible-dispatch` 缺少 `record-stop` / `mark-stopped` 命令，导致真实 automation 已删除后，本地 cleanup 仍报告 active automation run，增加验收判断噪音。
- 脚本 `register --thread` 目前依赖手工 thread 标识；实际 `codex_app.automation_update` 能写入真实 `target_thread_id`，但脚本账本没有自动同步该真实 id。

## 下一步建议

- 由 `AlembicWorkspace` 总控或 VAD 实现窗口补一轮最小修复 / 设计判断：明确 heartbeat 是否能在活跃 turn 中投递；若不能，应把 visible dispatch 触发模型改为“当前 turn 结束后 heartbeat 接棒”或改用可显式触发的通道。
- 为 `visible-dispatch.mjs` 增加 `record-stop --automation-id --write` 或 `cleanup --write` 的 stopped 标记能力，让真实删除后的本地状态不再误报 active run。
- 下一轮复测应先创建 heartbeat、结束当前响应或使用一个独立可见目标线程，再验证 `claimed` / `completed` 是否出现；不要把手工 `claim` 当作 heartbeat 成功。
