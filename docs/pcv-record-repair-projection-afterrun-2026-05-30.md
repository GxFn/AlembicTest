# PCVM Wave 6F Record Repair Projection After-Run

日期：2026-05-30
窗口：AlembicTest
任务：PCVM-W6F-ALEMBICTEST-RECORD-REPAIR-PROJECTION-AFTER-RUN
结论：pass / record_repair report projection present

## 窗口定位

AlembicTest 是真实测试验证窗口。本轮只做 BiliDili 真实 / 默认 AI after-run 复测，不修改 Alembic 产品源码，不修改 BiliDili 业务源码，不替总代控验收。

本轮收到结构化外部 AI 自动运行授权：project `BiliDili`，provider `deepseek`，model `deepseek-v4-pro`，dimensions `architecture`，`maxFiles=500`，`contentMaxLines=120`，`skipGuard=false`，scope 为 PCVM Wave 6F record_repair report projection after-run only。BiliDili 是 AlembicTest 已登记的开源真实测试项目，因此本轮由 AlembicTest 通过 daemon API 主动触发 after-run，并记录本机 API、runtime JSON、report 和日志证据。

## 执行范围

- 目标项目：BiliDili Ghost workspace
- Dashboard：`http://127.0.0.1:63588/jobs?job=bootstrap_mprx8joc_ea1bd248`
- job id：`bootstrap_mprx8joc_ea1bd248`
- session id：`bs_1780119583428_0fphgd`
- daemon data root：`~/.asd/workspaces/02a25032`
- test mode：enabled，bootstrap / rescan dimensions 均为 `architecture`
- request：`maxFiles=500`，`contentMaxLines=120`，`skipGuard=false`
- 结果：job `completed`，duration `640935ms`，1 dimension completed，0 failed，0 cancelled

## Build / Runtime Linkage

- Alembic commit：`a6155533b702e82a2e01d8cbfa69b261926fc0b8`
- AlembicAgent commit：`8375f40e795bf22c412d72563db62769c1eeee63`
- BiliDili commit：`5b10fd4c72ccc8aeda2e9b84289748b7d883d804`
- AlembicTest pre-run commit：`feab36ac198d2e217e6f772af5618f10bac6ff3b`
- `restart-alembic.mjs` 本轮默认执行 `npm run dev:link`，包含 AlembicCore build、AlembicAgent build、Alembic package build、Dashboard assets build 和 global dev install。
- Runtime linkage：`Alembic/node_modules/@alembic/agent/package.json` realpath 指向同级 `AlembicAgent/package.json`，`main` 为 `dist/index.js`。
- Dist proof：`Alembic/dist/lib/workflows/capabilities/execution/internal-agent/BootstrapPcvNodeLocalEvidence.js`、`BootstrapConsumers.js`、`InternalDimensionFillFinalizer.js` 命中 `record_repair` / `n9RecordRepair`；`AlembicAgent/dist` 继续命中 runtime PCV identity 字段。

## 验证命令

- `ALEMBIC_TEST_MODE=1 ALEMBIC_TEST_BOOTSTRAP_DIMS=architecture ALEMBIC_TEST_RESCAN_DIMS=architecture node AlembicTest/scripts/restart-alembic.mjs --project BiliDili --json --wait 20000 --stop-wait 8000 --preclean-stop-wait 8000`
- 上一条 preclean 将旧 daemon 杀掉后把 `status=killed` 记为 preclean failed，未进入启动阶段；按 AlembicTest 已验证路线使用同配置重跑 `--no-preclean`，并完成 dev-link 与新 daemon 启动。
- `node AlembicTest/scripts/verify-test-environment.mjs --url http://127.0.0.1:63588 --json`
- `node AlembicTest/scripts/probe-cold-start-process-timeline.mjs --project BiliDili --url http://127.0.0.1:63588 --data-root ~/.asd/workspaces/02a25032 --max-files 500 --content-max-lines 120 --timeout-ms 1800000 --poll-ms 5000 --output AlembicTest/tmp/pcvm-wave6f-record-repair-afterrun-timeline.json`
- `curl -sS --max-time 20 http://127.0.0.1:63588/api/v1/jobs/bootstrap_mprx8joc_ea1bd248?compact=false`
- `curl -sS --max-time 20 http://127.0.0.1:63588/api/v1/jobs/bootstrap_mprx8joc_ea1bd248/events?limit=1000`
- `curl -sS --max-time 20 http://127.0.0.1:63588/api/v1/modules/bootstrap/report/latest`
- `curl -sS --max-time 20 http://127.0.0.1:63588/api/v1/modules/bootstrap/reports/bs_1780119583428_0fphgd`

