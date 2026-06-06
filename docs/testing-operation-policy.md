# AlembicTest Testing Operation Policy

状态：长期规则
维护窗口：AlembicTest
适用范围：真实项目测试、冷启动监控、复现、smoke、回归和验证报告

## 核心规则

`AlembicWorkspace` 总控窗口负责定义测试目标、创建 state-root test card、分派测试窗口、验收回填证据和调整后续计划。总控默认先自测可自测内容；只有真实项目、Codex 环境、Dashboard、运行时监控或跨仓库集成环境证据确实需要外部窗口时，才分派本仓库。

同一个 `AlembicTest` 仓库由两个职责窗口使用：

- `AlembicTest-IDE`：Codex Plugin、Codex host MCP、Codex 会话 / 本地环境、installed / packaged Plugin runtime smoke、direct-thread / IDE 投递读回等测试。
- `AlembicTest`：BiliDili、AlembicWorkspace 或其它受保护真实项目的 cold-start / rescan / after-run、AI/provider、Dashboard 手动观察、运行时监控和真实项目回归。

以下操作默认归 `AlembicTest`：

- 启动或重启 Alembic 测试运行时。
- 点击或触发 cold-start / rescan / clean rebuild。
- 监控 Dashboard、Jobs API、daemon 日志或候选产出。
- 对 `AlembicWorkspace`、`BiliDili` 或总控明确授权的其它真实项目执行 smoke、复现或回归。
- 记录测试现象、失败原因、TODO、验证报告和后续建议。

以下操作默认归 `AlembicTest-IDE`：

- 运行或复核 Codex Plugin / host MCP fresh probe。
- 采集 installed / packaged Plugin runtime smoke、Codex 会话环境、local IDE / direct-thread 投递读回证据。
- 复验 Codex host tool 行为和环境边界，但不负责修复当前 Codex host MCP。

## 配置归属

测试默认配置放在 `AlembicTest/config/defaults.json`：

- legacy 默认测试目标项目，以及当前明确可选的真实测试项目清单。
- Alembic 本地仓库路径。
- AI 配置 fallback：先读取当前目标项目在 Alembic Ghost / standard runtime
  中的 AI 配置；如果目标项目没有 provider/key，可使用
  `ai.defaultSourceProject` 指向的默认测试 AI 配置。脚本和报告只允许写配置来源、
  provider/model 和 key presence，不允许写 secret 值。
- restart / stop / status 等等待时间。
- monitor 轮询、超时、日志 tail 和信号匹配规则。

一次性差异通过脚本参数传入，不要把用户本机绝对路径、密钥、token 或临时端口写入长期配置。

## 脚本归属

真实项目测试脚本和 Codex Plugin / 环境 probe 脚本都放在 `AlembicTest/scripts/`，但执行前必须按 state-root test card、当前计划或用户请求中的职责窗口分流。

control workspace 根 `scripts/` 只保留总控治理、文档校验、边界检查、状态机、intake 和派发检查脚本；不要把真实项目测试脚本重新放回根目录。

## 文档归属

长期测试计划、复现记录、监控记录和验证报告写入 `AlembicTest/docs/`。

跨仓库总控计划、state-root test card 和测试交流投影仍写在 control workspace active/state-root surface；这里只保存 `AlembicTest` / `AlembicTest-IDE` 回填的长期证据，不承载总控状态机。

## 回填要求

`AlembicTest` 或 `AlembicTest-IDE` 完成测试后，回填至少包含：

- state root / test card / target task id。
- 测试目标与触发入口。
- 使用配置或关键参数。
- job id / session id / Dashboard URL 摘要。
- 状态变化和候选数量。
- 关键日志信号。
- 失败 / 取消 / timeout / completed 分类。
- 是否改动真实项目业务代码。
- 遗留风险和下一步建议。
