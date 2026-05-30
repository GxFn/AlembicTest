# PCVM Wave 6F Scorecard Stage Authorized Rerun

日期：2026-05-30
窗口：AlembicTest
任务：PCVM-W6F-ALEMBICTEST-SCORECARD-STAGE-PROJECTION-AUTHORIZED-RERUN
结论：partial pass / record_repair report projection still missing

## 窗口定位

AlembicTest 是真实测试验证窗口。本轮只做 BiliDili 真实 / 默认 AI after-run 验证，不修改产品源码，不替总代控验收，不优化 Agent prompt，不做 Dashboard comparison UI。

本轮收到结构化外部 AI 自动运行授权：project `BiliDili`，provider `deepseek`，model `deepseek-v4-pro`，dimensions `architecture`，`maxFiles=500`，`contentMaxLines=120`，`skipGuard=false`，scope 为 PCVM Wave 6F scorecard stage projection rerun only。BiliDili 是 AlembicTest 已登记的开源真实测试项目，因此本轮由 AlembicTest 通过 daemon API 主动触发 cold-start / after-run，并记录本机 API、runtime JSON、report 和日志证据。

## 执行范围

- 目标项目：`/Users/gaoxuefeng/Documents/AlembicWorkspace/BiliDili`
- Dashboard：`http://127.0.0.1:62118/jobs?job=bootstrap_mprv4bby_f3598a3c`
- job id：`bootstrap_mprv4bby_f3598a3c`
- session id：`bs_1780116026927_3v10nz`
- daemon data root：`/Users/gaoxuefeng/.asd/workspaces/02a25032`
- test mode：enabled，bootstrap / rescan dimensions 均为 `architecture`
- request：`maxFiles=500`，`contentMaxLines=120`，`skipGuard=false`
- 结果：job `completed`，duration `888737ms`，1 dimension completed，0 failed，0 cancelled

## Fresh Dist / Runtime Linkage

- Alembic commit：`c3a7690145e72d2d068bd2b0ff4a0e31708540fa`
- AlembicAgent commit：`8375f40e795bf22c412d72563db62769c1eeee63`
- BiliDili commit：`5b10fd4c72ccc8aeda2e9b84289748b7d883d804`
- AlembicTest pre-run commit：`4c44403758960639b0bf3fff222567a3f04a68c5`
- Fresh build：`npm --prefix AlembicAgent run build` 通过。
- Dist scan：`AlembicAgent/dist/agent/runtime/PcvNodeEvidence.js` 与 `AlembicAgent/dist/agent/strategies/PipelineStrategy.js` 命中 `pcvStageNodeMap`、`pcvChainNodes`、`canonicalNodeId`、`chainNodeId`。
- Runtime linkage：`Alembic/node_modules/@alembic/agent/package.json` realpath 指向 `/Users/gaoxuefeng/Documents/AlembicWorkspace/AlembicAgent/package.json`，`main` 为 `dist/index.js`。

## 验证命令

- `npm --prefix AlembicAgent run build`
- `ALEMBIC_TEST_MODE=1 ALEMBIC_TEST_BOOTSTRAP_DIMS=architecture ALEMBIC_TEST_RESCAN_DIMS=architecture node AlembicTest/scripts/restart-alembic.mjs --project BiliDili --json --wait 20000 --stop-wait 8000 --preclean-stop-wait 8000 --no-dev-link`
- 上一条 preclean 将旧 daemon 杀掉后把 `status=killed` 记为 preclean failed，未进入启动阶段；按 AlembicTest 规则使用同配置重跑 `--no-preclean`，启动成功。
- `node AlembicTest/scripts/verify-test-environment.mjs --url http://127.0.0.1:62118 --json`
- `node AlembicTest/scripts/probe-cold-start-process-timeline.mjs --project BiliDili --url http://127.0.0.1:62118 --data-root /Users/gaoxuefeng/.asd/workspaces/02a25032 --max-files 500 --content-max-lines 120 --timeout-ms 1800000 --poll-ms 5000 --output AlembicTest/tmp/pcvm-wave6f-authorized-rerun-timeline.json`
- `curl -sS --max-time 20 http://127.0.0.1:62118/api/v1/jobs/bootstrap_mprv4bby_f3598a3c?compact=false`
- `curl -sS --max-time 20 http://127.0.0.1:62118/api/v1/jobs/bootstrap_mprv4bby_f3598a3c/events?limit=1000`
- `curl -sS --max-time 20 http://127.0.0.1:62118/api/v1/modules/bootstrap/report/latest`
- `curl -sS --max-time 20 http://127.0.0.1:62118/api/v1/modules/bootstrap/reports/bs_1780116026927_3v10nz`

