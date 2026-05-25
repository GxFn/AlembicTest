# Test-2026-05-24-02 cold-start process events retest

状态：部分通过，Dashboard live socket append 存在缺口
执行窗口：AlembicTest
执行时间：2026-05-24 11:53-12:03 CST
真实项目：BiliDili

## 结论

本轮在 BiliDili 真实项目上复测 Phase 1E 修复后，producer richness 已经在 live events API 中真实出现：`llm.input`、`tool`、`llm.output`、`llm.reflection` 均有 developer-facing event。REST 刷新恢复、Jobs timeline 滚动、Candidates cold-start 卡片摘要和任务详情入口均有截图或 DOM 证据。

未通过点是 Dashboard live socket append：当 late rich events 通过 socket 追加到已打开 Jobs 页面时，页面出现 React runtime error #31，错误内容指向把 `{ language, mimeType, role, text }` content 对象直接作为 React child 渲染。刷新同一 URL 后，REST recovery 能恢复并正确展示 13 条 timeline，因此缺口归属为 `AlembicDashboard` 的 live socket append / rich content render path，而不是 producer 缺失。

## 运行配置

- Dashboard URL：`http://127.0.0.1:57136`
- jobId：`bootstrap_mpj8tcyc_b1080061`
- sessionId：`bs_1779594833012_jqx3fn`
- project：`BiliDili`
- request：`maxFiles=24`，`contentMaxLines=80`，`skipGuard=false`
- 最终观察状态：`running`，`completed=1/14`，`activeTask=swift-objc-idiom`，`totalToolCalls=34`
- BiliDili git 前后状态：`## main...origin/main`，未改真实项目源码

## 上游版本证据

- AlembicCore：`36429274352a5f75b2aa3eb17eacf63a0986f9f2`
- AlembicAgent：`08f2102f23edbf3f920d2e7bc80a91e6c3c89661`
- Alembic：`0176a816cccfd4b89234569cd0f174b45d5bf6b9`
- AlembicDashboard：`06253df5ccb342225b23d47931b04e605b3bd22c`

## API 证据

最终 events API 摘要见 `../tmp/cold-start-process-timeline-test-02-2026-05-24/api-summary.json`。

kind counts：

| kind | count |
| --- | ---: |
| `workflow` | 6 |
| `checkpoint` | 1 |
| `llm.input` | 2 |
| `tool` | 1 |
| `llm.output` | 1 |
| `llm.reflection` | 1 |
| `summary` | 1 |
| `artifact` | 0 |
| `error` | 0 |

边界观察：

- `hiddenCount=0`，`retainedCount=13`，`count=13`。
- `sourceClassCounts={ "developer-facing": 13 }`。
- `llm.input` 的 `metadata.rawProviderPayload=false`，summary 明确说明 full prompt expansion、file contents、provider payloads 和 secrets 被省略。
- 对 `events-final.json` 扫描 `sk-*`、`sk-proj-*`、`AIza*`、`Bearer ...`、`Authorization:`，命中数均为 0。
- `contentObjectKinds` 显示 `llm.input`、`tool`、`llm.output`、`llm.reflection` 都以结构化 content object 进入 API：`language/mimeType/role/text` 或 `mimeType/role/text`。

## Dashboard 证据

证据目录：`../tmp/cold-start-process-timeline-test-02-2026-05-24/`

- Jobs live timeline 初始证据：`jobs-timeline-live-test-02.png` / `.dom.txt`
- REST recovery 初始证据：`jobs-timeline-rest-recovery-test-02.png` / `.dom.txt`
- Jobs timeline 滚动证据：`jobs-timeline-rich-content-scroll-metrics-test-02.json`
  - `scrollHeight=13747`
  - `clientHeight=591`
  - `scrollTop: 0 -> 1800`
- rich events 可见证据：`jobs-timeline-rich-events-visible-test-02.png`
  - 可见 `tool`、`llm.output`、`llm.reflection`、`summary`
- Candidates cold-start 卡片入口：`candidates-cold-start-card-test-02.png`
  - 卡片显示当前 job、最近关键事件和 `任务详情`
- 任务详情入口：`job-details-entry-test-02.png`
  - 点击 `任务详情` 后进入 `/jobs?job=bootstrap_mpj8tcyc_b1080061`
- socket append 缺口证据：`jobs-timeline-socket-append-test-02.png` / `.dom.txt`
  - 页面出现 `Minified React error #31`
  - 错误文本包含 `object with keys {language, mimeType, role, text}`
- REST rich recovery 证据：`jobs-timeline-rest-rich-recovery-test-02.png` / `.dom.txt`
  - 刷新同一 job URL 后恢复，显示 13 events

## 命令结果

```bash
npm --prefix AlembicTest run restart -- --project BiliDili --monitor-once --json
```

结果：第二次执行成功，Dashboard `http://127.0.0.1:57136`，daemon pid `88256`；第一次预清理已清理旧 state/logs，但旧 pid `81077` 被 SIGKILL 后脚本当下仍判定未退出，因此未继续启动，随后复跑成功。

```bash
npm --prefix AlembicTest run probe:cold-start-timeline -- --project BiliDili --url http://127.0.0.1:57136 --max-files 24 --content-max-lines 80 --timeout-ms 420000 --poll-ms 2500 --output AlembicTest/tmp/cold-start-process-timeline-test-02-2026-05-24/probe.json
```

结果：probe socket/API 基础链路通过，但在 420s 观察窗口结束时只看到 `workflow=6`、`checkpoint=1`、`llm.input=2`；随后最终 events API 在 `04:00:58Z` 追加了 `tool=1`、`llm.output=1`、`llm.reflection=1`、`summary=1`。稳定证据以 `events-final.json` 和 `api-summary.json` 为准。

```bash
curl -sS 'http://127.0.0.1:57136/api/v1/jobs/bootstrap_mpj8tcyc_b1080061/events?limit=240'
curl -sS 'http://127.0.0.1:57136/api/v1/jobs/bootstrap_mpj8tcyc_b1080061?compact=true'
curl -sS 'http://127.0.0.1:57136/api/v1/daemon/health'
```

结果：保存为 `events-final.json`、`job-final.json`、`daemon-health.json`。

## 缺口归属

- `Alembic` / `AlembicAgent` producer：本轮通过。真实 API 已产出 `llm.input`、`tool`、`llm.output`、`llm.reflection`。
- `AlembicDashboard` REST recovery：通过。刷新 job URL 后可以恢复 13 条 rich timeline。
- `AlembicDashboard` Jobs scroll：通过。列表级滚动容器可滚动，rich events 可读。
- `AlembicDashboard` live socket append：未通过。socket late rich event 追加时触发 React #31，疑似 socket append path 没有把 structured `content` 转成前端可渲染节点。
- hidden/raw/secret 边界：本轮未发现泄露；`llm.input` 是 safe projection，不是 raw provider prompt。

## 下一步建议

1. 分派 `AlembicDashboard` 修复 live socket append rich content 渲染，重点检查 socket event append 后的 view-model normalize 是否与 REST recovery 路径一致。
2. 修复后重新运行同一测试单的最小复测：不用扩大范围，只需保留页面打开状态等待 rich events socket append，确认不再 React #31，并截图 `tool` / `llm.output` / `llm.reflection` 直接 live append 可见。
3. 若需要更稳定地等待 rich events，建议增强 `probe:cold-start-timeline`：支持 `--wait-kinds llm.output,tool,llm.reflection` 和 `--grace-ms`，避免 fixed timeout 在 rich events 到达前刚好结束。
