# AlembicTest Testing Operation Policy

状态：长期规则
维护窗口：AlembicTest
适用范围：真实项目测试、冷启动监控、复现、smoke、回归和验证报告

## 核心规则

`AlembicWorkspace` 总控窗口只负责定义测试目标、分派测试窗口、验收回填证据和调整后续计划，不直接执行测试相关操作。

以下操作默认归 `AlembicTest`：

- 启动或重启 Alembic 测试运行时。
- 点击或触发 cold-start / rescan / clean rebuild。
- 监控 Dashboard、Jobs API、daemon 日志或候选产出。
- 对 `AlembicWorkspace`、`BiliDili` 或总控明确授权的其它真实项目执行 smoke、复现或回归。
- 记录测试现象、失败原因、TODO、验证报告和后续建议。

## 配置归属

测试默认配置放在 `AlembicTest/config/defaults.json`：

- legacy 默认测试目标项目，以及当前明确可选的真实测试项目清单。
- Alembic 本地仓库路径。
- restart / stop / status 等等待时间。
- monitor 轮询、超时、日志 tail 和信号匹配规则。

一次性差异通过脚本参数传入，不要把用户本机绝对路径、密钥、token 或临时端口写入长期配置。

## 脚本归属

真实项目测试脚本放在 `AlembicTest/scripts/`。

workspace 根 `scripts/` 只保留总控治理、文档校验、边界检查、索引归档和派发检查脚本；不要把真实项目测试脚本重新放回根目录。

## 文档归属

长期测试计划、复现记录、监控记录和验证报告写入 `AlembicTest/docs/`。

跨仓库总控计划仍写在 workspace 根 `docs/workspace/`，但只链接或引用 `AlembicTest` 回填的测试证据，不承载测试执行细节。

## 回填要求

AlembicTest 完成测试后，回填至少包含：

- 测试目标与触发入口。
- 使用配置或关键参数。
- job id / session id / Dashboard URL 摘要。
- 状态变化和候选数量。
- 关键日志信号。
- 失败 / 取消 / timeout / completed 分类。
- 是否改动真实项目业务代码。
- 遗留风险和下一步建议。
