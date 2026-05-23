# AlembicTest Small Fix / Cleanup Self-Check - 2026-05-23

状态：已回填，待总控验收
任务包：SFC-P1
执行窗口：AlembicTest
提交 hash：无，本轮只新增自检报告和回填总控计划，未提交

## 窗口定位

当前窗口是 `AlembicTest`，目标仓库是 `AlembicTest`。本轮职责是自检测试仓库、测试脚本、测试文档、默认配置和回归记录链路，产出问题清单、证据、影响范围和建议修复方式。

本轮不是 Alembic 产品实现窗口，不直接修复 Alembic / AlembicCore / AlembicAgent / AlembicDashboard / AlembicPlugin / BiliDili 代码，不运行真实项目测试，不清理 runtime 数据，不删除旧证据。

## 自检范围

已读取：

- workspace `AGENTS.md`
- `docs/workspace/index.md`
- `docs/workspace/current/small-fix-cleanup-self-check-plan-2026-05-23.md`
- `AlembicTest/AGENTS.md`
- `AlembicTest/README.md`
- `AlembicTest/package.json`
- `AlembicTest/.gitignore`
- `AlembicTest/docs/README.md`
- `AlembicTest/docs/testing-operation-policy.md`
- `AlembicTest/config/README.md`
- `AlembicTest/config/defaults.json`
- `AlembicTest/scripts/README.md`
- `AlembicTest/scripts/restart-alembic.mjs`
- `AlembicTest/scripts/monitor-alembic-bootstrap.mjs`
- `AlembicTest/scripts/probe-codex-prime.mjs`
- `AlembicTest/scripts/probe-resident-vector-search.mjs`

已做只读扫描：

- AlembicTest git 状态和未跟踪文件。
- `tmp/` 本地 probe 输出残留。
- README / docs / scripts 中的旧测试交换路径、localhost 端口、cache marker、绝对路径和 token-like 字符串线索。
- `package.json` 中的轻量 `check` 命令和 README 常用命令说明是否一致。

## 发现的问题

### SFC-AT-001：AlembicTest 存在未跟踪历史报告

现象：仓库已有未跟踪文件 `docs/global-function-boundary-evidence-test-2026-05-22.md`，不是本轮新建的 SFC 报告。

证据：

- `git -C AlembicTest status --short --branch` 输出 `?? docs/global-function-boundary-evidence-test-2026-05-22.md`。
- `git -C AlembicTest ls-files --others --exclude-standard` 只列出该文件。

影响范围：AlembicTest 仓库封口和后续测试报告追踪。若继续堆叠新报告但不处理该文件，后续总控很难判断它是遗漏提交、应取消的草稿，还是仍待验收的 GFBD 证据。

建议修复方式：下一阶段由总控确认该 GFBD 报告是否仍有效；若有效，先修正其中过期路径后单独纳入 AlembicTest 提交；若已被取代，明确标记取消或清理。由于它来自本轮之前，本轮不擅自提交或删除。

需要升级 / 用户确认：需要总控确认该历史报告的处理口径。

### SFC-AT-002：未跟踪 GFBD 报告引用过期测试交换路径

现象：未跟踪报告仍引用旧 root-level 测试交换路径，而当前 workspace 规则和执行入口已经使用 `docs/workspace/current/alembic-test-exchange.md`。

证据：

- `AlembicTest/docs/global-function-boundary-evidence-test-2026-05-22.md:26`
- `AlembicTest/docs/global-function-boundary-evidence-test-2026-05-22.md:80`
- `AlembicTest/docs/global-function-boundary-evidence-test-2026-05-22.md:135`

影响范围：如果该报告按原样提交，会把旧交换入口重新固化进 AlembicTest 长期证据，容易误导后续窗口读取旧路径。

建议修复方式：在处理 SFC-AT-001 时同步修正为当前入口，或若需保持历史原文，则补一句“历史路径，当前入口已迁移到 `docs/workspace/current/alembic-test-exchange.md`”。

需要升级 / 用户确认：与 SFC-AT-001 一起由总控确认。

### SFC-AT-003：`tmp/` 下保留多份历史 raw probe JSON

现象：`AlembicTest/tmp/` 下仍有 8 份 2026-05-21 / 2026-05-22 raw probe JSON。它们已被 `.gitignore` 排除，不会默认进入 git，但本地长期残留会污染后续测试环境判断。

证据：