## Runtime Evidence

- Timeline probe：`AlembicTest/tmp/pcvm-wave6f-authorized-rerun-timeline.json`
- Job API：`AlembicTest/tmp/pcvm-wave6f-authorized-rerun-job-full.json`
- Events API：`AlembicTest/tmp/pcvm-wave6f-authorized-rerun-events-full.json`
- Latest report API：`AlembicTest/tmp/pcvm-wave6f-authorized-rerun-report-latest.json`
- Session report API：`AlembicTest/tmp/pcvm-wave6f-authorized-rerun-report-session.json`
- Persisted bootstrap report：`AlembicTest/tmp/pcvm-wave6f-authorized-rerun-bootstrap-report-file.json`
- Persisted session report：`AlembicTest/tmp/pcvm-wave6f-authorized-rerun-bootstrap-report-session-file.json`
- Combined log tail：`AlembicTest/tmp/pcvm-wave6f-authorized-rerun-combined-tail.log`
- Daemon log tail：`AlembicTest/tmp/pcvm-wave6f-authorized-rerun-daemon-tail.log`
- Dashboard screenshot：`AlembicTest/tmp/pcvm-wave6f-authorized-rerun-dashboard.png`
- Dashboard DOM excerpt：`AlembicTest/tmp/pcvm-wave6f-authorized-rerun-dashboard-dom.txt`
- Summary JSON：`AlembicTest/tmp/pcvm-wave6f-authorized-rerun-summary.json`

Probe checks：

- classification：`pass`
- daemon health：success
- events API：available，`/api/v1/jobs/:jobId/events`
- socket：connected，joined notifications，observed matching events
- missing producer kinds：none

Final events：

- developer views：102
- retained：102
- hidden：0
- `workflow`：5
- `checkpoint`：1
- `llm.input`：36
- `llm.reflection`：18
- `llm.output`：36
- `tool`：1
- `summary`：4
- `artifact`：1

Job summary：

- tool calls：38
- duplicate tool calls：0
- token usage：input 726573，output 43278，reasoning 20596，cacheHit 494336
- candidates：8
- project skill delivery receipts：1
- pcv node local evidence dimensions：1
- pcv node local linked / blocked / total：3 / 1 / 4

## Canonical / Legacy Projection

Runtime events term counts：

- `pcvm:n9:analyze`：546
- `pcvm:n9:quality_gate`：16
- `pcvm:n9:record_repair`：16
- `pcvm:n11:produce`：88
- `pcvm:cold-start:n9`：472
- `pcvm:cold-start:n9:quality`：16
- `pcvm:cold-start:n9:repair`：16
- `pcvm:cold-start:n11`：88
- legacy `N9-agent-analyze-quality`：28
- legacy `N11-produce`：0
- legacy `analyze-evidence-grounding-ledger`：0

Latest / session / persisted report term counts：

- `pcvm:n9:analyze`：3
- `pcvm:n9:quality_gate`：3
- `pcvm:n9:record_repair`：0
- `pcvm:n11:produce`：3
- `pcvm:cold-start:n9`：6
- `pcvm:cold-start:n9:quality`：3
- `pcvm:cold-start:n9:repair`：0
- `pcvm:cold-start:n11`：3
- legacy `N9-agent-analyze-quality`：0
- legacy `N11-produce`：0
- legacy `analyze-evidence-grounding-ledger`：0

Report `pcvScorecard`：