## Evidence Paths

- Timeline probe：`AlembicTest/tmp/pcvm-wave6f-record-repair-afterrun-timeline.json`
- Summary JSON：`AlembicTest/tmp/pcvm-wave6f-record-repair-afterrun-summary.json`
- Runtime linkage：`AlembicTest/tmp/pcvm-wave6f-record-repair-afterrun-runtime-linkage.json`
- Dist proof：`AlembicTest/tmp/pcvm-wave6f-record-repair-afterrun-dist-proof.txt`
- Job API：`AlembicTest/tmp/pcvm-wave6f-record-repair-afterrun-job-full.json`
- Events API：`AlembicTest/tmp/pcvm-wave6f-record-repair-afterrun-events-full.json`
- Latest report API：`AlembicTest/tmp/pcvm-wave6f-record-repair-afterrun-report-latest.json`
- Session report API：`AlembicTest/tmp/pcvm-wave6f-record-repair-afterrun-report-session.json`
- Persisted bootstrap report：`AlembicTest/tmp/pcvm-wave6f-record-repair-afterrun-bootstrap-report-file.json`
- Persisted session report：`AlembicTest/tmp/pcvm-wave6f-record-repair-afterrun-bootstrap-report-session-file.json`
- Combined log tail：`AlembicTest/tmp/pcvm-wave6f-record-repair-afterrun-combined-tail.log`
- Daemon log tail：`AlembicTest/tmp/pcvm-wave6f-record-repair-afterrun-daemon-tail.log`
- Dashboard DOM excerpt：`AlembicTest/tmp/pcvm-wave6f-record-repair-afterrun-dashboard-dom.txt`

说明：Codex in-app browser 已打开具体 job 页面。截图尝试两次因 CDP screenshot timeout 未落图，因此本轮保留 Dashboard DOM、API、report 和日志证据；不把截图 timeout 归为产品失败。

## Runtime Evidence

Probe checks：

- classification：`pass`
- daemon health：success
- events API：available，`/api/v1/jobs/:jobId/events`
- socket：connected，joined notifications，observed matching events
- missing producer kinds：none

Final events：

- developer views：83
- retained：83
- hidden：0
- `workflow`：5
- `checkpoint`：1
- `llm.input`：30
- `llm.reflection`：11
- `llm.output`：30
- `tool`：1
- `summary`：4
- `artifact`：1

Job summary：

- tool calls：61
- duplicate tool calls：1
- token usage：input 543996，output 34422，reasoning 13330，cacheHit 335616
- candidates：9
- project skill delivery receipts：1
- pcv node local evidence dimensions：1
- pcv node local linked / blocked / total：3 / 1 / 5

## Canonical / Legacy Projection

Runtime events term counts：

- `pcvm:n9:analyze`：576
- `pcvm:n9:quality_gate`：16
- `pcvm:n9:record_repair`：16
- `pcvm:n11:produce`：44
- `pcvm:cold-start:n9`：496
- `pcvm:cold-start:n9:quality`：16
- `pcvm:cold-start:n9:repair`：16
- `pcvm:cold-start:n11`：44
- legacy `N9-agent-analyze-quality`：28
- legacy `N11-produce`：0
- legacy `analyze-evidence-grounding-ledger`：0

Latest / session / persisted report term counts are identical：

- `n9RecordRepair`：3
- `pcvm:n9:analyze`：3
- `pcvm:n9:quality_gate`：3
- `pcvm:n9:record_repair`：3
- `pcvm:n11:produce`：3
- `pcvm:cold-start:n9`：9
- `pcvm:cold-start:n9:quality`：3
- `pcvm:cold-start:n9:repair`：3
- `pcvm:cold-start:n11`：3
- legacy `N9-agent-analyze-quality`：0
- legacy `N11-produce`：0
- legacy `analyze-evidence-grounding-ledger`：0