- `AlembicTest/AGENTS.md:51-56` 规定 `tmp/` 是临时输出，默认不应进入 git，长期报告应放到 `AlembicTest/docs/`。
- `AlembicTest/.gitignore:15-19` 忽略 `.cache/`、`.tmp/`、`tmp/` 和 `*.log`。
- `find AlembicTest/tmp -maxdepth 2 -type f -print` 列出 8 个 probe JSON。
- 安全摘要脚本显示这些 JSON 均包含本机绝对路径、localhost URL，并命中 token/secret/cookie 等 token-like 字段名或字符串；本轮未展开原文和值。

影响范围：后续测试复盘、证据归档和本机隐私。虽然未提交，但 raw JSON 可能包含本机路径、端口、运行态 payload 或敏感字段名，若被复制到长期文档或外传会增加泄露风险；也可能让新测试误读旧端口 / 旧 payload 为当前环境。

建议修复方式：下一阶段增加明确的 tmp 证据保留策略，例如：

- 在 `AlembicTest/docs/README.md` 或 `AlembicTest/tmp/README.md` 写清 raw probe JSON 只作本地临时证据，不进入长期报告。
- 增加 `scripts/clean-test-tmp.mjs --dry-run` 或等价文档化清理流程，默认先 dry-run。
- 在总控授权后清理已完成报告对应的历史 raw JSON，保留脱敏摘要到长期报告。

需要升级 / 用户确认：删除本地 raw 证据属于清理动作，需要总控或用户授权；本轮只记录，不删除。

### SFC-AT-004：README 常用命令缺少最安全的轻量 `check`

现象：`package.json` 已提供 `check`，它只调用各脚本 `--help`；但 `AlembicTest/README.md` 的 Common Commands 首屏只列出 restart / monitor 命令，没有先给出 `npm --prefix AlembicTest run check`。

证据：

- `AlembicTest/package.json:7-13` 定义 `restart`、`restart:monitor`、`monitor`、`monitor:watch` 和 `check`。
- `AlembicTest/README.md:36-58` 的 Common Commands 只列 restart / monitor，并说明 restart 可能需要 elevated Codex sandbox permissions。

影响范围：自检、封口和新窗口上手。执行窗口可能在只需要验证脚本可用性时优先看到会触发运行态操作的 restart / monitor 命令，而不是 safer help-only check。

建议修复方式：下一阶段更新 `AlembicTest/README.md`，把 `npm --prefix AlembicTest run check` 和本仓库内 `npm run check` 放在 Common Commands 第一项，并标注它是自检 / 文档封口优先命令；restart / probe 继续标为需明确测试授权。

需要升级 / 用户确认：不需要用户确认，可作为下一阶段 AlembicTest 小修复。

### SFC-AT-005：历史报告中的 localhost / cache marker 容易被误读为当前运行态

现象：多份历史报告记录了当次 daemon URL、旧端口、cache marker 或本机绝对路径。这些内容作为历史证据合理，但 `docs/README.md` 没有明确提醒“历史报告中的 localhost / cache marker 不可复用为当前入口”。

证据：

- `AlembicTest/docs/bilidili-prime-shout-service-boundary-test-2026-05-21.md:43` 和 `:76` 记录当次 `http://127.0.0.1:63030`。
- `AlembicTest/docs/bilidili-resident-vector-search-vec5r-retest-2026-05-22.md:59-67` 记录当次 cache marker、daemon pid、runtime URL 和旧端口说明。
- `AlembicTest/docs/README.md:17-19` 只禁止密钥、本地凭据和 private machine-specific state，但未区分历史运行态证据与当前可执行入口。

影响范围：复测准备和新人读取历史报告。读者可能把旧端口、旧 pid、旧 cache marker 当成当前运行态，导致误连旧 Dashboard 或误判插件缓存状态。

建议修复方式：下一阶段在 `AlembicTest/docs/README.md` 增加一段历史证据阅读规则：报告内 localhost URL、pid、cache marker、mtime 等只代表当次测试证据；新测试必须通过当前 daemon state、脚本 status probe 或总控测试单重新发现入口。

需要升级 / 用户确认：不需要用户确认，可作为下一阶段 AlembicTest 文档小修复。

### SFC-AT-006：restart 脚本默认带 clean-environment preflight，需继续保持强授权边界

现象：`restart-alembic.mjs` 默认启用 preclean，会停止 Alembic daemon / stale AlembicTest monitor 并清理旧 daemon/log 文件。README 和脚本已说明其边界，但它仍是 destructive-ish 测试操作，不适合在自检阶段运行。

证据：

- `AlembicTest/config/defaults.json:10-15` 默认 `preclean.enabled`、`stopAllServices`、`cleanLogs` 为 `true`。
- `AlembicTest/scripts/restart-alembic.mjs` 中存在 `process.kill`、`rmSync`、`--dry-run`、`--no-preclean`、`--no-clean-logs` 等路径。
- `AlembicTest/README.md:18-23` 明确 destructive test operations 需要授权，并说明默认 restart preflight 不删除数据库、候选、设置、密钥或源码。

