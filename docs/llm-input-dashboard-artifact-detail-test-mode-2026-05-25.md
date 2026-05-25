# LLM Input Dashboard Artifact Detail Test Mode - 2026-05-25

测试单：`Test-2026-05-25-08 / LLMI-P9-Dashboard-Artifact-Detail-TestMode`
执行窗口：`AlembicTest`
执行时间：2026-05-25 16:09 CST

## 结论

通过。`AlembicTest` 使用最小 test-mode fixture 验证了 Dashboard 对 `llm.input` / `llm.output` process event `artifactRefs` 的真实 UI/API 消费闭环：Timeline 主列表只展示 projection / summary，详情侧栏按 artifact endpoint 读取完整 redacted artifact，并显示 `llmMetrics`、`traceEnvelope`、artifact metadata、loading / success / 404 / no artifactRef 状态。fixture secret 与 provider-only marker 未出现在 Timeline、详情 DOM 或 artifact API 内容中。

## 执行范围

- 只使用 `ALEMBIC_TEST_MODE=1`、AlembicTest fixture API、临时 Dashboard Vite server 和 headless Chrome DOM 自动化。
- 未跑 full cold-start / rescan，未启动真实 daemon 长任务，未操作 BiliDili。
- 未修改 `Alembic`、`AlembicDashboard`、`AlembicAgent`、`AlembicPlugin`、`AlembicCore` 产品源码。
- 新增 AlembicTest probe：`AlembicTest/scripts/probe-dashboard-artifact-detail.mjs`。

## 配置

- `ALEMBIC_TEST_MODE=1`
- `Alembic` commit：`aa5419434d51aa4d944c3614ecebd8aff47a009f`
- `AlembicDashboard` commit：`30b376cd3b5539d3fac0db2e019c4136bb98212d`
- Node：`v22.22.1`
- Headless Chrome：`Google Chrome 148.0.7778.179`
- fixture job id：`llmi-p9-dashboard-artifact-fixture`
- fixture session id：`session-llmi-p9-dashboard-fixture`
- 临时 Dashboard URL：`http://127.0.0.1:53163/jobs?job=llmi-p9-dashboard-artifact-fixture`
- fixture API URL：`http://127.0.0.1:53162`

## 验证命令

```bash
node --check AlembicTest/scripts/probe-dashboard-artifact-detail.mjs
node AlembicTest/scripts/probe-dashboard-artifact-detail.mjs --help
npm --prefix AlembicTest run check
ALEMBIC_TEST_MODE=1 node AlembicTest/scripts/probe-dashboard-artifact-detail.mjs
```

结果：

- `node --check ...`：通过。
- `node ... --help`：通过。
- `npm --prefix AlembicTest run check`：通过，包含新 probe help。
- `ALEMBIC_TEST_MODE=1 node ...`：通过，输出 `result=PASS`、`failedAssertions=[]`。
- probe 内部运行 `npm run test` 于 `AlembicDashboard`：通过，`12/12` tests passed。

## 证据

JSON 汇总：

- `AlembicTest/tmp/llm-input-dashboard-artifact-detail-test-mode.json`

Dashboard DOM / 截图：

- Timeline projection 文本：`AlembicTest/tmp/llm-input-dashboard-artifact-detail-test-mode/dashboard-artifact-detail-timeline.txt`
- input artifact success DOM：`AlembicTest/tmp/llm-input-dashboard-artifact-detail-test-mode/dashboard-artifact-detail-success.txt`
- input artifact success HTML：`AlembicTest/tmp/llm-input-dashboard-artifact-detail-test-mode/dashboard-artifact-detail-success.html`
- loading 截图：`AlembicTest/tmp/llm-input-dashboard-artifact-detail-test-mode/dashboard-artifact-detail-loading.png`
- input success 截图：`AlembicTest/tmp/llm-input-dashboard-artifact-detail-test-mode/dashboard-artifact-detail-success.png`
- output success 截图：`AlembicTest/tmp/llm-input-dashboard-artifact-detail-test-mode/dashboard-artifact-detail-output-success.png`
- 404 / failure 截图：`AlembicTest/tmp/llm-input-dashboard-artifact-detail-test-mode/dashboard-artifact-detail-error.png`
- no artifactRef 截图：`AlembicTest/tmp/llm-input-dashboard-artifact-detail-test-mode/dashboard-artifact-detail-empty.png`

API 请求摘要：

- `/api/v1/jobs?limit=100&compact=true`：2 次。
- `/api/v1/jobs/llmi-p9-dashboard-artifact-fixture/events?limit=120`：2 次，返回 4 个 developer views，含 `llm.input`、`llm.output`、missing artifact fixture 和 no artifactRef fixture。
- `/api/v1/jobs/llmi-p9-dashboard-artifact-fixture/artifacts/llm-input-full-redacted.md`：读取成功。
- `/api/v1/jobs/llmi-p9-dashboard-artifact-fixture/artifacts/llm-output-full-redacted.md`：读取成功。
- `/api/v1/jobs/llmi-p9-dashboard-artifact-fixture/artifacts/missing-artifact.md`：返回 404，Dashboard 展示可读错误。

关键断言全部通过：

- `timelineProjectionVisible=true`
- `fullArtifactAbsentFromTimeline=true`
- `fullArtifactVisibleInDetail=true`
- `outputArtifactVisibleInDetail=true`
- `loadingStateVisible=true`
- `errorStateVisible=true`
- `emptyStateVisible=true`
- `metricsVisible=true`
- `traceVisible=true`
- `artifactMetadataVisible=true`
- `secretAbsentFromTimeline=true`
- `secretAbsentFromDetail=true`
- `apiFetchedEvents=true`
- `apiFetchedSuccessArtifact=true`
- `apiFetchedOutputArtifact=true`
- `apiFetchedMissingArtifact=true`
- `dashboardContractTestsPassed=true`

## Git 状态

- `Alembic`：`git status --short` 为空。
- `AlembicDashboard`：`git status --short` 为空。
- `AlembicAgent` / `AlembicCore` / `AlembicPlugin` / `BiliDili`：`git status --short` 为空；本轮未触达产品源码或真实项目业务代码。
- `AlembicTest`：本轮新增 `scripts/probe-dashboard-artifact-detail.mjs` 和本报告，并更新 `package.json` / `scripts/README.md`；同时保留前序未提交 Test-07 资产。
- source folder runtime 写入：probe 前后状态一致；`AlembicDashboard` 未出现 `.asd/` 或 nested `Alembic/`；`Alembic` 仓库内存在 pre-existing ignored `.asd/`，本轮未新增。

## 失败归口

无失败归口。本轮未发现需要 `Alembic`、`AlembicDashboard`、`AlembicAgent` 或 `AlembicTest harness` 返工的问题。

## 遗留风险

- 本轮为 fixture / test-mode UI/API 复测，不覆盖 full cold-start / rescan、真实 provider 长任务、真实 dataRoot artifact lifecycle 或 package/runtime 产物链路。
- 临时 Dashboard URL 在 probe 完成后关闭；长期证据以截图、DOM 文本和 JSON 汇总为准。
- `AlembicAgent/dist` 未刷新仍属于总控既有遗留项 `GTODO-2026-05-25-002`，本轮不处理。
- `AlembicTest` 工作区有前序 Test-07 未提交资产，本轮未回退或合并处理。

## 下一步建议

总控可验收 `Test-2026-05-25-08` 并关闭 Wave 5 Dashboard artifact detail test-mode 门；后续若进入 Wave 6，建议先处理 `AlembicAgent/dist` / package runtime 产物，再做 package/runtime 或小 cold-start 集成验证。