Report `pcvScorecard`：

- summary：`blockedNodes=1`，`linkedNodes=3`，`nodeCount=5`，`dimensionCount=1`
- `groundingLedger`：`nodeId=pcvm:n9:analyze`，`chainNodeId=pcvm:cold-start:n9`，`status=linked`
- `n9QualityGate`：`nodeId=pcvm:n9:quality_gate`，`chainNodeId=pcvm:cold-start:n9:quality`，`status=linked`，`pass=true`
- `n9RecordRepair`：`nodeId=pcvm:n9:record_repair`，`chainNodeId=pcvm:cold-start:n9:repair`，`status=not-applicable`，`phasePresent=false`
- `n11`：`nodeId=pcvm:n11:produce`，`chainNodeId=pcvm:cold-start:n11`，`status=blocked-by-observability-gap`

解释：本轮没有真实 record repair phase 需要执行，因此 `n9RecordRepair.status=not-applicable`，但 report surface 已稳定保留 canonical `nodeId` / `chainNodeId` 和 `n9RecordRepair` 字段，满足本轮“record_repair projection after-run”验证目标。

## Result Judgment

成功部分：

- Alembic `a6155533b702e82a2e01d8cbfa69b261926fc0b8` after-run 成功完成。
- fresh build / dev-link / runtime linkage 均已确认。
- runtime events 继续出现 canonical `pcvm:n9:analyze`、`pcvm:n9:quality_gate`、`pcvm:n9:record_repair`、`pcvm:n11:produce`。
- latest report API、session report、persisted bootstrap report 和 persisted session report 均出现 `n9RecordRepair` / `pcvm:n9:record_repair` / `pcvm:cold-start:n9:repair`。
- `pcvm:n9:analyze`、`pcvm:n9:quality_gate`、`pcvm:n11:produce` 未回退。
- legacy `N11-produce` 与 `analyze-evidence-grounding-ledger` 没有覆盖 canonical identity。

仍保留的观察项：

- N11 仍因 sourceRef validity 标为 `blocked-by-observability-gap`：44 个 sourceRefs 中 37 个有效，7 个无效。invalid refs 包含 `README.m`、`AGENTS.m`、`docs/LaunchFlow.m` 和若干 `Sources/Core/ServiceKit/*` 路径。这是既有 N11 sourceRef grounding 风险，不属于本轮 record_repair projection 成败。
- compact progress 在运行期间仍只显示 `filling`，但 events / socket / final report 完整；这是 progress projection 可读性观察项，不影响本轮 report projection 结论。

## Boundary

本轮能推出：

- Wave 6F `record_repair` report projection 缺口已在 BiliDili architecture 真实 after-run 中关闭。
- 失败不再归因到 stale dist、AlembicTest 环境、外部 provider 授权、Dashboard 手动点击门禁或 report API 缺证。
- 若总控接受 `not-applicable` 作为“无 repair phase 也保留 report-facing canonical identity”的正确语义，则本轮可进入 Wave 6F 收束。

本轮不能推出：

- 不能推出 full cold-start、全维度、全 N0-N14 或真实 AI 输出稳定。
- 不能推出 Dashboard comparison UI 行为。
- 不能推出 N11 sourceRef validity 已修复；该风险需单独归口。

## Repo Status

- Alembic：无 tracked 变更。
- AlembicAgent：无 tracked 变更。
- AlembicDashboard：无 tracked 变更。
- BiliDili：无 tracked 变更。
- AlembicTest：本报告为新增 tracked 变更；runtime JSON / log / DOM 证据保存在 ignored `tmp/`。

## Risks And Next Steps

- 风险：真实 AI 输出非确定；不过本轮 runtime events 与 report API 均有完整落盘证据。
- 风险：N11 invalid sourceRefs 仍会让 N11 scorecard 处于 `blocked-by-observability-gap`，建议作为独立 N11 sourceRef grounding 后续项处理。
- 下一步建议：总控复核本报告和 `AlembicTest/tmp/pcvm-wave6f-record-repair-afterrun-summary.json`。若接受 `n9RecordRepair.status=not-applicable` 的语义，Wave 6F record_repair projection 可判通过；无需继续派 AlembicTest 或 AlembicAgent。