影响范围：测试运行态和开发者本机。当前设计与“重启前清环境”的测试需求一致，但后续文档和提示词必须持续强调：只有明确测试单或用户授权时才运行 restart。

建议修复方式：不作为代码 bug 立即修；下一阶段可补充 README 的命令分层，把 `check` / `--dry-run` 放到普通自检路径，把 restart 标为“授权测试路径”。

需要升级 / 用户确认：运行 restart / preclean 前需要授权；本轮未运行。

## 验证命令

已运行：

```bash
git -C AlembicTest status --short --branch
git -C AlembicTest ls-files --others --exclude-standard
find AlembicTest/tmp -maxdepth 2 -type f -print
rg -n "测试交换路径|docs/workspace/current/alembic-test-exchange|http://127\.0\.0\.1:[0-9]+|localhost:[0-9]+|gitHead|cache marker|/Users/gaoxuefeng" AlembicTest/docs AlembicTest/README.md AlembicTest/scripts AlembicTest/config
npm --prefix AlembicTest run check
```

结果摘要：

- `npm --prefix AlembicTest run check` 通过，四个脚本的 `--help` 均可执行。
- AlembicTest 当前已有本轮之前的未跟踪 GFBD 报告；本轮新增 SFC 报告后工作区仍会保留该历史未跟踪项。
- `tmp/` raw JSON 被 `.gitignore` 排除，但本地仍存在 8 份历史 raw evidence。

报告落盘后已运行：

```bash
git -C AlembicTest diff --check
git diff --check
node scripts/verify-workspace-docs.mjs --all-workspace
node scripts/check-workspace-current-layout.mjs
node scripts/check-dispatch-coverage.mjs
node scripts/check-todo-board.mjs --require
node scripts/check-task-packages.mjs --require
```

结果摘要：

- `git -C AlembicTest diff --check` 通过。
- `git diff --check` 通过。
- `node scripts/verify-workspace-docs.mjs --all-workspace` 通过，Markdown links checked: 122。
- `node scripts/check-workspace-current-layout.mjs` 通过。
- `node scripts/check-dispatch-coverage.mjs` 通过，发送窗口为 `Alembic`、`AlembicCore`、`AlembicAgent`、`AlembicDashboard`、`AlembicPlugin`；不发送给 `AlembicTest` 和 `BiliDili`。
- `node scripts/check-todo-board.mjs --require` 通过。
- `node scripts/check-task-packages.mjs --require` 通过。

## 未运行命令及理由

未运行：

```bash
npm --prefix AlembicTest run restart
npm --prefix AlembicTest run restart:monitor
npm --prefix AlembicTest run monitor
npm --prefix AlembicTest run monitor:watch
node AlembicTest/scripts/probe-codex-prime.mjs
node AlembicTest/scripts/probe-resident-vector-search.mjs
```

理由：本轮总控文档明确只做小问题 / 清理修复自检，不运行或修改 BiliDili，也不要求昂贵真实项目验证。上述命令会启动、观察或 probe Alembic / BiliDili 真实链路，超出本轮授权。

## 建议进入下一阶段的问题

| ID | 建议状态 | 推荐归属 | 建议处理 |
| --- | --- | --- | --- |
| SFC-AT-001 | 需要总控确认 | AlembicTest + 总控 | 决定未跟踪 GFBD 报告是提交、修正后提交，还是取消 / 清理。 |
| SFC-AT-002 | 进入修复包 | AlembicTest | 若提交 GFBD 报告，先修正旧测试交换路径或补历史路径说明。 |
| SFC-AT-003 | 需要授权后清理 | AlembicTest + 总控 | 建立 tmp retention / dry-run 清理流程；授权后清理旧 raw JSON。 |
| SFC-AT-004 | 进入修复包 | AlembicTest | README 增加安全 `check` 命令入口。 |
| SFC-AT-005 | 进入修复包 | AlembicTest | docs README 增加历史运行态证据阅读规则。 |
| SFC-AT-006 | 观察 / 文档加固 | AlembicTest | 保持 restart 强授权边界，必要时补命令分层说明。 |

## 遗留风险

- 未跟踪 GFBD 报告未处理，AlembicTest 工作区不会是完全干净状态。
- `tmp/` raw JSON 未清理，仍可能包含本机路径、旧端口、payload 字段或 token-like 字符串；本轮没有展开或删除。
- 本轮没有运行真实项目 probe / restart / monitor，因此只验证脚本 help 链路和文档 / 配置证据，不证明 Alembic 当前运行态可用。