- summary：`blockedNodes=1`，`linkedNodes=3`，`nodeCount=4`，`dimensionCount=1`
- `n8`：`nodeId=N8-stage-factory-tool-policy`，`chainNodeId=N8-stage-factory-tool-policy`，`status=linked`
- `groundingLedger`：`nodeId=pcvm:n9:analyze`，`chainNodeId=pcvm:cold-start:n9`，`status=linked`
- `n9QualityGate`：`nodeId=pcvm:n9:quality_gate`，`chainNodeId=pcvm:cold-start:n9:quality`，`status=linked`，`pass=true`
- `n11`：`nodeId=pcvm:n11:produce`，`chainNodeId=pcvm:cold-start:n11`，`status=blocked-by-observability-gap`
- `n9RecordRepair`：not present in latest / session / persisted report

## 结果判断

成功部分：

- 结构化授权后，AlembicTest 可自动触发 BiliDili 真实 after-run，不再阻塞在外部 provider 手动点击门禁。
- fresh Agent dist 与 Alembic runtime dev-link 均已确认，排除 stale dist 风险。
- job 成功完成，events API / socket / Dashboard / report API 全链路可采证。
- runtime events 中 canonical `pcvm:n9:analyze`、`pcvm:n9:quality_gate`、`pcvm:n9:record_repair`、`pcvm:n11:produce` 均出现。
- latest / session / persisted report 已出现 canonical `pcvm:n9:quality_gate`，并继续保留 `pcvm:n9:analyze` 与 `pcvm:n11:produce`。
- report surface 不再被 legacy `N11-produce` 或 `analyze-evidence-grounding-ledger` 覆盖。

未完成部分：

- latest / session / persisted report 仍未出现 `pcvm:n9:record_repair` 或 `pcvm:cold-start:n9:repair`。
- `pcvScorecard.dimensions.architecture` 未包含 `n9RecordRepair` 节点。
- N11 仍因 sourceRef validity 标为 `blocked-by-observability-gap`：28 个 sourceRefs 中 25 个有效，3 个无效，invalid refs 为 `AGENTS.m`、`README.m`、`docs/Architecture.m`。

结论：本轮执行完成，真实 runtime 证明 scorecard stage projection 返修部分生效；`quality_gate` 已进入 report surface。但完整成功条件要求 `record_repair` 同样进入 latest/session/persisted report，本轮仍缺，因此结论是 partial pass / needs controller review。

## 边界

本轮能推出：

- Alembic 提交 `c3a7690145e72d2d068bd2b0ff4a0e31708540fa` 的 scorecard stage projection 返修至少覆盖了 `quality_gate` report projection。
- `record_repair` 从 Agent/runtime events 到 Alembic report projection 的链路仍未完整承接。
- 本轮失败不是 AlembicTest 环境阻塞、不是用户点击门禁、不是 stale Agent dist、不是 external provider 未授权。

本轮不能推出：

- 不能判定 Wave 6F 全绿，因为 `record_repair` report surface 仍缺。
- 不能推出 full cold-start / all dimensions 行为；本轮仅覆盖 `architecture` 单维度。
- 不能推出 Dashboard comparison UI 或其它非本测试单功能。
- N11 sourceRef validity 风险只作为观察项；是否进入后续修复由总控裁决。

## 仓库状态

- Alembic：无 tracked 变更。
- AlembicAgent：无 tracked 变更。
- BiliDili：无 tracked 变更。
- AlembicTest：本报告为新增 tracked 变更；runtime JSON / log / screenshot 证据保存在 ignored `tmp/`。

## 遗留风险与下一步建议

- 风险：真实 AI 输出非确定；不过本轮 runtime events 与 report API 均有完整落盘证据。
- 风险：`record_repair` 是否必须在无 repair 动作时也形成 report-facing node，需要总控和 Alembic 源码窗口裁决；若完整成功条件不变，应继续归口 Alembic report / scorecard projection。
- 风险：N11 invalid sourceRefs 仍会让 N11 scorecard 处于 `blocked-by-observability-gap`，建议单独归口，不与本轮 `record_repair` 投影混为同一缺陷。
- 下一步建议：总控复核本报告和 `AlembicTest/tmp/pcvm-wave6f-authorized-rerun-summary.json` 后，若目标仍要求 `pcvm:n9:record_repair` 进入 latest/session/persisted report，应派 `Alembic` 检查 `InternalDimensionFillFinalizer` / scorecard summarize 是否只在实际 phase result 存在时才投影 repair evidence，或是否需要稳定的 absent-but-canonical report surface。
